import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert CSV file to PDF
 * @param {string} csvPath - Path to CSV file
 * @returns {Promise<string>} Path to created PDF file
 */
export function convertCSVToPDF(csvPath) {
  try {
    if (!csvPath || !fs.existsSync(csvPath)) {
      throw new Error("CSV file path is required and file must exist");
    }

    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const lines = csvContent.trim().split("\n");

    if (lines.length === 0) {
      throw new Error("CSV file is empty");
    }

    // Parse CSV (simple parser - handles quoted values)
    function parseCSVLine(line) {
      const result = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          // Field separator
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim()); // Add last field
      return result;
    }

    // Parse all lines
    const rows = lines.map((line) => parseCSVLine(line));
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    // Create PDF file path
    const csvDir = path.dirname(csvPath);
    const csvName = path.basename(csvPath, ".csv");
    const pdfPath = path.join(csvDir, `${csvName}.pdf`);

    // Create PDF document
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(pdfPath));

    // Set font
    doc.fontSize(12);

    // Title
    doc.fontSize(16).text("Data Export", { align: "center" }).moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString("vi-VN")}`, {
      align: "center",
    });
    doc.moveDown();

    // Calculate column widths
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnCount = headers.length;
    const columnWidth = columnCount > 0 ? pageWidth / columnCount : pageWidth;
    const rowHeight = 20;
    const startX = doc.page.margins.left;

    // Table header
    doc.fontSize(10).font("Helvetica-Bold");
    let y = doc.y;

    headers.forEach((header, index) => {
      const cellText = String(header || "");
      doc.text(cellText, startX + index * columnWidth, y, {
        width: columnWidth - 5,
        align: "left",
        ellipsis: true, // Truncate long text
      });
    });

    // Draw header underline
    y += rowHeight;
    doc
      .moveTo(startX, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .stroke();
    doc.y = y + 5;

    // Table data
    doc.font("Helvetica").fontSize(9);
    dataRows.forEach((row) => {
      // Check if we need a new page
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      } else {
        y = doc.y;
      }

      // Draw row data
      headers.forEach((header, colIndex) => {
        const cellValue = row[colIndex] || "";
        const cellText = String(cellValue);
        doc.text(cellText, startX + colIndex * columnWidth, y, {
          width: columnWidth - 5,
          align: "left",
          ellipsis: true, // Truncate long text
        });
      });

      doc.y = y + rowHeight;
    });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        console.log(`✅ PDF file created: ${pdfPath}`);
        resolve(pdfPath);
      });

      doc.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("❌ Error converting CSV to PDF:", error);
    throw error;
  }
}

