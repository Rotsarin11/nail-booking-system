/**
 * LINE OA Webhook — บอทตอบข้อความ (ระบบจองคิวทำเล็บออนไลน์)
 * ใช้ Express + @line/bot-sdk เวอร์ชัน 8+ (ตรวจ signature ให้อัตโนมัติ)
 *
 * ติดตั้ง:  npm install express @line/bot-sdk dotenv
 * รัน:      node line_webhook.js
 * เปิด public URL (ตอน dev):  ngrok http 3000  → เอา URL ไปตั้งใน LINE Console
 */
require('dotenv').config();
const express = require('express');
// เปลี่ยนโครงสร้างการดึงโมดูลให้รองรับเวอร์ชันล่าสุด
const { middleware, messagingApi } = require('@line/bot-sdk');

// ตรวจสอบชื่อตัวแปร env ให้ตรงกับในไฟล์ .env ของคุณ
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET || process.env.CHANNEL_SECRET,
};

// เปลี่ยนมาสร้าง client ด้วย MessagingApiClient ตามมาตรฐานใหม่
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

const app = express();

const LIFF_BOOKING_URL = process.env.LIFF_BOOKING_URL || 'https://liff.line.me/xxxxxxxx-xxxx';

// ⚠️ ห้ามใส่ express.json() ก่อน middleware ของ LINE — เพราะต้องใช้ raw body ตรวจ signature
app.post('/webhook', middleware(config), async (req, res) => {
  try {
    await Promise.all((req.body.events || []).map(handleEvent));
    res.sendStatus(200);
  } catch (err) {
    console.error('webhook error:', err);
    res.sendStatus(500);
  }
});

// ตอบกลับแต่ละ event
async function handleEvent(event) {
  // ผู้ใช้เพิ่มเพื่อน -> ทักทาย
  if (event.type === 'follow') {
    // ปรับรูปแบบ replyMessage ใหม่ ให้ส่งอาร์กิวเมนต์เป็น Object ก้อนเดียวที่มี replyToken และ messages (อาเรย์)
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [welcomeMessage()]
    });
  }

  // รับเฉพาะข้อความตัวอักษร
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const text = event.message.text.trim();

  // แชทบอทแบบเมนู (Menu-based) — ตอบตามคำที่ตรงเงื่อนไข
  if (['จองคิว', 'จอง', 'นัดหมาย'].includes(text)) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [bookingButton()]
    });
  }
  if (['บริการ', 'ราคา', 'เมนู'].includes(text)) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [serviceList()]
    });
  }
  if (['เวลาทำการ', 'เปิดกี่โมง', 'เวลา'].includes(text)) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text', text: 'ร้าน Take Care Nail เปิดทุกวันจันทร์–เสาร์ เวลา 10:00–19:00 น. ค่ะ 🌸',
      }]
    });
  }

  // ไม่ตรงเมนู -> ตอบค่าเริ่มต้น
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{
      type: 'text',
      text: 'พิมพ์เมนูที่ต้องการได้เลยค่ะ 💅\n• "จองคิว" — จองคิวออนไลน์\n• "บริการ" — ดูบริการและราคา\n• "เวลาทำการ" — เวลาเปิด-ปิด',
    }]
  });
}

// ---- ข้อความสำเร็จรูป ----
function welcomeMessage() {
  return {
    type: 'text',
    text: 'ยินดีต้อนรับสู่ Take Care Nail ค่ะ 🌸\nพิมพ์ "จองคิว" เพื่อจองคิวออนไลน์ หรือ "บริการ" เพื่อดูราคาได้เลยค่ะ',
  };
}

// ปุ่มเปิดหน้าจองคิว (LIFF) — กดแล้วเข้าเว็บจองได้เลย ไม่ต้องล็อกอิน
function bookingButton() {
  return {
    type: 'template',
    altText: 'จองคิวทำเล็บ',
    template: {
      type: 'buttons',
      title: 'จองคิวทำเล็บ 💅',
      text: 'กดปุ่มด้านล่างเพื่อเลือกบริการ วัน–เวลา และช่างได้เลยค่ะ',
      actions: [{ type: 'uri', label: 'เปิดหน้าจองคิว', uri: LIFF_BOOKING_URL }],
    },
  };
}

function serviceList() {
  return {
    type: 'text',
    text: [
      'บริการยอดนิยม 💅',
      '• ทาสีเจล — 300 บาท (60 นาที)',
      '• ต่อเล็บเจล — 700 บาท (120 นาที)',
      '• ต่อเล็บ PVC — 500 บาท (90 นาที)',
      '• เพ้นท์ลวดลาย — 200 บาท (45 นาที)',
      '• สปามือ — 250 บาท (45 นาที)',
      '',
      'พิมพ์ "จองคิว" เพื่อจองได้เลยค่ะ',
    ].join('\n'),
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LINE webhook running on :${PORT}/webhook`));
