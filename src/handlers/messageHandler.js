import { analyzeMessage } from "../services/ai.js";
import { sendGroupMessage } from "../services/zalo.js";
import { extractGroupId, extractSenderInfo, extractMessageText } from "../utils/extractors.js";
import { saveMessage } from "../database.js";

/**
 * Process message analysis (internal function)
 * @param {Object} data - Message data
 * @param {string} refreshToken - Zalo refresh token
 * @param {string} fallbackToken - Zalo access token fallback
 * @returns {Promise<Object>} Analysis result
 */
export async function processMessageAnalysis(data, refreshToken, fallbackToken) {
  try {
    const {
      author_id,
      author_name,
      message,
      group_id,
      timestamp,
      original_message,
      message_id,
      user_id_by_app,
      app_id,
      oa_id,
    } = data;

    // Validate required fields
    if (!message || !group_id) {
      throw new Error("Missing required fields: message and group_id");
    }

    console.log("\n📨 Processing message for analysis:");
    console.log("   Author ID:", author_id || "Unknown");
    console.log("   Author Name:", author_name || "Unknown");
    console.log("   Group ID:", group_id);
    console.log("   Message:", message);

    // Analyze message and convert to structured data
    const analysisResult = await analyzeMessage(message);

    // Save to database if analysis was successful
    if (analysisResult.success && analysisResult.data) {
      try {
        const dbResult = saveMessage({
          group_id: group_id,
          author_id: author_id,
          author_name: author_name,
          message: message,
          original_message: original_message,
          parsed_data: analysisResult.data,
          message_id: message_id || null,
          user_id_by_app: user_id_by_app || null,
          app_id: app_id || null,
          oa_id: oa_id || null,
        });
        console.log("✅ Message saved to database, ID:", dbResult.id);
        analysisResult.dbId = dbResult.id;
      } catch (dbError) {
        console.error("❌ Error saving to database:", dbError);
        // Continue even if DB save fails
      }
    }

    // Prepare response
    return {
      success: analysisResult.success !== false,
      result: analysisResult.message || "✅ Đã nhận tin nhắn và đang xử lý...",
      reply: analysisResult.message || "✅ Đã nhận tin nhắn và đang xử lý...",
      message: analysisResult.message || "✅ Đã nhận tin nhắn và đang xử lý...",
      data: analysisResult.data || null,
      timestamp: timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error processing message analysis:", error);
    throw error;
  }
}

/**
 * Process /p command message
 * Reference: https://developers.zalo.me/docs/official-account/webhook/nhom-chat-gmf/message_webhook
 * @param {Object} event - Webhook event from Zalo
 * @param {string} refreshToken - Zalo refresh token
 * @param {string} fallbackToken - Zalo access token fallback
 * @returns {Promise<Object|null>} Result or null if not a /p command
 */
export async function processCommandMessage(event, refreshToken, fallbackToken) {
  try {
    // Extract data from event (handle multiple formats)
    const groupId = extractGroupId(event);
    const sender = extractSenderInfo(event);
    const messageText = extractMessageText(event);

    if (!groupId) {
      console.warn("⚠️ No group_id found in event, skipping");
      return null;
    }

    // Check if message starts with /p
    if (!messageText || !messageText.trim().startsWith("/p ")) {
      return null;
    }

    const content = messageText.trim().slice(3).trim(); // Remove '/p ' prefix

    if (!content) {
      console.log("⚠️ Empty message after /p, skipping");
      return null;
    }

    console.log(`\n📨 New /p command detected:`);
    console.log(`   Sender ID: ${sender.id}`);
    console.log(`   Sender Name: ${sender.name}`);
    console.log(`   Group ID: ${groupId}`);
    console.log(`   Content: ${content}`);

    // Prepare data for backend
    const data = {
      author_id: sender.id,
      author_name: sender.name,
      user_id_by_app: sender.user_id_by_app,
      message: content,
      group_id: groupId,
      message_id: event.message?.msg_id || null,
      timestamp: event.timestamp || new Date().toISOString(),
      original_message: messageText,
      app_id: event.app_id || null,
      oa_id: event.oa_id || null,
    };

    // Process message analysis directly (no HTTP call needed)
    const result = await processMessageAnalysis(data, refreshToken, fallbackToken);

    // Get reply from backend response
    const reply =
      result?.result ||
      result?.reply ||
      result?.message ||
      "✅ Đã nhận tin nhắn và đang xử lý...";

    console.log(`📥 Backend response: ${reply}`);

    // Send reply back to group
    await sendGroupMessage(groupId, reply, refreshToken, fallbackToken);

    return { success: true, reply };
  } catch (error) {
    console.error("❌ Error processing command:", error);
    // Try to send error message to group
    try {
      const groupId = extractGroupId(event);
      if (groupId) {
        await sendGroupMessage(
          groupId,
          "❌ Bot gặp lỗi khi xử lý tin nhắn. Vui lòng thử lại sau.",
          refreshToken,
          fallbackToken
        );
      }
    } catch (sendError) {
      console.error("❌ Error sending error message:", sendError);
    }
    throw error;
  }
}

