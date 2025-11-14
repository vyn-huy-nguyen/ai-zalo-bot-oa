import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllGroupData } from "../database.js";

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Analyze message using Gemini AI and convert to structured data
 * @param {string} message - Message content to analyze
 * @returns {Promise<Object>} Analysis result with structured data
 */
export async function analyzeMessage(message) {
  try {
    // Validate API key
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === "your_gemini_api_key" ||
      process.env.GEMINI_API_KEY.trim() === ""
    ) {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env file");
    }

    console.log("🤖 Analyzing message with Gemini AI...");
    console.log("   API Key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
    console.log("   Message:", message.substring(0, 100) + (message.length > 100 ? "..." : ""));

    // Create prompt for Gemini to parse message into structured data
    const prompt = `Bạn là một hệ thống phân tích tin nhắn thông minh.
      Nhiệm vụ của bạn là phân tích tin nhắn của người dùng và chuyển đổi thành dữ liệu có cấu trúc (JSON).

      Tin nhắn của người dùng: ${message}

      Yêu cầu:
      - Phân tích tin nhắn và trích xuất thông tin về các sản phẩm, hàng hóa, số lượng, đơn vị, giá cả, v.v.
      - Trả về kết quả dưới dạng JSON với cấu trúc:
        {
          "items": [
            {
              "name": "Tên sản phẩm/hàng hóa",
              "quantity": Số lượng (number),
              "unit": "Đơn vị (ví dụ: cái, kg, thùng, ...)",
              "price": Giá (number, optional),
              "total": Tổng tiền (number, optional)
            }
          ],
          "summary": {
            "total_items": Tổng số mặt hàng,
            "total_quantity": Tổng số lượng,
            "total_amount": Tổng tiền (nếu có)
          },
          "metadata": {
            "date": "Ngày tháng (nếu có trong tin nhắn)",
            "type": "Loại giao dịch (nhập/xuất/bán/mua, ...)",
            "notes": "Ghi chú thêm (nếu có)"
          }
        }

      - Nếu tin nhắn không chứa thông tin về sản phẩm/hàng hóa, trả về items là mảng rỗng []
      - Chỉ trả về JSON, không thêm text giải thích
      - Đảm bảo JSON hợp lệ, có thể parse được

      Hãy phân tích và trả về JSON:`;

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more structured output
        maxOutputTokens: 2000,
      },
    });

    console.log("📤 Sending request to Gemini API...");
    console.log("   Model:", process.env.GEMINI_MODEL || "gemini-flash-latest");
    console.log("   Prompt length:", prompt.length, "characters");

    // Generate content with timeout
    const timeoutMs = 30000; // 30 seconds timeout
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Gemini API timeout after 30 seconds")), timeoutMs);
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    console.log("✅ Received response from Gemini API");
    
    const response = await result.response;
    const text = response.text();
    console.log("📥 Response text length:", text.length, "characters");

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    // Parse JSON
    const parsedData = JSON.parse(jsonText);

    console.log("✅ Message analyzed successfully");
    console.log("   Parsed data:", JSON.stringify(parsedData, null, 2));

    // Generate user-friendly response message
    const responseMessage = generateResponseMessage(parsedData);

    return {
      success: true,
      message: responseMessage,
      data: parsedData,
    };
  } catch (error) {
    console.error("❌ Error analyzing message:");
    console.error("   Error type:", error.constructor.name);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);
    
    // Check for specific error types
    if (error.message.includes("timeout")) {
      return {
        success: false,
        message: "❌ Lỗi: Gemini API timeout. Vui lòng thử lại sau.",
        data: null,
      };
    }
    
    if (error.message.includes("API_KEY") || error.message.includes("API key")) {
      return {
        success: false,
        message: "❌ Lỗi: GEMINI_API_KEY không hợp lệ. Vui lòng kiểm tra lại.",
        data: null,
      };
    }
    
    // Return error response
    return {
      success: false,
      message: `❌ Lỗi khi phân tích tin nhắn: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate user-friendly response message from parsed data
 * @param {Object} parsedData - Parsed data from AI
 * @returns {string} User-friendly message
 */
function generateResponseMessage(parsedData) {
  if (!parsedData.items || parsedData.items.length === 0) {
    return "✅ Đã nhận tin nhắn. Không tìm thấy thông tin sản phẩm/hàng hóa.";
  }

  let message = "✅ Đã phân tích và lưu tin nhắn:\n\n";
  
  // List items
  parsedData.items.forEach((item, index) => {
    message += `${index + 1}. ${item.name || "N/A"}`;
    if (item.quantity) {
      message += ` - Số lượng: ${item.quantity}`;
      if (item.unit) {
        message += ` ${item.unit}`;
      }
    }
    if (item.price) {
      message += ` - Giá: ${item.price.toLocaleString("vi-VN")}đ`;
    }
    if (item.total) {
      message += ` - Tổng: ${item.total.toLocaleString("vi-VN")}đ`;
    }
    message += "\n";
  });

  // Add summary
  if (parsedData.summary) {
    message += "\n📊 Tổng kết:\n";
    if (parsedData.summary.total_items) {
      message += `- Tổng số mặt hàng: ${parsedData.summary.total_items}\n`;
    }
    if (parsedData.summary.total_quantity) {
      message += `- Tổng số lượng: ${parsedData.summary.total_quantity}\n`;
    }
    if (parsedData.summary.total_amount) {
      message += `- Tổng tiền: ${parsedData.summary.total_amount.toLocaleString("vi-VN")}đ\n`;
    }
  }

  return message;
}

/**
 * Query and analyze data using Gemini API
 * @param {string} groupId - Group ID
 * @param {string} question - Question to ask
 * @returns {Promise<Object>} Query result with answer
 */
export async function queryAndAnalyzeData(groupId, question) {
  try {
    // Validate API key
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === "your_gemini_api_key" ||
      process.env.GEMINI_API_KEY.trim() === ""
    ) {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env file");
    }

    console.log(`🔍 Querying data for group ${groupId}...`);
    console.log("   API Key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");

    // Get all data from database for this group
    const groupData = getAllGroupData(groupId, 1000);

    if (!groupData || groupData.messages.length === 0) {
      return {
        success: false,
        message: "Không tìm thấy dữ liệu nào trong nhóm này.",
        data: null,
      };
    }

    console.log(
      `📊 Found ${groupData.messages.length} messages and ${groupData.items.length} items`
    );

    // Prepare data summary for AI
    const dataSummary = {
      total_messages: groupData.messages.length,
      total_items: groupData.items.length,
      messages: groupData.messages.map((msg) => ({
        id: msg.id,
        author: msg.author_name,
        date: msg.created_at,
        parsed_data: msg.parsed_data,
      })),
      items: groupData.items.map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        message_id: item.message_id,
      })),
    };

    // Create prompt for Gemini to answer question based on data
    const prompt = `Bạn là một hệ thống phân tích dữ liệu thông minh.
Nhiệm vụ của bạn là phân tích dữ liệu từ database và trả lời câu hỏi của người dùng.

Dữ liệu từ database:
${JSON.stringify(dataSummary, null, 2)}

Câu hỏi của người dùng: ${question}

Yêu cầu:
- Phân tích dữ liệu và trả lời câu hỏi một cách chính xác
- Nếu có số liệu cụ thể, hãy đưa ra số liệu chính xác
- Nếu không tìm thấy thông tin, hãy nói rõ
- Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu
- Có thể đưa ra các thống kê, tổng hợp nếu phù hợp

Hãy trả lời câu hỏi dựa trên dữ liệu trên:`;

    console.log("🤖 Calling Gemini API to analyze query...");

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      generationConfig: {
        temperature: 0.7, // Higher temperature for more natural responses
        maxOutputTokens: 2000,
      },
    });

    console.log("📤 Sending query request to Gemini API...");
    console.log("   Model:", process.env.GEMINI_MODEL || "gemini-flash-latest");
    console.log("   Data summary size:", JSON.stringify(dataSummary).length, "characters");
    console.log("   Question:", question);

    // Generate content with timeout
    const timeoutMs = 30000; // 30 seconds timeout
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Gemini API timeout after 30 seconds")), timeoutMs);
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    console.log("✅ Received response from Gemini API");
    
    const response = await result.response;
    const answer = response.text();
    console.log("📥 Answer length:", answer.length, "characters");

    console.log("📥 Gemini answer:", answer);

    return {
      success: true,
      message: answer,
      data: {
        question: question,
        data_analyzed: {
          messages_count: groupData.messages.length,
          items_count: groupData.items.length,
        },
      },
    };
  } catch (error) {
    console.error("❌ Error querying and analyzing data:");
    console.error("   Error type:", error.constructor.name);
    console.error("   Error message:", error.message);
    console.error("   Error stack:", error.stack);
    
    // Check for specific error types
    if (error.message.includes("timeout")) {
      throw new Error("Gemini API timeout. Vui lòng thử lại sau.");
    }
    
    if (error.message.includes("API_KEY") || error.message.includes("API key")) {
      throw new Error("GEMINI_API_KEY không hợp lệ. Vui lòng kiểm tra lại.");
    }
    
    throw error;
  }
}

