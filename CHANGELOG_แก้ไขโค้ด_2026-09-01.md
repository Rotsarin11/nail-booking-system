# สรุปการแก้ไขโค้ด nail-booking-system — 1 กันยายน 2569

เอกสารนี้สรุปการแก้ไขทั้งหมดที่ทำในเซสชันนี้ ตามที่ตกลงกันไว้ 5 เรื่อง: (1) ตรวจโค้ดทั้งหมด (2) เก็บกวาดไฟล์ขยะ (3) ทำหน้าจองลูกค้า (LIFF) ให้ครบ (4) เชื่อมข้อมูลบริการให้ตรงกันทุกที่ (5) เปลี่ยนฐานข้อมูลกลับไปใช้ MySQL/MariaDB

ทุกไฟล์ที่ถูกแทนที่มีการสำรองไว้ที่ `backend/api/_firestore_backup/` (ชื่อไฟล์ต่อท้ายด้วย `.bak` หรือระบุที่มา) ก่อนเขียนทับเสมอ ไม่มีไฟล์ต้นฉบับใดถูกลบทิ้งโดยไม่มีสำเนา

---

## 1) เปลี่ยนฐานข้อมูลกลับเป็น MySQL/MariaDB

โค้ดเดิม (`backend/api/server.js`, `backend/api/lib/firebase.js`) ใช้ Firebase Firestore ทั้งหมด ได้แปลงกลับมาใช้ MySQL/MariaDB ตาม schema ที่มีอยู่แล้ว (`schema/nail_booking_schema.sql`) โดย **ไม่เปลี่ยน endpoint หรือรูปแบบ JSON ที่ frontend เรียกใช้แม้แต่จุดเดียว** — ฝั่ง React ทั้งสองแอป (admin, customer) จึงไม่ต้องแก้โค้ดเพื่อรองรับการเปลี่ยนฐานข้อมูลนี้

ไฟล์ที่เพิ่ม/แก้ไข:
- `backend/api/lib/db.js` (ใหม่) — connection pool ผ่าน `mysql2/promise`
- `backend/api/lib/repo.js` (ใหม่) — เลเยอร์ repository ครบทุกตาราง แทนที่ฟังก์ชัน Firestore เดิมทั้งหมด
- `backend/api/server.js` — แก้ทุก endpoint ให้เรียก `repo` แทน Firestore SDK
- `backend/api/package.json` — เอา `firebase-admin` ออก ใส่ `mysql2`, `bcryptjs`, `cors`, `dotenv`, `express`
- `backend/api/.env.example` — เปลี่ยนเป็นตัวแปร `DB_HOST/PORT/USER/PASSWORD/NAME`
- `schema/nail_booking_schema.sql` + `schema_addendum_mysql_migration.sql` (addendum ใหม่) — เพิ่มตาราง `shop_settings` และคอลัมน์ยกเลิกการจอง (`cancel_reason`, `cancelled_by`, `cancelled_at`)
- แก้ hash รหัสผ่านตัวอย่างของ admin ใน schema จาก placeholder ที่ใช้งานไม่ได้ ให้เป็น bcrypt hash จริง (รหัสผ่านตัวอย่าง: `admin1234` — **ควรเปลี่ยนก่อนใช้งานจริง**)
- ไฟล์ต้นฉบับ Firestore ถูกย้ายไปสำรองที่ `backend/api/_firestore_backup/` (ไม่ได้ลบทิ้ง)

จุดที่ทดสอบแล้วจริงกับ MariaDB (ในเครื่องทดสอบของผม ก่อนส่งขึ้นเครื่องคุณ):
- ทุก endpoint อ่าน/เขียนข้อมูล (services, staff, closures, bookings, customers, settings)
- ระบบกันคิวชน (double-booking) ด้วย `SELECT ... FOR UPDATE` — ทดสอบยิงจองพร้อมกันแล้วกันซ้ำได้จริง
- การเปลี่ยนสถานะการจองและการยกเลิก (ต้องระบุเหตุผลเสมอ)
- ข้อความภาษาไทยใน `shop_settings.data` (JSON) — เก็บและอ่านออกมาถูกต้อง ไม่มีปัญหาตัวอักษรเพี้ยน

