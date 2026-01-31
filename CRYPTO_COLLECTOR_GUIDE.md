# Crypto Collector Guide

## คุณสมบัติ

- ✅ Real-time data collection จาก Binance WebSocket
- ✅ บันทึกข้อมูลลง SQLite database (ไม่ใช่ CSV)
- ✅ รองรับทุก trading pair ของ Binance
- ✅ Auto-reconnection เมื่อ connection หลุด
- ✅ Start/Stop collector ผ่าน Web UI
- ✅ แสดงสถิติ real-time
- ✅ เปลี่ยน symbol ได้ง่าย

## การติดตั้ง

### 1. ติดตั้ง Python Dependencies

```bash
cd server
pip3 install -r requirements.txt
```

Dependencies ที่ต้องการ:
- `websocket-client` - สำหรับเชื่อมต่อ WebSocket
- `pandas` - สำหรับ data processing
- `selenium` - สำหรับ web scraping
- `beautifulsoup4` - สำหรับ HTML parsing

### 2. รัน Backend Server

```bash
cd server
npm install
npm start
```

Backend จะรันที่ `http://localhost:3001`

### 3. รัน Frontend

```bash
# กลับไป root directory
cd ..
npm install
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

## การใช้งาน

### 1. เข้าสู่ระบบ

- เปิด browser ไปที่ `http://localhost:5173`
- Login ด้วย username/password
  - Username: `admin` / Password: `admin123`
  - Username: `user` / Password: `user123`

### 2. เปิดหน้า Crypto Collector

- คลิกที่เมนู **"Crypto Collector"** ในแถบด้านซ้าย

### 3. เริ่มเก็บข้อมูล

1. **เลือก Trading Pair**: ใส่ symbol ที่ต้องการ (เช่น `btcusdt`, `ethusdt`)
2. **กดปุ่ม "▶ Start Collector"**: เริ่มเก็บข้อมูล real-time
3. **ดูสถิติ**: สถิติจะอัพเดททุก 5 วินาที

### 4. หยุดเก็บข้อมูล

- กดปุ่ม **"⏹ Stop Collector"** เมื่อต้องการหยุด

### 5. ลบข้อมูล

- กดปุ่ม **"🗑 Clear Data"** เพื่อลบข้อมูลทั้งหมดของ symbol นั้น

## Trading Pairs ยอดนิยม

| Symbol | Description |
|--------|-------------|
| `btcusdt` | Bitcoin/USDT |
| `ethusdt` | Ethereum/USDT |
| `bnbusdt` | Binance Coin/USDT |
| `xrpusdt` | Ripple/USDT |
| `adausdt` | Cardano/USDT |
| `solusdt` | Solana/USDT |
| `dogeusdt` | Dogecoin/USDT |
| `maticusdt` | Polygon/USDT |

**หมายเหตุ:** สามารถใช้ trading pair ใดก็ได้จาก Binance โดยใส่เป็น lowercase (เช่น `btcjpy`, `ethbtc`)

## ข้อมูลที่เก็บ

Collector จะเก็บข้อมูลต่อไปนี้ในตาราง `crypto_trades`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key (auto increment) |
| `symbol` | TEXT | Trading pair (e.g., BTCUSDT) |
| `timestamp_ms` | INTEGER | Unix timestamp in milliseconds |
| `readable_time` | TEXT | Human-readable timestamp |
| `price` | REAL | Trade price |
| `quantity` | REAL | Trade quantity |
| `side` | TEXT | BUY or SELL |
| `is_maker` | INTEGER | 0 = BUY (taker), 1 = SELL (maker) |
| `created_at` | TEXT | Record creation time |

## สถิติที่แสดง

1. **Total Trades**: จำนวน trades ทั้งหมด
2. **Average Price**: ราคาเฉลี่ย
3. **Max Price**: ราคาสูงสุด
4. **Min Price**: ราคาต่ำสุด
5. **Total Volume**: ปริมาณการซื้อขายรวม
6. **Latest Trade**: เวลาของ trade ล่าสุด

