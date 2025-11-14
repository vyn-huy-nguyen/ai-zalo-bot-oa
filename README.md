# AI Zalo Bot - Official Account (OA) Version

Bot Zalo sử dụng Official Account (OA) và OpenAPI chính thức để xử lý tin nhắn nhóm GMF với lệnh `/p`. Bot sẽ nhận sự kiện từ Zalo qua webhook, gửi về backend API để phân tích, và trả kết quả lại group.

## 🎯 Tính năng

- ✅ Sử dụng Zalo Official Account (OA) và OpenAPI chính thức
- ✅ Webhook để nhận sự kiện từ nhóm GMF
- ✅ Xử lý lệnh `/p` để trigger bot
- ✅ Gửi tin nhắn về backend API để phân tích
- ✅ Tự động trả lời kết quả về group qua OpenAPI
- ✅ Xác thực webhook signature để bảo mật
- ✅ Hỗ trợ nhiều loại sự kiện (tin nhắn, tạo nhóm, thêm/xóa thành viên)

## 📋 Yêu cầu

- Node.js >= 18
- NPM hoặc Yarn
- **Zalo Official Account (OA) đã được xác thực** (có dấu tích vàng) ⚠️
  - Gói "Dùng thử" (chưa xác thực): **KHÔNG DÙNG ĐƯỢC** - không thể lấy Refresh Token
  - Gói Nâng cao hoặc Premium: ✅ Hỗ trợ đầy đủ GMF
  - **Quan trọng:** OA phải được xác thực để lấy được Refresh Token
- Ứng dụng Zalo Developer đã được tạo và liên kết với OA
- Server có thể nhận webhook từ Zalo (có thể dùng ngrok cho development)

## 🚀 Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd ai-zalo-bot-oa
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

**📖 Xem hướng dẫn chi tiết cách lấy các key:** [ENV_GUIDE.md](./ENV_GUIDE.md)

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Zalo OA Configuration
ZALO_OA_ID=your_oa_id
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
ZALO_ACCESS_TOKEN=your_access_token

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_VERIFY_TOKEN=your_verify_token
PORT=3000

# Backend API for message analysis
BACKEND_API=http://localhost:3001/api/analyze

# Server URL (for webhook callback)
SERVER_URL=https://your-domain.com
```

### 3. Tạo Zalo Official Account và Ứng dụng

1. **Tạo OA và Xác thực:**
   - Truy cập [Zalo Official Account](https://oa.zalo.me/) và đăng ký OA
   - ⚠️ **QUAN TRỌNG:** OA phải được xác thực (có dấu tích vàng) để lấy được Refresh Token
   - Gói "Dùng thử" (chưa xác thực): **KHÔNG DÙNG ĐƯỢC** - không thể lấy Refresh Token
   - Chọn gói Nâng cao hoặc Premium (cần để sử dụng GMF đầy đủ)
   - Hoàn tất quá trình xác thực OA theo hướng dẫn của Zalo
   - **Xem chi tiết:** [OA_REQUIREMENTS.md](./OA_REQUIREMENTS.md)

2. **Tạo ứng dụng trên Zalo Developer:**
   - Truy cập [Zalo Developer](https://developers.zalo.me/)
   - Tạo ứng dụng mới
   - Liên kết ứng dụng với OA của bạn

3. **Cấp quyền cho ứng dụng:**
   - Cấp quyền quản lý nhóm (GMF)
   - Cấp quyền gửi tin nhắn
   - Lấy `APP_ID`, `APP_SECRET`, `OA_ID`

4. **Lấy Access Token:**
   - Sử dụng API để lấy access token: `https://oauth.zalo.me/v4/oa/access_token`
   - Hoặc sử dụng token từ Zalo Developer Console

### 4. Cấu hình Webhook

1. **Cấu hình webhook trong Zalo Developer Console:**
   - Vào phần Webhook của ứng dụng
   - Nhập URL webhook: `https://your-domain.com/webhook`
   - Nhập Verify Token (giống với `WEBHOOK_VERIFY_TOKEN` trong `.env`)
   - Lưu Webhook Secret (đặt vào `WEBHOOK_SECRET` trong `.env`)

2. **Cho development (dùng ngrok):**
   ```bash
   ngrok http 3000
   ```
   - Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)
   - Cấu hình webhook URL: `https://abc123.ngrok.io/webhook`

### 5. Tạo nhóm GMF

Sử dụng OA Manager hoặc OpenAPI để tạo nhóm GMF:
- GMF-10: Tối đa 10 thành viên
- GMF-50: Tối đa 50 thành viên
- GMF-100: Tối đa 100 thành viên
- GMF-1000: Tối đa 1000 thành viên

