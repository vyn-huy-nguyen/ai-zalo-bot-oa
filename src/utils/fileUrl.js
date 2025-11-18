import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate public URL for a file in exports directory
 * @param {string} filePath - Full path to the file
 * @param {string} baseUrl - Base URL of the server (from SERVER_URL env or request)
 * @returns {string} Public URL to access the file
 */
export function getFileUrl(filePath, baseUrl = null) {
  try {
    // Get base URL from environment or parameter
    let serverUrl = baseUrl || process.env.SERVER_URL;
    
    // If no SERVER_URL, try to construct from common patterns
    if (!serverUrl) {
      // For development, use localhost
      const port = process.env.PORT || 3000;
      serverUrl = `http://localhost:${port}`;
      console.warn(`⚠️  SERVER_URL not set, using default: ${serverUrl}`);
      console.warn(`   Please set SERVER_URL in .env file for production`);
    }

    // Remove trailing slash from serverUrl
    serverUrl = serverUrl.replace(/\/$/, "");

    // Get relative path from exports directory
    const exportsDir = path.join(__dirname, "../../data/exports");
    const relativePath = path.relative(exportsDir, filePath);
    
    // Get filename
    const filename = path.basename(filePath);
    
    // Construct URL: {SERVER_URL}/exports/{filename}
    return `${serverUrl}/exports/${filename}`;
  } catch (error) {
    console.error("❌ Error generating file URL:", error);
    throw error;
  }
}

/**
 * Generate public view URL for a file preview page
 * @param {string} filePath
 * @param {string} baseUrl
 * @returns {string}
 */
export function getFileViewUrl(filePath, baseUrl = null) {
  try {
    let serverUrl = baseUrl || process.env.SERVER_URL;
    if (!serverUrl) {
      const port = process.env.PORT || 3000;
      serverUrl = `http://localhost:${port}`;
      console.warn(`⚠️  SERVER_URL not set, using default: ${serverUrl}`);
    }
    serverUrl = serverUrl.replace(/\/$/, "");

    const exportsDir = path.join(__dirname, "../../data/exports");
    const filename = path.basename(filePath);
    return `${serverUrl}/exports/view/${filename}`;
  } catch (error) {
    console.error("❌ Error generating file URL:", error);
    throw error;
  }
}

