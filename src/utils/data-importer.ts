import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { parseCSV, CsvRow } from "./csv-parser";

interface ClientLookup {
  [name: string]: string; // Client Name -> Client ID
}

const cleanClientName = (clientString: string): string => {
  // 1. Remove Notion URL part: " (https://...)"
  let name = clientString.replace(/\s*\(https?:\/\/.+\)/, '').trim();
  
  // 2. Remove session/date details in brackets: "(Session 2, 19 April 2025)" or "(Monday August 25 2025 90 minutes)"
  name = name.replace(/\s*\([\w\s\/,]+\)/, '').trim();
  
  // 3. Remove session number prefix: "1 - " or "2 - "
  name = name.replace(/^\d+\s*-\s*/, '').trim();
  
  // 4. Remove session details suffix: " Kinesiology (90 minutes)"
  name = name.replace(/\s*Kinesiology\s*\(.+\)/, '').trim();
  
  // 5. Handle specific cases like "Georg, January 12, 90 minutes"
  name = name.split(',')[0].trim();

  return name;
};

export async function importAppointmentsFromCSV(csvText: string) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    showError("No data found in CSV.");
    return { success: 0, failed: 0 };
  }

  // 1. Fetch all clients for lookup
  const { data: clientsData, error: clientError } = await supabase
    .from('clients')
    .select('id, name');

  if (clientError) {
    showError("Failed to fetch clients for mapping.");
    console.error(clientError);
    return { success: 0, failed: rows.length };
  }

  const clientLookup: ClientLookup = {};
  clientsData.forEach(client => {
    clientLookup[client.name.trim()] = client.id;
  });

  // 2. Process and insert appointments
  const appointmentsToInsert = [];
  let failedCount = 0;

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
      showError("User not authenticated. Cannot import data.");
      return { success: 0, failed: rows.length };
  }
  const user_id = user.id;

  for (const row of rows) {
    const rawClientName = row['Client'];
    const clientName = cleanClientName(rawClientName);
    const clientId = clientLookup[clientName];
    
    if (!clientId) {
      console.warn(`Skipping appointment ${row.Name}: Client "${clientName}" not found.`);
      failedCount++;
      continue;
    }

    // Attempt to parse date. CSV date format is "Month Day, Year" (e.g., "December 6, 2021")
    const dateString = row['Date'];
    let date: Date | null = null;
    try {
        // Use Date constructor for flexible parsing, then set a default time (10:00 AM)
        date = new Date(dateString);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        
        // Set a default time if none is specified (assuming 10:00 AM)
        date.setHours(10, 0, 0, 0); 
    } catch (e) {
        console.error(`Invalid date for appointment ${row.Name}: ${dateString}`);
        failedCount++;
        continue;
    }

    // Extract Notion link from the 'Notes' column if present
    let notionLink = null;
    if (row['Notes'] && row['Notes'].includes('https://www.notion.so/')) {
        // Simple extraction: find the first URL that looks like a Notion link
        const urlMatch = row['Notes'].match(/https:\/\/www\.notion\.so\/[a-zA-Z0-9-]+/);
        if (urlMatch) {
            notionLink = urlMatch[0];
        }
    }
    
    const appointment = {
      user_id: user_id,
      client_id: clientId,
      display_id: row['ID'] || null,
      name: row['Name'] || null,
      date: date.toISOString(),
      tag: row['tag'] || 'Kinesiology',
      status: row['Status'] === 'AP' ? 'Completed' : row['Status'] || 'Scheduled', // Map 'AP' to 'Completed'
      goal: row['Goal'] || null,
      issue: row['Issue'] || null,
      notes: row['Notes'] || null,
      additional_notes: row['Additional Notes'] || null,
      priority_pattern: row['Priority Pattern'] || null,
      session_north_star: row['Session North Star'] || null,
      modes_balances: row['🎛️ Modes & Balances'] || null,
      acupoints: row['🔺 Acupoints'] || null,
      journal: row['Journal'] || null,
      notion_link: notionLink,
    };
    
    appointmentsToInsert.push(appointment);
  }

  if (appointmentsToInsert.length === 0) {
    showError("No valid appointments to insert after client mapping.");
    return { success: 0, failed: rows.length };
  }

  // 3. Bulk insert
  const { error: insertError } = await supabase
    .from('appointments')
    .insert(appointmentsToInsert);

  if (insertError) {
    showError(`Failed to insert appointments: ${insertError.message}`);
    console.error(insertError);
    return { success: 0, failed: rows.length };
  }

  const successfulCount = appointmentsToInsert.length;
  
  return { success: successfulCount, failed: rows.length - successfulCount };
}