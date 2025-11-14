# Phân tích Key nào BẮT BUỘC và Key nào TÙY CHỌN

## 🔴 BẮT BUỘC (Required)

### 1. **ZALO_REFRESH_TOKEN** ⭐ BẮT BUỘC (Hoặc APP_ID + APP_SECRET)
- **Lý do:** Cần để lấy và refresh Access Token
- **Nếu thiếu:** Không thể gửi tin nhắn về group
- **Khuyến nghị:** Dùng Refresh Token (không cần APP_ID/APP_SECRET)

### 2. **GEMINI_API_KEY** ⭐ BẮT BUỘC
- **Lý do:** Cần để phân tích tin nhắn và query dữ liệu
- **Nếu thiếu:** Không thể parse tin nhắn hoặc trả lời query

### 3. **WEBHOOK_VERIFY_TOKEN** ⭐ BẮT BUỘC
- **Lý do:** Cần để verify webhook URL khi Zalo gọi lần đầu
- **Nếu thiếu:** Zalo không thể verify webhook, không nhận được events

---

## 🟡 TÙY CHỌN nhưng KHUYẾN NGHỊ (Optional but Recommended)

### 4. **ZALO_OA_ID** 🟡 KHUYẾN NGHỊ
- **Lý do:** Dùng để log và tracking, không bắt buộc cho hoạt động cơ bản
- **Nếu thiếu:** Vẫn hoạt động được, nhưng mất thông tin tracking

### 5. **ZALO_APP_ID + ZALO_APP_SECRET** 🟡 TÙY CHỌN (Nếu không có Refresh Token)
- **Lý do:** 
  - Cần để lấy Access Token nếu không có Refresh Token
  - Fallback khi Refresh Token hết hạn
- **⚠️ QUAN TRỌNG:** 
  - **Nếu có ZALO_REFRESH_TOKEN: KHÔNG CẦN APP_ID và APP_SECRET**
  - Chỉ cần nếu không có Refresh Token
- **Khuyến nghị:** 
  - Ưu tiên dùng ZALO_REFRESH_TOKEN (an toàn hơn, không cần lưu APP_SECRET)
  - Hoặc dùng APP_ID + APP_SECRET nếu không có Refresh Token

### 6. **ZALO_ACCESS_TOKEN** 🟡 TÙY CHỌN (Temporary)
- **Lý do:** 
  - Dùng tạm thời nếu không có Refresh Token hoặc APP_ID + APP_SECRET
  - Code sẽ dùng luôn nếu có
- **⚠️ QUAN TRỌNG:** 
  - Access Token có thời hạn (thường 1 giờ)
  - Nếu chỉ có ACCESS_TOKEN: Bot sẽ lỗi sau 1 giờ
  - Không khuyến nghị dùng lâu dài

### 7. **WEBHOOK_SECRET** 🟡 KHUYẾN NGHỊ
- **Lý do:** Dùng để verify signature của webhook requests (bảo mật)
- **Nếu thiếu:** Vẫn hoạt động được (code skip verification trong dev mode)
- **Khuyến nghị:** Nên có cho production để bảo mật

### 8. **SERVER_URL** 🟡 KHUYẾN NGHỊ
- **Lý do:** Chỉ dùng để log, không ảnh hưởng đến hoạt động
- **Nếu thiếu:** Vẫn hoạt động được
- **Lưu ý:** Bạn vẫn cần cấu hình webhook URL trong Zalo Developer Console

---

## 🟢 TÙY CHỌN (Optional - Có giá trị mặc định)

### 9. **PORT** 🟢 TÙY CHỌN
- **Mặc định:** `3000`
- **Nếu thiếu:** Sử dụng port 3000

### 10. **BACKEND_API** 🟢 TÙY CHỌN
- **Mặc định:** `http://localhost:3001/api/analyze`
- **Nếu thiếu:** Sử dụng default URL

### 11. **GEMINI_MODEL** 🟢 TÙY CHỌN
- **Mặc định:** `gemini-1.5-flash`
- **Nếu thiếu:** Sử dụng model mặc định

---

## 📊 Tóm tắt

### ✅ Tối thiểu cần có để bot hoạt động:

