import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Export parsed data to CSV file
 * @param {Object} parsedData - Parsed data from message analysis
 * @param {string} groupId - Group ID for filename
 * @param {string} messageId - Message ID for filename
 * @returns {Promise<string>} Path to created CSV file
 */
export function exportToCSV(parsedData, groupId, messageId = null) {
  try {
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, "../../data/exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = messageId
      ? `export_${groupId}_${messageId}_${timestamp}.csv`
      : `export_${groupId}_${timestamp}.csv`;
    const filePath = path.join(exportsDir, filename);

    // Prepare CSV content
    let csvContent = "";
    const headers = [];
    const rows = [];

    // Handle different data structures from Gemini analysis
    // Gemini can return various structures, so we need to handle them dynamically
    
    // Case 1: If parsedData has items array (most common case)
    if (parsedData.items && Array.isArray(parsedData.items) && parsedData.items.length > 0) {
      // Collect all possible keys from all items (dynamic, no hardcoded fields)
      const allKeys = new Set();
      parsedData.items.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach((key) => allKeys.add(key));
        }
      });

      // Convert Set to Array and sort alphabetically for consistency
      // Headers are already in Vietnamese from Gemini AI
      headers.push(...Array.from(allKeys).sort());

      // Build rows from items
      parsedData.items.forEach((item) => {
        const row = headers.map((header) => {
          const value = item[header];
          if (value === null || value === undefined) {
            return "";
          }
          // Escape CSV special characters
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        rows.push(row);
      });
    }
    // Case 2: If parsedData is an array itself
    else if (Array.isArray(parsedData) && parsedData.length > 0) {
      // Collect all possible keys from array items
      const allKeys = new Set();
      parsedData.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach((key) => allKeys.add(key));
        }
      });

      headers.push(...Array.from(allKeys).sort());

      // Build rows from array
      parsedData.forEach((item) => {
        const row = headers.map((header) => {
          const value = item[header];
          if (value === null || value === undefined) {
            return "";
          }
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        rows.push(row);
      });
    }
    // Case 3: If parsedData is a flat object, export as key-value pairs
    else if (typeof parsedData === "object" && parsedData !== null) {
      headers.push("Field", "Value");
      Object.entries(parsedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          let stringValue;
          if (Array.isArray(value)) {
            // If array, try to format nicely
            if (value.length > 0 && typeof value[0] === "object") {
              stringValue = JSON.stringify(value);
            } else {
              stringValue = value.join("; ");
            }
          } else if (typeof value === "object") {
            stringValue = JSON.stringify(value);
          } else {
            stringValue = String(value);
          }
          
          // Escape CSV special characters
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            stringValue = `"${stringValue.replace(/"/g, '""')}"`;
          }
          rows.push([key, stringValue]);
        }
      });
    }
    // Case 4: Other types (string, number, etc.)
    else {
      headers.push("Value");
      const stringValue = String(parsedData);
      const escapedValue = stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
      rows.push([escapedValue]);
    }

    // Write CSV content
    csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    // Write file
    fs.writeFileSync(filePath, csvContent, "utf8");

    console.log(`✅ CSV file created: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error("❌ Error exporting to CSV:", error);
    throw error;
  }
}

/**
 * Clean up old CSV files (keep only last N files)
 * @param {number} keepCount - Number of files to keep (default: 10)
 */
export function cleanupOldCSVFiles(keepCount = 10) {
  try {
    const exportsDir = path.join(__dirname, "../../data/exports");
    if (!fs.existsSync(exportsDir)) {
      return;
    }

    const files = fs
      .readdirSync(exportsDir)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => ({
        name: file,
        path: path.join(exportsDir, file),
        time: fs.statSync(path.join(exportsDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // Sort by modification time, newest first

    // Delete old files
    if (files.length > keepCount) {
      const filesToDelete = files.slice(keepCount);
      filesToDelete.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Deleted old CSV file: ${file.name}`);
        } catch (error) {
          console.warn(`⚠️  Could not delete file ${file.name}:`, error.message);
        }
      });
    }
  } catch (error) {
    console.warn("⚠️  Error cleaning up CSV files:", error.message);
  }
}

