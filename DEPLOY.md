# คู่มือการ Deploy บน VPS

คู่มือนี้จะแนะนำการ deploy Crypto Monitoring Dashboard บน VPS แบบ step-by-step

## สิ่งที่ต้องเตรียม

- VPS ที่มี Node.js (แนะนำ Ubuntu 20.04/22.04)
- Domain name (optional แต่แนะนำ)
- SSH access ไปยัง VPS

## ขั้นตอนการ Deploy

### 1. เตรียม VPS

#### 1.1 เชื่อมต่อ VPS
```bash
ssh root@your-vps-ip
# หรือ
ssh username@your-vps-ip
```

#### 1.2 อัปเดตระบบ
```bash
sudo apt update
sudo apt upgrade -y
```

#### 1.3 ติดตั้ง Node.js (ถ้ายังไม่มี)
```bash
# ติดตั้ง Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ตรวจสอบ version
node --version
npm --version
```

#### 1.4 ติดตั้ง PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

PM2 จะช่วยให้แอปทำงานใน background และ auto-restart เมื่อ server restart

### 2. Upload โค้ดไปยัง VPS

#### วิธีที่ 1: ใช้ Git (แนะนำ)
```bash
# บน VPS
cd /var/www  # หรือ directory อื่นที่ต้องการ
git clone https://github.com/your-username/crypto-monitoring.git
cd crypto-monitoring
```

#### วิธีที่ 2: ใช้ SCP
```bash
# บนเครื่อง local
scp -r /path/to/Crypto_Monitoring root@your-vps-ip:/var/www/
```

#### วิธีที่ 3: ใช้ rsync
```bash
# บนเครื่อง local
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /path/to/Crypto_Monitoring/ root@your-vps-ip:/var/www/crypto-monitoring/
```

### 3. ติดตั้ง Dependencies

```bash
# ติดตั้ง Frontend dependencies
npm install

# ติดตั้ง Backend dependencies
cd server
npm install
cd ..
```

### 4. ตั้งค่า Environment Variables

#### 4.1 สร้างไฟล์ .env สำหรับ Backend
```bash
cd server
nano .env
```

ใส่ข้อมูลต่อไปนี้:
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://your-domain.com
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string
```

**สำคัญ:** เปลี่ยน `JWT_SECRET` เป็น random string ที่ยาวและซับซ้อน!

#### 4.2 สร้างไฟล์ .env สำหรับ Frontend (optional)
```bash
cd ..
nano .env
```

```env
VITE_API_URL=http://your-domain.com:3001/api
# หรือถ้าใช้ reverse proxy
VITE_API_URL=https://your-domain.com/api
```

### 5. Build Frontend

```bash
# Build frontend สำหรับ production
npm run build
```

ไฟล์ที่ build จะอยู่ในโฟลเดอร์ `dist/`

### 6. Seed Database (ครั้งแรก)

```bash
cd server
npm run seed
```

### 7. ตั้งค่า Reverse Proxy (Nginx)

#### 7.1 ติดตั้ง Nginx
```bash
sudo apt install nginx -y
```

#### 7.2 สร้าง Nginx Config
```bash
sudo nano /etc/nginx/sites-available/crypto-monitoring
```

ใส่ข้อมูลต่อไปนี้:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Static files)
    location / {
        root /var/www/crypto-monitoring/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 7.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/crypto-monitoring /etc/nginx/sites-enabled/
sudo nginx -t  # ตรวจสอบ config
sudo systemctl restart nginx
```

### 8. ตั้งค่า SSL (Let's Encrypt) - Optional แต่แนะนำ

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot จะตั้งค่า SSL อัตโนมัติและ auto-renew

### 9. รัน Backend ด้วย PM2

```bash
cd /var/www/crypto-monitoring/server

# สร้างไฟล์ ecosystem.config.js
nano ecosystem.config.js
```

