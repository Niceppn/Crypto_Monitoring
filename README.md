# Crypto Monitoring Dashboard

เว็บแอปพลิเคชันสำหรับ monitoring database schemas พร้อมดีไซน์ธีม crypto ที่ทันสมัย

📖 **ดูคู่มือการ Deploy บน VPS:** [DEPLOY.md](./DEPLOY.md)

## คุณสมบัติ

- 🔐 ระบบ Login พร้อม JWT Authentication
- 📊 Dashboard แสดง database schemas
- 📋 ตารางข้อมูลพร้อม pagination และ search
- 🎨 ดีไซน์ธีม crypto (dark mode, gradients, animations)
- 📱 Responsive design (รองรับ desktop และ mobile)

## เทคโนโลยีที่ใช้

### Frontend
- React 18
- React Router
- Vite
- CSS3 (Custom styling)

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3) - ฐานข้อมูลไฟล์เดียว ง่ายต่อการ deploy บน VPS
- JWT Authentication
- bcryptjs

## การติดตั้งและรัน

### 1. ติดตั้ง Frontend

```bash
# ติดตั้ง dependencies
npm install

# รัน development server
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

### 2. ติดตั้ง Backend

```bash
# เข้าไปที่โฟลเดอร์ server
cd server

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env จาก .env.example
cp .env.example .env

# แก้ไข .env ตามต้องการ (optional)
# PORT=3001
# JWT_SECRET=your-secret-key
# FRONTEND_URL=http://localhost:5173

# Seed database (รันครั้งแรกหรือเมื่อต้องการ reset data)
npm run seed

# รัน server
npm start
# หรือ
npm run dev  # สำหรับ auto-reload
```

Backend จะรันที่ `http://localhost:3001`

**หมายเหตุ:** Database file จะถูกสร้างอัตโนมัติที่ `server/data/crypto_monitoring.db` เมื่อรัน server ครั้งแรก

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

สำหรับ Frontend สร้างไฟล์ `.env` ใน root directory (optional):

```env
VITE_API_URL=http://localhost:3001/api
```

## การใช้งาน

### Login Credentials (Demo)

- **Username:** `admin` / **Password:** `admin123`
- **Username:** `user` / **Password:** `user123`

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout

#### Schemas
- `GET /api/schemas` - Get all schemas
- `GET /api/schemas/:schemaName` - Get schema by name
- `GET /api/schemas/:schemaName/data` - Get schema data (with pagination & search)
- `GET /api/schemas/:schemaName/stats` - Get schema statistics

## โครงสร้างโปรเจกต์

```
Crypto_Monitoring/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── services/           # API services
│   ├── data/               # Mock data (for reference)
│   └── styles/             # CSS files
├── server/                 # Backend source code
│   ├── routes/             # API routes
│   ├── middleware/          # Express middleware
│   ├── data/               # Mock data
│   └── config/             # Configuration files
└── package.json            # Frontend dependencies
```

## Build สำหรับ Production

### Frontend
```bash
npm run build
```

### Backend
```bash
# Set NODE_ENV=production
NODE_ENV=production npm start
```

## ฐานข้อมูล (SQLite)

โปรเจกต์นี้ใช้ **SQLite** ซึ่งเป็นฐานข้อมูลไฟล์เดียว ไม่ต้อง setup server แยก เหมาะสำหรับ VPS

### Database Schema

- `transactions` - บันทึก transaction ของ cryptocurrency
- `wallets` - ข้อมูล wallet ของผู้ใช้
- `tokens` - ข้อมูล token metadata
- `blocks` - ข้อมูล blockchain blocks
- `users` - ข้อมูล user accounts
- `prices` - ข้อมูลราคา historical

### การจัดการ Database

```bash
# Seed database (ใส่ข้อมูลตัวอย่าง)
cd server
npm run seed

# Database file จะอยู่ที่: server/data/crypto_monitoring.db
```

### ข้อดีของ SQLite สำหรับ VPS

- ✅ ไม่ต้อง setup database server แยก
- ✅ ไฟล์เดียว ง่ายต่อการ backup
- ✅ Performance ดีสำหรับแอปขนาดเล็ก-กลาง
- ✅ ไม่ต้องจัดการ connection pool
- ✅ รองรับ SQL standard

## หมายเหตุ

- Database จะถูกสร้างอัตโนมัติเมื่อรัน server ครั้งแรก
- จำนวน rows ในแต่ละ schema จะถูกดึงจาก database จริง
- เปลี่ยน JWT_SECRET ใน production!
- สำหรับ production แนะนำให้ backup ไฟล์ `crypto_monitoring.db` เป็นประจำ

# Crypto_Monitoring
