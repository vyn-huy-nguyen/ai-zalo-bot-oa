import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./database.js";
import { initTokenCache } from "./services/token.js";
import { injectTokens } from "./middleware/injectTokens.js";
import webhookRoutes from "./routes/webhook.js";
import apiRoutes from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Zalo OA Configuration
const OA_ID = process.env.ZALO_OA_ID;
const ZALO_ACCESS_TOKEN = process.env.ZALO_ACCESS_TOKEN;
const ZALO_REFRESH_TOKEN = process.env.ZALO_REFRESH_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Initialize token cache
initTokenCache(ZALO_ACCESS_TOKEN);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Zalo OA Bot API",
      version: "1.0.0",
      description:
        "API documentation for Zalo Official Account Bot using OpenAPI for GMF group messaging",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development server",
      },
      {
        url: process.env.SERVER_URL || "https://your-domain.com",
        description: "Production server",
      },
    ],
    tags: [
      {
        name: "Webhook",
        description: "Webhook endpoints for receiving events from Zalo",
      },
      {
        name: "Groups",
        description: "GMF group management endpoints",
      },
      {
        name: "Health",
        description: "Health check and info endpoints",
      },
    ],
  },
  apis: ["./src/index.js", "./src/routes/*.js"], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Zalo OA Bot API Documentation",
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inject tokens middleware (for routes that need tokens)
app.use(injectTokens(ZALO_REFRESH_TOKEN, ZALO_ACCESS_TOKEN, WEBHOOK_SECRET, VERIFY_TOKEN));

/**
 * Serve Zalo domain verification file
 * This endpoint is required for Zalo domain ownership verification
 * Reference: Zalo Developer Console - Domain Verification
 */
app.get("/zalo_verifierClsq2DBqPX4YXj1AzAjrJ1EExdF_-3ejDJKu.html", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../zalo_verifierClsq2DBqPX4YXj1AzAjrJ1EExdF_-3ejDJKu.html");
    
    if (fs.existsSync(filePath)) {
      const htmlContent = fs.readFileSync(filePath, "utf8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(htmlContent);
      console.log("✅ Zalo domain verification file served");
    } else {
      console.warn("⚠️ Zalo verification file not found:", filePath);
      res.status(404).send("Verification file not found");
    }
  } catch (error) {
    console.error("❌ Error serving verification file:", error);
    res.status(500).send("Error serving verification file");
  }
});

// Serve static files from exports directory
const exportsDir = path.join(__dirname, "../data/exports");
app.use("/exports", express.static(exportsDir, {
  setHeaders: (res, filePath) => {
    // Set proper content-type for CSV files
    if (filePath.endsWith(".csv")) {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
    }
  }
}));

// CSV preview route (render as HTML table for quick viewing)
app.get("/exports/view/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename || filename.includes("..")) {
      return res.status(400).send("Invalid filename");
    }

    const filePath = path.join(exportsDir, filename);
    if (!filePath.startsWith(exportsDir)) {
      return res.status(403).send("Access denied");
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    const csvContent = fs.readFileSync(filePath, "utf8");
    const rows = csvContent
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => parseCsvLine(line));

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(renderCsvPreview(filename, rows));
  } catch (error) {
    console.error("❌ Error rendering CSV preview:", error);
    res.status(500).send("Error rendering CSV preview");
  }
});

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function renderCsvPreview(filename, rows) {
  const escapedFilename = filename.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const tableRows = rows
    .map((row, index) => {
      const cells = row
        .map((cell) =>
          `<td>${(cell || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .trim()}</td>`
        )
        .join("");
      const rowClass = index === 0 ? "header-row" : "";
      return `<tr class="${rowClass}">${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>CSV Preview - ${escapedFilename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; margin-bottom: 10px; }
        table { border-collapse: collapse; width: 100%; overflow-x: auto; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
        th, .header-row td { background: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
        tr:hover { background: #f1f1f1; }
        .actions { margin-top: 15px; }
        .actions a { margin-right: 15px; color: #007bff; text-decoration: none; }
        .actions a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>CSV Preview: ${escapedFilename}</h1>
        <div class="actions">
          <a href="/exports/${escapedFilename}" target="_blank">⬇️ Tải CSV</a>
          <a href="javascript:window.history.back()">⬅️ Quay lại</a>
        </div>
        <div class="table-wrapper">
          <table>
            ${tableRows || "<tr><td>File rỗng</td></tr>"}
          </table>
        </div>
      </div>
    </body>
  </html>`;
}

// Routes
app.use("/", webhookRoutes);
app.use("/api", apiRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Returns service info and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service information
 */
app.get("/", (req, res) => {
  res.json({
    service: "Zalo OA Bot Webhook Server",
    status: "running",
    endpoints: {
      webhook: "GET/POST /webhook",
      health: "GET /health",
      info: "GET /api/info",
      docs: "GET /api-docs",
      verification: "GET /zalo_verifierClsq2DBqPX4YXj1AzAjrJ1EExdF_-3ejDJKu.html",
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Zalo OA Bot Webhook Server",
  });
});

// Start server
app.listen(PORT, () => {
  const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
  
  console.log("\n🚀 Zalo OA Bot Webhook Server started");
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`📥 Webhook URL: ${serverUrl}/webhook`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📁 Exports files: ${serverUrl}/exports/<filename>\n`);
  console.log("⚠️  Make sure to:");
  console.log("   1. Configure webhook URL in Zalo Developer Console");
  console.log("   2. Set VERIFY_TOKEN in .env file");
  console.log("   3. Set WEBHOOK_SECRET in .env file");
  console.log("   4. Set SERVER_URL in .env file (for CSV file links)");
  console.log("   5. Configure ZALO_ACCESS_TOKEN in .env file (optional, for initial token)");
  console.log("   6. Configure ZALO_REFRESH_TOKEN in .env file (required, for token refresh)\n");
});
