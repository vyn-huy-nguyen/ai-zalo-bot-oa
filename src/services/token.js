import axios from "axios";

// Token cache for access token management
let cachedAccessToken = null;
let tokenExpiresAt = null;

/**
 * Initialize token cache with initial access token
 * @param {string} initialToken - Initial access token from .env
 */
export function initTokenCache(initialToken) {
  cachedAccessToken = initialToken || null;
  tokenExpiresAt = null;
}

/**
 * Refresh access token using refresh token
 * Reference: https://developers.zalo.me/docs/official-account/access-token
 * @param {string} refreshToken - Refresh token from .env
 * @returns {Promise<string>} New access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken || refreshToken === "your_refresh_token") {
      throw new Error("ZALO_REFRESH_TOKEN is required. Please configure it in .env file");
    }

    console.log("🔄 Refreshing access token using refresh token...");

    const response = await axios.post(
      "https://oauth.zalo.me/v4/oa/access_token",
      null,
      {
        params: {
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        },
      }
    );

    if (!response.data || !response.data.access_token) {
      throw new Error("Failed to refresh access token from Zalo");
    }

    // Update cached token
    cachedAccessToken = response.data.access_token;
    
    // Calculate expiration time (default 3600 seconds = 1 hour)
    const expiresIn = response.data.expires_in || 3600;
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log("✅ Access token refreshed successfully");
    return cachedAccessToken;
  } catch (error) {
    console.error("❌ Error refreshing access token:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

/**
 * Get or refresh access token
 * Uses ZALO_ACCESS_TOKEN if available and valid, otherwise refreshes using ZALO_REFRESH_TOKEN
 * Reference: https://developers.zalo.me/docs/official-account/access-token
 * @param {string} refreshToken - Refresh token from .env
 * @param {string} fallbackToken - Fallback access token from .env
 * @returns {Promise<string>} Valid access token
 */
export async function getAccessToken(refreshToken, fallbackToken = null) {
  try {
    // Check if we have a valid cached token
    if (
      cachedAccessToken &&
      tokenExpiresAt &&
      Date.now() < tokenExpiresAt - 60000 // 1 minute buffer
    ) {
      // Token is still valid
      return cachedAccessToken;
    }

    // If we have initial access token but no expiration, use it first
    // (will refresh on next call if it expires)
    if (cachedAccessToken && !tokenExpiresAt) {
      // Try to use the initial token, but refresh it to get expiration time
      try {
        return await refreshAccessToken(refreshToken);
      } catch (error) {
        // If refresh fails, try using the initial token anyway
        console.warn("⚠️ Could not refresh token, using initial access token");
        return cachedAccessToken;
      }
    }

    // Refresh token using ZALO_REFRESH_TOKEN
    return await refreshAccessToken(refreshToken);
  } catch (error) {
    console.error("❌ Error getting access token:", error.message);
    // Fallback to initial access token if refresh fails
    if (fallbackToken && fallbackToken !== "your_access_token") {
      console.warn("⚠️ Using initial ZALO_ACCESS_TOKEN as fallback");
      return fallbackToken;
    }
    throw error;
  }
}

