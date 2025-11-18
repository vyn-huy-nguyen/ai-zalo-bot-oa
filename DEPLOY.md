# Hướng dẫn Deploy lên EC2

## Yêu cầu

- EC2 instance (Ubuntu 20.04+, Amazon Linux 2, hoặc Amazon Linux 2023)
- Node.js 18+ và npm
- PM2 (process manager)
- Nginx (optional, cho reverse proxy)

## Bước 1: Chuẩn bị EC2 Instance

### 1.1. Kết nối vào EC2

```bash
# Ubuntu
ssh -i your-key.pem ubuntu@your-ec2-ip

# Amazon Linux 2023
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 1.2. Cập nhật hệ thống

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Amazon Linux 2023
sudo dnf update -y
```

### 1.3. Cài đặt Node.js 18+

#### Ubuntu/Debian:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Amazon Linux 2023:
```bash
# Cài đặt Node.js 18 từ NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Hoặc dùng nvm (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 1.4. Cài đặt PM2

```bash
sudo npm install -g pm2
```

### 1.5. Cài đặt Nginx (optional)

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# Amazon Linux 2023
sudo dnf install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Bước 2: Deploy Code

### 2.1. Clone repository hoặc upload code

```bash
# Option 1: Clone từ Git
cd ~
git clone your-repo-url
cd ai-zalo-bot-oa

# Option 2: Upload code bằng SCP
# Từ máy local (Ubuntu):
scp -i your-key.pem -r ai-zalo-bot-oa ubuntu@your-ec2-ip:~/

# Từ máy local (Amazon Linux):
scp -i your-key.pem -r ai-zalo-bot-oa ec2-user@your-ec2-ip:~/
```

### 2.2. Cài đặt dependencies

```bash
cd ~/ai-zalo-bot-oa
npm install --production
```

### 2.3. Tạo thư mục logs và data

```bash
mkdir -p logs
mkdir -p data/exports
```

### 2.4. Tạo file .env

```bash
cp .env.example .env
nano .env
```

Điền đầy đủ các biến môi trường:
- `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_OA_ID`
- `ZALO_ACCESS_TOKEN`, `ZALO_REFRESH_TOKEN`
- `WEBHOOK_VERIFY_TOKEN`, `WEBHOOK_SECRET`
- `SERVER_URL` (URL public của server, ví dụ: `https://your-domain.com` hoặc `http://your-ec2-ip:3001`)
- `GEMINI_API_KEY`, `GEMINI_MODEL`
- `PORT` (mặc định 3001 - được set trong ecosystem.config.cjs)

## Bước 3: Cấu hình PM2

### 3.1. Khởi động ứng dụng với PM2

```bash
# Option 1: Dùng ecosystem config (file .cjs để tránh conflict với ES modules)
pm2 start ecosystem.config.cjs

# Option 2: Nếu vẫn lỗi, dùng đường dẫn trực tiếp
pm2 start src/index.js --name zalo-bot-oa

# Option 3: Hoặc dùng npm script
npm run pm2:start
```

### 3.2. Lưu cấu hình PM2 để tự động khởi động khi reboot

```bash
pm2 save
pm2 startup
# Chạy lệnh được PM2 suggest (thường là sudo env PATH=...)
```

### 3.3. Kiểm tra trạng thái

```bash
pm2 status
pm2 logs zalo-bot-oa
```

## Bước 4: Cấu hình Firewall

### 4.1. Mở port trong EC2 Security Group (AWS Console)

- Port 3001 (port mặc định của ứng dụng, hoặc port bạn đã cấu hình)
- Port 80, 443 (nếu dùng Nginx)

**Quan trọng:** Phải mở port trong EC2 Security Group từ AWS Console!

### 4.2. Cấu hình Firewall trên Server

#### Ubuntu/Debian (UFW):
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3001/tcp  # App port (mặc định 3001)
sudo ufw allow 80/tcp     # HTTP (nếu dùng Nginx)
sudo ufw allow 443/tcp    # HTTPS (nếu dùng Nginx)
sudo ufw enable
```

#### Amazon Linux 2023 (firewalld):
```bash
# Kiểm tra firewalld có chạy không
sudo systemctl status firewalld

# Nếu chưa cài, cài đặt:
sudo dnf install firewalld -y
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Mở ports
sudo firewall-cmd --permanent --add-port=22/tcp    # SSH
sudo firewall-cmd --permanent --add-port=3001/tcp # App port (mặc định 3001)
sudo firewall-cmd --permanent --add-port=80/tcp   # HTTP (nếu dùng Nginx)
sudo firewall-cmd --permanent --add-port=443/tcp  # HTTPS (nếu dùng Nginx)
sudo firewall-cmd --reload

