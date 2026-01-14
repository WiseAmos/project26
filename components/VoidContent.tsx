'use client'

import { useMemo, useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'

const COUNT = 1000
const SPREAD = 100

// -- CRANE GEOMETRY (S3) --
const S3 = [
    0, 0.0, 0,           // 0 Center
    1.8, 0.5, 0,         // 1 Wing R Tip
    -1.8, 0.5, 0,        // 2 Wing L Tip
    0, 1.1, 1.0,         // 3 Tail Tip
    0, 0.0, -0.8,        // 4 Head Tip

    // Waist
    0.35, -0.6, 0.35,    // 5 RB
    -0.35, -0.6, 0.35,   // 6 LB
    -0.35, -0.6, -0.35,  // 7 LF
    0.35, -0.6, -0.35,   // 8 RF

    // Tail/Neck/Beak
    0.0, 0.6, 0.5,       // 9
    -0.08, 0.7, 0.6,     // 10
    0.08, 0.7, 0.6,      // 11
    0.0, 0.8, -0.5,      // 12
    -0.08, 0.9, -0.6,    // 13
    0.08, 0.9, -0.6,     // 14
    0.0, 0.4, -0.7,      // 15
    -0.06, 0.45, -0.8,   // 16
    0.06, 0.45, -0.8,    // 17

    // Wing Roots
    0.36, -0.59, -0.35,  // 18
    0.36, -0.59, 0.35,   // 19
    -0.36, -0.59, -0.35, // 20
    -0.36, -0.59, 0.35   // 21
]

const INDICES = [
    0, 8, 5, 0, 6, 7, // Body
    1, 19, 18, 2, 20, 21, // Wings
    0, 10, 6, 0, 9, 10, 0, 5, 11, 0, 11, 9, // Tail
    9, 3, 10, 9, 11, 3,
    0, 7, 13, 0, 13, 12, 0, 14, 8, 0, 12, 14, // Neck
    12, 13, 16, 12, 16, 15, 12, 17, 14, 12, 15, 17, // Beak Base
    15, 16, 4, 15, 4, 17 // Beak Tip
]

interface VoidContentProps {
    onSelectWish?: (wish: string | null) => void
}

export default function VoidContent({ onSelectWish }: VoidContentProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const [wishes, setWishes] = useState<string[]>([])

    // Connect to Firestore (Realtime)
    useEffect(() => {
        const q = query(collection(db, 'wishes'), orderBy('timestamp', 'desc'), limit(1000))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data().message as string)
            setWishes(data)
        })
        return () => unsubscribe()
    }, [])

    // Generate random positions (Static Cloud surrounding camera)
    const { positions, rotations, scales } = useMemo(() => {
        const p = new Float32Array(COUNT * 3)
        const r = new Float32Array(COUNT * 3)
        const s = new Float32Array(COUNT * 3)

        for (let i = 0; i < COUNT; i++) {
            p[i * 3] = (Math.random() - 0.5) * SPREAD
            p[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
            p[i * 3 + 2] = (Math.random() - 0.5) * SPREAD

            r[i * 3] = Math.random() * Math.PI
            r[i * 3 + 1] = Math.random() * Math.PI
            r[i * 3 + 2] = Math.random() * Math.PI

            s[i * 3] = 1 + Math.random() * 0.5
            s[i * 3 + 1] = 1 + Math.random() * 0.5
            s[i * 3 + 2] = 1 + Math.random() * 0.5
        }
        return { positions: p, rotations: r, scales: s }
    }, [])

    // Update Instances
    useLayoutEffect(() => {
        if (!meshRef.current) return

        const dummy = new THREE.Object3D()
        const color = new THREE.Color()

        for (let i = 0; i < COUNT; i++) {
            dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
            dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2])
            dummy.scale.set(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2])
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)

            // Color Logic
            let isRed = false
            if (i < wishes.length) {
                const msg = wishes[i].toLowerCase()
                if (msg.includes('sorry') || msg.includes('love')) isRed = true
            } else {
                if (Math.random() < 0.05) isRed = true
            }

            if (isRed) color.setHex(0xfff0f0)
            else color.setHex(0xffffff)

            meshRef.current.setColorAt(i, color)
        }

        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true

    }, [wishes, positions, rotations, scales])

    // Crane Geometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const vertFloat = new Float32Array(S3)
        geo.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3))
        geo.setIndex(INDICES)
        geo.computeVertexNormals()
        return geo
    }, [])

    const handleClick = useCallback((e: any) => {
        e.stopPropagation()
        const id = e.instanceId

        console.log("Clicked Instance ID:", id, "Total Wishes:", wishes.length)

        if (id !== undefined && onSelectWish) {
            if (id < wishes.length) {
                onSelectWish(wishes[id])
            } else {
                onSelectWish("A silent prayer.")
            }
        }
    }, [wishes, onSelectWish])

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, undefined, COUNT]}
            onClick={handleClick}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <meshStandardMaterial
                color="#ffffff"
                flatShading
                roughness={0.6}
                metalness={0.1}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    )
}
