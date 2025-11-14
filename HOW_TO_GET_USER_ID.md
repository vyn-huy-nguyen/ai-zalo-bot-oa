# Hướng dẫn lấy Zalo User ID

**Tham khảo:** [Zalo Developer Community - Hỏi cách lấy user_id](https://developers.zalo.me/community/detail/24595fbe63fb8aa5d3ea)

## ⚠️ Quan trọng: Có 2 loại User ID

Theo [Zalo Support](https://developers.zalo.me/community/detail/24595fbe63fb8aa5d3ea), có **2 loại user_id**:

### 1. **user_id by app** (Social API)
- Dùng để sử dụng **Social API**
- **KHÔNG THỂ** dùng để gửi tin nhắn bằng OA
- Lấy được sau khi user login vào app

### 2. **user_id by OA** (OA API) ⭐
- Dùng để sử dụng các **API liên quan đến OA** (ví dụ: gửi tin nhắn bằng OA)
- **Đây là user_id bạn cần** để tạo nhóm GMF
- Chỉ lấy được khi user **đã quan tâm (follow) OA**

---

## 📱 Cách lấy User ID by OA (để tạo nhóm GMF)

### Cách 1: Từ Webhook Event "User quan tâm OA" ⭐ (Khuyến nghị)

**Bước 1:** Đảm bảo user đã quan tâm OA
- User mở Zalo app
- Tìm OA của bạn và nhấn "Quan tâm" (Follow)

**Bước 2:** Webhook sẽ nhận event
- Zalo sẽ gửi webhook event: `oa_follow` hoặc `user_follow_oa`
- Event sẽ chứa `user_id_by_oa` hoặc `user_id`

**Bước 3:** Xem Server Logs
- Mở terminal chạy server (`npm run dev`)
- Bạn sẽ thấy log event khi user quan tâm OA
- Copy `user_id` từ event

**Ví dụ webhook event:**
```json
{
  "event_name": "oa_follow",
  "user_id_by_oa": "186729651760683225",  ← User ID by OA
  "oa_id": "607812198688816074",
  "timestamp": "1696908900672"
}
```

**Tham khảo:** [Sự kiện người dùng quan tâm Official Account](https://developers.zalo.me/docs/official-account/webhook/su-kien-nguoi-dung-quan-tam-bo-quan-tam-official-account-post-3707)

---

### Cách 2: Từ Webhook Event khi User gửi tin nhắn

**Bước 1:** User gửi tin nhắn đến OA
- Mở Zalo app
- Nhắn tin cho OA của bạn (bất kỳ tin nhắn nào)

**Bước 2:** Xem Server Logs
- Mở terminal chạy server (`npm run dev`)
- Bạn sẽ thấy log:
  ```
  📨 New /p command detected:
     Sender ID: 186729651760683225  ← User ID by OA
     Sender Name: Tên của bạn
  ```

**Bước 3:** Copy User ID
- Copy số `186729651760683225` (hoặc số tương tự)
- Đây chính là `user_id_by_oa` của bạn

**Lưu ý:** User phải đã quan tâm OA thì mới gửi được tin nhắn.

---

### Cách 3: Từ Zalo Developer Console

**Bước 1:** Truy cập Zalo Developer
- Vào: https://developers.zalo.me/
- Đăng nhập bằng tài khoản Zalo của bạn

**Bước 2:** Vào ứng dụng của bạn
- Chọn ứng dụng đã tạo
- Vào phần "Webhook" hoặc "Events"

**Bước 3:** Xem Webhook Events
- Tìm event khi user quan tâm OA (`oa_follow`)
- Hoặc event khi user gửi tin nhắn (`user_send_text`)
- Trong event data, tìm:
  - `user_id_by_oa` → Đây là User ID by OA
  - Hoặc `sender.id` (trong message event)

**Ví dụ event:**
```json
{
  "event_name": "user_send_text",
  "user_id_by_oa": "186729651760683225",  ← User ID by OA
  "oa_id": "607812198688816074",
  "message": {
    "text": "test"
  }
}
```

---

### Cách 4: Từ API Followers (Nếu user đã follow OA)

**Bước 1:** Đảm bảo user đã follow OA
- User phải đã quan tâm OA của bạn

**Bước 2:** Gọi API (nếu có endpoint)
```bash
# Lấy danh sách followers
curl "https://openapi.zalo.me/v3.0/oa/getfollowers?offset=0&count=50" \
  -H "access_token: YOUR_ACCESS_TOKEN"
```

**Bước 3:** Tìm User ID trong response
- Response sẽ chứa danh sách followers với `user_id`

---

## 🔍 Lưu ý quan trọng

### 1. **User phải quan tâm OA**
- ⚠️ **Bắt buộc:** User phải đã quan tâm (follow) OA của bạn
- Nếu chưa quan tâm, bạn **KHÔNG THỂ** lấy được `user_id_by_oa`
- Không thể dùng `user_id_by_app` để gửi tin nhắn OA

### 2. **User ID có dạng:**
- Số dài: `186729651760683225`
- Hoặc: `8756287263669629130`
- Thường là 16-19 chữ số

### 3. **User ID khác với:**
- Số điện thoại
- Zalo ID (username)
- Display name
- `user_id_by_app` (không dùng được cho OA API)

### 4. **Cách nhanh nhất:**
1. User quan tâm OA của bạn
2. User gửi tin nhắn đến OA
3. Xem server logs → Copy User ID

---

## 📝 Ví dụ sử dụng User ID

Sau khi có `user_id_by_oa`, bạn có thể dùng để:

### 1. **Tạo nhóm GMF mới:**
```json
POST /api/groups/create
{
  "group_name": "Nhóm test",
  "member_user_ids": ["186729651760683225"]  ← User ID by OA
}
```

### 2. **Gửi tin nhắn đến user:**
- Sử dụng OA API để gửi tin nhắn đến user với `user_id_by_oa`

---

## ❓ FAQ

**Q: Tôi lấy được user_id_by_app nhưng không dùng được để tạo nhóm?**
A: Đúng vậy! `user_id_by_app` chỉ dùng cho Social API. Để tạo nhóm GMF, bạn cần `user_id_by_oa`. User phải quan tâm OA trước.

**Q: User ID có thay đổi không?**
A: Không, User ID là cố định cho mỗi tài khoản Zalo.

**Q: Tôi có thể lấy User ID từ Zalo app không?**
A: Không, Zalo app không hiển thị User ID. Phải dùng API hoặc webhook.

**Q: Làm sao biết user đã quan tâm OA chưa?**
A: 
- User gửi được tin nhắn đến OA → Đã quan tâm
- Hoặc check webhook event `oa_follow`

**Q: Tôi muốn lấy số điện thoại của user?**
A: Cần dùng API "Gửi thông báo theo mẫu yêu cầu thông tin người dùng" và webhook "Sự kiện người dùng đồng ý chia sẻ thông tin". Xem thêm: [Zalo Support Response](https://developers.zalo.me/community/detail/24595fbe63fb8aa5d3ea)

---

## 🎯 Tóm tắt nhanh

**Để lấy User ID by OA (để tạo nhóm GMF):**

1. ✅ **User phải quan tâm OA của bạn** (bắt buộc)
2. ✅ User gửi tin nhắn đến OA (hoặc quan tâm OA)
3. ✅ Xem server logs/webhook events
4. ✅ Copy `user_id_by_oa` hoặc `sender.id`
5. ✅ Dùng User ID này để tạo nhóm GMF

**Ví dụ log:**
```
📨 New /p command detected:
   Sender ID: 186729651760683225  ← Copy số này (User ID by OA)
   Sender Name: Nguyễn Văn A
   Group ID: f414c8f76fa586fbdfb4
   Content: test
```

---

## 📚 Tài liệu tham khảo

- [Zalo Developer Community - Hỏi cách lấy user_id](https://developers.zalo.me/community/detail/24595fbe63fb8aa5d3ea)
- [Sự kiện người dùng quan tâm Official Account](https://developers.zalo.me/docs/official-account/webhook/su-kien-nguoi-dung-quan-tam-bo-quan-tam-official-account-post-3707)
- [Lấy thông tin, ảnh đại diện (Social API)](https://developers.zalo.me/docs/social-api/tai-lieu/thong-tin-ten-anh-dai-dien)
- [Gửi thông báo theo mẫu yêu cầu thông tin người dùng](https://developers.zalo.me/docs/official-account/gui-tin-va-thong-bao-qua-oa/gui-thong-bao-theo-mau-yeu-cau-thong-tin-nguoi-dung-post-5055)

