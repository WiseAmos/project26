'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { useEffect, useState, useMemo, useRef } from 'react'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import * as THREE from 'three'
import Link from 'next/link'

interface CraneData {
    id: string
    message: string
    createdAt: any
}

const SPREAD = 80

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

function ResponsiveCamera() {
    const { camera, size } = useThree()

    useEffect(() => {
        const isMobile = size.width < 768
        // Move camera back on mobile to see more items
        // Desktop: 30. Mobile: 60.
        const targetZ = isMobile ? 55 : 30
        camera.position.setZ(targetZ)
    }, [camera, size.width])

    return null
}

function CranesCloud({ cranes, onSelect }: { cranes: CraneData[], onSelect: (crane: CraneData) => void }) {
    const meshRef = useRef<THREE.InstancedMesh>(null)

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const vertFloat = new Float32Array(S3)
        geo.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3))
        geo.setIndex(INDICES)
        geo.computeVertexNormals()
        return geo
    }, [])

    // Generate positions based on crane count
    const { positions, rotations, scales } = useMemo(() => {
        const count = Math.max(cranes.length, 1)
        const p = new Float32Array(count * 3)
        const r = new Float32Array(count * 3)
        const s = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * SPREAD
            p[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
            p[i * 3 + 2] = (Math.random() - 0.5) * SPREAD

            r[i * 3] = Math.random() * Math.PI
            r[i * 3 + 1] = Math.random() * Math.PI
            r[i * 3 + 2] = Math.random() * Math.PI

            s[i * 3] = 1.2
            s[i * 3 + 1] = 1.2
            s[i * 3 + 2] = 1.2
        }
        return { positions: p, rotations: r, scales: s }
    }, [cranes.length])

    // Update instance matrices
    useEffect(() => {
        if (!meshRef.current || cranes.length === 0) return

        const dummy = new THREE.Object3D()
        const color = new THREE.Color()

        for (let i = 0; i < cranes.length; i++) {
            dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
            dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2])
            dummy.scale.set(scales[i * 3], scales[i * 3 + 1], scales[i * 3 + 2])
            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)

            // Subtle color variation
            const msg = cranes[i].message?.toLowerCase() || ''
            if (msg.includes('sorry') || msg.includes('love')) {
                color.setHex(0xfff0f0)
            } else {
                color.setHex(0xffffff)
            }
            meshRef.current.setColorAt(i, color)
        }

        meshRef.current.instanceMatrix.needsUpdate = true
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    }, [cranes, positions, rotations, scales])

    const handleClick = (e: any) => {
        e.stopPropagation()
        const id = e.instanceId
        if (id !== undefined && id < cranes.length) {
            onSelect(cranes[id])
        }
    }

    if (cranes.length === 0) return null

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, undefined, cranes.length]}
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

