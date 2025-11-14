# Yêu cầu về Zalo Official Account (OA)

## ❌ Gói "Dùng thử" (Chưa xác thực) - KHÔNG DÙNG ĐƯỢC

**Lý do:**
- Tài khoản OA "Dùng thử" (chưa xác thực) **KHÔNG THỂ** lấy được **Refresh Token**
- Không có Refresh Token → Không thể sử dụng API của Zalo
- Bot sẽ không hoạt động được

**Cách nhận biết:**
- OA chưa có dấu tích vàng (✓) bên cạnh tên
- Chưa hoàn tất quá trình xác thực với Zalo

---

## ✅ Yêu cầu để Bot hoạt động

### 1. **OA phải được Xác thực** (Bắt buộc)

**Điều kiện:**
- OA phải có **dấu tích vàng** (✓) bên cạnh tên
- Đã hoàn tất quá trình xác thực với Zalo
- Có thể lấy được **Refresh Token** từ Zalo Developer Console

**Cách xác thực OA:**
1. Truy cập [Zalo Official Account](https://oa.zalo.me/)
2. Vào phần "Xác thực" hoặc "Verification"
3. Hoàn tất quá trình xác thực theo hướng dẫn của Zalo
4. Thường cần:
   - Xác minh doanh nghiệp
   - Cung cấp giấy phép kinh doanh
   - Xác minh thông tin liên hệ

**Tham khảo:**
- [Zalo OA Xác thực là gì?](https://zalocloud.freshdesk.com/support/solutions/articles/151000112497-zalo-oa-x%C3%A1c-th%E1%BB%B1c-l%C3%A0-g%C3%AC-h%C6%B0%E1%BB%9Bng-d%E1%BA%ABn-li%C3%AAn-k%E1%BA%BFt-zalo-oa-v%C3%A0o-t%C3%A0i-kho%E1%BA%A3n-zca)

---

### 2. **Gói OA** (Khuyến nghị)

**Gói Nâng cao hoặc Premium:**
- ✅ Hỗ trợ đầy đủ tính năng GMF (Group Messaging Features)
- ✅ Có thể tạo và quản lý nhóm GMF
- ✅ Không giới hạn số lượng nhóm
- ✅ Hỗ trợ đầy đủ API

**Gói Cơ bản (đã xác thực):**
- ⚠️ Có thể có giới hạn về tính năng GMF
- ⚠️ Có thể giới hạn số lượng nhóm
- ✅ Vẫn có thể lấy Refresh Token (nếu đã xác thực)

---

## 🔍 Kiểm tra OA có thể dùng được không

### Bước 1: Kiểm tra OA đã xác thực chưa

1. Truy cập [Zalo Official Account](https://oa.zalo.me/)
2. Kiểm tra tên OA có dấu tích vàng (✓) không
3. Nếu chưa có → Cần xác thực trước

### Bước 2: Kiểm tra có thể lấy Refresh Token không

1. Truy cập [Zalo Developer](https://developers.zalo.me/)
2. Vào ứng dụng của bạn
3. Vào phần "Access Token" hoặc "Công cụ" → "Lấy Access Token"
4. Nếu thấy **Refresh Token** → ✅ OA có thể dùng được
5. Nếu không thấy Refresh Token → ❌ OA chưa xác thực, không dùng được

---

## 📊 So sánh các gói OA

| Gói OA | Xác thực | Refresh Token | GMF | Bot hoạt động? |
|--------|----------|---------------|-----|----------------|
| **Dùng thử** (chưa xác thực) | ❌ | ❌ | ❌ | ❌ **KHÔNG** |
| **Cơ bản** (đã xác thực) | ✅ | ✅ | ⚠️ Giới hạn | ✅ **CÓ THỂ** |
| **Nâng cao** (đã xác thực) | ✅ | ✅ | ✅ Đầy đủ | ✅ **CÓ** |
| **Premium** (đã xác thực) | ✅ | ✅ | ✅ Đầy đủ | ✅ **CÓ** |

---

## ⚠️ Lưu ý

1. **Xác thực OA là BẮT BUỘC:**
   - Không có Refresh Token → Bot không hoạt động được
   - Chỉ có Access Token (hết hạn sau 1 giờ) → Không đủ để bot hoạt động lâu dài

2. **Gói OA:**
   - Gói "Dùng thử" (chưa xác thực): **KHÔNG DÙNG ĐƯỢC**
   - Gói Cơ bản (đã xác thực): Có thể dùng được nhưng có giới hạn
   - Gói Nâng cao/Premium: Khuyến nghị cho production

3. **Quá trình xác thực:**
   - Có thể mất vài ngày để Zalo xác thực
   - Cần cung cấp đầy đủ thông tin doanh nghiệp
   - Sau khi xác thực, có thể lấy Refresh Token ngay

---

## 🆘 Troubleshooting

### Không lấy được Refresh Token

**Nguyên nhân:**
- OA chưa được xác thực
- Ứng dụng chưa liên kết với OA
- Chưa cấp quyền cho ứng dụng

**Giải pháp:**
1. Kiểm tra OA đã có dấu tích vàng chưa
2. Nếu chưa → Hoàn tất quá trình xác thực
3. Kiểm tra ứng dụng đã liên kết với OA chưa
4. Kiểm tra đã cấp quyền cho ứng dụng chưa

### OA đã xác thực nhưng vẫn không lấy được Refresh Token

**Nguyên nhân:**
- Ứng dụng chưa được liên kết với OA
- Chưa cấp quyền cho ứng dụng

**Giải pháp:**
1. Vào Zalo Developer → Ứng dụng của bạn
2. Vào "Official Account" → "Liên kết OA"
3. Chọn OA đã xác thực
4. Cấp quyền: "Quản lý nhóm chat (GMF)" và "Gửi tin nhắn"
5. Thử lấy Refresh Token lại

---

## 📖 Tài liệu tham khảo

- [Zalo Official Account](https://oa.zalo.me/)
- [Zalo OA Xác thực](https://zalocloud.freshdesk.com/support/solutions/articles/151000112497-zalo-oa-x%C3%A1c-th%E1%BB%B1c-l%C3%A0-g%C3%AC-h%C6%B0%E1%BB%9Bng-d%E1%BA%ABn-li%C3%AAn-k%E1%BA%BFt-zalo-oa-v%C3%A0o-t%C3%A0i-kho%E1%BA%A3n-zca)
- [Zalo Developer](https://developers.zalo.me/)