# Kiểm tra
sudo firewall-cmd --list-all
```

**Lưu ý:** Amazon Linux 2023 thường không cần cấu hình firewall trên server nếu đã mở trong Security Group. Nhưng nếu muốn thêm lớp bảo mật, có thể dùng firewalld.

## Bước 5: Cấu hình Nginx (Optional - Recommended)

### 5.1. Tạo Nginx config

#### Ubuntu/Debian:
```bash
sudo nano /etc/nginx/sites-available/zalo-bot
```

#### Amazon Linux 2023:
```bash
sudo nano /etc/nginx/conf.d/zalo-bot.conf
```

Nội dung (thay `18.141.138.124` bằng IP hoặc domain của bạn):

```nginx
server {
    listen 80;
    server_name 18.141.138.124;  # Thay bằng IP hoặc domain của bạn

    # Logging
    access_log /var/log/nginx/zalo-bot-access.log;
    error_log /var/log/nginx/zalo-bot-error.log;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase body size for file uploads
    client_max_body_size 10M;
}
```

### 5.2. Enable site và test

#### Ubuntu/Debian:
```bash
sudo ln -s /etc/nginx/sites-available/zalo-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Amazon Linux 2023:
```bash
# File đã nằm trong conf.d nên không cần symlink
sudo nginx -t
sudo systemctl restart nginx
```

### 5.3. Cấu hình SSL với Let's Encrypt (Optional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Bước 6: Cấu hình Webhook trong Zalo Developer Console

1. Đăng nhập vào [Zalo Developer Console](https://developers.zalo.me/)
2. Vào ứng dụng của bạn
3. Cấu hình Webhook URL:
   - Nếu dùng domain: `https://your-domain.com/webhook`
   - Nếu dùng IP: `http://your-ec2-ip:3001/webhook`
4. Điền `WEBHOOK_VERIFY_TOKEN` (phải khớp với trong file .env)
5. Lưu và verify webhook

## Bước 7: Kiểm tra và Monitor

### 7.1. Kiểm tra ứng dụng

```bash
# Xem logs
pm2 logs zalo-bot-oa

# Xem status
pm2 status

# Restart app
pm2 restart zalo-bot-oa

# Stop app
pm2 stop zalo-bot-oa
```

### 7.2. Test endpoints

```bash
# Health check
curl http://localhost:3001/health

# Hoặc từ bên ngoài
curl http://your-ec2-ip:3001/health
```

## Bước 8: Backup và Maintenance

### 8.1. Backup database

```bash
# Tạo script backup
nano ~/backup-db.sh
```

Nội dung:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp ~/ai-zalo-bot-oa/data/zalo_bot.db $BACKUP_DIR/zalo_bot_$DATE.db
# Giữ chỉ 7 ngày
find $BACKUP_DIR -name "zalo_bot_*.db" -mtime +7 -delete
```

```bash
chmod +x ~/backup-db.sh

# Thêm vào crontab (backup mỗi ngày lúc 2h sáng)
crontab -e
# Thêm dòng:
# Ubuntu:
0 2 * * * /home/ubuntu/backup-db.sh
# Amazon Linux:
0 2 * * * /home/ec2-user/backup-db.sh
```

### 8.2. Cleanup old CSV files

Ứng dụng tự động cleanup, nhưng có thể thêm cron job:

```bash
# Thêm vào crontab
crontab -e

# Cleanup CSV files older than 7 days
0 3 * * * find ~/ai-zalo-bot-oa/data/exports -name "*.csv" -mtime +7 -delete
```

## Troubleshooting

### App không khởi động

```bash
# Kiểm tra logs
pm2 logs zalo-bot-oa --lines 100

# Kiểm tra .env file
cat .env

# Kiểm tra port đã được sử dụng chưa
sudo lsof -i :3001
# Hoặc
sudo netstat -tulpn | grep :3001

# Kiểm tra file script có tồn tại không
ls -la src/index.js

# Nếu PM2 báo lỗi "No script path", thử:
pm2 start src/index.js --name zalo-bot-oa
```

### Webhook không nhận được

1. Kiểm tra Security Group đã mở port chưa
2. Kiểm tra firewall
3. Kiểm tra SERVER_URL trong .env có đúng không
4. Kiểm tra logs: `pm2 logs zalo-bot-oa`

### Database errors

```bash
# Kiểm tra quyền truy cập
ls -la data/zalo_bot.db

# Fix permissions nếu cần
chmod 644 data/zalo_bot.db
```

## Update Code

```bash
# Pull latest code
cd ~/ai-zalo-bot-oa
git pull  # hoặc upload code mới

# Install new dependencies
npm install --production

# Restart app
pm2 restart zalo-bot-oa
```

## Useful Commands

```bash
# PM2
pm2 status              # Xem status
pm2 logs                # Xem logs
pm2 restart zalo-bot-oa # Restart
pm2 stop zalo-bot-oa    # Stop
pm2 delete zalo-bot-oa  # Xóa khỏi PM2

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t           # Test config

# System
df -h                   # Disk space
free -h                 # Memory
top                     # CPU/Memory usage
```

