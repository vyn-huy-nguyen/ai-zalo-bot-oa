import { queryAndAnalyzeData } from "../services/ai.js";
import { sendGroupMessage } from "../services/zalo.js";
import { extractGroupId, extractSenderInfo, extractMessageText } from "../utils/extractors.js";

/**
 * Process query request (internal function)
 * @param {Object} data - Query data
 * @returns {Promise<Object>} Query result
 */
export async function processQueryRequest(data) {
  try {
    const { group_id, question, author_id, author_name } = data;

    // Validate required fields
    if (!question || !group_id) {
      throw new Error("Missing required fields: question and group_id");
    }

    console.log("\n🔍 Processing query request:");
    console.log("   Author ID:", author_id || "Unknown");
    console.log("   Author Name:", author_name || "Unknown");
    console.log("   Group ID:", group_id);
    console.log("   Question:", question);

    // Query and analyze data using AI
    const queryResult = await queryAndAnalyzeData(group_id, question);

    // Prepare response
    return {
      success: queryResult.success !== false,
      result: queryResult.message || "Không thể truy vấn dữ liệu.",
      reply: queryResult.message || "Không thể truy vấn dữ liệu.",
      data: queryResult.data || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Error processing query:", error);
    throw error;
  }
}

/**
 * Process /t command message (query data)
 * @param {Object} event - Webhook event from Zalo
 * @param {string} refreshToken - Zalo refresh token
 * @param {string} fallbackToken - Zalo access token fallback
 * @returns {Promise<Object|null>} Result or null if not a /t command
 */
export async function processQueryCommand(event, refreshToken, fallbackToken) {
  try {
    // Extract data from event
    const groupId = extractGroupId(event);
    const sender = extractSenderInfo(event);
    const messageText = extractMessageText(event);

    if (!groupId) {
      console.warn("⚠️ No group_id found in event, skipping");
      return null;
    }

    // Check if message starts with /t
    if (!messageText || !messageText.trim().startsWith("/t ")) {
      return null;
    }

    const question = messageText.trim().slice(3).trim(); // Remove '/t ' prefix

    if (!question) {
      console.log("⚠️ Empty question after /t, skipping");
      return null;
    }

    console.log(`\n🔍 New /t query command detected:`);
    console.log(`   Sender ID: ${sender.id}`);
    console.log(`   Sender Name: ${sender.name}`);
    console.log(`   Group ID: ${groupId}`);
    console.log(`   Question: ${question}`);

    // Prepare data for query
    const data = {
      author_id: sender.id,
      author_name: sender.name,
      question: question,
      group_id: groupId,
      message_id: event.message?.msg_id || null,
      timestamp: event.timestamp || new Date().toISOString(),
      original_message: messageText,
      app_id: event.app_id || null,
      oa_id: event.oa_id || null,
    };

    // Process query request directly (no HTTP call needed)
    const result = await processQueryRequest(data);

    // Get reply from backend response
    const reply =
      result?.result ||
      result?.reply ||
      result?.message ||
      "❌ Không thể truy vấn dữ liệu. Vui lòng thử lại sau.";

    console.log(`📥 Backend query response: ${reply}`);

    // Send reply back to group
    await sendGroupMessage(groupId, reply, refreshToken, fallbackToken);

    return { success: true, reply };
  } catch (error) {
    console.error("❌ Error processing query command:", error);
    // Try to send error message to group
    try {
      const groupId = extractGroupId(event);
      if (groupId) {
        await sendGroupMessage(
          groupId,
          "❌ Bot gặp lỗi khi truy vấn dữ liệu. Vui lòng thử lại sau.",
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

