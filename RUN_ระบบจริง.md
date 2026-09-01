# เชื่อมระบบให้ทำงานจริง — คู่มือรัน (อัปเดต 1 ก.ย. 2569)

> เอกสารนี้แทนที่เวอร์ชันเดิมทั้งหมด — ระบบย้ายจาก Firebase Firestore มาเป็น **MySQL/MariaDB** แล้ว และเพิ่มระบบ **อัปเดตแบบเรียลไทม์ (Socket.IO)** กับ **ล็อกอินลูกค้าผ่าน LINE LIFF** เข้ามาด้วย

## สถาปัตยกรรม

```
เว็บลูกค้า (React/Vite)  ─┐         ┌─►  MySQL / MariaDB
                          ├─► Backend API (Express) ┤     (services, staff, bookings, ...)
เว็บแอดมิน (React/Vite) ─┘         └─►  Socket.IO (push แบบเรียลไทม์ กลับไปทั้งสองเว็บ)
```

- Backend ตัวเดียวทำหน้าที่คู่: เป็น REST API (เขียน/อ่านข้อมูล, กันคิวชนด้วย SQL transaction) และเป็น Socket.IO server (ส่งข้อมูลใหม่กลับไปหาเว็บทั้งสองทันทีที่มีการเปลี่ยนแปลง — ไม่ต้องกดรีเฟรช)
- ทั้งสองเว็บมี **fallback เป็น mock data** อัตโนมัติเมื่อไม่ได้ตั้ง `VITE_API_URL` จึงยังเปิดดู UI ได้โดยไม่ต้องรัน backend

## สิ่งที่ต้องมี

- Node.js 18 ขึ้นไป
- MySQL หรือ MariaDB (ติดตั้งในเครื่อง หรือใช้ cloud DB ก็ได้)

---

## 1) เตรียมฐานข้อมูล (ครั้งแรกครั้งเดียว)

```bash
mysql -u root -p -e "CREATE DATABASE nail_booking CHARACTER SET utf8mb4;"

# import schema หลัก แล้วตามด้วย addendum (เพิ่มตาราง shop_settings + คอลัมน์ยกเลิกการจอง)
mysql --default-character-set=utf8mb4 -u root -p nail_booking < schema/nail_booking_schema.sql
mysql --default-character-set=utf8mb4 -u root -p nail_booking < schema/schema_addendum_mysql_migration.sql
```

> ต้องใช้ `--default-character-set=utf8mb4` เสมอ ไม่งั้นข้อความภาษาไทยจะเพี้ยน
>
> schema สร้างบัญชีแอดมินตัวอย่างให้แล้ว: username `admin` รหัสผ่าน `admin1234` — **เปลี่ยนก่อนใช้งานจริง**

## 2) รัน Backend API

```bash
cd backend/api
npm install                # ติดตั้ง mysql2, socket.io, express ฯลฯ
cp .env.example .env       # แล้วแก้ DB_USER / DB_PASSWORD / DB_NAME ให้ตรงกับเครื่องคุณ
npm run start              # หรือ npm run dev (auto-reload)
```

ทดสอบว่าเชื่อมฐานข้อมูลได้:
```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/services
```

ค่าที่ตั้งได้ใน `.env` (ดู `.env.example`):

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | ค่าเชื่อมต่อ MySQL/MariaDB |
| `LINE_LOGIN_CHANNEL_ID` | (ไม่บังคับ) เปิดใช้ล็อกอิน LINE LIFF จริง — ว่างไว้ก็ใช้งานได้ปกติ แค่ `/api/auth/line` จะปฏิเสธ token เสมอ |

## 3) รันเว็บลูกค้า

```bash
cd nail-booking-customer
npm install                # ติดตั้ง @line/liff, socket.io-client ฯลฯ
cp .env.example .env.local
npm run dev
```

ใน `.env.local` ตั้ง `VITE_API_URL=http://localhost:4000` เสมอ ส่วน `VITE_LIFF_ID` ปล่อยว่างไว้ได้ถ้ายังไม่มี LINE Login Channel — แอปจะใช้โปรไฟล์ลูกค้าตัวอย่างแทน (โหมดสาธิต ใช้งานได้ครบทุกฟีเจอร์)

## 4) รันเว็บแอดมิน

```bash
cd nail-booking-frontend
npm install                # ติดตั้ง socket.io-client
cp .env.example .env.local
npm run dev
```

ใน `.env.local` ตั้ง `VITE_API_URL=http://localhost:4000`

## 5) ทดสอบวงจรจริง

