import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
    try {
        const { wishes, color } = await req.json()

        // AUTH CHECK
        const authHeader = req.headers.get('x-admin-key')
        if (authHeader !== (process.env.ADMIN_PASSWORD || '26102006')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!Array.isArray(wishes)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 })
        }

        const batch = adminDb.batch()
        const collectionRef = adminDb.collection('wishes')
        const now = Date.now()

        // Firestore batches limit to 500 ops. We'll slice if needed, but for now assuming < 500
        // Or loop batches.

        let operationCount = 0;
        let batchIndex = 0;
        let currentBatch = adminDb.batch();

        for (const wishText of wishes) {
            if (!wishText.trim()) continue;

            const newDoc = collectionRef.doc();
            currentBatch.set(newDoc, {
                message: wishText.trim(),
                timestamp: now - (operationCount * 100), // Stagger slightly so they sort properly
                color: color || '#e0e0e0'
            });

            operationCount++;

            if (operationCount >= 490) {
                await currentBatch.commit();
                currentBatch = adminDb.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await currentBatch.commit();
        }

        return NextResponse.json({ success: true, count: wishes.length })
    } catch (error) {
        console.error("Import Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
