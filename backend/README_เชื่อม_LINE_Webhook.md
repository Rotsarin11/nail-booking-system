# วิธีเชื่อม LINE OA + Webhook ให้บอทตอบข้อความได้

ภาพรวม: บอททำงานโดย LINE ส่ง **event** (เช่น มีคนพิมพ์ข้อความ) มายัง **Webhook URL** ของเรา →
เซิร์ฟเวอร์ Express รับมา ประมวลผล แล้ว **ตอบกลับ** ผ่าน Messaging API

```
ลูกค้าพิมพ์ข้อความ ─▶ LINE Platform ─▶ POST /webhook (เซิร์ฟเวอร์เรา) ─▶ reply กลับ ─▶ ลูกค้าเห็นคำตอบ
```

---

## ขั้นที่ 1 — สร้าง Messaging API channel
1. เข้า https://developers.line.biz/console/
2. สร้าง **Provider** (ถ้ายังไม่มี) → สร้าง channel แบบ **Messaging API**
3. เข้าแท็บ **Basic settings** จด **Channel secret**
4. เข้าแท็บ **Messaging API** กด **Issue** เพื่อออก **Channel access token (long-lived)** แล้วจดไว้

## ขั้นที่ 2 — ปิดการตอบกลับอัตโนมัติของ LINE (สำคัญ)
ในแท็บ **Messaging API** > **LINE Official Account features**:
- **Auto-reply messages** → ปิด (Disabled)
- **Greeting messages** → จะเปิดหรือปิดก็ได้
- **Webhook** → **เปิด (Enabled)**

> ถ้าไม่ปิด Auto-reply บอทของเราจะชนกับข้อความตอบอัตโนมัติของ LINE

## ขั้นที่ 3 — ติดตั้งและรันเซิร์ฟเวอร์
```bash
cd backend
npm install express @line/bot-sdk dotenv
cp .env.example .env          # แล้วเปิด .env ใส่ค่าจริง (token, secret, LIFF url)
node line_webhook.js          # จะขึ้น: LINE webhook running on :3000/webhook
```

## ขั้นที่ 4 — เปิด public URL ด้วย ngrok (ตอนพัฒนา)
LINE ต้องเรียก URL ที่เป็น **HTTPS สาธารณะ** เครื่องเราที่รันบน localhost จึงต้องใช้ ngrok:
```bash
ngrok http 3000
```
จะได้ URL เช่น `https://ab12cd34.ngrok-free.app` → Webhook URL คือ
```
https://ab12cd34.ngrok-free.app/webhook
```

## ขั้นที่ 5 — ตั้ง Webhook URL ใน LINE Console
1. แท็บ **Messaging API** > ช่อง **Webhook URL** วาง URL จากขั้นที่ 4
2. กด **Verify** — ต้องขึ้น **Success** (เซิร์ฟเวอร์ต้องรันอยู่)
3. เปิดสวิตช์ **Use webhook**

## ขั้นที่ 6 — ทดสอบ
เพิ่มเพื่อน LINE OA ของร้าน แล้วพิมพ์:
- `จองคิว` → บอทส่งปุ่มเปิดหน้าจอง (LIFF)
- `บริการ` → บอทส่งรายการบริการ + ราคา
- `เวลาทำการ` → บอทตอบเวลาเปิด-ปิด

---

## จุดสำคัญด้านความปลอดภัย (พูดตอน present ได้)
- ทุก request จาก LINE จะแนบ **signature** ในเฮดเดอร์ `x-line-signature`
- `middleware(config)` ของ `@line/bot-sdk` จะ **ตรวจ signature ด้วย Channel secret ให้อัตโนมัติ** → กันคนปลอม request มายิง webhook
- เพราะต้องใช้ **raw body** ตรวจ signature จึง **ห้ามใส่ `express.json()` ก่อน** middleware ของ LINE

## reply vs push (เรื่องต้นทุน — พูดตอน present ได้)
- **Reply message** (ตอบกลับทันทีด้วย `replyToken`) — **ฟรี ไม่นับโควตา** ใช้กับการตอบแชท/ยืนยันจอง
- **Push message** (ส่งเองภายหลัง เช่น เตือนก่อนนัด 1 วัน) — **นับโควตา** (บัญชีฟรีจำกัดต่อเดือน)
- ดังนั้นออกแบบให้ยืนยันจองใช้ reply, สงวน push ไว้เฉพาะแจ้งเตือนล่วงหน้า

## ตอนขึ้นจริง (production)
- ngrok ใช้ได้แค่ตอน dev (URL เปลี่ยนทุกครั้ง) — ตอนใช้จริงต้อง deploy เซิร์ฟเวอร์ Express ไว้ที่โฮสต์ที่มี HTTPS ถาวร เช่น Render, Railway หรือ Google Cloud Run แล้วเอา URL นั้นมาตั้งเป็น Webhook URL แทน
- (Firebase Hosting เป็น static hosting ใช้โฮสต์เว็บ/LIFF ไม่ได้รัน webhook นี้โดยตรง)
