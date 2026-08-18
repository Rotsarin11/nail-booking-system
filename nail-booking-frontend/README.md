# Take Care Nail — Admin Dashboard

หน้าแดชบอร์ดผู้ดูแลร้าน (React + Vite + Tailwind CSS) สำหรับระบบจองคิวและจัดการให้บริการทำเล็บออนไลน์

## เริ่มใช้งาน

```bash
cd nail-booking-frontend
npm install
npm run dev        # เปิด dev server ที่ http://localhost:5173
```

## Build เพื่อ deploy ขึ้น Firebase Hosting

```bash
npm run build      # สร้างไฟล์ production ที่โฟลเดอร์ dist/
firebase deploy    # firebase.json ตั้งให้ serve จาก dist แล้ว
```

## โครงสร้างไฟล์

```
src/
├── main.jsx                      จุดเริ่ม + React Router
├── App.jsx                       เลย์เอาต์หลัก (sidebar + topbar + routes)
├── index.css                     Tailwind directives + สไตล์ทั่วไป
├── lib/status.js                 label/สี ของสถานะการจอง + ฟอร์แมตเงินบาท
├── data/mockData.js              ข้อมูลจำลอง (ตรงกับ schema Firestore 6 collection)
├── components/
│   ├── layout/Sidebar.jsx        เมนูด้านซ้าย
│   ├── layout/Topbar.jsx         แถบบน (ค้นหา, แจ้งเตือน)
│   └── dashboard/                การ์ดสถิติ, กราฟรายได้, โดนัทสถานะ, ตารางนัด, บริการยอดนิยม
└── pages/
    ├── Dashboard.jsx             หน้าแดชบอร์ด
    └── Placeholder.jsx           หน้าที่ยังไม่พัฒนา
```

## เชื่อมต่อ Firestore จริง (ขั้นต่อไป)

ตอนนี้ Dashboard อ่านจาก `src/data/mockData.js` — shape ของข้อมูลตรงกับ collection จริง
(`bookings`, `staff`, `services`, `users`) ให้เปลี่ยนไปดึงจาก Firestore ได้เลยโดยไม่ต้องแก้ UI:

1. `npm install firebase`
2. สร้าง `src/lib/firebase.js` ใส่ config โปรเจกต์ `online-naile-service`
3. แทนที่ import จาก `mockData` ด้วย query เช่น
   `getDocs(query(collection(db,'bookings'), where('bookingDate','==',TODAY)))`
