import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const ADMIN_KEY = process.env.ADMIN_PASSWORD || '26102006'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('x-admin-key')
        if (authHeader !== ADMIN_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { target } = body // 'traffic' or 'security'

        let collectionName = ''
        if (target === 'traffic') {
            collectionName = 'analytics_visits'
        } else if (target === 'security') {
            collectionName = 'wish_audit_logs'
        } else {
            return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
        }

        // Batch delete using Firebase Admin
        // Note: For very large collections in production, recursiveDelete is recommended but might time out HTTP.
        // For this scale, retrieving a batch and deleting is fine, or just using get() + batch.delete().

        const batchSize = 500
        const collectionRef = adminDb.collection(collectionName)
        const snapshot = await collectionRef.limit(batchSize).get()

        if (snapshot.empty) {
            return NextResponse.json({ success: true, count: 0, message: 'No logs to clear' })
        }

        const batch = adminDb.batch()
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref)
        })

        await batch.commit()

        // If there are more, the user can click again (simple pagination approach)
        // Or we could loop here, but Vercel functions have timeouts (10s on hobby).
        // Safest to delete one batch and tell user "Deleted 500 logs".

        return NextResponse.json({ success: true, count: snapshot.size, message: `Deleted ${snapshot.size} logs` })

    } catch (error) {
        console.error("Clear logs error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
