-- =====================================================================
--  ระบบจองคิวและจัดการให้บริการทำเล็บออนไลน์
--  Online Nail Service Appointment and Management System
--  Database Schema (MySQL 8 / MariaDB 10.4+)
--  ---------------------------------------------------------------------
--  หลักการออกแบบ:
--   - Role ที่ล็อกอิน = 2 : admin (ผู้ดูแลร้าน), customer (ลูกค้า)
--   - "ช่าง" เป็น resource ในฐานข้อมูล (ตาราง staff) ไม่ใช่ role ล็อกอิน
--     ผู้ดูแลร้านเป็นผู้จัดการช่างและมอบหมายคิว
--   - หนึ่งการจอง (booking) มีได้หลายบริการ  -> ตาราง booking_items (M:N)
--   - เก็บ price_snapshot / duration_snapshot กันราคาย้อนหลังเพี้ยน
--   - bookings เก็บทั้ง start_time และ end_time เพื่อตรวจคิวชนกันได้
--   - มี staff_service / staff_schedule / shop_closure รองรับอัลกอริทึม
--     คำนวณ slot ว่าง
--  Charset: utf8mb4 (รองรับภาษาไทย + emoji)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS service_results;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS booking_items;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS staff_service;
DROP TABLE IF EXISTS staff_schedule;
DROP TABLE IF EXISTS shop_closure;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1) users : บัญชีผู้ใช้ที่ล็อกอินเข้าระบบ (2 role เท่านั้น)
--    - customer : ยืนยันตัวตนผ่าน LINE (line_user_id)
--    - admin    : ล็อกอินเว็บด้วย username/password_hash
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    role           ENUM('admin','customer') NOT NULL,
    full_name      VARCHAR(100) NOT NULL,              -- ชื่อ/ชื่อเล่น
    phone          VARCHAR(15)  NULL,
    line_user_id   VARCHAR(50)  NULL,                  -- ใช้กับลูกค้าที่มาจาก LINE
    username       VARCHAR(50)  NULL,                  -- ใช้กับแอดมิน
    password_hash  VARCHAR(255) NULL,                  -- ใช้กับแอดมิน (เก็บ hash เท่านั้น)
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_line (line_user_id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2) staff : ช่างทำเล็บ (resource) — ไม่ล็อกอิน แอดมินเป็นผู้จัดการ
-- ---------------------------------------------------------------------
CREATE TABLE staff (
    staff_id     INT AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    nickname     VARCHAR(50)  NULL,
    phone        VARCHAR(15)  NULL,
    specialty    VARCHAR(255) NULL,                    -- ความเชี่ยวชาญ
    status       ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3) services : รายการบริการทำเล็บ (ราคา/ระยะเวลาปัจจุบัน)
--    buffer_min = เวลาทำความสะอาด/เตรียมงานหลังบริการ (ใช้คำนวณ end_time)
-- ---------------------------------------------------------------------
CREATE TABLE services (
    service_id    INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    category      VARCHAR(50)  NULL,
    description   VARCHAR(255) NULL,
    duration_min  INT NOT NULL,                        -- ระยะเวลาให้บริการ (นาที)
    buffer_min    INT NOT NULL DEFAULT 10,             -- เวลากันชนหลังบริการ (นาที)
    price         DECIMAL(10,2) NOT NULL,
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (duration_min > 0),
    CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4) staff_service : M:N — ช่างคนไหนทำบริการอะไรได้บ้าง
--    (จำเป็นสำหรับอัลกอริทึมหา slot: ดึงเฉพาะช่างที่ทำบริการชุดนี้ได้)
-- ---------------------------------------------------------------------
CREATE TABLE staff_service (
    staff_id    INT NOT NULL,
    service_id  INT NOT NULL,
    PRIMARY KEY (staff_id, service_id),
    FOREIGN KEY (staff_id)   REFERENCES staff(staff_id)     ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5) staff_schedule : เวลาทำงานปกติของช่างรายวันในสัปดาห์
