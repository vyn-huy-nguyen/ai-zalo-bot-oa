import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

/**
 * Test Gemini API Key
 * Usage: node test-gemini.js
 */
async function testGeminiAPI() {
  console.log("🧪 Testing Gemini API Key...\n");

  // Check if API key exists
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.trim() === "") {
    console.error("❌ Error: GEMINI_API_KEY chưa được cấu hình trong .env file");
    console.log("\n📝 Hướng dẫn:");
    console.log("1. Mở file .env");
    console.log("2. Thêm dòng: GEMINI_API_KEY=your_api_key_here");
    console.log("3. Lấy API key tại: https://aistudio.google.com/app/apikey");
    process.exit(1);
  }

  // Validate API key format
  if (!apiKey.startsWith("AIza")) {
    console.warn("⚠️  Warning: API key không đúng định dạng (nên bắt đầu bằng 'AIza')");
  }

  console.log("✅ API Key found:", apiKey.substring(0, 10) + "...");
  console.log("   Full length:", apiKey.length, "characters\n");

  try {
    // Initialize Gemini AI client
    console.log("🔌 Initializing Gemini AI client...");
    const genAI = new GoogleGenerativeAI(apiKey);

    // List available models first
    console.log("📋 Fetching available models...");
    try {
      const models = await genAI.listModels();
      console.log("✅ Available models:");
      models.forEach((m) => {
        console.log(`   - ${m.name}`);
      });
      console.log();
    } catch (listError) {
      console.log("⚠️  Could not list models, will try common model names");
    }

    // Try to get model - try different model names
    const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    console.log("📦 Trying model:", modelName);

    // Common model names to try
    const modelNamesToTry = [
      modelName, // User specified or default
      "gemini-flash-latest",
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "models/gemini-pro",
      "models/gemini-1.5-pro",
      "models/gemini-flash-latest",
    ];

    let model = null;
    let workingModelName = null;

    for (const name of modelNamesToTry) {
      try {
        console.log(`   Trying: ${name}...`);
        model = genAI.getGenerativeModel({
          model: name,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        });
        // Test if model works by making a quick call
        const testResult = await model.generateContent("test");
        await testResult.response;
        workingModelName = name;
        console.log(`   ✅ Model ${name} works!\n`);
        break;
      } catch (err) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          console.log(`   ❌ Model ${name} not found, trying next...`);
          continue;
        } else {
          // Other error, might be API key issue
          throw err;
        }
      }
    }

    if (!model || !workingModelName) {
      throw new Error(
        "Không tìm thấy model nào hoạt động. Vui lòng kiểm tra GEMINI_MODEL trong .env hoặc thử: gemini-pro, gemini-1.5-pro"
      );
    }

    console.log(`✅ Using model: ${workingModelName}\n`);

    // Test prompt
    const testPrompt = "Xin chào! Hãy trả lời ngắn gọn bằng tiếng Việt: Bạn là ai?";
    console.log("\n📤 Sending test request...");
    console.log("   Prompt:", testPrompt);

    // Set timeout
    const timeoutMs = 30000; // 30 seconds
    const generatePromise = model.generateContent(testPrompt);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout after 30 seconds")), timeoutMs);
    });

    const startTime = Date.now();
    const result = await Promise.race([generatePromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    console.log("✅ Received response (took", duration, "ms)\n");

    // Get response
    const response = await result.response;
    const text = response.text();

    // Display results
    console.log("=".repeat(60));
    console.log("📥 RESPONSE FROM GEMINI:");
    console.log("=".repeat(60));
    console.log(text);
    console.log("=".repeat(60));
    console.log("\n✅ SUCCESS! Gemini API Key hoạt động bình thường!");
    console.log("   Response length:", text.length, "characters");
    console.log("   Response time:", duration, "ms");

    // Additional info
    console.log("\n📊 API Info:");
    console.log("   Model:", workingModelName);
    console.log("   API Key:", apiKey.substring(0, 15) + "...");
    console.log("\n💡 Tip: Nếu muốn dùng model này, thêm vào .env:");
    console.log(`   GEMINI_MODEL=${workingModelName}`);
    console.log("\n✨ Bạn có thể sử dụng Gemini API trong ứng dụng!");

  } catch (error) {
    console.error("\n❌ ERROR:");
    console.error("=".repeat(60));
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);

    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }

    // Specific error handling
    if (error.message.includes("403") || error.message.includes("Forbidden")) {
      console.error("\n💡 Possible solutions:");
      console.error("1. Kiểm tra API key có đúng không");
      console.error("2. Đảm bảo API key chưa bị xóa hoặc vô hiệu hóa");
      console.error("3. Tạo API key mới tại: https://aistudio.google.com/app/apikey");
      console.error("4. Kiểm tra không có khoảng trắng thừa trong .env file");
    } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      console.error("\n💡 Possible solutions:");
      console.error("1. API key không hợp lệ");
      console.error("2. Tạo API key mới tại: https://aistudio.google.com/app/apikey");
    } else if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      console.error("\n💡 Possible solutions:");
      console.error("1. Kiểm tra kết nối internet");
      console.error("2. Thử lại sau vài giây");
    } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
      console.error("\n💡 Possible solutions:");
      console.error("1. Đã vượt quá giới hạn free tier");
      console.error("2. Đợi một chút rồi thử lại");
      console.error("3. Kiểm tra quota tại: https://aistudio.google.com/app/apikey");
    } else if (error.message.includes("404") || error.message.includes("not found")) {
      console.error("\n💡 Possible solutions:");
      console.error("1. Model name không đúng");
      console.error("2. Thử các model names sau trong .env:");
      console.error("   GEMINI_MODEL=gemini-pro");
      console.error("   GEMINI_MODEL=gemini-1.5-pro");
      console.error("3. Hoặc để trống để script tự động tìm model phù hợp");
    }

    console.error("=".repeat(60));
    process.exit(1);
  }
}

// Run test
testGeminiAPI().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

