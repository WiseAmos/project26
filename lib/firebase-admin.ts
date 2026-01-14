import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') // Fix newlines if stored as single line string

if (!projectId || !clientEmail || !privateKey) {
    // Prevent crashing during build, but log warning
    if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ Firebase Admin Environment Variables missing.")
    }
}

const apps = getApps()

const adminApp = !apps.length ? initializeApp({
    credential: cert({
        projectId,
        clientEmail,
        privateKey,
    })
}) : apps[0]

export const adminDb = getFirestore(adminApp)
