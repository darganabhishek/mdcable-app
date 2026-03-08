/**
 * Utility function to export data to CSV and trigger a download.
 * @param {Array} data - Array of objects to export.
 * @param {Array} headers - Optional array of header names for the CSV. If omitted, keys of the first data object will be used.
 * @param {string} fileName - Name of the file to be downloaded.
 */
export const downloadCSV = (data, headers = null, fileName = "export.csv") => {
  if (!data || !data.length) {
    console.warn("No data available to export.");
    return;
  }

  // Determine headers if not provided
  const headerKeys = headers ? headers : Object.keys(data[0]);

  // Format the CSV content
  const csvRows = [];

  // Add headers to CSV
  csvRows.push(headerKeys.join(","));

  // Add data rows
  for (const row of data) {
    const values = headerKeys.map((header) => {
      // Handle nested objects (like customer.name in payments)
      let value = row[header];

      // If the header itself is a path (e.g. 'customer.name')
      if (header.includes(".")) {
        const parts = header.split(".");
        value = parts.reduce(
          (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : ""),
          row,
        );
      }

      // Escape quotes and handle commas
      const escaped = ("" + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
