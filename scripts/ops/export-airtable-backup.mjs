import fs from 'node:fs';
import path from 'node:path';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_ENV_KEYS = ['AIRTABLE_BASE_ID', 'AIRTABLE_SANTIS_BASE_ID'];
const TOKEN_ENV_KEYS = ['AIRTABLE_PAT', 'AIRTABLE_API_KEY'];
const DEFAULT_OUTPUT_ROOT = 'Santis_OS_Backups';
const TIME_ZONE = 'Europe/Podgorica';

const BACKUP_TABLES = [
  { key: 'bookings', sheetName: 'Bookings', tableEnv: 'AIRTABLE_BOOKINGS_TABLE_ID', fallbackTable: 'Bookings' },
  { key: 'clients', sheetName: 'Clients', tableEnv: 'AIRTABLE_CLIENTS_TABLE_ID', fallbackTable: 'Clients' },
  { key: 'payments', sheetName: 'Payments', tableEnv: 'AIRTABLE_PAYMENTS_TABLE_ID', fallbackTable: 'Payments' },
  { key: 'inventory', sheetName: 'Inventory', tableEnv: 'AIRTABLE_INVENTORY_TABLE_ID', fallbackTable: 'Inventory' },
];

function parseArgs(argv) {
  return argv.reduce((result, arg) => {
    if (!arg.startsWith('--')) return result;
    const [rawKey, ...rawValue] = arg.slice(2).split('=');
    result[rawKey] = rawValue.length > 0 ? rawValue.join('=') : true;
    return result;
  }, {});
}

function firstEnv(keys) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return null;
}

function todayInPodgorica() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeCell(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(normalizeCell).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    if ('name' in value || 'id' in value) return normalizeCell(value.name || value.id);
    return JSON.stringify(value);
  }
  return String(value);
}

function csvEscape(value) {
  const text = normalizeCell(value);
  if (/[,"\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function recordsToRows(records) {
  const fieldNames = new Set(['__recordId', '__createdTime']);

  for (const record of records) {
    for (const fieldName of Object.keys(record.fields || {})) {
      fieldNames.add(fieldName);
    }
  }

  const headers = [...fieldNames];
  const rows = records.map((record) => {
    const row = {
      __recordId: record.id,
      __createdTime: record.createdTime,
      ...(record.fields || {}),
    };
    return headers.map((header) => normalizeCell(row[header]));
  });

  return { headers, rows };
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function xmlEscape(value) {
  return normalizeCell(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function columnName(index) {
  let name = '';
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sheetXml(headers, rows) {
  const allRows = [headers, ...rows];
  const rowXml = allRows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.map((cell, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowNumber}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function uint16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function createZip(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8');
    const data = Buffer.from(file.content, 'utf8');
    const checksum = crc32(data);

    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      name,
    ]);

    localParts.push(localHeader, data);

    const centralHeader = Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      name,
    ]);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function createWorkbook(sheets) {
  const sheetEntries = sheets.map((sheet, index) => ({ ...sheet, id: index + 1 }));
  const workbookSheets = sheetEntries.map((sheet) => (
    `<sheet name="${xmlEscape(sheet.name).slice(0, 31)}" sheetId="${sheet.id}" r:id="rId${sheet.id}"/>`
  )).join('');

  const relationships = sheetEntries.map((sheet) => (
    `<Relationship Id="rId${sheet.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`
  )).join('');

  const overrides = sheetEntries.map((sheet) => (
    `<Override PartName="/xl/worksheets/sheet${sheet.id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join('');

  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overrides}
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relationships}
  <Relationship Id="rId${sheetEntries.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
    },
    ...sheetEntries.map((sheet) => ({
      name: `xl/worksheets/sheet${sheet.id}.xml`,
      content: sheetXml(sheet.headers, sheet.rows),
    })),
  ];

  return createZip(files);
}

async function fetchAirtableRecords({ baseId, token, table }) {
  const records = [];
  let offset = null;

  do {
    const params = new URLSearchParams({ pageSize: '100' });
    if (offset) params.set('offset', offset);

    const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Airtable read failed for ${table}: ${response.status} ${JSON.stringify(payload).slice(0, 300)}`);
    }

    records.push(...(payload.records || []));
    offset = payload.offset || null;
  } while (offset);

  return records;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = args.date || todayInPodgorica();
  const outputRoot = args.out || DEFAULT_OUTPUT_ROOT;
  const outputDir = path.resolve(process.cwd(), outputRoot, date);
  const baseId = firstEnv(BASE_ID_ENV_KEYS);
  const token = firstEnv(TOKEN_ENV_KEYS);

  if (!baseId) {
    throw new Error('Missing Airtable base ID. Set AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID.');
  }

  if (!token) {
    throw new Error('Missing Airtable token. Set AIRTABLE_PAT or AIRTABLE_API_KEY in the backend/ops environment.');
  }

  ensureDirectory(outputDir);

  const workbookSheets = [];
  const manifest = {
    generatedAt: new Date().toISOString(),
    date,
    timeZone: TIME_ZONE,
    outputDir,
    mode: 'read-only',
    tables: [],
  };

  for (const tableConfig of BACKUP_TABLES) {
    const table = process.env[tableConfig.tableEnv] || tableConfig.fallbackTable;
    console.log(`Reading ${tableConfig.sheetName} from Airtable table ${table}...`);
    const records = await fetchAirtableRecords({ baseId, token, table });
    const { headers, rows } = recordsToRows(records);
    const csvPath = path.join(outputDir, `${tableConfig.key}.csv`);

    writeCsv(csvPath, headers, rows);
    workbookSheets.push({ name: tableConfig.sheetName, headers, rows });
    manifest.tables.push({
      key: tableConfig.key,
      table,
      records: records.length,
      csv: path.relative(process.cwd(), csvPath),
    });
  }

  const workbookPath = path.join(outputDir, `santis_backup_${date}.xlsx`);
  fs.writeFileSync(workbookPath, createWorkbook(workbookSheets));
  manifest.workbook = path.relative(process.cwd(), workbookPath);

  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('Backup export completed.');
  console.log(`Output: ${path.relative(process.cwd(), outputDir)}`);
}

main().catch((error) => {
  console.error(`Backup export failed: ${error.message}`);
  process.exit(1);
});
