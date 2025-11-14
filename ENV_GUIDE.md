# Hướng dẫn lấy các Key trong file .env

## 📋 Danh sách các Key cần cấu hình

```env
# Zalo OA Configuration
ZALO_OA_ID=your_oa_id
ZALO_REFRESH_TOKEN=your_refresh_token  # ⭐ KHUYẾN NGHỊ - Nếu có thì không cần APP_ID/APP_SECRET
# Hoặc (nếu không có Refresh Token):
# ZALO_APP_ID=your_app_id
# ZALO_APP_SECRET=your_app_secret
# ZALO_ACCESS_TOKEN=your_access_token  # Tùy chọn

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_VERIFY_TOKEN=your_verify_token
PORT=3000

# Backend API for message analysis
BACKEND_API=http://localhost:3001/api/analyze

# Server URL (for webhook callback)
SERVER_URL=https://your-domain.com

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

---

## 🔑 Cách lấy từng Key

### 1. **ZALO_OA_ID** (Official Account ID)

**Cách lấy:**
1. Truy cập [Zalo Official Account](https://oa.zalo.me/)
2. Đăng nhập bằng tài khoản Zalo
3. Vào trang quản lý OA của bạn
4. **OA ID** sẽ hiển thị ở:
   - URL: `https://oa.zalo.me/home/oa/XXXXX` → `XXXXX` là OA ID
   - Hoặc trong phần "Thông tin tài khoản"
   - Hoặc trong phần "Cài đặt" → "Thông tin OA"

**Ví dụ:** `607812198688816074`

---

### 2. **ZALO_APP_ID** (Application ID) - TÙY CHỌN (Nếu không có Refresh Token)

**Cách lấy:**
1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Đăng nhập bằng tài khoản Zalo
3. Vào "Ứng dụng" → Chọn ứng dụng của bạn (hoặc tạo mới)
4. **App ID** hiển thị ở:
   - Trang chủ của ứng dụng
   - Phần "Thông tin ứng dụng"
   - URL: `https://developers.zalo.me/app/XXXXX` → `XXXXX` là App ID

**Ví dụ:** `4591324301967398637`

---

### 3. **ZALO_APP_SECRET** (Application Secret) - TÙY CHỌN (Nếu không có Refresh Token)

**Cách lấy:**
1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Vào ứng dụng của bạn
3. Vào phần "Cài đặt" hoặc "Thông tin ứng dụng"
4. Tìm "App Secret" hoặc "Secret Key"
5. Click "Hiển thị" để xem secret (có thể cần xác thực)

**⚠️ Lưu ý:** 
- App Secret chỉ hiển thị 1 lần khi tạo ứng dụng
- Nếu quên, có thể reset secret (nhưng secret cũ sẽ không dùng được nữa)

**Ví dụ:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### 4. **ZALO_REFRESH_TOKEN** (Refresh Token) ⭐ KHUYẾN NGHỊ

**Cách lấy:**
1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Vào ứng dụng của bạn
3. Vào phần "Access Token" hoặc "Công cụ" → "Lấy Access Token"
4. Copy **Refresh Token** (không phải Access Token)

**⚠️ Lưu ý:**
- Refresh Token có thời hạn dài hơn Access Token
- Code sẽ tự động refresh Access Token khi cần
- **Nếu có Refresh Token, KHÔNG CẦN APP_ID và APP_SECRET**
- Refresh Token an toàn hơn vì không cần lưu APP_SECRET

**Ví dụ:** `your_refresh_token_string_here`

---

### 5. **ZALO_ACCESS_TOKEN** (Access Token) - TÙY CHỌN

**Cách 1: Lấy từ API (Nếu không có Refresh Token)**

```bash
curl "https://oauth.zalo.me/v4/oa/access_token?app_id=YOUR_APP_ID&app_secret=YOUR_APP_SECRET&grant_type=client_credentials"
```

**Response:**
```json
{
  "access_token": "your_access_token_here",
  "refresh_token": "your_refresh_token_here",
  "expires_in": 3600
}
```

**Cách 2: Lấy từ Zalo Developer Console**
1. Vào ứng dụng trên Zalo Developer
2. Vào phần "Access Token" hoặc "Token"
3. Copy token (nếu có sẵn)

**⚠️ Lưu ý:**
- Access Token có thời hạn (thường 3600 giây = 1 giờ)
- **Khuyến nghị:** Dùng ZALO_REFRESH_TOKEN thay vì ACCESS_TOKEN
- Có thể để trống nếu đã có REFRESH_TOKEN hoặc APP_ID + APP_SECRET

