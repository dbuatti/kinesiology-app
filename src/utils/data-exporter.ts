"use client";

import { format } from "date-fns";

/**
 * Exports an array of client objects to a CSV file formatted for Mailchimp.
 */
export function exportClientsToMailchimpCSV(clients: any[]) {
  const headers = ["Email Address", "First Name", "Last Name", "Phone Number", "Suburbs", "Birthday", "Occupation", "Tags", "FNH_Status"];
  const rows = clients.map(client => {
    const nameParts = (client.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const birthday = client.born ? format(new Date(client.born), "MM/dd") : "";
    const tags = client.is_practitioner ? "FNH, Practitioner" : "FNH, Client";
    const fnhStatus = client.is_practitioner ? "Practitioner" : "Active Client";
    const suburbs = Array.isArray(client.suburbs) ? client.suburbs.join(", ") : (client.suburbs || "");

    return [client.email || "", firstName, lastName, client.phone || "", suburbs, birthday, client.occupation || "", tags, fnhStatus]
      .map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  downloadCSV(csvContent, "mailchimp");
}

/**
 * Exports an array of client objects to a CSV file formatted for Kit (ConvertKit).
 */
export function exportClientsToKitCSV(clients: any[]) {
  // Kit standard headers
  const headers = [
    "Email",
    "First Name",
    "Tags",
    "Phone",
    "Suburbs",
    "Occupation"
  ];

  const rows = clients.map(client => {
    const firstName = (client.name || "").trim().split(/\s+/)[0] || "";
    const tags = client.is_practitioner ? "FNH, Practitioner" : "FNH, Client";
    const suburbs = Array.isArray(client.suburbs) ? client.suburbs.join(", ") : (client.suburbs || "");

    const rowData = [
      client.email || "",
      firstName,
      tags,
      client.phone || "",
      suburbs,
      client.occupation || ""
    ];

    return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  downloadCSV(csvContent, "kit");
}

function downloadCSV(content: string, provider: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = format(new Date(), "yyyy-MM-dd");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `fnh_${provider}_export_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}