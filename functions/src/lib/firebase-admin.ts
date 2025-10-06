// functions/src/lib/firebase-admin.ts
import {
  getApps,
  initializeApp,
  getApp,
  applicationDefault,
} from 'firebase-admin/app'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    storageBucket: 'striive-8eb17.firebasestorage.app',
  })
}

// Re-export ready-to-use handles
export const app = getApp()
export const db = getFirestore(app)
// export const auth = getAuth(app)
export const storage = getStorage(app)
export const serverTimestamp = FieldValue.serverTimestamp // helper
export { Timestamp }