**Ví dụ:** `your_access_token_string_here`

---

### 6. **ZALO_APP_ID** (Application ID) - TÙY CHỌN (Nếu không có Refresh Token)

**Cách lấy:**
1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Đăng nhập bằng tài khoản Zalo
3. Vào "Ứng dụng" → Chọn ứng dụng của bạn (hoặc tạo mới)
4. **App ID** hiển thị ở:
   - Trang chủ của ứng dụng
   - Phần "Thông tin ứng dụng"
   - URL: `https://developers.zalo.me/app/XXXXX` → `XXXXX` là App ID

**⚠️ Lưu ý:**
- Chỉ cần nếu không có ZALO_REFRESH_TOKEN
- Nếu có Refresh Token, không cần APP_ID và APP_SECRET

**Ví dụ:** `4591324301967398637`

---

### 7. **WEBHOOK_SECRET** (Webhook Secret)

**Cách lấy:**
1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Vào ứng dụng của bạn
3. Vào phần "Webhook"
4. Tìm "Webhook Secret" hoặc "Secret Key"
5. Copy secret (nếu chưa có, tạo mới)

**⚠️ Lưu ý:**
- Secret này dùng để verify signature của webhook requests
- Giữ bí mật, không chia sẻ

**Ví dụ:** `webhook_secret_abc123xyz`

---

### 6. **WEBHOOK_VERIFY_TOKEN** (Verify Token)

**Cách tạo:**
- Đây là token bạn tự tạo, không phải lấy từ Zalo
- Tạo một chuỗi ngẫu nhiên, an toàn
- Token này dùng để verify webhook URL khi Zalo gọi lần đầu

**Cách tạo token:**
```bash
# Sử dụng openssl
openssl rand -hex 32

# Hoặc sử dụng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Hoặc tự tạo một chuỗi ngẫu nhiên
# Ví dụ: my_verify_token_2024_abc123xyz
```

**⚠️ Lưu ý:**
- Token này phải giống với token bạn nhập trong Zalo Developer Console
- Giữ bí mật

**Ví dụ:** `my_verify_token_123456789`

---

### 7. **PORT** (Server Port)

**Giá trị:**
- Port cho webhook server (mặc định: `3000`)
- Có thể thay đổi nếu port 3000 đã được sử dụng

**Ví dụ:** `3000` hoặc `8080`

---

### 8. **BACKEND_API** (Backend API URL)

**Mục đích:**
- URL của backend API server (chạy trên port 3001)
- Webhook server (port 3000) sẽ gửi request đến đây khi có tin nhắn `/p` hoặc `/t`
- Backend này xử lý phân tích AI và lưu database

**Luồng hoạt động:**
```
Zalo Webhook → index.js (port 3000) → BACKEND_API (port 3001) → Gemini AI → Database
```

**Giá trị:**
- Nếu chạy local: `http://localhost:3001/api/analyze`
- Nếu deploy: `https://your-backend-domain.com/api/analyze`
- **Lưu ý:** Đây là URL nội bộ giữa 2 server, không cần public

**Ví dụ:** `http://localhost:3001/api/analyze`

---

### 9. **SERVER_URL** (Server URL for Webhook)

**Mục đích:**
- ✅ **ĐÚNG** - Đây là URL bạn cần đưa vào cấu hình Webhook trong Zalo Developer Console
- URL công khai của webhook server (phải accessible từ internet)
- Zalo sẽ gửi webhook events đến URL này