ใส่ข้อมูล:
```javascript
module.exports = {
  apps: [{
    name: 'crypto-monitoring-api',
    script: 'server.js',
    cwd: '/var/www/crypto-monitoring/server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

```bash
# สร้างโฟลเดอร์ logs
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# ทำตามคำแนะนำที่แสดงบนหน้าจอ
```

### 10. ตรวจสอบสถานะ

```bash
# ตรวจสอบ PM2
pm2 status
pm2 logs crypto-monitoring-api

# ตรวจสอบ Nginx
sudo systemctl status nginx

# ตรวจสอบ port
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :80
```

### 11. Firewall Configuration

```bash
# เปิด port 80 และ 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## การจัดการหลัง Deploy

### Restart Application
```bash
pm2 restart crypto-monitoring-api
```

### ดู Logs
```bash
pm2 logs crypto-monitoring-api
# หรือ
tail -f /var/www/crypto-monitoring/server/logs/out.log
```

### Update Application
```bash
cd /var/www/crypto-monitoring
git pull  # ถ้าใช้ git
# หรือ upload ไฟล์ใหม่

# Rebuild frontend
npm run build

# Restart backend
cd server
pm2 restart crypto-monitoring-api
```

### Backup Database
```bash
# Backup SQLite database
cp /var/www/crypto-monitoring/server/data/crypto_monitoring.db \
   /var/www/crypto-monitoring/server/data/crypto_monitoring.db.backup.$(date +%Y%m%d)

# หรือใช้ cron job สำหรับ auto-backup
```

### Setup Auto Backup (Cron Job)
```bash
crontab -e
```

เพิ่มบรรทัดนี้ (backup ทุกวันเวลา 2:00 AM):
```bash
0 2 * * * cp /var/www/crypto-monitoring/server/data/crypto_monitoring.db /var/www/crypto-monitoring/server/data/backups/crypto_monitoring.db.$(date +\%Y\%m\%d)
```

## Troubleshooting

### Backend ไม่ทำงาน
```bash
# ตรวจสอบ logs
pm2 logs crypto-monitoring-api

# ตรวจสอบว่า port 3001 ถูกใช้หรือไม่
sudo lsof -i :3001

# Restart
pm2 restart crypto-monitoring-api
```

### Frontend ไม่แสดง
```bash
# ตรวจสอบ Nginx
sudo nginx -t
sudo systemctl status nginx

# ตรวจสอบว่าไฟล์ build อยู่ที่ถูกต้อง
ls -la /var/www/crypto-monitoring/dist
```

### Database Error
```bash
# ตรวจสอบว่า database file มีอยู่
ls -la /var/www/crypto-monitoring/server/data/

# ตรวจสอบ permissions
sudo chown -R $USER:$USER /var/www/crypto-monitoring/server/data/
```

### Port ถูกใช้แล้ว
```bash
# หา process ที่ใช้ port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

## Security Checklist

- [ ] เปลี่ยน JWT_SECRET เป็น random string
- [ ] ตั้งค่า firewall (UFW)
- [ ] ใช้ SSL/HTTPS (Let's Encrypt)
- [ ] เปลี่ยน default SSH port (optional)
- [ ] ตั้งค่า fail2ban (optional)
- [ ] ตั้งค่า auto-backup database
- [ ] ตรวจสอบ file permissions
- [ ] ใช้ strong password สำหรับ VPS

## Performance Tips

1. **ใช้ PM2 Cluster Mode** (ถ้ามีหลาย CPU cores):
```javascript
// ecosystem.config.js
instances: 'max',  // ใช้ทุก core
exec_mode: 'cluster'
```

2. **Enable Nginx Caching** สำหรับ static files

3. **ใช้ CDN** สำหรับ static assets (optional)

4. **Monitor Resources**:
```bash
pm2 monit
```

## หมายเหตุ

- แนะนำให้ใช้ domain name แทน IP address
- Backup database เป็นประจำ
- Monitor logs เพื่อตรวจสอบ errors
- Update dependencies เป็นประจำเพื่อความปลอดภัย