export default function Gallery() {
    const [cranes, setCranes] = useState<CraneData[]>([])
    const [selectedCrane, setSelectedCrane] = useState<CraneData | null>(null)
    const [showInstructions, setShowInstructions] = useState(true)

    useEffect(() => {
        const fetchCranes = async () => {
            try {
                const q = query(collection(db, "wishes"), orderBy("timestamp", "desc"));
                const querySnapshot = await getDocs(q);
                const list: CraneData[] = []
                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    list.push({
                        id: doc.id,
                        message: data.message || '',
                        createdAt: data.timestamp
                    })
                })
                setCranes(list)
            } catch (e) {
                console.error("Error fetching cranes: ", e)
            }
        }
        fetchCranes()
    }, [])

    // Fade out instructions after interaction or timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowInstructions(false)
        }, 5000)

        const handleInteraction = () => {
            setTimeout(() => setShowInstructions(false), 1500)
        }

        window.addEventListener('pointerdown', handleInteraction, { once: true })
        window.addEventListener('touchstart', handleInteraction, { once: true })
        window.addEventListener('wheel', handleInteraction, { once: true })

        return () => {
            clearTimeout(timer)
            window.removeEventListener('pointerdown', handleInteraction)
            window.removeEventListener('touchstart', handleInteraction)
            window.removeEventListener('wheel', handleInteraction)
        }
    }, [])

    return (
        <div className="w-full h-screen bg-[#fdfbf6] relative">
            <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
                <color attach="background" args={['#fdfbf6']} />
                <fog attach="fog" args={['#fdfbf6', 30, 100]} />
                <ambientLight intensity={0.6} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />

                <CranesCloud cranes={cranes} onSelect={setSelectedCrane} />

                <OrbitControls
                    makeDefault
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={10}
                    maxDistance={80}
                    autoRotate={true}
                    autoRotateSpeed={0.3}
                    target={[0, 0, 0]}
                    mouseButtons={{
                        LEFT: THREE.MOUSE.ROTATE,
                        MIDDLE: THREE.MOUSE.DOLLY,
                        RIGHT: THREE.MOUSE.PAN
                    }}
                    touches={{
                        ONE: THREE.TOUCH.ROTATE,
                        TWO: THREE.TOUCH.DOLLY_PAN
                    }}
                />

                <Environment preset="apartment" />
                <ResponsiveCamera />
            </Canvas>

            {/* Header */}
            <div className="absolute top-0 left-0 p-6 md:p-8 z-10 pointer-events-none">
                <h1 className="text-[#333] font-light text-xl md:text-2xl uppercase tracking-widest">
                    Gallery ({cranes.length} / 1000)
                </h1>
            </div>

            {/* Back Link */}
            <Link
                href="/"
                className="absolute top-6 right-6 md:top-8 md:right-8 z-10 text-[#333]/60 hover:text-[#333] text-sm tracking-wide transition-colors"
            >
                ← Back
            </Link>

            {/* Instructions - Centered */}
            {!selectedCrane && showInstructions && (
                <div
                    className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center pointer-events-none"
                    style={{ zIndex: 20 }}
                >
                    <div className={`transition-opacity duration-1000 ${showInstructions ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-[#333]/60 text-xs md:text-sm tracking-wide text-center px-6 py-3 bg-white/50 backdrop-blur-md rounded-full shadow-lg">
                            Drag to look around • Scroll to zoom • Tap a crane
                        </p>
                    </div>
                </div>
            )}

            {/* Wish Modal - Premium Design */}
            {selectedCrane && (
                <div
                    className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center"
                    style={{ zIndex: 100, backgroundColor: 'rgba(0,0,0,0.3)' }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedCrane(null)
                    }}
                >
                    <div
                        className="relative mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20 blur-2xl scale-110 rounded-2xl"></div>

                        {/* Modal card */}
                        <div className="relative bg-gradient-to-b from-[#fefefe] to-[#f8f6f2] backdrop-blur-xl px-8 py-10 md:px-14 md:py-14 shadow-2xl border border-white/60 max-w-[85vw] md:max-w-lg rounded-2xl">

                            {/* Decorative crane silhouette */}
                            <div className="absolute top-4 right-4 opacity-10">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-[#333]">
                                    <path d="M12 2L8 8H4L8 12L4 20H12L16 12L20 8H16L12 2Z" />
                                </svg>
                            </div>

                            {/* Quote marks */}
                            <div className="text-6xl md:text-7xl text-[#333]/10 font-serif absolute -top-2 left-4 leading-none">"</div>

                            {/* Wish text */}
                            <p className="text-[#333] font-serif italic text-xl md:text-2xl lg:text-3xl leading-relaxed tracking-wide text-center pt-4 pb-8">
                                {selectedCrane.message}
                            </p>

                            {/* Divider */}
                            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#333]/20 to-transparent mx-auto mb-6"></div>

                            {/* Close button */}
                            <button
                                type="button"
                                className="block mx-auto text-xs uppercase tracking-[0.25em] text-[#333]/50 hover:text-[#333] transition-all duration-300 py-2 px-6 rounded-full hover:bg-[#333]/5"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedCrane(null)
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
