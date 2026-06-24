import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const pat = process.env.AIRTABLE_PAT;
const baseId = process.env.AIRTABLE_BASE_ID;
const backupRoot = process.env.SANTIS_BACKUP_ROOT;
const cloudDir = process.env.SANTIS_BACKUP_CLOUD_DIR;

if (!pat || !baseId || !backupRoot) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const TZ = 'Europe/Podgorica';
const todayDate = DateTime.now().setZone(TZ).toISODate();
const generatedAt = DateTime.now().setZone(TZ).toISO();

const tables = {
  Bookings: 'tblocCFVgSNfaLAH6',
  Clients: 'tbl6cxT1XnkUifl4I',
  Payments: 'tblcUltjoMusYcQob',
  Inventory: 'tbl1HzavzuHMtneEP',
  BackupLog: 'tbl9ndhdUcCnui5gp',
  OfflineExports: 'tblldVgEx2rg6zfrC',
  Locks: 'tblWAaSnJVrWbnz9m'
};

async function fetchAirtable(tableId) {
  let records = [];
  let offset = null;
  do {
    let url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
    if (offset) url += `?offset=${offset}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${pat}` }
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Airtable fetch failed: ${res.statusText} - ${errorText} for ${tableId}`);
    }
    const data = await res.json();
    if (data.records) records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

async function updateAirtable(tableId, recordId, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Airtable update failed: ${res.statusText} - ${errorText} for ${tableId}`);
  }
}

async function createAirtable(tableId, fields) {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: [{ fields }] })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Airtable create failed: ${res.statusText} - ${errorText} for ${tableId}`);
  }
}

function getColumns(records) {
  const cols = new Set();
  records.forEach(r => Object.keys(r.fields).forEach(k => cols.add(k)));
  return Array.from(cols);
}

async function createXLSX(filename, data, columns) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.columns = columns.map(c => ({ header: c, key: c }));
  data.forEach(row => ws.addRow(row));
  await wb.xlsx.writeFile(filename);
}

async function createCSV(filename, data, columns) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.columns = columns.map(c => ({ header: c, key: c }));
  data.forEach(row => ws.addRow(row));
  await wb.csv.writeFile(filename);
}

async function createPDF(filename, data, columns) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);
    
    stream.on('finish', resolve);
    stream.on('error', reject);
    
    doc.fontSize(16).text(`Daily Schedule - ${todayDate}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(8);
    
    data.forEach((row) => {
      let text = Object.entries(row).filter(([_,v]) => v).map(([k,v]) => `${k}: ${v}`).join(' | ');
      doc.text(text);
      doc.moveDown(0.2);
    });
    
    doc.end();
  });
}

