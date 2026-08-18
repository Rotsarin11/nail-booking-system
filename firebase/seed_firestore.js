/**
 * Seed data สำหรับ Cloud Firestore (เวอร์ชันแก้ปัญหาโปรเจกต์ ID อัตโนมัติ)
 * ระบบจองคิวและจัดการให้บริการทำเล็บออนไลน์ (กรณีศึกษา Take Care Nail)
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

// เริ่มต้นระบบโดยดึงข้อมูล Project ID จากไฟล์คีย์ลับโดยตรง เพื่อไม่ให้พิมพ์ผิดพลาดย้อนหลัง
initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id, // 🌟 ดึงค่าอัตโนมัติจากไฟล์ json 
  databaseId: "(default)"
});

const db = getFirestore();
const now = FieldValue.serverTimestamp();

async function seed() {
  const batch = db.batch();

  // ---- users (แอดมิน 1 + ลูกค้า 1) ----
  const adminRef = db.collection('users').doc('user_admin');
  batch.set(adminRef, {
    role: 'admin', fullName: 'ผู้ดูแลร้าน Take Care Nail', phone: '0800000000',
    lineUserId: null, username: 'admin',
    passwordHash: '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH', createdAt: now,
  });
  const custRef = db.collection('users').doc('user_002');
  batch.set(custRef, {
    role: 'customer', fullName: 'ลูกค้าทดสอบ', phone: '0811111111',
    lineUserId: 'Uxxxxxxxxxxxxxxxx', username: null, passwordHash: null, createdAt: now,
  });

  // ---- services ----
  const services = [
    ['svc_gel',     'ทาสีเจล',            'พื้นฐาน', 'ทาสีเจลมือ',              60,  10, 300],
    ['svc_extgel',  'ต่อเล็บเจล',          'ต่อเล็บ', 'ต่อเล็บเจลพร้อมตะไบทรง',   120, 15, 700],
    ['svc_pvc',     'ต่อเล็บ PVC',         'ต่อเล็บ', 'ต่อเล็บ PVC',             90,  15, 500],
    ['svc_paint',   'เพ้นท์ลวดลาย',        'ตกแต่ง',  'เพ้นท์ลาย/ติดอะไหล่',      45,  10, 200],
    ['svc_remove',  'ล้างสีเจล/ถอดเล็บ',   'ล้าง-ถอด','ล้างสีเจลหรือถอดเล็บเดิม', 30,  10, 150],
    ['svc_spa',     'สปามือ',             'บำรุง',   'สปาบำรุงมือ',             45,  10, 250],
  ];
  for (const [id, name, category, description, durationMin, bufferMin, price] of services) {
    batch.set(db.collection('services').doc(id), {
      name, category, description, durationMin, bufferMin, price, isActive: true, createdAt: now,
    });
  }

  // ---- staff ----
  const weekMonSat = { start: '10:00', end: '19:00' };
  const sched = { '1': weekMonSat, '2': weekMonSat, '3': weekMonSat,
                  '4': weekMonSat, '5': weekMonSat, '6': weekMonSat };
  batch.set(db.collection('staff').doc('staff_001'), {
    fullName: 'ช่างเอ', nickname: 'เอ', phone: '0820000001', specialty: 'ต่อเล็บ, เพ้นท์เล็บ',
    status: 'active', serviceIds: ['svc_gel', 'svc_extgel', 'svc_pvc', 'svc_paint'],
    schedule: sched, createdAt: now,
  });
  batch.set(db.collection('staff').doc('staff_002'), {
    fullName: 'ช่างบี', nickname: 'บี', phone: '0820000002', specialty: 'ทำเล็บพื้นฐาน, สปา',
    status: 'active', serviceIds: ['svc_gel', 'svc_remove', 'svc_spa'],
    schedule: sched, createdAt: now,
  });

  // ---- booking ตัวอย่าง ----
  const bkRef = db.collection('bookings').doc('booking_001');
  batch.set(bkRef, {
    userId: 'user_002', userName: 'ลูกค้าทดสอบ',
    staffId: 'staff_001', staffName: 'ช่างเอ',
    bookingDate: '2026-08-01', startTime: '13:00', endTime: '16:10',
    status: 'confirmed', note: 'ขอโทนสีชมพู', totalPrice: 900,
    items: [
      { serviceId: 'svc_extgel', name: 'ต่อเล็บเจล',   priceSnapshot: 700, durationSnapshot: 120 },
      { serviceId: 'svc_paint',  name: 'เพ้นท์ลวดลาย', priceSnapshot: 200, durationSnapshot: 45 },
    ],
    result: null, createdAt: now,
  });

  // ---- notifications ----
  batch.set(db.collection('notifications').doc(), {
    bookingId: 'booking_001', type: 'confirm',
    message: 'ยืนยันการจอง 1 ส.ค. 2026 เวลา 13:00 น. กับช่างเอ',
    channel: 'LINE', scheduledAt: new Date('2026-07-25T12:00:00Z'), sentAt: null, status: 'pending',
  });
  batch.set(db.collection('notifications').doc(), {
    bookingId: 'booking_001', type: 'reminder',
    message: 'พรุ่งนี้มีนัดทำเล็บ 13:00 น. ที่ Take Care Nail',
    channel: 'LINE', scheduledAt: new Date('2026-07-31T20:00:00Z'), sentAt: null, status: 'pending',
  });

  // ---- shopClosures ----
  batch.set(db.collection('shopClosures').doc(), {
    closureDate: '2026-08-12', staffId: null, reason: 'วันแม่แห่งชาติ',
  });

  await batch.commit();
  console.log('✅ Seed สำเร็จ: users, services, staff, bookings, notifications, shopClosures');
}

seed().catch((e) => { console.error('❌ Seed ล้มเหลว:', e); process.exit(1); });