--    day_of_week : 0=อาทิตย์ ... 6=เสาร์
-- ---------------------------------------------------------------------
CREATE TABLE staff_schedule (
    schedule_id  INT AUTO_INCREMENT PRIMARY KEY,
    staff_id     INT NOT NULL,
    day_of_week  TINYINT NOT NULL,                     -- 0-6
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    CHECK (day_of_week BETWEEN 0 AND 6),
    CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6) shop_closure : วันหยุด/วันปิด
--    staff_id NULL  = ปิดทั้งร้านวันนั้น
--    staff_id ระบุ  = ช่างคนนั้นลาวันนั้น
-- ---------------------------------------------------------------------
CREATE TABLE shop_closure (
    closure_id   INT AUTO_INCREMENT PRIMARY KEY,
    closure_date DATE NOT NULL,
    staff_id     INT NULL,
    reason       VARCHAR(255) NULL,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 7) bookings : หัวการจอง (1 นัด = 1 แถว) ผูกกับลูกค้า + ช่าง 1 คน
--    เก็บ start_time และ end_time -> ตรวจคิวชนกันได้
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,                        -- ลูกค้า (FK users)
    staff_id      INT NOT NULL,                        -- ช่างที่รับคิว (FK staff)
    booking_date  DATE NOT NULL,                       -- วันที่นัดหมาย
    start_time    TIME NOT NULL,                       -- เวลาเริ่ม
    end_time      TIME NOT NULL,                       -- เวลาจบ (คำนวณจาก Σduration+buffer)
    status        ENUM('pending','confirmed','completed','cancelled','no_show')
                   NOT NULL DEFAULT 'pending',
    note          VARCHAR(255) NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)  REFERENCES users(user_id),
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
    CHECK (end_time > start_time),
    -- index เร่งการค้นหาคิวชนกัน (staff + วัน)
    KEY idx_booking_overlap (staff_id, booking_date, start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 8) booking_items : รายการบริการในแต่ละการจอง (M:N booking<->service)
--    เก็บ snapshot ราคา/ระยะเวลา ณ วันจอง -> รายงานย้อนหลังไม่เพี้ยน
-- ---------------------------------------------------------------------
CREATE TABLE booking_items (
    item_id           INT AUTO_INCREMENT PRIMARY KEY,
    booking_id        INT NOT NULL,
    service_id        INT NOT NULL,
    price_snapshot    DECIMAL(10,2) NOT NULL,          -- ราคา ณ วันจอง
    duration_snapshot INT NOT NULL,                    -- ระยะเวลา ณ วันจอง (นาที)
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 9) notifications : การแจ้งเตือนที่ผูกกับการจอง
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    type            ENUM('confirm','reminder','change','cancel') NOT NULL,
    message         VARCHAR(255) NOT NULL,
    channel         VARCHAR(20) NOT NULL DEFAULT 'LINE',
    scheduled_at    DATETIME NOT NULL,                 -- กำหนดเวลาที่จะส่ง
    sent_at         DATETIME NULL,                     -- เวลาที่ส่งจริง (NULL=ยังไม่ส่ง)
    status          ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 10) service_results : ผลการให้บริการ (บันทึกหลังบริการเสร็จ) 1:1 กับ booking
