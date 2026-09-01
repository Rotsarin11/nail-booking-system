-- =====================================================================
--  ส่วนเพิ่มเติมจาก schema/nail_booking_schema.sql
--  จำเป็นสำหรับการย้าย backend/api กลับจาก Firestore มาใช้ MySQL/MariaDB
--  ให้ endpoint เดิมทำงานได้ครบทุกอัน (ตาราง settings + คอลัมน์ยกเลิกการจอง)
--  รันไฟล์นี้ "ต่อจาก" schema/nail_booking_schema.sql
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 11) shop_settings : การตั้งค่าร้าน (1 แถวเดียว) — เดิมเป็น Firestore
--     doc settings/shop เก็บ key/value อิสระ จึงใช้ JSON column แทน
--     เพื่อไม่ต้องล็อกโครงสร้างฟิลด์ตายตัว (ชื่อร้าน เวลาเปิด-ปิด ฯลฯ)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shop_settings (
    id          TINYINT PRIMARY KEY DEFAULT 1,
    data        JSON NOT NULL,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
    CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- bookings : เพิ่มคอลัมน์บันทึกเหตุผล/ผู้ยกเลิก/เวลาที่ยกเลิก
--     (เดิม server.js เขียนฟิลด์เหล่านี้ลง Firestore doc ได้อิสระ
--      แต่ตารางเชิงสัมพันธ์ต้องมีคอลัมน์รองรับไว้ล่วงหน้า)
-- ---------------------------------------------------------------------
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(255) NULL AFTER note,
    ADD COLUMN IF NOT EXISTS cancelled_by  ENUM('admin','customer') NULL AFTER cancel_reason,
    ADD COLUMN IF NOT EXISTS cancelled_at  DATETIME NULL AFTER cancelled_by;

-- ค่าเริ่มต้นของการตั้งค่าร้าน (สอดคล้องกับ shop info ใน mockData.js)
INSERT INTO shop_settings (id, data) VALUES (1, JSON_OBJECT(
    'name', 'Take Care Nail',
    'tagline', 'ร้านทำเล็บครบวงจร ดูแลทุกปลายนิ้ว',
    'phone', '098-145-0399',
    'address', 'ถ.นิมมานเหมินท์ ซ.9 อ.เมือง จ.เชียงใหม่',
    'openHour', 10,
    'closeHour', 19,
    'lineId', '@takecarenail'
)) ON DUPLICATE KEY UPDATE id = id;
