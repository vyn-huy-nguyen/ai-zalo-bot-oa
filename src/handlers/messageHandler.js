import { analyzeMessage } from "../services/ai.js";
import { sendGroupMessage } from "../services/zalo.js";
import { extractGroupId, extractSenderInfo, extractMessageText } from "../utils/extractors.js";
import { saveMessage } from "../database.js";
import { exportToCSV } from "../utils/csvExporter.js";
import { getFileUrl, getFileViewUrl } from "../utils/fileUrl.js";

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

    // If analysis failed, throw error (will be caught by caller to prevent sending message)
    if (!analysisResult.success || !analysisResult.data) {
      throw new Error(
        analysisResult.error || "Failed to analyze message: No data returned from AI"
      );
    }

    // Save to database if analysis was successful
    let dbResult = null;
    try {
      dbResult = saveMessage({
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
      // Continue even if DB save fails, but log the error
    }

    // Prepare response
    return {
      success: true,
      result: analysisResult.message || "✅ Đã nhận tin nhắn và đang xử lý...",
      reply: analysisResult.message || "✅ Đã nhận tin nhắn và đang xử lý...",
      message: analysisResult.message || "✅ Đã nhận tin nhắn và đang xử lý...",
      data: analysisResult.data,
      dbId: dbResult?.id || null,
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

    // Check if message starts with /p (accepts "/p" or "/p " or "/p\n")
    const normalizedMessage = messageText?.trimStart() || "";
    if (!normalizedMessage || !normalizedMessage.toLowerCase().startsWith("/p")) {
      return null;
    }

    // Extract content after /p command
    const content = normalizedMessage.slice(2).trim();

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
    // Flow: Analyze → Save to DB → Create CSV → Send file
    const result = await processMessageAnalysis(data, refreshToken, fallbackToken);

    // If analysis was successful and data was saved to DB, create CSV and send file
    if (result.success && result.data) {
      try {
        // Step 1: Export to CSV (using data from Gemini analysis)
        // CSV will dynamically handle any structure returned by Gemini
        const csvPath = exportToCSV(
          result.data,
          groupId,
          data.message_id || null
        );

        console.log(`📄 CSV file created: ${csvPath}`);

        // Step 2: Generate public URL for CSV file
        const csvUrl = getFileUrl(csvPath);
        const csvViewUrl = getFileViewUrl(csvPath);
        console.log(`🔗 CSV file URL: ${csvUrl}`);

        // Step 3: Send link to CSV file in group
        const message = `📊 Dữ liệu đã được phân tích và xuất CSV.\n\n👀 Xem nhanh: ${csvViewUrl}\n⬇️ Tải file: ${csvUrl}`;
        await sendGroupMessage(groupId, message, refreshToken, fallbackToken);

        // File is kept in data/exports directory (not deleted)
        console.log("✅ CSV file created and link sent to group successfully");
        console.log(`📁 CSV file saved at: ${csvPath}`);
        console.log(`🔗 Public URL: ${csvUrl}`);

        return { success: true, csvPath, csvUrl, csvViewUrl, dbId: result.dbId };
      } catch (csvError) {
        console.error("❌ Error creating CSV file or sending link:", csvError);
        // If CSV creation or sending fails, throw error to prevent sending text message
        throw new Error(`Failed to create CSV or send link: ${csvError.message}`);
      }
    } else {
      // This should not happen if processMessageAnalysis throws on error
      throw new Error("Analysis result is invalid");
    }
  } catch (error) {
    console.error("❌ Error processing command:", error);
    // Do NOT send any message to group if there's an error
    // Just log the error and return
    console.log("⚠️  No message sent to group due to error");
    throw error;
  }
}

