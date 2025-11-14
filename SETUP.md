# Hướng dẫn Setup Zalo OA Bot

## Bước 1: Tạo Zalo Official Account (OA)

1. Truy cập [Zalo Official Account](https://oa.zalo.me/)
2. Đăng ký OA cho doanh nghiệp của bạn
3. Chọn gói **Nâng cao** hoặc **Premium** (cần để sử dụng GMF)
4. Lưu lại **OA ID**

## Bước 2: Tạo Ứng dụng trên Zalo Developer

1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Đăng nhập bằng tài khoản Zalo
3. Tạo ứng dụng mới:
   - Vào "Ứng dụng" → "Tạo ứng dụng mới"
   - Điền thông tin ứng dụng
   - Lưu lại **App ID** và **App Secret**

4. Liên kết ứng dụng với OA:
   - Vào ứng dụng vừa tạo
   - Chọn "Official Account" → "Liên kết OA"
   - Chọn OA của bạn

5. Cấp quyền cho ứng dụng:
   - Vào "Quyền truy cập"
   - Bật quyền: **Quản lý nhóm chat (GMF)**
   - Bật quyền: **Gửi tin nhắn**

## Bước 3: Lấy Access Token

Có 2 cách:

### Cách 1: Lấy từ API (Khuyến nghị)

```bash
curl "https://oauth.zalo.me/v4/oa/access_token?app_id=YOUR_APP_ID&app_secret=YOUR_APP_SECRET&grant_type=client_credentials"
```

Response:
```json
{
  "access_token": "your_access_token_here",
  "expires_in": 3600
}
```

### Cách 2: Lấy từ Zalo Developer Console

- Vào ứng dụng → "Access Token"
- Copy token (nếu có)

## Bước 4: Cấu hình Webhook

### 4.1. Tạo Webhook Secret

1. Vào ứng dụng trên Zalo Developer
2. Vào "Webhook"
3. Tạo Webhook Secret mới
4. Lưu lại secret này

### 4.2. Cấu hình Webhook URL

**Cho Production:**
- URL: `https://your-domain.com/webhook`
- Verify Token: Tạo một token ngẫu nhiên (ví dụ: `my_verify_token_123`)
- Lưu Verify Token này

**Cho Development (dùng ngrok):**

1. Cài đặt ngrok:
   ```bash
   npm install -g ngrok
   # hoặc
   brew install ngrok
   ```

2. Chạy ngrok:
   ```bash
   ngrok http 3000
   ```

3. Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)
4. Cấu hình webhook URL: `https://abc123.ngrok.io/webhook`
5. Verify Token: Tạo token ngẫu nhiên

## Bước 5: Tạo nhóm GMF

### Cách 1: Dùng OA Manager

1. Vào [OA Manager](https://oa.zalo.me/)
2. Chọn OA của bạn
3. Vào "Nhóm chat" → "Tạo nhóm mới"
4. Chọn loại nhóm:
   - GMF-10: Tối đa 10 thành viên
   - GMF-50: Tối đa 50 thành viên
   - GMF-100: Tối đa 100 thành viên
   - GMF-1000: Tối đa 1000 thành viên
5. Thêm thành viên vào nhóm

### Cách 2: Dùng OpenAPI

Sử dụng API để tạo nhóm (xem tài liệu Zalo Developer)

## Bước 6: Cấu hình .env

1. Copy `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```

2. Điền thông tin vào `.env`:
   ```env
   # Zalo OA Configuration
   ZALO_OA_ID=your_oa_id_here
   ZALO_APP_ID=your_app_id_here
   ZALO_APP_SECRET=your_app_secret_here
   ZALO_ACCESS_TOKEN=your_access_token_here

   # Webhook Configuration
   WEBHOOK_SECRET=your_webhook_secret_here
   WEBHOOK_VERIFY_TOKEN=your_verify_token_here
   PORT=3000

   # Backend API for message analysis
   BACKEND_API=http://localhost:3001/api/analyze

   # Server URL (for webhook callback)
   SERVER_URL=https://your-domain.com
   ```

## Bước 7: Cài đặt và chạy

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. Chạy Server:
   ```bash
   npm start
   # hoặc
   npm run dev
   ```

   Server sẽ chạy tại `http://localhost:3000` và bao gồm:
   - Webhook endpoints
   - Backend API endpoints
   - Swagger documentation tại `http://localhost:3000/api-docs`

3. Nếu dùng ngrok, chạy ngrok (Terminal 2):
   ```bash
   ngrok http 3000
   ```

## Bước 8: Test Bot

1. Vào nhóm GMF đã tạo
2. Gửi tin nhắn: `/p Xin chào!`
3. Bot sẽ:
   - Nhận sự kiện qua webhook
   - Gửi về backend phân tích
   - Trả kết quả về group

## Kiểm tra Logs

- Server logs: Xem terminal chạy `npm start` hoặc `npm run dev`
- Zalo Developer Console: Xem webhook events
- Swagger UI: `http://localhost:3000/api-docs`

## Troubleshooting

### Webhook không nhận được sự kiện

1. Kiểm tra webhook URL đúng chưa
2. Kiểm tra Verify Token đúng chưa
3. Kiểm tra server có accessible từ internet không
4. Xem logs trong Zalo Developer Console

### Không gửi được tin nhắn

1. Kiểm tra Access Token còn hợp lệ không
2. Kiểm tra OA có quyền gửi tin trong nhóm GMF không
3. Kiểm tra group_id đúng chưa

### Lỗi xác thực

1. Kiểm tra APP_ID và APP_SECRET đúng chưa
2. Kiểm tra OA đã liên kết với ứng dụng chưa
3. Kiểm tra quyền đã được cấp chưa

## Tài liệu tham khảo

- [Zalo For Developers](https://developers.zalo.me/)
- [OA Group Messaging Feature](https://developers.zalo.me/docs/official-account/nhom-chat-gmf/general)
- [Webhook GMF](https://developers.zalo.me/docs/official-account/webhook/nhom-chat-gmf/create_group)