--     total_price = ยอดรวม snapshot ของนัดนั้น (บันทึกไว้เพื่อรายงานรายได้)
-- ---------------------------------------------------------------------
CREATE TABLE service_results (
    result_id       INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    result_detail   VARCHAR(255) NULL,                 -- รายละเอียดผลงาน
    status          ENUM('done','partial','cancelled') NOT NULL DEFAULT 'done',
    completed_date  DATE NULL,
    completed_time  TIME NULL,
    total_price     DECIMAL(10,2) NULL,
    note            VARCHAR(255) NULL,
    UNIQUE KEY uq_result_booking (booking_id),         -- 1 การจอง = 1 ผลบริการ
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  ข้อมูลตัวอย่าง (SEED) — อ้างอิงบริการจากร้าน Take Care Nail (บทที่ 2)
--  *** ราคา/ระยะเวลาเป็นค่าตัวอย่าง ให้แก้เป็นค่าจริงของร้านก่อนใช้งาน ***
-- =====================================================================

-- แอดมิน 1 คน + ลูกค้าตัวอย่าง
INSERT INTO users (role, full_name, phone, line_user_id, username, password_hash) VALUES
-- รหัสผ่านตัวอย่าง: admin1234 (hash จริงด้วย bcrypt cost 10 — เปลี่ยนก่อนใช้งานจริง)
('admin',    'ผู้ดูแลร้าน Take Care Nail', '0800000000', NULL, 'admin', '$2b$10$ZfXeYQ7XDJ786kxlqrIiKe7TIm4xZUsSs/QS5BZCodEQSVw8LfX2K'),
('customer', 'ลูกค้าทดสอบ',               '0811111111', 'Uxxxxxxxxxxxxxxxx', NULL, NULL);

-- ช่าง 2 คน
INSERT INTO staff (full_name, nickname, specialty, status) VALUES
('ช่างเอ', 'เอ', 'ต่อเล็บ, เพ้นท์เล็บ', 'active'),
('ช่างบี', 'บี', 'ทำเล็บพื้นฐาน, สปามือเท้า', 'active');

-- บริการ (ตัวอย่าง — อิงหมวดจาก 2.2 ของบทที่ 2)
INSERT INTO services (name, category, description, duration_min, buffer_min, price) VALUES
('ทาสีเจล',            'พื้นฐาน',      'ทาสีเจลมือ',              60,  10, 300.00),
('ต่อเล็บเจล',          'ต่อเล็บ',      'ต่อเล็บเจลพร้อมตะไบทรง',   120, 15, 700.00),
('ต่อเล็บ PVC',         'ต่อเล็บ',      'ต่อเล็บ PVC',             90,  15, 500.00),
('เพ้นท์ลวดลาย',        'ตกแต่ง',       'เพ้นท์ลาย/ติดอะไหล่',      45,  10, 200.00),
('ล้างสีเจล/ถอดเล็บ',   'ล้าง-ถอด',     'ล้างสีเจลหรือถอดเล็บเดิม', 30,  10, 150.00),
('สปามือ',             'บำรุง',        'สปาบำรุงมือ',             45,  10, 250.00);

-- ช่างทำบริการอะไรได้บ้าง (staff_service)
INSERT INTO staff_service (staff_id, service_id) VALUES
(1,1),(1,2),(1,3),(1,4),          -- ช่างเอ: ทาสีเจล, ต่อเล็บเจล, ต่อ PVC, เพ้นท์
(2,1),(2,5),(2,6);                -- ช่างบี: ทาสีเจล, ล้าง/ถอด, สปามือ

-- ตารางเวลาทำงานช่าง (จ.-ส. 10:00-19:00 ; day_of_week 1..6)
INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES
(1,1,'10:00','19:00'),(1,2,'10:00','19:00'),(1,3,'10:00','19:00'),
(1,4,'10:00','19:00'),(1,5,'10:00','19:00'),(1,6,'10:00','19:00'),
(2,1,'10:00','19:00'),(2,2,'10:00','19:00'),(2,3,'10:00','19:00'),
(2,4,'10:00','19:00'),(2,5,'10:00','19:00'),(2,6,'10:00','19:00');

-- ตัวอย่างการจอง 1 นัด (ลูกค้า user_id=2 จองช่าง staff_id=1: ต่อเล็บเจล+เพ้นท์)
-- end_time = 13:00 + (120+15 + 45+10) = 13:00 + 190 นาที = 16:10
INSERT INTO bookings (user_id, staff_id, booking_date, start_time, end_time, status, note) VALUES
(2, 1, '2026-08-01', '13:00', '16:10', 'confirmed', 'ลูกค้าขอโทนสีชมพู');

INSERT INTO booking_items (booking_id, service_id, price_snapshot, duration_snapshot) VALUES
(1, 2, 700.00, 120),
(1, 4, 200.00, 45);

INSERT INTO notifications (booking_id, type, message, scheduled_at) VALUES
(1, 'confirm',  'ยืนยันการจองวันที่ 1 ส.ค. 2026 เวลา 13:00 น. กับช่างเอ',            '2026-07-25 12:00:00'),
(1, 'reminder', 'แจ้งเตือน: พรุ่งนี้มีนัดทำเล็บ 13:00 น. ที่ Take Care Nail',        '2026-07-31 20:00:00');