**Cách 1: Dùng Refresh Token (KHUYẾN NGHỊ)**
```env
# BẮT BUỘC
ZALO_REFRESH_TOKEN=your_refresh_token
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_VERIFY_TOKEN=your_verify_token

# TÙY CHỌN (có default)
PORT=3000                    # Mặc định: 3000
BACKEND_API=http://localhost:3001/api/analyze  # Mặc định: localhost:3001
GEMINI_MODEL=gemini-1.5-flash  # Mặc định: gemini-1.5-flash
```

**Cách 2: Dùng APP_ID + APP_SECRET**
```env
# BẮT BUỘC
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_VERIFY_TOKEN=your_verify_token

# TÙY CHỌN (có default)
PORT=3000                    # Mặc định: 3000
BACKEND_API=http://localhost:3001/api/analyze  # Mặc định: localhost:3001
GEMINI_MODEL=gemini-1.5-flash  # Mặc định: gemini-1.5-flash
```

### ✅ Khuyến nghị đầy đủ:

```env
# BẮT BUỘC
ZALO_REFRESH_TOKEN=your_refresh_token  # ⭐ KHUYẾN NGHỊ
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_VERIFY_TOKEN=your_verify_token

# KHUYẾN NGHỊ
ZALO_OA_ID=your_oa_id
WEBHOOK_SECRET=your_webhook_secret
SERVER_URL=https://your-domain.com

# TÙY CHỌN (fallback nếu không có Refresh Token)
# ZALO_APP_ID=your_app_id
# ZALO_APP_SECRET=your_app_secret
# ZALO_ACCESS_TOKEN=your_access_token

# TÙY CHỌN
PORT=3000
BACKEND_API=http://localhost:3001/api/analyze
GEMINI_MODEL=gemini-1.5-flash
```

---

## ⚠️ Lưu ý quan trọng

1. **ZALO_REFRESH_TOKEN vs APP_ID + APP_SECRET:**
   - **Refresh Token (KHUYẾN NGHỊ):**
     - Có thời hạn dài hơn Access Token
     - Code tự động refresh Access Token khi cần
     - **KHÔNG CẦN APP_ID và APP_SECRET** nếu có Refresh Token
     - An toàn hơn vì không cần lưu APP_SECRET
   
   - **APP_ID + APP_SECRET (Fallback):**
     - Chỉ cần nếu không có Refresh Token
     - Code sẽ tự động lấy token mới khi cần
     - Cần lưu APP_SECRET (nhạy cảm về bảo mật)
   
   - **ACCESS_TOKEN (Temporary):**
     - Chỉ dùng tạm thời
     - Có thời hạn ngắn (1 giờ)
     - Không khuyến nghị dùng lâu dài
   
   **Khuyến nghị:**
   - ✅ **Tốt nhất:** Chỉ dùng ZALO_REFRESH_TOKEN (không cần APP_ID/APP_SECRET)
   - ✅ **Tốt:** Dùng ZALO_APP_ID + ZALO_APP_SECRET (nếu không có Refresh Token)
   - ❌ **Không nên:** Chỉ dùng ZALO_ACCESS_TOKEN (sẽ lỗi sau 1 giờ)

2. **WEBHOOK_SECRET:**
   - Trong development: Có thể để trống (code skip verification)
   - Trong production: Nên có để bảo mật

3. **SERVER_URL:**
   - Chỉ dùng để log/reference
   - Bạn vẫn cần cấu hình webhook URL trong Zalo Developer Console thủ công

4. **WEBHOOK_VERIFY_TOKEN:**
   - Phải giống với token bạn nhập trong Zalo Developer Console
   - Nếu không giống, Zalo không thể verify webhook

---

## 🧪 Test với tối thiểu

**Cách 1: Dùng Refresh Token (KHUYẾN NGHỊ)**
```env
ZALO_REFRESH_TOKEN=your_refresh_token
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_VERIFY_TOKEN=your_verify_token
```

**Cách 2: Dùng APP_ID + APP_SECRET**
```env
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_VERIFY_TOKEN=your_verify_token
```

Các key khác sẽ dùng giá trị mặc định hoặc code sẽ tự xử lý.

