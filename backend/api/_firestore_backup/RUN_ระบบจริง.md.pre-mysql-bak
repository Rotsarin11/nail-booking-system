# เชื่อมระบบให้ทำงานจริง — คู่มือรัน (วงจรการจอง)

เอกสารนี้อธิบายวิธีรัน "วงจรการจองหลัก" แบบเชื่อมข้อมูลจริง: ลูกค้าจอง → บันทึกลง Firestore ผ่าน backend (กันคิวชนด้วย transaction) → เจ้าของร้านเห็นและกดยืนยัน/ยกเลิก/เสร็จสิ้นได้

## สถาปัตยกรรม

```
เว็บลูกค้า (React/Vite)  ─┐
                          ├─► Backend API (Express)  ─►  Cloud Firestore (online-naile-service)
เว็บแอดมิน (React/Vite) ─┘        └ กันคิวชนด้วย runTransaction
```

- **ทำไมต้องมี backend:** การกัน "คิวชน" ต้องอ่าน-ตรวจ-เขียนแบบอะตอมมิกด้วย Firestore `runTransaction` ฝั่งเซิร์ฟเวอร์ ทำจาก client ล้วน + security rules ไม่ปลอดภัย (ลูกค้าสองคนอาจอ่านว่า "ว่าง" พร้อมกันแล้วจองทับ)
- ทั้งสองเว็บมี **fallback เป็น mock data** อัตโนมัติเมื่อไม่ได้ตั้ง `VITE_API_URL` จึงยังเปิดดู UI ได้โดยไม่ต้องรัน backend

## สิ่งที่ต้องมี
- Node.js 18+
- ไฟล์ service account ของโปรเจกต์ Firebase อยู่ที่ `firebase/serviceAccountKey.json` (มีอยู่แล้ว)

---

## 1) เตรียม Firestore (ครั้งแรกครั้งเดียว)
ใส่ข้อมูลตัวอย่าง (services, staff, ฯลฯ) ลงฐานข้อมูลจริง:
```bash
cd firebase
npm install
node seed_firestore.js
```
> Deploy security rules ด้วย (ถ้าใช้ Firebase CLI): `firebase deploy --only firestore:rules`

## 2) รัน Backend API
```bash
cd backend/api
npm install
cp .env.example .env      # แก้ค่าได้ถ้าต้องการ (PORT ค่าเริ่มต้น 4000)
npm run start             # หรือ npm run dev (auto-reload)
```
ทดสอบว่าเชื่อม Firestore ได้:
```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/services
```

## 3) รันเว็บลูกค้า
```bash
cd nail-booking-customer
npm install
echo "VITE_API_URL=http://localhost:4000" > .env.local
npm run dev
```

## 4) รันเว็บแอดมิน
```bash
cd nail-booking-frontend
npm install
echo "VITE_API_URL=http://localhost:4000" > .env.local
npm run dev
```

## 5) ทดสอบวงจรจริง
1. เปิดเว็บลูกค้า → จองคิว (เลือกบริการ → ช่าง → วัน/เวลา → ยืนยัน) → สถานะเริ่มต้น "รอยืนยัน"
2. เปิดเว็บแอดมิน หน้า "การจอง" → เห็นรายการที่เพิ่งจอง → กด **ยืนยัน / ยกเลิก / เสร็จสิ้น**
3. กลับไปเว็บลูกค้า หน้า "นัดของฉัน" → สถานะอัปเดตตามที่แอดมินดำเนินการ
4. ทดสอบกันคิวชน: จองช่างคนเดิม เวลาเดิม ซ้ำ → ระบบจะปฏิเสธ ("ช่วงเวลานี้เพิ่งถูกจองไปแล้ว")

---