1. เปิดเว็บลูกค้า → จองคิว (เลือกบริการ → ช่าง → วัน/เวลา → ยืนยัน) → สถานะเริ่มต้น "รอยืนยัน"
2. เปิดเว็บแอดมิน หน้า "การจอง" → เห็นรายการที่เพิ่งจอง **ขึ้นเองทันทีโดยไม่ต้องรีเฟรช** → กด **ยืนยัน / ยกเลิก / เสร็จสิ้น**
3. กลับไปเว็บลูกค้า หน้า "นัดของฉัน" → สถานะอัปเดตเองทันทีตามที่แอดมินดำเนินการ
4. ทดสอบกันคิวชน: เปิดเว็บลูกค้า 2 แท็บ เลือกช่าง/วัน/เวลาเดียวกันค้างไว้ทั้งสองแท็บ แล้วยืนยันแท็บแรกก่อน → แท็บที่สองจะเห็นช่องเวลานั้นเทาลงเอง (หรือถูกเคลียร์พร้อมข้อความแจ้ง) โดยไม่ต้องรีเฟรช
5. ทดสอบเรียลไทม์ฝั่งแคตตาล็อก: แก้ราคาบริการในหน้าแอดมิน → สลับไปดูเว็บลูกค้าที่เปิดค้างไว้ ราคาจะเปลี่ยนเองทันที

---

## API endpoints (สรุป)

| Method | Path | ใช้ทำอะไร |
|---|---|---|
| POST | `/api/auth/line` | ยืนยันตัวตนลูกค้าจาก LINE LIFF access token |
| GET | `/api/services`, `/api/staff`, `/api/shop-closures` | อ่านแคตตาล็อก |
| GET | `/api/availability?date=&serviceIds=&staffId=` | คำนวณเวลาที่ว่าง |
| GET | `/api/bookings?userId=` / `?scope=admin` | รายการจอง (ลูกค้า/แอดมิน) |
| POST | `/api/bookings` | สร้างการจอง (SQL transaction กันคิวชน) |
| PATCH | `/api/bookings/:id` | เปลี่ยนสถานะ (ยืนยัน/เสร็จสิ้น/ยกเลิก ฯลฯ) |
| POST | `/api/bookings/:id/cancel` | ลูกค้ายกเลิกเอง |
| POST/PATCH/DELETE | `/api/services`, `/api/staff`, `/api/shop-closures` | จัดการแคตตาล็อก (แอดมิน) |
| GET/PUT | `/api/settings` | การตั้งค่าร้าน |

**Socket.IO events** (push อัตโนมัติ ไม่ต้องเรียกเอง — ดูรายละเอียดใน `CHANGELOG_เรียลไทม์_2026-09-01.md`): `services:updated`, `staff:updated`, `closures:updated`, `settings:updated`, `bookings:admin:updated`, `bookings:mine:updated`, `availability:changed`

---

## ความปลอดภัย

- ไฟล์ `firebase/serviceAccountKey.json` เดิมถูกลบไปแล้วและไม่มีในโปรเจกต์นี้แล้ว (ระบบไม่ใช้ Firebase Admin SDK อีกต่อไป) — ไม่มีความเสี่ยงจุดนี้แล้ว
- รหัสผ่านฐานข้อมูล (`DB_PASSWORD`) และค่าใน `.env` ทุกไฟล์ **ห้าม commit ขึ้น git** (`.gitignore` กันไว้ให้แล้ว)
- เปลี่ยนรหัสผ่านแอดมินตัวอย่าง (`admin1234`) ก่อนใช้งานจริง
- ตอนนี้ Socket.IO และ CORS ของ REST API เปิดกว้าง (`origin: '*'`) เพื่อความง่ายตอนพัฒนา — ถ้า deploy frontend/backend คนละโดเมนกันจริง ควรจำกัด origin ให้แคบลง

---

## ทำงานจริงแล้ว vs ขั้นต่อไป

**ทำงานจริงแล้ว (เชื่อม MySQL + เรียลไทม์):**
- แคตตาล็อกบริการ/ช่าง/วันหยุด, การคำนวณเวลาว่าง, การสร้างการจอง (กันคิวชนด้วย SQL transaction), รายการจองของลูกค้า, การจัดการสถานะฝั่งแอดมิน, การตั้งค่าร้าน, แดชบอร์ด/กระดิ่งแจ้งเตือน
- **อัปเดตแบบเรียลไทม์ทั้งสองฝั่ง** ผ่าน Socket.IO — ไม่ต้องกดรีเฟรชอีกต่อไป
- ล็อกอินลูกค้าผ่าน LINE LIFF (`/api/auth/line`) — พร้อมใช้งานจริงเมื่อกรอก `VITE_LIFF_ID` และ `LINE_LOGIN_CHANNEL_ID`; ถ้ายังไม่กรอกจะ fallback เป็นโปรไฟล์ตัวอย่างอัตโนมัติ (โหมดสาธิต)

**ยังเป็นขั้นถัดไป:**
- Admin login (JWT) — ตอนนี้หน้าแอดมินยังไม่มีหน้าล็อกอินกั้น (schema มีคอลัมน์ password_hash เตรียมไว้แล้ว)
- แจ้งเตือน LINE OA (มี `backend/line_webhook.js` เป็นฐานอยู่แล้ว)
- ทดสอบ LIFF เส้นทางสำเร็จจริงกับ LINE Login Channel จริง (ตอนนี้ทดสอบได้แค่เส้นทาง error เพราะยังไม่มี channel จริง)
