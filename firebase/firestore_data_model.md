# โครงสร้างข้อมูล Firestore — ฉบับออกแบบสำหรับบทที่ 3
**ระบบจองคิวและจัดการให้บริการทำเล็บออนไลน์ (Firebase / Cloud Firestore)**

สถาปัตยกรรม: **Firestore** (ฐานข้อมูล NoSQL) + **Firebase Hosting** (เว็บแอดมิน + หน้า LIFF)
Backend: Node.js + Express (webhook LINE, อัลกอริทึม slot, JWT) ต่อ Firestore ผ่าน Admin SDK
Role ที่ล็อกอิน = 2 : admin (ผู้ดูแลร้าน), customer (ลูกค้า) · ช่างเป็น "ข้อมูล" ที่แอดมินจัดการ

> Firestore เป็น NoSQL แบบ document ไม่มี foreign key / join / ตาราง — ใช้หลักคิดต่างจาก relational:
> - ข้อมูลที่ **อ่านคู่กันเสมอ + เล็ก + ไม่โต** → ฝัง (embed) ไว้ในเอกสารเดียว
> - ข้อมูลที่ **โตไม่จำกัด หรือถูกค้นแยก** → แยกเป็น collection แล้วอ้างด้วย id (reference)

---

## ภาพรวม 6 Collection
| Collection | เก็บอะไร | ฝังอะไรไว้ข้างใน |
|---|---|---|
| `users` | บัญชีล็อกอิน (admin, customer) | - |
| `staff` | ช่างทำเล็บ (resource) | `serviceIds[]` (ทำบริการอะไรได้), `schedule{}` (เวลาทำงานรายวัน) |
| `services` | รายการบริการ + ราคา/เวลา | - |
| `bookings` | การจอง 1 นัด | `items[]` (บริการหลายรายการ + snapshot), `result{}` (ผลบริการ) |
| `shopClosures` | วันหยุด/วันลาช่าง | - |
| `notifications` | คิวการแจ้งเตือน (ให้ cron ดึงไปส่ง) | - |

**หลักการฝัง:** `staff_service` และ `staff_schedule` (relational เดิม) → ฝังใน `staff`; `booking_items` และ `service_results` → ฝังใน `bookings` เพราะอ่านคู่กับการจองเสมอและไม่โตเกินขนาด document (1 MB)

---

## 1) Collection: `users`
docId = **lineUserId สำหรับลูกค้า** (สร้างอัตโนมัติเมื่อเปิด LIFF ครั้งแรก — ไม่มีหน้าสมัคร/ล็อกอิน) · แอดมินใช้ docId แยก
> ลูกค้าเข้าสู่ระบบอัตโนมัติผ่าน LINE (LIFF Auto-Login) — ดู `liff_auth_flow.md`
```json
{
  "role": "customer",            // "admin" | "customer"
  "fullName": "ลูกค้าทดสอบ",
  "phone": "0811111111",
  "lineUserId": "Uxxxxxxxx",      // ลูกค้า (null สำหรับแอดมิน)
  "username": null,               // แอดมิน
  "passwordHash": null,           // แอดมิน (เก็บ hash เท่านั้น)
  "createdAt": "2026-08-01T10:00:00Z"
}
```

## 2) Collection: `staff`  (ช่าง — ฝัง staff_service + staff_schedule)
```json
{
  "fullName": "ช่างเอ",
  "nickname": "เอ",
  "phone": "0820000000",
  "specialty": "ต่อเล็บ, เพ้นท์เล็บ",
  "status": "active",             // "active" | "inactive"
  "serviceIds": ["svc_gel", "svc_extgel", "svc_paint"],   // ทำบริการอะไรได้ (แทน staff_service M:N)
  "schedule": {                   // เวลาทำงานรายวัน 0=อา..6=ส (แทน staff_schedule)
    "1": { "start": "10:00", "end": "19:00" },
    "2": { "start": "10:00", "end": "19:00" }
  },
  "createdAt": "2026-08-01T09:00:00Z"
}
```

## 3) Collection: `services`
```json
{
  "name": "ต่อเล็บเจล",
  "category": "ต่อเล็บ",
  "description": "ต่อเล็บเจลพร้อมตะไบทรง",
  "durationMin": 120,             // ระยะเวลาให้บริการ (นาที)
  "bufferMin": 15,                // เวลากันชนหลังบริการ (นาที)
  "price": 700.00,
  "isActive": true,
  "createdAt": "2026-08-01T09:00:00Z"
}
```

