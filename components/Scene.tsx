'use client'

import { useState, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import FoldingContent from './FoldingStage'
import VoidContent from './VoidContent'

interface SceneProps {
    mode: 'LOADING' | 'INTRO' | 'FOLDING' | 'WISH' | 'VOID'
    onFoldComplete?: () => void
    onSelectWish?: (wish: string | null) => void
    onFoldProgress?: (step: number, progress: number, isComplete: boolean) => void
    isReleasing?: boolean
    isSettling?: boolean
    isReleasing?: boolean
    isSettling?: boolean
    lastWish?: string | null
    onComplete?: () => void // For Intro completion
}

function CameraController({ mode, isReleasing }: { mode: string, isReleasing?: boolean }) {
    const { camera } = useThree()
    const targetPos = useRef(new THREE.Vector3(0, 2, 4))
    const prevMode = useRef(mode)

    useFrame((state, delta) => {
        // RELEASE ANIMATION: Zoom out to reveal the gallery
        if (isReleasing) {
            targetPos.current.set(0, 0, 30) // Target Gallery Position
            camera.position.lerp(targetPos.current, delta * 1.5) // Smooth Zoom Out
            camera.lookAt(0, 0, 0)
            return
        }

        // When entering VOID mode, move camera to a better position for gallery viewing
        if (mode === 'VOID') {
            if (prevMode.current !== 'VOID') {
                // If we are already close to the target (e.g. coming from Release animation), don't snap
                const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 30))
                if (dist > 10) {
                    camera.position.set(0, 0, 30)
                    camera.lookAt(0, 0, 0)
                }
                prevMode.current = 'VOID'
            }
            return // OrbitControls handles camera after this
        }

        prevMode.current = mode

        if (mode === 'FOLDING' || mode === 'WISH' || mode === 'LOADING' || mode === 'INTRO') {
            targetPos.current.set(0, 2, 4)
        } else {
            targetPos.current.set(0, 2, 4)
        }

        camera.position.lerp(targetPos.current, delta * 0.8)
        camera.lookAt(0, 0, 0)
    })
    return null
}

export default function Scene({ mode, onFoldComplete, onSelectWish, onFoldProgress, isReleasing, isSettling, lastWish }: SceneProps) {
    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#f4f1ea]">
            <Canvas shadows camera={{ position: [0, 2, 4], fov: 45 }}>
                <CameraController mode={mode} isReleasing={isReleasing} />

                {/* GLOBAL SCENE SETUP */}
                <color attach="background" args={['#fdfbf6']} />
                {/* Fog - extended for VOID mode */}
                <fog attach="fog" args={['#fdfbf6', 10, mode === 'VOID' || isReleasing ? 80 : 60]} />

                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />

                {/* USER CRANE (Visible during folding, wish input, AND void/gallery) 
                    Kept in VOID so the flown-away crane remains visible in the distance */}
                {(mode === 'INTRO' || mode === 'FOLDING' || mode === 'WISH' || mode === 'VOID' || mode === 'LOADING') && (
                    <FoldingContent
                        key="folding-stage"
                        onComplete={onFoldComplete}
                        forceFinish={mode === 'WISH' || mode === 'VOID'}
                        onProgressChange={onFoldProgress}
                        isReleasing={isReleasing}
                        lastWish={lastWish}
                        onSelectWish={onSelectWish}
                    />
                )}

                {/* VOID GALLERY (Cloud of cranes) */}
                {/* Show during Release to "Reveal" them */}
                {(mode === 'VOID' || isReleasing) && (
                    <VoidContent key="void-content" onSelectWish={onSelectWish} />
                )}

                {/* OrbitControls - Mobile-friendly with touch support */}
                {mode === 'FOLDING' || mode === 'WISH' ? (
                    <OrbitControls
                        key="orbit-folding"
                        enabled={!isReleasing} // Disable during release flight
                        enableZoom={false}
                        enablePan={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                    />
                ) : mode === 'VOID' ? (
                    <OrbitControls
                        key="orbit-void"
                        makeDefault
                        enabled={!isSettling} // Disable during settling phase
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minDistance={5}
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
                ) : null}

            </Canvas>
        </div>
    )
}
