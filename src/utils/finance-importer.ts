import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

const parseCurrency = (val: string): number | null => {
  if (!val) return null;
  // Remove $, commas, and handle parentheses for negative numbers
  let clean = val.replace(/[$,\s]/g, '');
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = '-' + clean.substring(1, clean.length - 1);
  }
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  // Expected format: DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export async function importFinancesFromCSV(csvText: string) {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) {
    showError("CSV file is empty or invalid.");
    return { success: 0, failed: 0 };
  }

  // Handle headers (Note: there are duplicate "Account" headers in your CSV)
  const headers = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1);

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    showError("User not authenticated.");
    return { success: 0, failed: 0 };
  }

  const transactions = [];
  let failedCount = 0;

  for (const row of dataRows) {
    // Simple CSV split (doesn't handle quoted commas, but your data looks clean)
    const values = row.split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const date = parseDate(values[3]);
    if (!date) {
      failedCount++;
      continue;
    }

    transactions.push({
      user_id: user.id,
      week: parseInt(values[0]) || null,
      month_code: values[1],
      month_name: values[2],
      transaction_date: date,
      account_identifier: values[4], // First "Account" column
      description: values[5],
      credit: parseCurrency(values[6]),
      debit: parseCurrency(values[7]),
      account_label: values[8], // Second "Account" column
      category_1: values[9],
      category_2: values[10],
      is_work: values[11]?.toLowerCase() === 'yes',
      amount: parseCurrency(values[12]),
      notes: values[15],
      mmm_yyyy: values[17]
    });
  }

  if (transactions.length === 0) {
    showError("No valid transactions found to import.");
    return { success: 0, failed: failedCount };
  }

  // Bulk insert in chunks of 100 to avoid payload limits
  const chunkSize = 100;
  let successCount = 0;

  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    const { error } = await supabase.from('finance_transactions').insert(chunk);
    if (error) {
      console.error("Insert error:", error);
      failedCount += chunk.length;
    } else {
      successCount += chunk.length;
    }
  }

  return { success: successCount, failed: failedCount };
}