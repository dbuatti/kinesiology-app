"use client";

import { format } from "date-fns";

/**
 * Exports an array of client objects to a CSV file formatted for Mailchimp.
 * Follows the 'Tags' and 'Custom Fields' logic for seamless import.
 */
export function exportClientsToMailchimpCSV(clients: any[]) {
  // Mailchimp standard headers + Custom FNH fields
  const headers = [
    "Email Address",
    "First Name",
    "Last Name",
    "Phone Number",
    "Suburbs",
    "Birthday",
    "Occupation",
    "Tags",
    "FNH_Status"
  ];

  const rows = clients.map(client => {
    // 1. Split name into first and last
    const nameParts = (client.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    
    // 2. Format birthday (MM/DD)
    const birthday = client.born ? format(new Date(client.born), "MM/dd") : "";
    
    // 3. Handle Tags (Comma separated)
    const tags = client.is_practitioner ? "FNH, Practitioner" : "FNH, Client";
    
    // 4. Handle Custom Status
    const fnhStatus = client.is_practitioner ? "Practitioner" : "Active Client";

    // 5. Join suburbs array
    const suburbs = Array.isArray(client.suburbs) ? client.suburbs.join(", ") : (client.suburbs || "");

    const rowData = [
      client.email || "",
      firstName,
      lastName,
      client.phone || "",
      suburbs,
      birthday,
      client.occupation || "",
      tags,
      fnhStatus
    ];

    // Escape quotes and join with commas
    return rowData.map(val => {
      const stringVal = String(val);
      if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    }).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = format(new Date(), "yyyy-MM-dd");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `fnh_mailchimp_export_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}