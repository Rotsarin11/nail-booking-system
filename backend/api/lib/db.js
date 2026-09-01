// MySQL / MariaDB connection pool.
// Replaces the old Firestore Admin initialisation (lib/firebase.js).
//
// Reads connection info from env vars (see .env.example):
//   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
//
// dateStrings:true makes DATE/TIME/DATETIME columns come back as plain
// strings ('YYYY-MM-DD' / 'HH:MM:SS') instead of JS Date objects, which
// matches the string shape the rest of the app (slots.js, the frontend,
// the customer app) already expects — this is what keeps the JSON
// contract of every endpoint unchanged after the Firestore → MySQL swap.
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nail_booking',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true,
  timezone: '+07:00', // Asia/Bangkok — store & read local wall-clock time as-is
})

module.exports = { pool }