**หมายเหตุทางเทคนิคที่เจอ:** MariaDB ไม่รองรับ `CAST(x AS JSON)` เหมือน MySQL (ต่างจากเอกสารทั่วไปที่มักสมมติว่าเหมือนกัน) จึงต้องเก็บ JSON เป็น string ธรรมดาแทน — แก้ไว้ใน `repo.js` แล้ว

---

## 2) รวมข้อมูลบริการให้ตรงกันทุกที่ (ราคา/หมวดหมู่)

ก่อนแก้ไข ราคาและหมวดหมู่ของบริการไม่ตรงกันระหว่างไฟล์ต่าง ๆ เช่น "ทาสีเจล" schema บอก 300 บาท แต่ mock data ของแอดมินบอก 350 บาท เป็นต้น ได้ยึด **`schema/nail_booking_schema.sql` เป็นแหล่งความจริงเดียว (single source of truth)** แล้วแก้ให้ตรงกันทุกจุด:

- `nail-booking-frontend/src/data/mockData.js` (แอดมิน) — แก้ราคา/หมวดหมู่ให้ตรง schema และเปลี่ยนให้ `totalPrice` ของการจองคำนวณจากราคาบริการจริงแทนการพิมพ์ตัวเลขเอง (กันราคาหลุดไม่ตรงกันในอนาคต)
- `nail-booking-customer/src/data/mockData.js` (ลูกค้า) — แก้ราคา/หมวดหมู่ให้ตรง schema เช่นกัน
- `backend/line_webhook.js` — เพิ่มบริการที่ขาดหายไปในข้อความแสดงรายการบริการของ LINE bot ("ล้างสีเจล/ถอดเล็บ — 150 บาท")

---

## 3) เก็บกวาดไฟล์ขยะ

- ลบไฟล์ขยะ `vite.config.js.timestamp-*.mjs` ที่ค้างอยู่ 32 ไฟล์ (เกิดจาก Vite dev server ที่ไม่ได้ปิดอย่างถูกต้อง)
- ยืนยันแล้วว่าไฟล์ `serviceAccountKey.json` ที่เคยหลุดออกมา (ปัญหาที่พบในรีวิวโค้ดฉบับ 11 ส.ค.) ถูกลบไปแล้วจริงและไม่มีอยู่ใน git history

---

## 4) หน้าจองลูกค้า (LIFF) — เพิ่มระบบล็อกอินอัตโนมัติผ่าน LINE

หน้าจองของลูกค้า (booking flow: เลือกบริการ → เลือกช่าง → เลือกวัน-เวลา → ยืนยัน) **มีอยู่แล้วครบ** ในโค้ดจริง (ต่างจากที่เอกสารรีวิวเก่าฉบับ 11 ส.ค. เข้าใจผิดว่ายังไม่มี) สิ่งที่ขาดจริงคือ **การยืนยันตัวตนลูกค้าจาก LINE** — เดิมใช้ mock profile คงที่ตัวเดียวเสมอ

ได้เพิ่มระบบ LIFF auto-login ตามที่ออกแบบไว้แล้วใน `firebase/liff_auth_flow.md` (ปรับจาก Firestore+JWT ให้ใช้ backend MySQL แทน) โดยยึดหลักความปลอดภัยเดิมที่เอกสารนั้นเน้นไว้: **ห้ามเชื่อ lineUserId ที่ส่งจาก client ตรง ๆ (ปลอมได้)** — ต้อง verify access token กับเซิร์ฟเวอร์ LINE ก่อนเสมอ

