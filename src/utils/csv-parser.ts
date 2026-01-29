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
  // Remove BOM if present
  const cleanText = csvText.replace(/^\ufeff/, '');
  const lines = cleanText.split('\n');
  
  if (lines.length === 0) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);
  const data: CsvRow[] = [];

  let i = 1;
  while (i < lines.length) {
    const { values, linesConsumed } = parseCSVRow(lines, i, header.length);
    
    if (values.length === header.length) {
      const row: Partial<CsvRow> = {};
      values.forEach((value, index) => {
        (row as any)[header[index]] = value;
      });
      data.push(row as CsvRow);
    } else if (values.length > 0) {
      console.warn(`CSV parsing: Skipping row at line ${i + 1} - expected ${header.length} columns, got ${values.length}`);
    }
    
    i += linesConsumed;
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

function parseCSVRow(lines: string[], startIndex: number, expectedColumns: number): { values: string[], linesConsumed: number } {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let linesConsumed = 0;
  let lineIndex = startIndex;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    linesConsumed++;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // If we're in quotes, this field continues on the next line
    if (inQuotes) {
      current += '\n';
      lineIndex++;
    } else {
      // End of row
      values.push(current.trim());
      break;
    }
  }

  return { values, linesConsumed };
}