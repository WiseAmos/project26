import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
    try {
        // Extract IP and Country from headers (Vercel/Next.js)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1' // Fallback for localhost
        const country = request.headers.get('x-vercel-ip-country') || 'Unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Store in 'analytics_visits' collection using Admin SDK
        // This bypasses Firestore Rules "allow write: if false"
        await adminDb.collection('analytics_visits').add({
            ip,
            country,
            userAgent,
            path: '/',
            timestamp: new Date() // Admin SDK uses native Date or Timestamp
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Analytics Log Error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
