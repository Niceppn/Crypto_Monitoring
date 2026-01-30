# 🚀 Quick Start Guide สำหรับ VPS

คู่มือสั้นๆ สำหรับ deploy บน VPS แบบเร็ว

## ขั้นตอนแบบย่อ

### 1. เชื่อมต่อ VPS และเตรียมระบบ

```bash
# เชื่อมต่อ VPS
ssh root@your-vps-ip

# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง PM2
sudo npm install -g pm2

# ติดตั้ง Nginx
sudo apt install nginx -y
```

### 2. Upload โค้ด

```bash
# สร้าง directory
sudo mkdir -p /var/www
cd /var/www

# วิธีที่ 1: Clone จาก Git
git clone https://github.com/your-repo/crypto-monitoring.git
cd crypto-monitoring

# วิธีที่ 2: Upload ผ่าน SCP (จากเครื่อง local)
# scp -r ./Crypto_Monitoring root@your-vps-ip:/var/www/
```

### 3. ติดตั้งและ Setup

```bash
# ติดตั้ง dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

# Seed database
cd server
npm run seed
cd ..
```

### 4. ตั้งค่า Environment

```bash
# สร้าง .env สำหรับ backend
cd server
nano .env
```

ใส่ข้อมูล:
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://your-domain.com
JWT_SECRET=เปลี่ยนเป็น-random-string-ยาวๆ
```

### 5. ตั้งค่า Nginx

```bash
sudo nano /etc/nginx/sites-available/crypto-monitoring
```

ใส่:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/crypto-monitoring/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/crypto-monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. รัน Backend ด้วย PM2

```bash
cd /var/www/crypto-monitoring/server
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # ทำตามคำแนะนำ
```

### 7. ตั้งค่า SSL (Optional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 8. เปิด Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## ✅ เสร็จแล้ว!

เปิด browser ไปที่ `http://your-domain.com` หรือ `http://your-vps-ip`

## คำสั่งที่ใช้บ่อย

```bash
# ดู status
pm2 status

# ดู logs
pm2 logs crypto-monitoring-api

# Restart
pm2 restart crypto-monitoring-api

# Backup database
cd /var/www/crypto-monitoring/server/scripts
chmod +x backup.sh
./backup.sh
```

## 🔧 Troubleshooting

**Backend ไม่ทำงาน:**
```bash
pm2 logs crypto-monitoring-api
pm2 restart crypto-monitoring-api
```

**Frontend ไม่แสดง:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**Port ถูกใช้:**
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
```

---

📖 **ดูคู่มือละเอียด:** [DEPLOY.md](./DEPLOY.md)