## 4) Collection: `bookings`  (หัวใจของระบบ — ฝัง items[] + result{})
```json
{
  "userId": "user_002",
  "userName": "ลูกค้าทดสอบ",       // denormalize ไว้แสดงผลเร็ว
  "staffId": "staff_001",
  "staffName": "ช่างเอ",
  "bookingDate": "2026-08-01",     // string YYYY-MM-DD (ใช้ == ในคิวรี่)
  "startTime": "13:00",
  "endTime": "16:10",              // คำนวณจาก Σ(durationSnapshot)+buffer -> ตรวจคิวชนได้
  "status": "confirmed",           // pending|confirmed|completed|cancelled|no_show
  "note": "ขอโทนสีชมพู",
  "totalPrice": 900.00,
  "items": [                       // แทน booking_items (M:N) + snapshot ในตัว
    { "serviceId": "svc_extgel", "name": "ต่อเล็บเจล", "priceSnapshot": 700.00, "durationSnapshot": 120 },
    { "serviceId": "svc_paint",  "name": "เพ้นท์ลวดลาย", "priceSnapshot": 200.00, "durationSnapshot": 45 }
  ],
  "result": null,                  // เติมหลังบริการเสร็จ (แทน service_results)
  "createdAt": "2026-07-25T11:30:00Z"
}
```
เมื่อบริการเสร็จ อัปเดตฟิลด์ `result`:
```json
"result": {
  "detail": "งานเรียบร้อย ลูกค้าพอใจ",
  "status": "done",               // done|partial|cancelled
  "completedAt": "2026-08-01T16:05:00Z",
  "note": ""
}
```

## 5) Collection: `shopClosures`
```json
{
  "closureDate": "2026-08-12",
  "staffId": null,                 // null = ปิดทั้งร้าน / มี id = ช่างคนนั้นลา
  "reason": "วันแม่แห่งชาติ"
}
```

## 6) Collection: `notifications`  (top-level เพื่อให้ cron ดึง "ที่ถึงกำหนดส่ง")
```json
{
  "bookingId": "booking_001",
  "type": "reminder",              // confirm|reminder|change|cancel
  "message": "พรุ่งนี้มีนัดทำเล็บ 13:00 น. ที่ Take Care Nail",
  "channel": "LINE",
  "scheduledAt": "2026-07-31T20:00:00Z",
  "sentAt": null,                  // null = ยังไม่ส่ง
  "status": "pending"              // pending|sent|failed
}
```

---

## การแปลงจาก 10 ตาราง (SQL) → 6 collection (Firestore)
| relational เดิม | Firestore |
|---|---|
| users | collection `users` |
| staff | collection `staff` |
| services | collection `services` |
| **staff_service** (M:N) | ฝังเป็น array `staff.serviceIds[]` |
| **staff_schedule** | ฝังเป็น map `staff.schedule{}` |
| shop_closure | collection `shopClosures` |
| bookings | collection `bookings` |
| **booking_items** (M:N) | ฝังเป็น array `bookings.items[]` (+snapshot) |
| **service_results** (1:1) | ฝังเป็น map `bookings.result{}` |
| notifications | collection `notifications` |

---

## ⚠️ ประเด็นเทคนิคสำคัญ (เขียนลงบท 3 เพื่อยกระดับตอน present)

### อัลกอริทึมคำนวณช่วงเวลาว่าง (slot)
1. รวม `durationMin + bufferMin` ของทุกบริการที่เลือก → `requiredMinutes`
2. หาช่างที่ทำ**ครบทุกบริการ**: query `staff` where `serviceIds array-contains-any` แล้วกรองในโค้ดให้ครบทุกตัว
3. อ่าน `staff.schedule[dayOfWeek]` ของวันนั้น แล้วตัดวันปิด/วันลาจาก `shopClosures`
4. query `bookings` where `staffId ==` และ `bookingDate ==` และ `status in [pending,confirmed]` → ได้ช่วงที่ถูกจอง
5. หาช่องว่าง ≥ `requiredMinutes` แล้วคืน slot ทุก 30 นาที

### การป้องกันจองชนกัน (double booking) — ข้อจำกัดของ Firestore + ทางแก้
**ข้อจำกัด:** Firestore ใช้ inequality filter ได้ **แค่ฟิลด์เดียวต่อคิวรี่** ดังนั้นเงื่อนไข overlap
`startTime < newEnd AND endTime > newStart` (2 ฟิลด์) **ทำในคิวรี่เดียวไม่ได้**
**ทางแก้:** query ด้วย equality (staffId, bookingDate, status) แล้วเช็ค overlap ในโค้ด — ครอบด้วย **Firestore Transaction** เพื่อกัน race condition ตอนลูกค้า 2 คนกดพร้อมกัน:
```js
await db.runTransaction(async (tx) => {
  const q = db.collection('bookings')
    .where('staffId', '==', staffId)
    .where('bookingDate', '==', date)
    .where('status', 'in', ['pending', 'confirmed']);
  const snap = await tx.get(q);
  const clash = snap.docs.some(d => {
    const b = d.data();
    return b.startTime < newEnd && b.endTime > newStart;   // เช็ค overlap ในโค้ด
  });
  if (clash) throw new Error('SLOT_TAKEN');                // -> แจ้งลูกค้าว่าคิวเพิ่งถูกจอง
  tx.set(db.collection('bookings').doc(), newBooking);     // ไม่ชน -> เขียนใหม่ atomic
});
```
> จุดนี้แสดงว่าเข้าใจข้อจำกัด NoSQL และแก้ด้วย transaction ได้ — เป็นคำถามที่กรรมการถามบ่อย

### Composite Index ที่ต้องสร้าง
- `bookings`: (staffId ==, bookingDate ==, status in) → ต้องมี composite index
- `notifications`: (status ==, scheduledAt <=) สำหรับ cron ดึงที่ถึงกำหนด
