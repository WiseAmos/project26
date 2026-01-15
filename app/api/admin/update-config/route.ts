import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
    try {
        const newConfig = await req.json()


        // AUTH CHECK
        const authHeader = req.headers.get('x-admin-key')
        if (authHeader !== (process.env.ADMIN_PASSWORD || '26102006')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!newConfig || typeof newConfig !== 'object') {
            return NextResponse.json({ error: "Invalid config" }, { status: 400 })
        }

        // Validate basic structure if needed, or trust Admin Input (Gatekeeper protected frontend)
        // Ideally we check if 'introSequence' exists etc.

        await adminDb.collection('config').doc('global').set(newConfig, { merge: true })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Update Config Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
