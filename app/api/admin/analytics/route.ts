import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Secure this endpoint! (Ideally via middleware or check header here)
// For now, we assume the Admin page client sends the x-admin-key which we should check.

const ADMIN_KEY = process.env.ADMIN_PASSWORD || '26102006'

export async function GET(request: Request) {
    try {
        // 1. Auth Check
        const authHeader = request.headers.get('x-admin-key')
        if (authHeader !== ADMIN_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Fetch recent visits using Admin SDK (Bypasses Rules)
        // Note: Admin SDK syntax is slightly different (no `query()` helper wrapper usually needed for simple chains)
        const visitsSnap = await adminDb.collection('analytics_visits')
            .orderBy('timestamp', 'desc')
            .limit(500)
            .get()

        const visits = visitsSnap.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to ISO string
                // Admin SDK timestamps behave similarly but safer to use toDate()
                timestamp: data.timestamp?.toDate?.().toISOString() || new Date().toISOString()
            }
        })

        // 3. Aggregation for Map (Country counts)
        const countryCounts: Record<string, number> = {}
        visits.forEach((v: any) => {
            const country = v.country || 'Unknown'
            countryCounts[country] = (countryCounts[country] || 0) + 1
        })

        const mapData = Object.entries(countryCounts).map(([name, count]) => ({ name, count }))

        return NextResponse.json({
            recentVisits: visits.slice(0, 50), // Send top 50 for table
            mapData, // Send aggregated data for map
            totalVisits: visits.length // Detailed count of fetched sample
        })
    } catch (error) {
        console.error('Analytics Fetch Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
