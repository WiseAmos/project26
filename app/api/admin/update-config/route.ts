import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

const ADMIN_KEY = process.env.ADMIN_PASSWORD || '26102006'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('x-admin-key')
        if (authHeader !== ADMIN_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const newConfig = await request.json()

        // Remove undefined fields if any, or just set the doc directly.
        // We put this in 'config/global'
        await adminDb.collection('config').doc('global').set(newConfig, { merge: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Config Update Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
