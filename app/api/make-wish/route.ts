import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const RATE_LIMIT_Window = 60 * 60 * 1000 // 1 Hour
const RATE_LIMIT_MAX = 5 // Max 5 wishes per hour per IP

// Simple in-memory cache for Config (Lambda/Serverless warm usage)
let cachedConfig: any = null
let lastConfigFetch = 0
const CONFIG_CACHE_TTL = 60000 // 60 seconds

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { message, color } = body

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }

        const now = Date.now()

        // 0. Load Config (Cached)
        if (!cachedConfig || (now - lastConfigFetch > CONFIG_CACHE_TTL)) {
            try {
                const configSnap = await adminDb.collection('config').doc('global').get()
                cachedConfig = configSnap.data()
                lastConfigFetch = now
            } catch (e) {
                console.error("Config fetch failed, using fallback/cache if available", e)
            }
        }

        const security = cachedConfig?.security || { rateLimitMax: 5, rateLimitWindowMs: 3600000, blockedIps: [] }
        const RATE_LIMIT_Window = security.rateLimitWindowMs || 3600000
        const RATE_LIMIT_MAX = security.rateLimitMax || 5
        const BLOCKED_IPS = security.blockedIps || []

        // 1. Get IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

        // 1.5 Check Blocklist
        if (BLOCKED_IPS.includes(ip)) {
            // Log security event (Fire and forget, don't await blocking response logic too much, but we should log it)
            adminDb.collection('wish_audit_logs').add({
                ip,
                timestamp: now,
                action: 'blocked_visit',
                details: 'IP in Blocklist'
            }).catch(e => console.error("Audit log failed", e))

            return NextResponse.json({ error: 'Access Denied' }, { status: 403 })
        }

        // 2. Check Rate Limit (Count Only)
        const windowStart = now - RATE_LIMIT_Window
        let rateCount = 0

        try {
            // Optimization: Use count() instead of getting all docs
            const logsCount = await adminDb.collection('wish_audit_logs')
                .where('ip', '==', ip)
                .where('timestamp', '>', windowStart)
                .count()
                .get()

            rateCount = logsCount.data().count
        } catch (e) {
            console.error("Rate limit check failed:", e)
            // Fail open but log
        }

        if (rateCount >= RATE_LIMIT_MAX) {
            adminDb.collection('wish_audit_logs').add({
                ip,
                timestamp: now,
                action: 'rate_limited',
                details: `Exceeded ${RATE_LIMIT_MAX} wishes`
            }).catch(e => console.error("Audit log failed", e))

            return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
        }

        // 3. Parallel Execution: Create Wish + Log Audit
        // We can await both, or just await wish and let audit run (but safer to await both for consistency)
        const wishData = {
            message: message.trim(),
            color: color || '#808080',
            timestamp: now
        }

        const wishRef = adminDb.collection('wishes').doc() // Generate ID client-side style but on server

        const writePromise = wishRef.set(wishData)

        const auditPromise = adminDb.collection('wish_audit_logs').add({
            wishId: wishRef.id,
            ip: ip,
            timestamp: now,
            action: 'create_wish'
        })

        await Promise.all([writePromise, auditPromise])

        return NextResponse.json({ success: true, id: wishRef.id })

    } catch (error) {
        console.error("Error creating wish:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