Tham khảo: [Quản lý nhóm GMF](https://oa.zalo.me/home/documents/vie/guides/quan-ly-nhom-gmf_1954166378348758227)

## 💻 Sử dụng

### Chạy Server

```bash
npm start
# hoặc
npm run dev
```

Server sẽ chạy tại `http://localhost:3000` và bao gồm:
- Webhook endpoints
- Backend API endpoints (phân tích AI, query, database)
- Swagger documentation tại `http://localhost:3000/api-docs`

### Sử dụng Bot trong Group

Trong nhóm GMF:

1. Gửi tin nhắn bắt đầu bằng `/p`:
   ```
   /p Xin chào mọi người!
   ```

2. Bot sẽ:
   - Nhận sự kiện qua webhook
   - Gửi về backend API để phân tích
   - Trả kết quả về group qua OpenAPI

## 🔧 Cấu trúc Project

```
ai-zalo-bot-oa/
├── src/
│   ├── index.js      # Webhook server (nhận sự kiện từ Zalo)
│   └── backend.js    # Backend API (phân tích tin nhắn)
├── .env              # Cấu hình (không commit)
├── .env.example      # Mẫu cấu hình
├── package.json
└── README.md
```

## 🛠️ Tùy chỉnh Backend

File `src/index.js` chứa hàm `analyzeMessage()` và `analyzeMessageWithAI()` - đây là nơi bạn thêm logic phân tích AI:

```javascript
async function analyzeMessage(message) {
  // TODO: Thêm logic AI của bạn ở đây
  // Ví dụ: gọi OpenAI API, GPT, hoặc service khác
  
  // const aiResponse = await callAIService(message);
  // return aiResponse;
  
  return "Kết quả phân tích...";
}
```

## 📚 API Endpoints

### Webhook Server (index.js)

#### GET /webhook
Xác thực webhook URL với Zalo

#### POST /webhook
Nhận sự kiện từ Zalo OA

**Request từ Zalo:**
```json
{
  "event": "user_send_text",
  "sender": {
    "id": "user_id",
    "name": "Tên người dùng"
  },
  "message": {
    "text": "/p Nội dung tin nhắn"
  },
  "group_id": "group_123",
  "timestamp": 1234567890
}
```

### Backend API (integrated in index.js)

#### POST /api/analyze
Nhận tin nhắn từ webhook server để phân tích

**Request:**
```json
{
  "author_id": "user_id",
  "author_name": "Tên người dùng",
  "message": "Nội dung tin nhắn",
  "group_id": "group_123",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "result": "Kết quả phân tích...",
  "reply": "Kết quả phân tích...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /health
Health check endpoint

## ⚠️ Lưu ý quan trọng

1. **OA và GMF:**
   - ⚠️ **OA phải được xác thực** (có dấu tích vàng) để lấy được Refresh Token
   - Gói "Dùng thử" (chưa xác thực): **KHÔNG DÙNG ĐƯỢC** - không thể lấy Refresh Token
   - Chỉ hoạt động với nhóm GMF do OA tạo/quản lý
   - Không thể dùng với nhóm chat cá nhân thông thường
   - Gói Nâng cao hoặc Premium: ✅ Hỗ trợ đầy đủ GMF

2. **Bảo mật:**
   - Không commit file `.env` lên git
   - Luôn verify webhook signature
   - Bảo vệ `APP_SECRET` và `WEBHOOK_SECRET`

3. **Rate Limiting:**
   - Zalo có giới hạn số lượng request
   - Backend nên xử lý async để tránh block

4. **Webhook URL:**
   - Phải là HTTPS (trừ localhost)
   - Phải accessible từ internet
   - Dùng ngrok cho development

## 🔄 So sánh với Unofficial API

| Tính năng | OA/OpenAPI | Unofficial API |
|-----------|------------|----------------|
| Tính hợp pháp | ✅ Chính thức | ⚠️ Không chính thức |
| Rủi ro tài khoản | ✅ An toàn | ❌ Có thể bị khóa |
| Phạm vi nhóm | ⚠️ Chỉ GMF | ✅ Tất cả nhóm |
| Chi phí | ⚠️ Cần gói trả phí | ✅ Miễn phí |
| Độ ổn định | ✅ Ổn định | ⚠️ Có thể thay đổi |

## 🐛 Xử lý lỗi

### Webhook không nhận được sự kiện
- Kiểm tra webhook URL đã cấu hình đúng chưa
- Kiểm tra Verify Token
- Kiểm tra server có accessible từ internet không
- Xem logs trong Zalo Developer Console

### Không gửi được tin nhắn về group
- Kiểm tra Access Token còn hợp lệ không
- Kiểm tra OA có quyền gửi tin trong nhóm GMF không
- Kiểm tra group_id đúng chưa

### Backend không nhận request
- Kiểm tra `BACKEND_API` trong `.env` đúng chưa
- Đảm bảo backend server đang chạy
- Kiểm tra firewall/port

## 📖 Tài liệu tham khảo

- [Zalo For Developers](https://developers.zalo.me/)
- [OA Group Messaging Feature (GMF)](https://developers.zalo.me/docs/official-account/nhom-chat-gmf/general)
- [Webhook GMF](https://developers.zalo.me/docs/official-account/webhook/nhom-chat-gmf/create_group)
- [Quản lý nhóm GMF](https://oa.zalo.me/home/documents/vie/guides/quan-ly-nhom-gmf_1954166378348758227)

## 📄 License

MIT

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

