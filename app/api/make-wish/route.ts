import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const RATE_LIMIT_Window = 60 * 60 * 1000 // 1 Hour
const RATE_LIMIT_MAX = 5 // Max 5 wishes per hour per IP

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { message, color } = body

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        // 1. Get IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

        // 2. Check Rate Limit
        // We query the audit logs for this IP in the last hour
        const now = Date.now()
        const windowStart = now - RATE_LIMIT_Window

        // Note: This requires a composite index on [ip, timestamp], or we just query by ip and filter in memory if volume is low.
        // Assuming low volume, we query by IP and limit/sort.
        // Or better: just add a "timestamp" > windowStart clause.
        // Using Admin SDK we can do this easily.

        let recentLogs = []
        try {
            const logsSnap = await adminDb.collection('wish_audit_logs')
                .where('ip', '==', ip)
                .where('timestamp', '>', windowStart)
                .get()

            recentLogs = logsSnap.docs
        } catch (e) {
            console.error("Rate limit check failed:", e)
            // If index is missing or query fails, we might fail open or closed.
            // For now, let's fail open but log it, to avoid blocking legit users if DB is quirky.
            // But to be secure, we should probably just proceed.
        }

        if (recentLogs.length >= RATE_LIMIT_MAX) {
            return NextResponse.json({ error: 'Rate limit exceeded. Please wait a while before making another wish.' }, { status: 429 })
        }

        // 3. Create Wish (Public)
        const wishRef = await adminDb.collection('wishes').add({
            message: message.trim(),
            color: color || '#808080',
            timestamp: now
        })

        // 4. Log Audit (Private)
        await adminDb.collection('wish_audit_logs').add({
            wishId: wishRef.id,
            ip: ip,
            timestamp: now,
            action: 'create_wish'
        })

        return NextResponse.json({ success: true, id: wishRef.id })

    } catch (error) {
        console.error("Error creating wish:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
