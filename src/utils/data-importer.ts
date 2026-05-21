import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { parseCSV, CsvRow } from "@/utils/csv-parser";

interface ClientLookup {
  [name: string]: string; // Client Name -> Client ID
}

const cleanClientName = (clientString: string): string => {
  if (!clientString) return '';
  
  // 1. Extract name from Notion URL format: "Name (https://...)"
  const notionMatch = clientString.match(/^"?([^(]+)\s*\(https?:\/\/[^)]+\)"?$/);
  if (notionMatch) {
    return notionMatch[1].trim();
  }
  
  // 2. Remove any remaining quotes
  let name = clientString.replace(/^"|"$/g, '').trim();
  
  // 3. Remove session/date details in brackets
  name = name.replace(/\s*\([^)]*\d{4}[^)]*\)/g, '').trim();
  
  // 4. Remove session number prefix: "1 - " or "2 - "
  name = name.replace(/^\d+\s*-\s*/, '').trim();
  
  // 5. Remove session details suffix
  name = name.replace(/\s*Kinesiology\s*\([^)]+\)/g, '').trim();
  
  // 6. Take only the first part before comma (for cases like "Georg, January 12")
  name = name.split(',')[0].trim();

  return name;
};

export async function importClientsFromCSV(csvText: string) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    showError("No data found in CSV.");
    return { success: 0, failed: 0 };
  }

  console.log(`Parsed ${rows.length} clients from CSV`);

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    showError("User not authenticated.");
    return { success: 0, failed: rows.length };
  }

  const clientsToInsert = [];
  let failedCount = 0;

  for (const row of rows) {
    const name = row['Name'];
    if (!name) {
      failedCount++;
      continue;
    }

    let bornDate = null;
    if (row['Born']) {
      try {
        const parsedDate = new Date(row['Born']);
        if (!isNaN(parsedDate.getTime())) {
          bornDate = parsedDate.toISOString();
        }
      } catch (e) {}
    }

    const suburbsArray = row['Suburb'] 
      ? [row['Suburb'].trim()] 
      : [];

    clientsToInsert.push({
      user_id: user.id,
      name: name.trim(),
      email: row['Email'] || null,
      phone: row['Phone'] || null,
      born: bornDate,
      suburbs: suburbsArray,
      occupation: row['Occupation'] || null,
      marital_status: row['Marital Status'] || null,
      children: row['Children'] || null,
      journal: row['Journal'] || null,
      pronouns: row['Pronouns'] || null
    });
  }

  const { error } = await supabase.from('clients').insert(clientsToInsert);
  if (error) {
    showError(`Failed to import clients: ${error.message}`);
    return { success: 0, failed: rows.length };
  }

  return { success: clientsToInsert.length, failed: failedCount };
}

export async function importAppointmentsFromCSV(csvText: string) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    showError("No data found in CSV.");
    return { success: 0, failed: 0 };
  }

  console.log(`Parsed ${rows.length} rows from CSV`);

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
    clientLookup[client.name.trim().toLowerCase()] = client.id;
  });

  console.log(`Loaded ${Object.keys(clientLookup).length} clients for matching`);

  // 2. Get authenticated user
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    showError("User not authenticated. Cannot import data.");
    return { success: 0, failed: rows.length };
  }
  const user_id = user.id;

  // 3. Fetch existing display_ids to avoid duplicates
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('display_id')
    .not('display_id', 'is', null);

  const existingDisplayIds = new Set(
    (existingAppointments || []).map(a => a.display_id)
  );

  // 4. Process and insert appointments
  const appointmentsToInsert = [];
  let failedCount = 0;
  let skippedDuplicates = 0;

  for (const row of rows) {
    const rawClientName = row['Client'];
    const clientName = cleanClientName(rawClientName);
    
    if (!clientName) {
      console.warn(`Skipping appointment ${row.Name}: Empty client name`);
      failedCount++;
      continue;
    }

    let clientId = clientLookup[clientName.toLowerCase()];
    
    if (!clientId) {
      console.log(`Client "${clientName}" not found. Creating new client profile...`);
      try {
        let bornDate = null;
        if (row['Born']) {
          try {
            const parsedDate = new Date(row['Born']);
            if (!isNaN(parsedDate.getTime())) {
              bornDate = parsedDate.toISOString();
            }
          } catch (e) {}
        }

        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert({
            user_id: user_id,
            name: clientName,
            email: row['Email'] || null,
            phone: row['Phone'] || null,
            born: bornDate,
            suburbs: row['Suburb'] ? [row['Suburb'].trim()] : []
          })
          .select('id')
          .single();

        if (createError) throw createError;
        clientId = newClient.id;
        clientLookup[clientName.toLowerCase()] = clientId; // Add to lookup cache
      } catch (err) {
        console.error(`Failed to create client "${clientName}":`, err);
        failedCount++;
        continue;
      }
    }

    // Check for duplicate display_id
    const displayId = row['ID'] || null;
    if (displayId && existingDisplayIds.has(displayId)) {
      console.warn(`Skipping appointment ${row.Name}: Duplicate display_id "${displayId}"`);
      skippedDuplicates++;
      failedCount++;
      continue;
    }

    // Parse date
    const dateString = row['Date'];
    let date: Date | null = null;
    try {
      date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      date.setHours(10, 0, 0, 0);
    } catch (e) {
      console.error(`Invalid date for appointment ${row.Name}: ${dateString}`);
      failedCount++;
      continue;
    }

    // Extract Notion link from Notes
    let notionLink = null;
    if (row['Notes'] && row['Notes'].includes('notion.so')) {
      const urlMatch = row['Notes'].match(/https:\/\/[^\s,)]+notion\.so[^\s,)]+/);
      if (urlMatch) {
        notionLink = urlMatch[0];
      }
    }
    
    const appointment = {
      user_id: user_id,
      client_id: clientId,
      display_id: displayId,
      name: row['Name'] || null,
      date: date.toISOString(),
      tag: row['tag'] || 'Kinesiology',
      status: row['Status'] === 'AP' ? 'Completed' : row['Status'] || 'Scheduled',
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
    showError(`No valid appointments to insert. ${skippedDuplicates} duplicates skipped.`);
    return { success: 0, failed: rows.length };
  }

  console.log(`Attempting to insert ${appointmentsToInsert.length} appointments`);

  // 5. Bulk insert
  const { error: insertError } = await supabase
    .from('appointments')
    .insert(appointmentsToInsert);

  if (insertError) {
    showError(`Failed to insert appointments: ${insertError.message}`);
    console.error(insertError);
    return { success: 0, failed: rows.length };
  }

  const successfulCount = appointmentsToInsert.length;
  
  if (skippedDuplicates > 0) {
    showSuccess(`Import complete: ${successfulCount} imported, ${skippedDuplicates} duplicates skipped`);
  }
  
  return { success: successfulCount, failed: rows.length - successfulCount };
}