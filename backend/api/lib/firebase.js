// Firestore Admin initialisation.
// Loads the service-account key from (in order):
//   1. GOOGLE_APPLICATION_CREDENTIALS (absolute path)  — recommended
//   2. ../../firebase/serviceAccountKey.json           — repo default
const path = require('path')
const fs = require('fs')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore')

function resolveKeyPath() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (envPath && fs.existsSync(envPath)) return envPath
  const repoDefault = path.resolve(__dirname, '../../../firebase/serviceAccountKey.json')
  if (fs.existsSync(repoDefault)) return repoDefault
  throw new Error(
    'ไม่พบ service account key — ตั้งค่า GOOGLE_APPLICATION_CREDENTIALS หรือวางไฟล์ที่ firebase/serviceAccountKey.json',
  )
}

const serviceAccount = require(resolveKeyPath())

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
})

const db = getFirestore()

module.exports = { db, FieldValue, Timestamp, projectId: serviceAccount.project_id }
