import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_ENV_KEYS = ['AIRTABLE_BASE_ID', 'AIRTABLE_SANTIS_BASE_ID'];
const TOKEN_ENV_KEYS = ['AIRTABLE_PAT', 'AIRTABLE_API_KEY'];
const BOOKINGS_TABLE_ID = process.env.AIRTABLE_BOOKINGS_TABLE_ID || 'tblocCFVgSNfaLAH6';
const DEFAULT_OUTPUT_ROOT = 'Santis_OS_Offline_Schedule';
const TIME_ZONE = 'Europe/Podgorica';
const DEFAULT_LOCATION = 'budva';

const LOCATION_ALIASES = {
  budva: '01 BUDVA — Santis Club Budva',
  kotor: 'Kotor',
  tivat: 'Tivat',
};

const SCHEDULE_HEADERS = [
  'Booking ID',
  'Date',
  'Start time',
  'Finish time',
  'Client name',
  'Client phone',
  'Service',
  'Duration',
  'Therapist',
  'Room',
  'Status',
  'Payment status',
  'Balance due',
  'Notes',
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
  if (Array.isArray(value)) return value.map(normalizeCell).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if ('name' in value || 'id' in value) return normalizeCell(value.name || value.id);
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function firstField(fields, names) {
  for (const name of names) {
    const value = normalizeCell(fields[name]);
    if (value) return value;
  }
  return '';
}

function csvEscape(value) {
  const text = normalizeCell(value);
  if (/[,"\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) lines.push(row.map(csvEscape).join(','));
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
  return {
    dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    dosDate: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
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
      uint32(0x04034b50), uint16(20), uint16(0), uint16(0), uint16(dosTime), uint16(dosDate),
      uint32(checksum), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), name,
    ]);
    localParts.push(localHeader, data);
    centralParts.push(Buffer.concat([
      uint32(0x02014b50), uint16(20), uint16(20), uint16(0), uint16(0), uint16(dosTime), uint16(dosDate),
      uint32(checksum), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), uint16(0),
      uint16(0), uint16(0), uint32(0), uint32(offset), name,
    ]));
    offset += localHeader.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.concat([
    uint32(0x06054b50), uint16(0), uint16(0), uint16(files.length), uint16(files.length),
    uint32(centralDirectory.length), uint32(offset), uint16(0),
  ]);
  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function createWorkbook(headers, rows) {
  const files = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
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
  <sheets><sheet name="Daily Schedule" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
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
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml(headers, rows) },
  ];
  return createZip(files);
}

