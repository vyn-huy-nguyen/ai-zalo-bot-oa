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
  console.log("\n🚀 Zalo OA Bot Webhook Server started");
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`📥 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs\n`);
  console.log("⚠️  Make sure to:");
  console.log("   1. Configure webhook URL in Zalo Developer Console");
  console.log("   2. Set VERIFY_TOKEN in .env file");
  console.log("   3. Set WEBHOOK_SECRET in .env file");
  console.log("   4. Configure ZALO_ACCESS_TOKEN in .env file (optional, for initial token)");
  console.log("   5. Configure ZALO_REFRESH_TOKEN in .env file (required, for token refresh)\n");
});
