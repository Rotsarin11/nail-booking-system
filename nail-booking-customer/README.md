# Take Care Nail — เว็บฝั่งลูกค้า (Customer LIFF App)

เว็บแอปฝั่ง **ผู้ใช้บริการ (ลูกค้า)** ของระบบจองคิวทำเล็บ Take Care Nail
คู่กับเว็บฝั่งแอดมิน (`../nail-booking-frontend`) — ใช้ธีม rose-gold เดียวกัน
ออกแบบเป็น **mobile-first** สำหรับเปิดผ่าน LINE LIFF (auto-login)

## รันโปรเจกต์
```bash
npm install
npm run dev      # เปิด http://localhost:5174
npm run build    # สร้างไฟล์ production ที่ dist/
```

## หน้าจอ
| เส้นทาง | หน้า | รายละเอียด |
|---|---|---|
| `/` | หน้าแรก | ทักทาย, ปุ่มจองคิว, นัดถัดไป, บริการยอดนิยม, ช่าง, ข้อมูลร้าน |
| `/services` | บริการทั้งหมด | กรองตามหมวด + เริ่มจองจากบริการ |
| `/book` → `/book/staff` → `/book/datetime` → `/book/confirm` | จองคิว 4 ขั้น | เลือกบริการ → เลือกช่าง → เลือกวัน/เวลา → ยืนยัน |
| `/booking-success/:id` | สำเร็จ | สรุปคำขอจอง (สถานะ "รอยืนยัน") |
| `/my-bookings` | นัดของฉัน | แท็บ กำลังจะถึง / ประวัติ |
| `/my-bookings/:id` | รายละเอียดนัด | ดูข้อมูล + ยกเลิกนัด |
| `/profile` | โปรไฟล์ | ข้อมูลลูกค้า, สถิติ, แก้เบอร์โทร |

## จุดสำคัญของโค้ด
- **`src/lib/slots.js`** — อัลกอริทึมคำนวณช่วงเวลาที่จองได้ (ตัดคิวชน + วันหยุด/วันลา + เวลาทำการช่าง + กันเวลาที่ผ่านไปแล้ว) ทั้งแบบระบุช่างและ "ไม่ระบุช่าง" (จัดช่างว่างอัตโนมัติ)
- **`src/context/BookingContext.jsx`** — state ของ draft การจอง + รายการนัดของลูกค้า (เพิ่ม/ยกเลิกได้)
- **`src/data/mockData.js`** — ข้อมูลจำลองรูปแบบตรงกับ Firestore schema (`firebase/firestore_data_model.md`) เปลี่ยนเป็น query จริงภายหลังได้เลย

## เชื่อมของจริงภายหลัง
1. เพิ่ม `@line/liff`, เรียก `liff.init()` แล้วส่ง access token ไป `POST /api/auth/line` (ดู `firebase/liff_auth_flow.md`)
2. แทน array ใน `mockData.js` ด้วยการดึงจาก Firestore / REST API — โครงข้อมูลเหมือนกันอยู่แล้ว
3. `confirmBooking()` เปลี่ยนจากเพิ่มใน state เป็นเรียก API สร้าง booking จริง