## การรัน Collector แบบ Manual (Optional)

หากต้องการรัน collector ผ่าน terminal โดยตรง:

```bash
cd server
python3 scripts/crypto_collector.py btcusdt
```

**หมายเหตุ:** วิธีนี้จะรันต่อเนื่องไปเรื่อยๆ กด `Ctrl+C` เพื่อหยุด

## Troubleshooting

### 1. Collector ไม่สามารถเริ่มได้

**สาเหตุ**: Database ยังไม่ถูกสร้าง

**วิธีแก้**:
```bash
cd server
npm run seed
```

### 2. WebSocket connection error

**สาเหตุ**: Internet connection หรือ Binance API มีปัญหา

**วิธีแก้**:
- ตรวจสอบ internet connection
- ลองรอสักครู่แล้วลองใหม่
- ตรวจสอบว่า symbol ที่ใส่ถูกต้อง

### 3. Python script ไม่พบ dependencies

**สาเหตุ**: ยังไม่ได้ติดตั้ง Python packages

**วิธีแก้**:
```bash
cd server
pip3 install -r requirements.txt
```

### 4. ข้อมูลไม่อัพเดท

**สาเหตุ**: Collector อาจหยุดทำงาน

**วิธีแก้**:
- กด Stop แล้ว Start ใหม่
- ตรวจสอบ console log ว่ามี error หรือไม่

## Database Query Examples

### ดูข้อมูล trades ทั้งหมด
```sql
SELECT * FROM crypto_trades
ORDER BY timestamp_ms DESC
LIMIT 100;
```

### นับจำนวน trades แต่ละ symbol
```sql
SELECT symbol, COUNT(*) as total_trades
FROM crypto_trades
GROUP BY symbol;
```

### หา trade ที่มีราคาสูงสุด
```sql
SELECT * FROM crypto_trades
WHERE symbol = 'BTCUSDT'
ORDER BY price DESC
LIMIT 1;
```

### คำนวณราคาเฉลี่ยต่อชั่วโมง
```sql
SELECT
  strftime('%Y-%m-%d %H:00:00', readable_time) as hour,
  AVG(price) as avg_price,
  COUNT(*) as trades
FROM crypto_trades
WHERE symbol = 'BTCUSDT'
GROUP BY hour
ORDER BY hour DESC;
```

## API Endpoints

### Start Collector
```http
POST /api/collector/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "btcusdt"
}
```

### Stop Collector
```http
POST /api/collector/stop
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "btcusdt"
}
```

### Get Status
```http
GET /api/collector/status?symbol=BTCUSDT
Authorization: Bearer <token>
```

### Get Statistics
```http
GET /api/collector/stats?symbol=BTCUSDT
Authorization: Bearer <token>
```

### Get Trades
```http
GET /api/collector/trades?symbol=BTCUSDT&page=1&limit=50
Authorization: Bearer <token>
```

### Clear Trades
```http
DELETE /api/collector/clear
Authorization: Bearer <token>
Content-Type: application/json

{
  "symbol": "BTCUSDT"
}
```

## ข้อแนะนำ

1. **เริ่มจาก symbol ที่มีปริมาณการซื้อขายสูง** (เช่น `btcusdt`, `ethusdt`) เพื่อให้เห็นข้อมูลไหลเข้ามาเร็ว
2. **อย่าลืม Stop collector** เมื่อไม่ใช้งาน เพื่อประหยัด resources
3. **Clear data เป็นระยะ** ถ้าไม่ต้องการเก็บข้อมูลเก่า
4. **Backup database** ก่อนลบข้อมูล

## ข้อจำกัด

- รองรับเฉพาะ Binance WebSocket API
- หนึ่ง symbol สามารถรัน collector ได้ครั้งละ 1 ตัวเท่านั้น
- ต้องมี internet connection ตลอดเวลา

## License

MIT License - ใช้งานได้อย่างอิสระ
