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

// -- ANIMATED CRANE COMPONENT --
function Crane({ i, wish, geometry, position, rotation, baseScale, onSelectWish }: {
    i: number
    wish: string
    geometry: THREE.BufferGeometry
    position: [number, number, number]
    rotation: [number, number, number]
    baseScale: number
    onSelectWish?: (wish: string | null) => void
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)

    // Animation State
    const currentScale = useRef(0) // Start at 0 for "fade in" effect
    const hoverScale = useRef(1.0) // Independent hover smoothing
    const targetScale = baseScale

    useFrame((state, delta) => {
        if (!meshRef.current) return

        // Smoothly lerp current scale to target (Entrance)
        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, delta * 3)

        // Smoothly lerp hover scale (Interaction)
        const targetHover = hovered ? 1.2 : 1.0
        hoverScale.current = THREE.MathUtils.lerp(hoverScale.current, targetHover, delta * 8)

        // Add subtle floating motion
        const time = state.clock.getElapsedTime()
        const floatY = Math.sin(time + i) * 0.05

        const finalScale = currentScale.current * hoverScale.current

        meshRef.current.scale.set(finalScale, finalScale, finalScale)
        meshRef.current.position.y = position[1] + floatY
    })

    const msg = wish.toLowerCase()
    const isRed = msg.includes('sorry') || msg.includes('love') || msg.includes('regret') || msg.includes('miss')
    const color = isRed ? "#ffa0a0" : "#ffffff"

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            position={position}
            rotation={rotation}
            scale={[0, 0, 0]} // Initial scale handled by Ref
            onClick={(e) => {
                e.stopPropagation()
                onSelectWish?.(wish)
            }}
            onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(true)
                document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(e) => {
                e.stopPropagation()
                setHovered(false)
                document.body.style.cursor = 'auto'
            }}
        >
            <meshStandardMaterial
                color={color}
                flatShading
                roughness={0.6}
                metalness={0.1}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9} // Slight transparency for the paper look
            />
        </mesh>
    )
}

export default function VoidContent({ onSelectWish }: VoidContentProps) {
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
            // SPHERICAL DISTRIBUTION with HOLE (Donut/Shell)
            const radius = 5 + Math.random() * (SPREAD - 5)
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            p[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            p[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            p[i * 3 + 2] = radius * Math.cos(phi)

            r[i * 3] = Math.random() * Math.PI
            r[i * 3 + 1] = Math.random() * Math.PI
            r[i * 3 + 2] = Math.random() * Math.PI

            s[i * 3] = 1 + Math.random() * 0.5
            s[i * 3 + 1] = 1 + Math.random() * 0.5
            s[i * 3 + 2] = 1 + Math.random() * 0.5
        }
        return { positions: p, rotations: r, scales: s }
    }, [])

    // Crane Geometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const vertFloat = new Float32Array(S3)
        geo.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3))
        geo.setIndex(INDICES)
        geo.computeVertexNormals()
        geo.computeBoundingSphere()
        return geo
    }, [])

    return (
        <group>
            {wishes.map((wish, i) => {
                // Bounds check
                if (i * 3 >= positions.length) return null

                const pos = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]] as [number, number, number]
                const rot = [rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2]] as [number, number, number]
                const baseScale = scales[i * 3]

                return (
                    <Crane
                        key={i}
                        i={i}
                        wish={wish}
                        geometry={geometry}
                        position={pos}
                        rotation={rot}
                        baseScale={baseScale}
                        onSelectWish={onSelectWish}
                    />
                )
            })}
        </group>
    )
}
