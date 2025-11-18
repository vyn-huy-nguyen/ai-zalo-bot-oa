import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAllGroupData } from "../database.js";

// Don't initialize genAI at top level - initialize it inside functions after validating API key

/**
 * Analyze message using Gemini AI and convert to structured data
 * @param {string} message - Message content to analyze
 * @returns {Promise<Object>} Analysis result with structured data
 */
export async function analyzeMessage(message) {
  try {
    // Validate API key first
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env file");
    }

    // Validate API key format
    if (!apiKey.startsWith("AIza")) {
      console.warn(
        "⚠️  Warning: API key không đúng định dạng (nên bắt đầu bằng 'AIza')"
      );
    }

    // Initialize Gemini AI client with validated API key
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("🤖 Analyzing message with Gemini AI...");
    console.log("   API Key:", apiKey.substring(0, 10) + "...");
    console.log("   Message length:", message.length, "characters");
    console.log("   Full message:", message);
    console.log(
      "   Message preview:",
      message.substring(0, 200) + (message.length > 200 ? "..." : "")
    );

    // Create prompt for Gemini to parse message into structured data
    const prompt = `Bạn là một hệ thống phân tích tin nhắn thông minh.
      Nhiệm vụ của bạn là phân tích tin nhắn của người dùng và chuyển đổi thành dữ liệu có cấu trúc (JSON).

      Tin nhắn của người dùng: ${message}

      Yêu cầu:
      - Phân tích TẤT CẢ các dòng trong tin nhắn và trích xuất thông tin về các sản phẩm, hàng hóa, số lượng, đơn vị
      - Mỗi dòng có thể chứa thông tin về một sản phẩm với các format phổ biến:
        * "Tên sản phẩm: số lượng đơn vị" (ví dụ: "Chân hp/1000:60 cái")
        * "Tên sản phẩm số lượng đơn vị" (ví dụ: "Vít nở 6:1200cái")
        * "Tên sản phẩm - số lượng đơn vị"
        * Hoặc các format khác tương tự
      - Trả về kết quả dưới dạng JSON với cấu trúc:
        {
          "items": [
            {
              "Tên hàng hóa": "Tên sản phẩm/hàng hóa (giữ nguyên tên gốc)",
              "Số lượng": Số lượng (number),
              "Đơn vị": "Đơn vị (ví dụ: cái, kg, thùng, thanh, tuýp, ...)",
              "Đơn giá": Giá (number, optional - chỉ thêm nếu có trong tin nhắn),
              "Thành tiền": Tổng tiền (number, optional - chỉ thêm nếu có trong tin nhắn)
            }
          ],
          "summary": {
            "Tổng số mặt hàng": Tổng số mặt hàng (số lượng items),
            "Tổng số lượng": Tổng số lượng (tổng quantity của tất cả items),
            "Tổng tiền": Tổng tiền (nếu có)
          },
          "metadata": {
            "Ngày": "Ngày tháng (nếu có trong tin nhắn, ví dụ: 4/10)",
            "Loại": "Loại giao dịch (nhập/xuất/bán/mua, ... - nếu có trong tin nhắn)",
            "Ghi chú": "Ghi chú thêm (nếu có, ví dụ: tên công ty, địa điểm)"
          }
        }

      - QUAN TRỌNG: 
        * TẤT CẢ các key trong JSON phải là tiếng Việt (không dùng tiếng Anh như "name", "quantity", "unit")
        * Phân tích TẤT CẢ các dòng có chứa thông tin sản phẩm, không bỏ sót
        * Nếu một dòng không rõ ràng, hãy cố gắng suy luận từ ngữ cảnh
        * Giữ nguyên tên sản phẩm như trong tin nhắn (không thay đổi, không thêm bớt)
        * Nếu có thông tin khác trong tin nhắn (ví dụ: địa điểm, công ty, người gửi), hãy thêm vào items với key tiếng Việt phù hợp
      - Nếu tin nhắn không chứa thông tin về sản phẩm/hàng hóa, trả về items là mảng rỗng []
      - Chỉ trả về JSON, không thêm text giải thích, không thêm markdown code blocks
      - Đảm bảo JSON hợp lệ, có thể parse được

      Ví dụ:
      Input: "Chân hp/1000:60 cái\nThanh nẹp v5:4 thanh\nVít nở 6:1200cái"
      Output: {
        "items": [
          {"Tên hàng hóa": "Chân hp/1000", "Số lượng": 60, "Đơn vị": "cái"},
          {"Tên hàng hóa": "Thanh nẹp v5", "Số lượng": 4, "Đơn vị": "thanh"},
          {"Tên hàng hóa": "Vít nở 6", "Số lượng": 1200, "Đơn vị": "cái"}
        ],
        "summary": {"Tổng số mặt hàng": 3, "Tổng số lượng": 1264},
        "metadata": {}
      }

      Hãy phân tích và trả về JSON với TẤT CẢ key bằng tiếng Việt:`;

    // Get model name (try different names if needed, similar to test script)
    const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    console.log("📤 Sending request to Gemini API...");
    console.log("   Model:", modelName);
    console.log("   Prompt length:", prompt.length, "characters");

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.3, // Lower temperature for more structured output
        maxOutputTokens: 2000,
      },
    });

    // Generate content with timeout
    const timeoutMs = 30000; // 30 seconds timeout
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Gemini API timeout after 30 seconds")),
        timeoutMs
      );
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
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/i, "")
        .replace(/\n?```$/i, "");
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

    if (
      error.message.includes("API_KEY") ||
      error.message.includes("API key")
    ) {
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

  // List items dynamically - display all fields from each item
  parsedData.items.forEach((item, index) => {
    message += `${index + 1}. `;

    // Display all fields from item object dynamically
    const fields = [];
    Object.entries(item).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        // Format value based on type
        let displayValue = value;
        if (typeof value === "number") {
          // If it looks like a price/amount, format with currency
          if (
            key.toLowerCase().includes("giá") ||
            key.toLowerCase().includes("tiền") ||
            key.toLowerCase().includes("price") ||
            key.toLowerCase().includes("total") ||
            key.toLowerCase().includes("amount")
          ) {
            displayValue = value.toLocaleString("vi-VN") + "đ";
          } else {
            displayValue = value.toLocaleString("vi-VN");
          }
        }
        fields.push(`${key}: ${displayValue}`);
      }
    });

    message += fields.join(" | ") + "\n";
  });

  // Add summary dynamically - display all fields from summary object
  if (parsedData.summary && typeof parsedData.summary === "object") {
    message += "\n📊 Tổng kết:\n";
    Object.entries(parsedData.summary).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        let displayValue = value;
        if (typeof value === "number") {
          // Format numbers appropriately
          if (
            key.toLowerCase().includes("tiền") ||
            key.toLowerCase().includes("amount") ||
            key.toLowerCase().includes("total")
          ) {
            displayValue = value.toLocaleString("vi-VN") + "đ";
          } else {
            displayValue = value.toLocaleString("vi-VN");
          }
        }
        message += `- ${key}: ${displayValue}\n`;
      }
    });
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
    // Validate API key first
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong .env file");
    }

    // Validate API key format
    if (!apiKey.startsWith("AIza")) {
      console.warn(
        "⚠️  Warning: API key không đúng định dạng (nên bắt đầu bằng 'AIza')"
      );
    }

    // Initialize Gemini AI client with validated API key
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log(`🔍 Querying data for group ${groupId}...`);
    console.log("   API Key:", apiKey.substring(0, 10) + "...");

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
    // Note: items now have item_data as JSON object (flexible schema)
    const dataSummary = {
      total_messages: groupData.messages.length,
      total_items: groupData.items.length,
      messages: groupData.messages.map((msg) => ({
        id: msg.id,
        author: msg.author_name,
        date: msg.created_at,
        parsed_data: msg.parsed_data,
      })),
      items: groupData.items.map((item) => {
        // item.item_data contains the full item object (already parsed JSON)
        // Include both item_data and metadata (message_id, created_at, etc.)
        return {
          ...item.item_data, // Spread all fields from item_data (supports dynamic schema)
          message_id: item.message_id,
          created_at: item.created_at,
        };
      }),
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
      - Trả lời bằng tiếng Việt, ngắn gọn tối đa 2 câu, đi thẳng vào trọng tâm câu hỏi
      - Không chào hỏi, không giải thích dài dòng, không thêm thông tin ngoài câu hỏi
      - Có thể đưa ra các thống kê, tổng hợp nếu phù hợp

      Hãy trả lời câu hỏi dựa trên dữ liệu trên:`;

    console.log("🤖 Calling Gemini API to analyze query...");

    // Get model name
    const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";

    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7, // Higher temperature for more natural responses
        maxOutputTokens: 2000,
      },
    });

    console.log("📤 Sending query request to Gemini API...");
    console.log("   Model:", modelName);
    console.log(
      "   Data summary size:",
      JSON.stringify(dataSummary).length,
      "characters"
    );
    console.log("   Question:", question);

    // Generate content with timeout
    const timeoutMs = 30000; // 30 seconds timeout
    const generatePromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Gemini API timeout after 30 seconds")),
        timeoutMs
      );
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

    if (
      error.message.includes("API_KEY") ||
      error.message.includes("API key")
    ) {
      throw new Error("GEMINI_API_KEY không hợp lệ. Vui lòng kiểm tra lại.");
    }

    throw error;
  }
}
