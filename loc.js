import xlsx from 'xlsx';
import fs from 'fs';

// Load Excel file
const workbook = xlsx.readFile('locations.xlsx');
const sheet = workbook.Sheets['locations'];

// Convert sheet to JSON
const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

let sqlStatements = '';

data.forEach(row => {
  const latArray = [];
  const lonArray = [];

  for (const key in row) {
    const value = row[key];

    // Skip nulls or non-numeric values
    if (value === null || isNaN(value)) continue;

    // Group lat/lon based on column name or position
    if (key.toLowerCase().includes('lat') || key.startsWith('__empty')) {
      latArray.push(value);
    } else if (key.toLowerCase().includes('lon') || key.startsWith('__empty')) {
      lonArray.push(value);
    }
  }

  // If we still have values, create INSERT
  if (latArray.length === 0 || lonArray.length === 0) {
    console.warn('Skipping row due to missing lat or lon:', row.customer);
    return;
  }

  const sql = `INSERT INTO customers_location (type, code, customer, lat, lon, direction)
VALUES (
  '${row.type || ''}',
  '${row.code || ''}',
  '${row.customer || ''}',
  ARRAY[${latArray.map(v => `'${v}'`).join(', ')}]::text[],
  ARRAY[${lonArray.map(v => `'${v}'`).join(', ')}]::text[],
  '${row.direction || ''}'
);`;

  sqlStatements += sql + '\n';
});

fs.writeFileSync('insert_customers_location.sql', sqlStatements);
console.log('SQL statements saved to insert_customers_location.sql');
