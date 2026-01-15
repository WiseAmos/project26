import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
    try {
        const { id } = await req.json()


        // AUTH CHECK
        const authHeader = req.headers.get('x-admin-key')
        if (authHeader !== (process.env.ADMIN_PASSWORD || '26102006')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 })
        }

        // Ideally verification happens here via Token
        // For now, we assume the obscure URL + frontend gatekeeper provides "soft" security
        // But in production, you should verify a session cookie or token.

        await adminDb.collection('wishes').doc(id).delete()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