ไฟล์ที่เพิ่ม/แก้ไข:
- `backend/api/server.js` — เพิ่ม `POST /api/auth/line` รับ LIFF access token, ตรวจสอบกับ `https://api.line.me/oauth2/v2.1/verify` (เช็ค `client_id` ตรงกับ channel ของร้าน), ดึงโปรไฟล์จาก `https://api.line.me/v2/profile`, แล้ว upsert ลงตาราง `users` (role=customer) — ใช้ฟังก์ชัน upsert เดิมที่ endpoint จองอยู่แล้วใช้ ทำให้ลูกค้าคนเดิมกลับมาใช้ user_id เดิมเสมอ
- `nail-booking-customer/src/lib/liffAuth.js` (ใหม่) — ฟังก์ชัน `initLiffCustomer()`: ถ้าไม่ได้ตั้งค่า `VITE_LIFF_ID` จะข้ามไปใช้ mock profile ทันที (โหมด demo/ทดสอบไม่กระทบ) ถ้าตั้งค่าไว้จะเรียก LINE LIFF SDK จริง และล้มแล้ว fallback กลับ mock เสมอ ไม่มีทางทำให้หน้าเว็บพังจากปัญหา LINE
- `nail-booking-customer/src/lib/dataSource.js` — แก้จุดบกพร่องเชิงสถาปัตยกรรม: เดิม `currentUser` เป็น `const` ตายตัว ทำให้ต่อให้ล็อกอิน LINE สำเร็จ การจอง/ยกเลิกก็ยังส่ง user เดิมอยู่ดี แก้เป็น `let` พร้อมฟังก์ชัน `setCurrentUser()` ให้ตัวตนจริงจาก LINE ไหลไปถึงทุกจุดที่เรียก API
- `nail-booking-customer/src/context/BookingContext.jsx` — เรียก `initLiffCustomer()` ก่อนโหลด catalog ตอนเปิดแอป
- `nail-booking-customer/package.json` — เพิ่ม `@line/liff`
- `nail-booking-customer/.env.example` — เพิ่ม `VITE_LIFF_ID=` (เว้นว่างไว้ = โหมด demo)
- `backend/api/.env.example` — เพิ่ม `LINE_LOGIN_CHANNEL_ID=`

**ทดสอบแล้ว:** syntax ของทุกไฟล์ (`node --check`, esbuild parse สำหรับ JSX), เส้นทาง error ของ `/api/auth/line` (ไม่มี token → 401, token ปลอม/ไม่ได้ตั้งค่า channel → 401 โดยไม่ crash) **ยังไม่ได้ทดสอบเส้นทางสำเร็จจริง** เพราะต้องมี LIFF ID และ LINE Login Channel จริงของร้าน — เป็นสิ่งที่คุณต้องไปสมัครและตั้งค่าเอง (ดูขั้นตอนด้านล่าง)

---

## สิ่งที่คุณต้องทำต่อเอง

1. **ตั้งค่าฐานข้อมูล**: import `schema/nail_booking_schema.sql` แล้วตามด้วย `schema_addendum_mysql_migration.sql` เข้า MySQL/MariaDB ของคุณ (ใช้ `mysql --default-character-set=utf8mb4` เพื่อกันปัญหาภาษาไทยเพี้ยน) แล้วกรอกค่าใน `backend/api/.env` ตาม `.env.example`
2. **รัน `npm install` ในโฟลเดอร์ `backend/api` และ `nail-booking-customer`** — ผมเริ่มรันให้ในเครื่องคุณแล้วบางส่วน (ติดตั้ง `@line/liff` สำเร็จ) แต่การติดตั้งผ่าน remote bridge บนโฟลเดอร์ Windows ช้ามาก (ทำงานเกิน 3 นาทีไม่เสร็จ) แนะนำให้รันคำสั่งนี้เองในเครื่องโดยตรงเพื่อความชัวร์
3. **ถ้าจะเปิดใช้ LIFF จริง**: ไปที่ LINE Developers Console → สร้าง/ใช้ LINE Login Channel → เปิดแท็บ LIFF → คัดลอก LIFF ID ใส่ `VITE_LIFF_ID` ในไฟล์ `.env` ของ `nail-booking-customer` และคัดลอก Channel ID ใส่ `LINE_LOGIN_CHANNEL_ID` ใน `.env` ของ `backend/api`
4. **เปลี่ยนรหัสผ่าน admin ตัวอย่าง** (`admin1234`) ก่อนใช้งานจริง
5. รัน `npm run build` ในทั้งสองแอป React เพื่อยืนยันว่า build ผ่านในเครื่องคุณเอง (ผมตรวจ syntax ให้ครบแล้วแต่ยังไม่ได้ build จริงเพราะ `npm install` ยังไม่เสร็จสมบูรณ์บนเครื่องคุณ)

ไฟล์สำรองทั้งหมดของโค้ดเวอร์ชันก่อนแก้ไข อยู่ที่ `backend/api/_firestore_backup/` หากต้องการย้อนกลับจุดใดจุดหนึ่งสามารถดูได้จากโฟลเดอร์นี้