function hashFile(filename) {
  if (!fs.existsSync(filename)) return null;
  const content = fs.readFileSync(filename);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function run() {
  const warnings = [];
  
  const baseFolder = path.join(backupRoot, todayDate);
  const dirs = {
    csv: path.join(baseFolder, 'csv'),
    xlsx: path.join(baseFolder, 'xlsx'),
    pdf: path.join(baseFolder, 'pdf'),
    manifest: path.join(baseFolder, 'manifest'),
    logs: path.join(baseFolder, 'logs')
  };
  Object.values(dirs).forEach(d => fs.mkdirSync(d, { recursive: true }));

  // Fetch data
  const bookingsRaw = await fetchAirtable(tables.Bookings);
  const clientsRaw = await fetchAirtable(tables.Clients);
  const paymentsRaw = await fetchAirtable(tables.Payments);
  const inventoryRaw = await fetchAirtable(tables.Inventory);
  
  const dailyScheduleRaw = bookingsRaw.map(r => r.fields).filter(f => {
    const envLive = f['Environment'] === 'Live';
    const statusNotCancelled = f['Status_New'] !== 'Cancelled';
    let isToday = false;
    if (f['Start_DateTime']) {
      const startObj = DateTime.fromISO(f['Start_DateTime']).setZone(TZ);
      isToday = startObj.toISODate() === todayDate;
    }
    return envLive && statusNotCancelled && isToday;
  });

  const dailyFields = [
    'Booking ID', 'Reception Time Display', 'Client_Link', 'Service_Link',
    'Therapist_Link', 'Room_Link', 'Location_Link', 'Start_DateTime',
    'Calculated_Finish_DateTime', 'Status_New', 'Payment Method',
    'Payment_Status_New', 'Booking Display Amount Due', 'Total Paid Display',
    'Balance Due Display', 'Payment Closure Status', 'Reception_Notes'
  ];

  const dailyScheduleData = dailyScheduleRaw.map(f => {
    const row = {};
    dailyFields.forEach(col => row[col] = f[col] || '');
    return row;
  });

  const filesToHash = [];

  async function exportTable(name, rawRecords, doPdf=false) {
    const data = rawRecords.map(r => r.fields || r);
    const columns = doPdf ? dailyFields : getColumns(rawRecords);
    
    const csvPath = path.join(dirs.csv, `${name}.csv`);
    await createCSV(csvPath, data, columns);
    filesToHash.push(csvPath);
    
    const xlsxPath = path.join(dirs.xlsx, `${name}.xlsx`);
    await createXLSX(xlsxPath, data, columns);
    filesToHash.push(xlsxPath);
    
    if (doPdf) {
      const pdfPath = path.join(dirs.pdf, `${name}.pdf`);
      await createPDF(pdfPath, data, columns);
      filesToHash.push(pdfPath);
    }
    return { name, count: data.length };
  }

  const exportStats = [
    await exportTable('Bookings', bookingsRaw),
    await exportTable('Clients', clientsRaw),
    await exportTable('Payments', paymentsRaw),
    await exportTable('Inventory', inventoryRaw),
    await exportTable('Daily_Schedule', dailyScheduleData, true),
  ];

  const hashes = {};
  for (const f of filesToHash) {
    hashes[path.basename(f)] = hashFile(f);
  }

  // Cloud copy
  let finalCloudDir = null;
  if (cloudDir) {
    const targetDir = path.join(cloudDir, todayDate);
    try {
      fs.cpSync(baseFolder, targetDir, { recursive: true });
      finalCloudDir = targetDir;
    } catch (e) {
      warnings.push(`Cloud sync failed: ${e.message}`);
    }
  }

  // Manifest
  const manifestContent = {
    generated_at: generatedAt,
    export_date: todayDate,
    timezone: TZ,
    base_id: baseId,
    tables: exportStats,
    file_paths: filesToHash,
    hashes,
    cloud_copy_path: finalCloudDir,
    warnings,
    final_status: 'SUCCESS'
  };
  const manifestPath = path.join(dirs.manifest, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2));
  filesToHash.push(manifestPath);

  // Audit Log
  const auditPath = path.join(dirs.logs, 'backup_audit_log.txt');
  fs.writeFileSync(auditPath, `Generated at: ${generatedAt}\nHashes:\n${JSON.stringify(hashes, null, 2)}`);
  
  let logsUpdated = 'No';
  try {
    const backupLogRecords = await fetchAirtable(tables.BackupLog);
    const backupRecord = backupLogRecords.find(r => 
      r.fields['Backup_Date'] === todayDate && 
      (r.fields['Backup_Type'] === 'Daily Offline Sync' || r.fields['Backup_Title'] === 'Daily Offline Sync' || !r.fields['Backup_Type']) 
    ); 

    const bNotes = `Local path: ${baseFolder}\nCloud path: ${finalCloudDir || 'N/A'}\nHashes: ${JSON.stringify(hashes)}\nManual offline-open verification still required.`;
    if (backupRecord) {
      await updateAirtable(tables.BackupLog, backupRecord.id, {
        Status: 'Completed',
        Notes: bNotes
      });
    } else {
      await createAirtable(tables.BackupLog, {
        Backup_Date: todayDate,
        Backup_Type: 'Daily Offline Sync',
        Status: 'Completed',
        Notes: bNotes
      });
    }

    const exportRecords = await fetchAirtable(tables.OfflineExports);
    const schedName = `OFFLINE-SCHEDULE-${todayDate}-DAILY`;
    const exportRecord = exportRecords.find(r => 
      r.fields['Export Date'] === todayDate && 
      r.fields['Export Name'] === schedName
    );

    const eNotes = `Paths: ${baseFolder}\nHashes: ${JSON.stringify(hashes)}\nmanual offline-open verification required`;
    if (exportRecord) {
      await updateAirtable(tables.OfflineExports, exportRecord.id, {
        'Export Status': 'Generated',
        'Output Notes': eNotes
      });
    } else {
      await createAirtable(tables.OfflineExports, {
        'Export Date': todayDate,
        'Export Name': schedName,
        'Export Status': 'Generated',
        'Output Notes': eNotes
      });
    }
    logsUpdated = 'Yes';
  } catch (err) {
    warnings.push(`Airtable logs not updated: ${err.message}`);
  }

  // Lock status
  const lockRecords = await fetchAirtable(tables.Locks);
  let lock08 = 'Unknown';
  let lock12 = 'Unknown';
  lockRecords.forEach(r => {
    const idField = r.fields['Name'] || r.fields['Lock_ID'] || r.fields['ID'] || JSON.stringify(r.fields);
    const statusField = r.fields['Status'] || r.fields['Lock Status'];
    if (idField.includes('LOCK-08')) lock08 = statusField || 'Found';
    if (idField.includes('LOCK-12')) lock12 = statusField || 'Found';
  });

  console.log(`SANTIS BACKUP / OFFLINE EXPORT RESULT
Date: ${todayDate}
Generated folder: ${baseFolder}
Bookings CSV/XLSX: ${hashes['Bookings.csv'] ? 'Yes' : 'No'}/${hashes['Bookings.xlsx'] ? 'Yes' : 'No'}
Clients CSV/XLSX: ${hashes['Clients.csv'] ? 'Yes' : 'No'}/${hashes['Clients.xlsx'] ? 'Yes' : 'No'}
Payments CSV/XLSX: ${hashes['Payments.csv'] ? 'Yes' : 'No'}/${hashes['Payments.xlsx'] ? 'Yes' : 'No'}
Inventory CSV/XLSX: ${hashes['Inventory.csv'] ? 'Yes' : 'No'}/${hashes['Inventory.xlsx'] ? 'Yes' : 'No'}
Daily Schedule PDF/XLSX: ${hashes['Daily_Schedule.pdf'] ? 'Yes' : 'No'}/${hashes['Daily_Schedule.xlsx'] ? 'Yes' : 'No'}
Manifest: ${manifestPath}
Warnings: ${warnings.length ? warnings.join(', ') : 'None'}
Airtable logs updated: ${logsUpdated}
LOCK-08 status: ${lock08}
LOCK-12 status: ${lock12}
Manual action still required:
* Open one PDF offline
* Open one XLSX offline
* Confirm cloud copy exists
* Then manager may approve LOCK-08`);

}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