function pdfEscape(value) {
  return normalizeCell(value).replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function wrapText(text, maxLength = 92) {
  const words = normalizeCell(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function createPdf({ title, subtitle, rows }) {
  const maxRowsPerPage = 24;
  const pages = [];
  const chunks = [];
  for (let index = 0; index < rows.length; index += maxRowsPerPage) {
    chunks.push(rows.slice(index, index + maxRowsPerPage));
  }
  if (chunks.length === 0) chunks.push([]);

  for (const [pageIndex, chunk] of chunks.entries()) {
    const lines = [`BT /F1 16 Tf 40 800 Td (${pdfEscape(title)}) Tj ET`, `BT /F1 10 Tf 40 784 Td (${pdfEscape(subtitle)}) Tj ET`];
    let y = 758;
    if (chunk.length === 0) {
      lines.push(`BT /F1 11 Tf 40 ${y} Td (${pdfEscape('No bookings found for this branch/date.')}) Tj ET`);
    }
    for (const row of chunk) {
      const main = `${row[2]}-${row[3]} | ${row[4]} | ${row[6]} | ${row[8]} | ${row[9]}`;
      lines.push(`BT /F1 9 Tf 40 ${y} Td (${pdfEscape(main)}) Tj ET`);
      y -= 13;
      const detail = `Status: ${row[10]} | Payment: ${row[11]} | Due: ${row[12]} | Notes: ${row[13]}`;
      for (const wrappedLine of wrapText(detail, 100).slice(0, 2)) {
        lines.push(`BT /F1 8 Tf 58 ${y} Td (${pdfEscape(wrappedLine)}) Tj ET`);
        y -= 11;
      }
      y -= 5;
    }
    lines.push(`BT /F1 8 Tf 40 28 Td (${pdfEscape(`Page ${pageIndex + 1} of ${chunks.length}`)}) Tj ET`);
    pages.push(lines.join('\n'));
  }

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  for (const [index, content] of pages.entries()) {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
  }

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

function escapeFormulaText(value) {
  return normalizeCell(value).replaceAll("'", "\\'");
}

async function fetchAirtableBookings({ baseId, token, date, environment }) {
  const formula = [
    'AND(',
    `{Environment} = '${escapeFormulaText(environment)}',`,
    `DATETIME_FORMAT(SET_TIMEZONE({Start_DateTime}, '${TIME_ZONE}'), 'YYYY-MM-DD') = '${escapeFormulaText(date)}',`,
    "NOT(OR({Status_New} = 'Cancelled', {Status_New} = 'No-show'))",
    ')',
  ].join('');

  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({
      cellFormat: 'string',
      timeZone: TIME_ZONE,
      userLocale: 'en-us',
      pageSize: '100',
      filterByFormula: formula,
      'sort[0][field]': 'Start_DateTime',
      'sort[0][direction]': 'asc',
    });
    if (offset) params.set('offset', offset);

    const url = `${AIRTABLE_API_URL}/${baseId}/${BOOKINGS_TABLE_ID}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Airtable read failed: ${response.status} ${JSON.stringify(payload).slice(0, 300)}`);
    }
    records.push(...(payload.records || []));
    offset = payload.offset || null;
  } while (offset);
  return records;
}

function matchesLocation(fields, locationKey) {
  const canonical = LOCATION_ALIASES[locationKey] || locationKey;
  const locationValue = normalizeCell(fields.Location_Link).toLowerCase();
  if (!locationValue) return false;
  return locationValue.includes(canonical.toLowerCase()) || locationValue.includes(locationKey.toLowerCase());
}

function toScheduleRow(record, date) {
  const fields = record.fields || {};
  return [
    firstField(fields, ['Booking ID']) || record.id,
    date,
    firstField(fields, ['Reception Time Display', 'Start Time', 'Start_DateTime']),
    firstField(fields, ['Calculated_Finish_DateTime', 'Finish Time', 'End Time']),
    firstField(fields, ['Client_Link', 'Client Name', 'Full Name']),
    firstField(fields, ['Client Phone', 'Client_Phone', 'Phone', 'Phone Number', 'Client Phone Lookup']),
    firstField(fields, ['Service_Link', 'Service', 'Service Name']),
    firstField(fields, ['Duration', 'Duration_Minutes', 'Service Duration']),
    firstField(fields, ['Therapist_Link', 'Therapist', 'Therapist Name']),
    firstField(fields, ['Room_Link', 'Room', 'Room Name']),
    firstField(fields, ['Status_New', 'Status']),
    firstField(fields, ['Payment_Status_New', 'Payment Status']),
    firstField(fields, ['Balance_Due_EUR', 'Balance Due', 'Balance Due EUR']),
    firstField(fields, ['Notes', 'Reception Notes', 'Internal Notes']),
  ];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = args.date || todayInPodgorica();
  const locationKey = normalizeCell(args.location || DEFAULT_LOCATION).toLowerCase();
  const environment = normalizeCell(args.environment || 'Live');
  const outputRoot = normalizeCell(args.out || DEFAULT_OUTPUT_ROOT);
  const outputDir = path.resolve(process.cwd(), outputRoot, date);
  const slug = locationKey.replace(/[^a-z0-9-]/g, '-');
  const baseId = firstEnv(BASE_ID_ENV_KEYS);
  const token = firstEnv(TOKEN_ENV_KEYS);

  if (!baseId) throw new Error('Missing Airtable base ID. Set AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID.');
  if (!token) throw new Error('Missing Airtable token. Set AIRTABLE_PAT or AIRTABLE_API_KEY in the backend/ops environment.');

  ensureDirectory(outputDir);
  const records = await fetchAirtableBookings({ baseId, token, date, environment });
  const rows = records
    .filter((record) => matchesLocation(record.fields || {}, locationKey))
    .map((record) => toScheduleRow(record, date));

  const csvPath = path.join(outputDir, `${slug}-daily-schedule.csv`);
  const xlsxPath = path.join(outputDir, `${slug}-daily-schedule.xlsx`);
  const pdfPath = path.join(outputDir, `${slug}-daily-schedule.pdf`);
  const manifestPath = path.join(outputDir, `${slug}-daily-schedule-manifest.json`);

  writeCsv(csvPath, SCHEDULE_HEADERS, rows);
  fs.writeFileSync(xlsxPath, createWorkbook(SCHEDULE_HEADERS, rows));
  fs.writeFileSync(pdfPath, createPdf({
    title: `Offline Daily Schedule — ${locationKey.toUpperCase()} — ${date}`,
    subtitle: `Generated ${new Date().toISOString()} · ${environment} · ${TIME_ZONE}`,
    rows,
  }));

  fs.writeFileSync(manifestPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    date,
    location: locationKey,
    environment,
    timeZone: TIME_ZONE,
    mode: 'read-only',
    records: rows.length,
    files: {
      csv: path.relative(process.cwd(), csvPath),
      xlsx: path.relative(process.cwd(), xlsxPath),
      pdf: path.relative(process.cwd(), pdfPath),
    },
  }, null, 2)}\n`, 'utf8');

  console.log(`Offline schedule generated for ${locationKey} on ${date}.`);
  console.log(`Records: ${rows.length}`);
  console.log(`Output: ${path.relative(process.cwd(), outputDir)}`);
}

main().catch((error) => {
  console.error(`Offline schedule generation failed: ${error.message}`);
  process.exit(1);
});
