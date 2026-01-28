export interface CsvRow {
  'Name': string;
  'Additional Notes': string;
  'Age': string;
  'Client': string;
  'Date': string;
  'Date as Text': string;
  'Formula': string;
  'Goal': string;
  'ID': string;
  'Issue': string;
  'Journal': string;
  'Notes': string;
  'Priority Pattern': string;
  'Rollup': string;
  'Session North Star': string;
  'Star Sign': string;
  'Status': string;
  'tag': string;
  '🎛️ Modes & Balances': string;
  '🔺 Acupoints': string;
}

export function parseCSV(csvText: string): CsvRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Simple header parsing, assuming the first line is the header
  const header = lines[0].split(',').map(h => h.trim().replace(/[\ufeff\r]/g, ''));
  const data: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row: Partial<CsvRow> = {};
    let lineToParse = line;

    // Handle potential leading BOM character
    if (i === 1 && lineToParse.startsWith('\ufeff')) {
        lineToParse = lineToParse.substring(1);
    }

    // Simple parser that handles quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lineToParse.length; j++) {
        const char = lineToParse[j];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim()); // Push the last value

    if (values.length !== header.length) {
        console.error("CSV parsing error: Column count mismatch on line", i + 1, values.length, header.length);
        // Fallback to simple split if complex parsing fails (less reliable)
        const simpleValues = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (simpleValues.length === header.length) {
             simpleValues.forEach((value, index) => {
                (row as any)[header[index]] = value;
            });
        } else {
            continue; // Skip problematic row
        }
    } else {
        values.forEach((value, index) => {
            // Clean up quotes if they were used
            const cleanedValue = value.replace(/^"|"$/g, '');
            (row as any)[header[index]] = cleanedValue;
        });
    }

    data.push(row as CsvRow);
  }

  return data;
}