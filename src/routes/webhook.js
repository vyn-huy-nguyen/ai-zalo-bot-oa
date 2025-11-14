import express from "express";
import { verifyWebhookSignature } from "../middleware/verifySignature.js";
import { extractGroupId, extractMessageText } from "../utils/extractors.js";
import { processQueryCommand } from "../handlers/queryHandler.js";
import { processCommandMessage } from "../handlers/messageHandler.js";

const router = express.Router();

// Message event types from Zalo GMF
const MESSAGE_EVENT_TYPES = [
  // User sends messages to group
  "user_send_group_text",
  "user_send_group_image",
  "user_send_group_link",
  "user_send_group_audio",
  "user_send_group_video",
  "user_send_group_business_card",
  "user_send_group_sticker",
  "user_send_group_gif",
  "user_send_group_file",
  // OA sends messages to group
  "oa_send_group_text",
  "oa_send_group_image",
  "oa_send_group_link",
  "oa_send_group_audio",
  "oa_send_group_location",
  "oa_send_group_video",
  "oa_send_group_business_card",
  "oa_send_group_sticker",
  "oa_send_group_gif",
  "oa_send_group_file",
  // Legacy/fallback event types
  "user_send_text",
  "oa_send_text",
  "user_send_message",
  "message",
  "text_message",
  "group_message",
  "gmf_message",
];

/**
 * Handle webhook events
 * @param {Object} event - Webhook event from Zalo
 * @param {string} refreshToken - Zalo refresh token
 * @param {string} fallbackToken - Zalo access token fallback
 */
async function handleWebhookEvent(event, refreshToken, fallbackToken) {
  const eventType =
    event.event_name ||
    event.event ||
    event.type ||
    event.event_type ||
    "unknown";

  console.log(`📋 Event type: ${eventType}`);
  console.log(`   App ID: ${event.app_id || "N/A"}`);
  console.log(`   OA ID: ${event.oa_id || "N/A"}`);

  if (MESSAGE_EVENT_TYPES.includes(eventType)) {
    // Process text message - check for commands
    const messageText = extractMessageText(event);

    if (messageText && messageText.trim()) {
      // Check for /t command (query data) first
      if (messageText.trim().startsWith("/t ")) {
        await processQueryCommand(event, refreshToken, fallbackToken);
      }
      // Check for /p command (parse and save)
      else if (messageText.trim().startsWith("/p ")) {
        await processCommandMessage(event, refreshToken, fallbackToken);
      }
      // Other messages are ignored
    } else {
      console.log("ℹ️ Message event received but no text content found");
    }
  }
  // Handle group creation event
  else if (
    eventType === "oa_create_group" ||
    eventType === "create_group" ||
    eventType === "group_created"
  ) {
    const groupId = extractGroupId(event);
    console.log("✅ New group created:", groupId);
  }
  // Handle member added event
  else if (
    eventType === "oa_add_member" ||
    eventType === "add_member" ||
    eventType === "member_added"
  ) {
    const groupId = extractGroupId(event);
    console.log("✅ Member added to group:", groupId);
  }
  // Handle member removed event
  else if (
    eventType === "oa_remove_member" ||
    eventType === "remove_member" ||
    eventType === "member_removed"
  ) {
    const groupId = extractGroupId(event);
    console.log("✅ Member removed from group:", groupId);
  }
  // Handle unknown event types
  else {
    console.log(`ℹ️ Unhandled event type: ${eventType}`);
    console.log("   Full event data:", JSON.stringify(event, null, 2));
  }
}

/**
 * @swagger
 * /webhook:
 *   get:
 *     summary: Webhook verification endpoint
 *     description: Zalo will call this to verify webhook URL when setting up webhook
 *     tags: [Webhook]
 *     parameters:
 *       - in: query
 *         name: mode
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification mode (should be "subscribe")
 *       - in: query
 *         name: verify_token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verify token (must match WEBHOOK_VERIFY_TOKEN in .env)
 *       - in: query
 *         name: challenge
 *         required: true
 *         schema:
 *           type: string
 *         description: Challenge string from Zalo
 *     responses:
 *       200:
 *         description: Webhook verified successfully (returns challenge)
 *       403:
 *         description: Verification failed
 */
router.get("/webhook", (req, res) => {
  const mode = req.query.mode;
  const token = req.query.verify_token;
  const challenge = req.query.challenge;
  const verifyToken = req.verifyToken; // Passed from middleware

  console.log("\n🔍 Webhook verification request:");
  console.log("   Mode:", mode);
  console.log("   Token:", token);
  console.log("   Challenge:", challenge);

  // Verify token
  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Webhook verification failed");
    res.status(403).send("Forbidden");
  }
});

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Webhook endpoint to receive events from Zalo OA
 *     description: Receives webhook events from Zalo (messages, group creation, member changes, etc.)
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_name:
 *                 type: string
 *                 example: "user_send_group_text"
 *               sender:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *               recipient:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *               message:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                   msg_id:
 *                     type: string
 *               app_id:
 *                 type: string
 *               oa_id:
 *                 type: string
 *               timestamp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event received and processed successfully
 *       403:
 *         description: Invalid webhook signature
 */
router.post("/webhook", async (req, res) => {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(req, req.webhookSecret)) {
      console.warn("⚠️ Invalid webhook signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log("\n📨 Received webhook event:");
    console.log(JSON.stringify(event, null, 2));

    // Handle webhook event
    await handleWebhookEvent(event, req.refreshToken, req.fallbackToken);

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    console.error("   Error stack:", error.stack);
    // Still return 200 to prevent Zalo from retrying excessively
    res.status(200).json({ success: false, error: error.message });
  }
});

/**
 * Handle webhook requests at root URL (for Zalo verification)
 * Zalo may send POST requests to root URL during webhook setup
 */
router.post("/", async (req, res) => {
  console.log("\n📨 Received POST request at root URL (webhook verification)");

  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(req, req.webhookSecret)) {
      console.warn("⚠️ Invalid webhook signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log("\n📨 Received webhook event:");
    console.log(JSON.stringify(event, null, 2));

    // Handle webhook event
    await handleWebhookEvent(event, req.refreshToken, req.fallbackToken);

    // Always return 200 OK to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    console.error("   Error stack:", error.stack);
    // Still return 200 to prevent Zalo from retrying excessively
    res.status(200).json({ success: false, error: error.message });
  }
});

export default router;