**Cách sử dụng:**
1. Lấy URL (xem bên dưới)
2. Vào [Zalo Developer](https://developers.zalo.me/) → Ứng dụng của bạn
3. Vào phần "Webhook"
4. Nhập Webhook URL: `{SERVER_URL}/webhook`
   - Ví dụ: `https://abc123.ngrok.io/webhook`
   - Hoặc: `https://api.yourdomain.com/webhook`

**Cách lấy URL (Development với ngrok):**
```bash
# Cài ngrok
npm install -g ngrok
# hoặc
brew install ngrok

# Chạy ngrok (trỏ đến port 3000 - webhook server)
ngrok http 3000

# Copy URL từ ngrok (ví dụ: https://abc123.ngrok.io)
# → Đây chính là SERVER_URL
```

**Cho Production:**
- Sử dụng domain thật của bạn
- Ví dụ: `https://api.yourdomain.com`
- Đảm bảo có SSL certificate (HTTPS)

**⚠️ Lưu ý:**
- URL này phải accessible từ internet (Zalo cần gọi được)
- Phải là HTTPS (trừ localhost)
- URL đầy đủ sẽ là: `{SERVER_URL}/webhook`

**Ví dụ:** 
- Development: `https://abc123.ngrok.io`
- Production: `https://api.yourdomain.com`

---

### 10. **GEMINI_API_KEY** (Gemini API Key)

**Cách lấy:**
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Đăng nhập bằng Google account
3. Click "Get API key" hoặc "Create API key"
4. Chọn "Create API key in new project" hoặc chọn project có sẵn
5. Copy API key được tạo

**⚠️ Lưu ý:**
- API key có dạng: `AIza...` (bắt đầu bằng AIza)
- Giữ bí mật, không chia sẻ
- Có free tier với giới hạn requests

**Ví dụ:** `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`

---

### 11. **GEMINI_MODEL** (Gemini Model Name)

**Giá trị:**
- Model Gemini bạn muốn sử dụng
- Mặc định: `gemini-1.5-flash` (nhanh, rẻ)
- Các model khác:
  - `gemini-1.5-flash` - Nhanh, rẻ (khuyến nghị)
  - `gemini-1.5-pro` - Chính xác hơn, đắt hơn
  - `gemini-pro` - Phiên bản cũ
  - `gemini-1.5-flash-latest` - Phiên bản mới nhất

**Ví dụ:** `gemini-1.5-flash`

---

## 📝 File .env mẫu hoàn chỉnh

```env
# Zalo OA Configuration
ZALO_OA_ID=607812198688816074
ZALO_APP_ID=4591324301967398637
ZALO_APP_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
ZALO_ACCESS_TOKEN=your_access_token_here

# Webhook Configuration
WEBHOOK_SECRET=webhook_secret_abc123xyz
WEBHOOK_VERIFY_TOKEN=my_verify_token_123456789
PORT=3000

# Backend API for message analysis
BACKEND_API=http://localhost:3001/api/analyze

# Server URL (for webhook callback)
SERVER_URL=https://abc123.ngrok.io

# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
GEMINI_MODEL=gemini-1.5-flash
```

---

## 🔒 Bảo mật

1. **KHÔNG commit file `.env` lên Git**
   - File `.env` đã được thêm vào `.gitignore`
   - Chỉ commit `.env.example`

2. **Không chia sẻ các key:**
   - APP_SECRET
   - ACCESS_TOKEN
   - WEBHOOK_SECRET
   - GEMINI_API_KEY

3. **Rotate keys định kỳ:**
   - Đổi APP_SECRET nếu bị lộ
   - Đổi WEBHOOK_SECRET nếu nghi ngờ bị lộ
   - Đổi GEMINI_API_KEY nếu bị lộ

---

## ✅ Checklist

- [ ] Đã tạo Zalo Official Account và lấy OA_ID
- [ ] Đã tạo ứng dụng trên Zalo Developer và lấy APP_ID, APP_SECRET
- [ ] Đã lấy/cấu hình ACCESS_TOKEN
- [ ] Đã cấu hình Webhook và lấy WEBHOOK_SECRET
- [ ] Đã tạo WEBHOOK_VERIFY_TOKEN
- [ ] Đã lấy GEMINI_API_KEY từ Google AI Studio
- [ ] Đã cấu hình SERVER_URL (ngrok cho dev hoặc domain cho production)
- [ ] Đã điền tất cả các key vào file `.env`
- [ ] Đã test kết nối

---

## 🆘 Troubleshooting

### Không tìm thấy OA_ID
- Kiểm tra bạn đã đăng ký OA chưa
- Kiểm tra bạn đang đăng nhập đúng tài khoản

### Không tìm thấy APP_SECRET
- App Secret chỉ hiển thị 1 lần khi tạo ứng dụng
- Nếu quên, reset secret trong Zalo Developer Console

### Access Token hết hạn
- Token có thời hạn, code sẽ tự động refresh nếu có APP_ID và APP_SECRET
- Hoặc lấy token mới từ API

### Webhook không nhận được sự kiện
- Kiểm tra WEBHOOK_VERIFY_TOKEN đúng chưa
- Kiểm tra SERVER_URL có accessible từ internet không
- Kiểm tra webhook URL trong Zalo Developer Console

### Gemini API lỗi
- Kiểm tra GEMINI_API_KEY đúng chưa
- Kiểm tra có đủ quota không
- Kiểm tra model name đúng chưa

