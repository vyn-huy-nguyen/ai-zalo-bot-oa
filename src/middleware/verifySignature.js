import crypto from "crypto";

/**
 * Verify webhook signature from Zalo
 * Reference: https://developers.zalo.me/docs/official-account/webhook/nhom-chat-gmf/message_webhook
 * Signature formula: sha256(appId + data + timeStamp + OAsecretKey)
 * Header: X-ZEvent-Signature
 * @param {Object} req - Express request object
 * @param {string} webhookSecret - OA secret key from .env
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(req, webhookSecret) {
  try {
    const signature =
      req.headers["x-zevent-signature"] || req.headers["X-ZEvent-Signature"];

    // If no signature header, skip verification (for development)
    if (!signature) {
      console.warn(
        "⚠️ No X-ZEvent-Signature header found - skipping verification (OK for development)"
      );
      return true; // Allow in development, but should be false in production
    }

    if (!webhookSecret || webhookSecret === "your_webhook_secret") {
      console.warn("⚠️ WEBHOOK_SECRET not configured - skipping verification");
      return true; // Allow in development
    }

    const event = req.body;
    const appId = event.app_id || "";
    const timestamp = event.timestamp || "";
    const data = JSON.stringify(event); // Full event data as JSON string
    const oaSecretKey = webhookSecret; // OA secret key from .env

    // Zalo signature formula: sha256(appId + data + timeStamp + OAsecretKey)
    const signatureString = appId + data + timestamp + oaSecretKey;
    const hash = crypto.createHash("sha256").update(signatureString).digest("hex");

    const isValid = signature === hash;
    if (!isValid) {
      console.warn("⚠️ Invalid webhook signature");
      console.warn("   Expected:", hash);
      console.warn("   Received:", signature);
    } else {
      console.log("✅ Webhook signature verified");
    }
    return isValid;
  } catch (error) {
    console.error("❌ Error verifying signature:", error);
    return false;
  }
}