## API endpoints (สรุป)
| Method | Path | ใช้ทำอะไร |
|---|---|---|
| GET | `/api/services`, `/api/staff`, `/api/shop-closures` | อ่านแคตตาล็อก |
| GET | `/api/availability?date=&serviceIds=&staffId=` | คำนวณเวลาที่ว่าง |
| GET | `/api/bookings?userId=` / `?scope=admin` | รายการจอง (ลูกค้า/แอดมิน) |
| POST | `/api/bookings` | สร้างการจอง (transaction กันคิวชน) |
| PATCH | `/api/bookings/:id` | เปลี่ยนสถานะ (ยืนยัน/เสร็จสิ้น ฯลฯ) |
| POST | `/api/bookings/:id/cancel` | ยกเลิก |

---

## ⚠️ ความปลอดภัย — กุญแจ service account
`firebase/serviceAccountKey.json` เป็น **กุญแจลับระดับผู้ดูแล** (เขียน/ลบ Firestore ได้ทั้งหมด)

**สถานะจริงในโปรเจกต์นี้:** ตรวจแล้วพบว่าไฟล์นี้ **ยังไม่ได้ถูก commit** — โฟลเดอร์ `firebase/` และ root ไม่ได้อยู่ใน git repo ใดเลย (มีเพียง `backend/` ที่เป็น repo และมันไม่ track `.env` อยู่แล้ว) จึงยังไม่มีการรั่วในเวิร์กสเปซนี้

**ป้องกันไว้แล้ว:** เพิ่ม `.gitignore` ที่ root + ที่ `firebase/` ให้ ignore คีย์นี้และ `.env` ทุกที่ ดังนั้นถ้าจะ `git init` ที่ root แล้ว commit ครั้งแรก ไฟล์ลับจะไม่ถูกใส่เข้าไป

**ถ้าคุณเคย push โปรเจกต์นี้ขึ้น remote (เช่น GitHub) มาก่อน** ให้ถือว่าคีย์หลุดแล้ว และทำ 3 ขั้น:
1. ลบออกจากการ track + คอมมิตการลบ:
   ```bash
   git rm --cached firebase/serviceAccountKey.json
   git commit -m "chore: stop tracking service account key"
   ```
2. ลบออกจาก **ประวัติทั้งหมด** (ไม่งั้นยังดึงจาก history เก่าได้) ด้วย `git filter-repo` หรือ BFG:
   ```bash
   git filter-repo --path firebase/serviceAccountKey.json --invert-paths
   git push --force
   ```
3. **หมุนคีย์ใหม่ (rotate)** ที่ Firebase Console → Project settings → Service accounts → Generate new private key แล้วลบคีย์เก่าทิ้ง (ต้องทำเสมอเมื่อสงสัยว่าหลุด)

**บนเซิร์ฟเวอร์จริง** อย่าวางคีย์ไว้ใน repo — ตั้ง env ชี้ไปไฟล์ภายนอกแทน (backend รองรับอยู่แล้ว):
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/serviceAccountKey.json
```

---

## ทำงานจริงแล้ว vs ขั้นต่อไป
**ทำงานจริงแล้ว (เชื่อม Firestore):**
- แคตตาล็อกบริการ/ช่าง, การคำนวณเวลาว่าง, การสร้างการจอง (กันคิวชน), รายการจองของลูกค้า, การจัดการสถานะฝั่งแอดมิน (ยืนยัน/ยกเลิก/เสร็จสิ้น), แดชบอร์ดนับคิว/สถานะวันนี้

**ยังเป็น mock / เป็นขั้นถัดไป:**
- ล็อกอิน: LINE LIFF auto-login (ลูกค้า) + admin login (JWT) — ตอนนี้ใช้ผู้ใช้ตัวอย่าง
- แจ้งเตือน LINE OA (มี `backend/line_webhook.js` เป็นฐานอยู่แล้ว)
- หน้าแอดมินอื่น (ช่าง/บริการ/ลูกค้า/วันหยุด/ตั้งค่า) ยังอ่านจาก mock — ต่อ API ได้ด้วยรูปแบบเดียวกับหน้า "การจอง"
- กราฟรายได้ 7 วัน/บริการยอดนิยม ยังใช้ mock
