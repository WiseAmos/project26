'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// -- MATERIALS --
const PAPER_MATERIAL = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.1,
    flatShading: true,
})

// -- TOPOLOGY V6 (Wide-Base Wings & Reverse Folds) --
// 22 Vertices
// 0: Center (Body Hump)
// 1: Wing R Tip, 2: Wing L Tip
// 3: Tail Tip, 4: Beak Tip
// 5-8: Waist (Body) RB, LB, LF, RF
// 9-11: Tail Knee (Spine, Edge L, Edge R)
// 12-14: Neck Knee (Spine, Edge L, Edge R)
// 15-17: Beak Bend (Spine, Edge L, Edge R)
// -- SPLIT WING ROOTS (CORNER COPIES) --
// 18: Wing R Root Front (Copy of Waist RF / v8)
// 19: Wing R Root Back (Copy of Waist RB / v5)
// 20: Wing L Root Front (Copy of Waist LF / v7)
// 21: Wing L Root Back (Copy of Waist LB / v6)

// S0: FLAT CREASE PATTERN
const S0 = [
    0, 0, 0,        // 0 Center
    1, 1, 0,        // 1 Wing R Tip (Top-Right corner)
    -1, -1, 0,      // 2 Wing L Tip (Bottom-Left corner)
    -1, 1, 0,       // 3 Tail Tip (Top-Left corner)
    1, -1, 0,       // 4 Beak Tip (Bottom-Right corner)

    // Waist (Midpoints of edges)
    0, 1, 0,        // 5 Waist RB (Top edge midpoint)
    -1, 0, 0,       // 6 Waist LB (Left edge midpoint)
    0, -1, 0,       // 7 Waist LF (Bottom edge midpoint)
    1, 0, 0,        // 8 Waist RF (Right edge midpoint)

    // Tail Knees (Subdividing Top-Left Quadrant)
    -0.5, 0.5, 0,   // 9 Spine (Diagonal Midpoint)
    -1.0, 0.5, 0,   // 10 Edge L (On Left Edge) - Fills area 6-3
    -0.5, 1.0, 0,   // 11 Edge R (On Top Edge) - Fills area 5-3

    // Neck Knees (Subdividing Bottom-Right Quadrant)
    0.5, -0.5, 0,   // 12 Spine (Diagonal Midpoint)
    0.5, -1.0, 0,   // 13 Edge L (On Bottom Edge)
    1.0, -0.5, 0,   // 14 Edge R (On Right Edge)

    // Beak Bends (Subdividing Neck Tip Area)
    0.75, -0.75, 0, // 15 Spine (Further down diagonal)
    0.75, -1.0, 0,  // 16 Edge L (On Bottom Edge, near tip)
    1.0, -0.75, 0,  // 17 Edge R (On Right Edge, near tip)

    // -- WING ROOTS (New Corner Splits) --
    // Wing R (TR Corner 1,1):
    // RootF (adj 1,0): Copy v8
    // RootB (adj 0,1): Copy v5
    1, 0, 0,        // 18 Wing R Root F (Copy of v8)
    0, 1, 0,        // 19 Wing R Root B (Copy of v5)

    // Wing L (BL Corner -1,-1):
    // RootF (adj 0,-1): Copy v7
    // RootB (adj -1,0): Copy v6
    0, -1, 0,       // 20 Wing L Root F (Copy of v7)
    -1, 0, 0        // 21 Wing L Root B (Copy of v6)
]

// S1: TRIANGLE (Fold Tail to Head)
// Diagonal Fold along line connecting WingR(1,1) and WingL(-1,-1)? 
// No, S0 is: 1(TR), 2(BL), 3(TL), 4(BR).
// Standard fold: TL(3) folds to BR(4). Line is TR(1)-BL(2).
// Result is Triangle: TR(1), BL(2), BR(4).
const S1 = [
    0, 0, 0,        // 0 Center
    1, 1, 0,        // 1 Wing R (Top-Right) - Stay
    -1, -1, 0,      // 2 Wing L (Bottom-Left) - Stay
    1, -1, 0.02,    // 3 Tail Tip -> Moves to Beak Tip (4) (Bottom-Right)
    1, -1, 0,       // 4 Beak Tip (Bottom-Right) - Stay

    // Waist Transforms (Align to Triangle Edges)
    // Edge TR-BR (Right Edge): v5,v8.
    // v8(1,0) stays. v5(0,1) folds to (1,0)? No, (0,1) reflects across y=-x+??
    // Line is y=x. Reflection of (0,1) is (1,0).
    1, 0, 0.01,     // 5 Waist RB (Rotated to RF)
    0, -1, 0.01,    // 6 Waist LB (Rotated to LF)
    0, -1, 0,       // 7 Waist LF (Stay)
    1, 0, 0,        // 8 Waist RF (Stay)

    // Knees (Move with Tip 3)
    0.5, -0.5, 0.02,// 9 Tail Knee
    0.5, -0.5, 0.02,// 10
    0.5, -0.5, 0.02,// 11

    // Neck Knee (Stay)
    0.5, -0.5, 0,   // 12
    0.5, -0.5, 0,   // 13
    0.5, -0.5, 0,   // 14

    // Beak Bend (Stay)
    0.75, -0.75, 0, // 15
    0.75, -0.75, 0, // 16
    0.75, -0.75, 0, // 17

    // Wing Roots
    1, 0, 0,        // 18 Wing R Root F (Stay)
    1, 0, 0.01,     // 19 Wing R Root B (Moves to F)
    0, -1, 0,       // 20 Wing L Root F (Stay)
    0, -1, 0.01     // 21 Wing L Root B (Moves to F)
]

// S2: DIAMOND (Square Base) -> Centered on Origin
const S2 = [
    0, 0.71, 0,     // 0 Center (Top Corner)
    0, -0.71, 0,    // 1 Wing R Tip -> Bottom
    0, -0.71, 0,    // 2 Wing L Tip -> Bottom
    0, -0.71, 0,    // 3 Tail Tip -> Bottom
    0, -0.71, 0,    // 4 Beak Tip -> Bottom

    // Waist (The visible sides of the Diamond)
    0.71, 0, 0,     // 5 Waist RB -> Right Corner
    -0.71, 0, 0,    // 6 Waist LB -> Left Corner
    -0.71, 0, 0,    // 7 Waist LF -> Left Corner
    0.71, 0, 0,     // 8 Waist RF -> Right Corner

    // Internal Vertices
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,

    // Roots
    0.35, 0, 0, 0.35, 0, 0, -0.35, 0, 0, -0.35, 0, 0
]

// S_BIRDBASE (Lowered to keep center stable)
const S_BirdBase = [
    0, 0.8, 0,         // 0 Center High (Lowered from 1.5)
    0.8, -0.2, 0,      // 1 Wing R
    -0.8, -0.2, 0,     // 2 Wing L
    0, -2.0, -0.2,     // 3 Tail (Lowered from -1.8)
    0, -2.0, 0.2,      // 4 Head (Lowered from -1.8)

    // Waist
    0, -0.5, 0,        // 5 (Lowered from 0)
    0, -0.5, 0,        // 6 (Lowered from 0)
    0, -0.5, 0,        // 7 (Lowered from 0)
    0, -0.5, 0,        // 8 (Lowered from 0)

    // Tail/Neck/Beak
    0, -1.0, 0,        // 9 Tail Knee Spine (Lowered from -0.5)
    0, -1.0, 0,        // 10 Tail Knee Edge L (Lowered from -0.5)
    0, -1.0, 0,        // 11 Tail Knee Edge R (Lowered from -0.5)

    0, -1.0, 0,        // 12 Neck Knee Spine (Lowered from -0.5)
    0, -1.0, 0,        // 13 Neck Knee Edge L (Lowered from -0.5)
    0, -1.0, 0,        // 14 Neck Knee Edge R (Lowered from -0.5)

    0, -1.3, 0,        // 15 Beak Bend Spine (Lowered from -1.0)
    0, -1.3, 0,        // 16 Beak Bend Edge L (Lowered from -1.0)
    0, -1.3, 0,        // 17 Beak Bend Edge R (Lowered from -1.0)

    // Wing Roots
    0, -0.2, 0,        // 18 Wing R Root F (Lowered from 0)
    0, -0.2, 0,        // 19 Wing R Root B (Lowered from 0)
    0, -0.2, 0,        // 20 Wing L Root F (Lowered from 0)
    0, -0.2, 0         // 21 Wing L Root B (Lowered from 0)
]

// S3: CRANE FINAL (Shifted Down by 0.5)
// S3: CRANE FINAL (Cleaned & Verified)
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

// INDICES (V6 - Corrected Winding & Tessellation)
const INDICES = [
    // -- BODY WALLS (Inner Volume) --
    0, 8, 5,   // Right Wall
    0, 6, 7,   // Left Wall

    // -- WINGS (Outer Flaps) --
    1, 19, 18, // Wing R
    2, 20, 21, // Wing L

    // -- TAIL SECTION (Top-Left) --
    // Left Wall Strip
    0, 10, 6,  // Center -> EdgeL -> WaistL
    0, 9, 10,  // Center -> Spine -> EdgeL

    // Right Wall Strip
    0, 5, 11,  // Center -> WaistT -> EdgeR
    0, 11, 9,  // Center -> EdgeR -> Spine

    // Tip Triangles
    9, 3, 10,  // Spine -> Tip -> EdgeL
    9, 11, 3,  // Spine -> EdgeR -> Tip

    // -- NECK SECTION (Bottom-Right) --
    // Left Wall Strip (Bottom)
    0, 7, 13,  // Center -> WaistB -> EdgeL
    0, 13, 12, // Center -> EdgeL -> Spine

    // Right Wall Strip (Right)
    0, 14, 8,  // Center -> EdgeR -> WaistR
    0, 12, 14, // Center -> Spine -> EdgeR

    // Beak Base
    12, 13, 16, // NeckSpine -> NeckEdgeL -> BeakEdgeL
    12, 16, 15, // NeckSpine -> BeakEdgeL -> BeakSpine
    12, 17, 14, // NeckSpine -> BeakEdgeR -> NeckEdgeR (Corrected Winding)
    12, 15, 17, // NeckSpine -> BeakSpine -> BeakEdgeR

    // Beak Tip
    15, 16, 4,  // BeakSpine -> BeakEdgeL -> Tip
    15, 4, 17   // BeakSpine -> Tip -> BeakEdgeR
]

interface PaperSheetProps {
    step: number
    progress: number
    isReleasing?: boolean
    lastWish?: string | null
    onSelectWish?: (wish: string | null) => void
    color?: string
}

export function PaperFoldingEngine({ step, progress, isReleasing, lastWish, onSelectWish, color = '#e0e0e0' }: PaperSheetProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const groupRef = useRef<THREE.Group>(null)

    // Dynamic Material based on color prop
    const material = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            side: THREE.DoubleSide,
            roughness: 0.6,
            metalness: 0.1,
            flatShading: true,
        })
    }, [color])

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const vertFloat = new Float32Array(S0)
        geo.setAttribute('position', new THREE.BufferAttribute(vertFloat, 3))
        geo.setIndex(INDICES)
        geo.computeVertexNormals() // Splits normals at non-manifold edges (Wing/Body seam)
        return geo
    }, [])

    useFrame((state, delta) => {
        // FLIGHT ANIMATION
        if (isReleasing && groupRef.current) {
            // Fly primarily AWAY (Z) and slightly UP (Y)
            // Camera is zooming out (Z+), so we reduce crane Z speed to let camera do the work
            groupRef.current.position.z -= delta * 4
            groupRef.current.position.y += delta * 1.5 // Gentle rise

            // Rotation for natural flight
            groupRef.current.rotation.x -= delta * 0.5
            groupRef.current.rotation.z += delta * 0.2

            // Dynamic Scaling: Transition from Folding Scale (0.85) to World Scale (1.2)
            // This ensures it doesn't look tiny in the gallery, but fits the screen during folding.
            const currentScale = groupRef.current.scale.x
            if (currentScale < 1.25) {
                const growFactor = delta * 0.5 // Grow speed
                const newScale = Math.min(currentScale + growFactor, 1.25)
                groupRef.current.scale.setScalar(newScale)
            }
        }

        if (!meshRef.current) return
        const geo = meshRef.current.geometry
        const pos = geo.attributes.position.array as Float32Array

        // ROTATIONAL LOGIC FOR STEP 0 (Diagonal Fold)
        // Avoids linear "crushing" through origin
        if (step === 3) {
            const testStart = S_BirdBase[0]
            const testEnd = S3[0]
            if (Math.random() < 0.01) {
                // console.log(`Step 3 Debug: P=${progress.toFixed(2)} StartLen=${S_BirdBase.length} EndLen=${S3.length} Start[0]=${testStart} End[0]=${testEnd}`)
            }
        }

        if (step === 0) {
            const axis = new THREE.Vector3(1, 1, 0).normalize()
            const angle = progress * Math.PI // 180 degrees

            // Vertices "Above" the fold line y=x that need to rotate
            // 3: Tail Tip, 5: Waist T, 6: Waist L, 9-11: Knees, 19: RootRB, 21: RootLB
            const MOVING_INDICES = [3, 5, 6, 9, 10, 11, 19, 21]

            for (let i = 0; i < 22; i++) {
                if (MOVING_INDICES.includes(i)) {
                    // Start from S0 (Flat)
                    const v = new THREE.Vector3(S0[i * 3], S0[i * 3 + 1], S0[i * 3 + 2])
                    // Rotate axis angle
                    // Negative angle implies "folding down/under"? 
                    // Let's try PI (Positive) -> Rotates "Up" towards -Z? Z is up? 
                    // Coordinate system: Y Up? Z Depth?
                    // Flat paper is on Z=0.
                    // Axis (1,1,0). Vertex (-1,1,0).
                    // Cross (1,1,0)x(-1,1,0) = (0,0,2). +Z axis.
                    // Positive rotation around Axis would push (-1,1) towards -Z (Right Hand Rule on Axis).
                    // We want it to fold "Up" (towards +Z)? 
                    // No, "Up" relative to table might be +Z if camera looks down -Z.
                    // Usually Z is depth.
                    // Let's assume we want a visible arc. 
                    // Try Angle = PI.
                    v.applyAxisAngle(axis, angle)

                    pos[i * 3] = v.x
                    pos[i * 3 + 1] = v.y
                    pos[i * 3 + 2] = v.z
                } else {
                    // Static vertices stay at S0
                    pos[i * 3] = S0[i * 3]
                    pos[i * 3 + 1] = S0[i * 3 + 1]
                    pos[i * 3 + 2] = S0[i * 3 + 2]
                }
            }
        }
        else {
            // STANDARD LERP FOR OTHER STEPS
            let start = S0
            let end = S0
            let p = progress

            // UPDATED STEP LOGIC with S1 and S2
            if (step === 1) {
                start = S1
                end = S2 // Fold Diamond
            } else if (step === 2) {
                // Step 2: Wings & Head (Diamond -> Crane)
                start = S2
                end = S3
                p = progress
            }

            // Safety for final step completion
            if (step >= 3) { start = S3; end = S3; p = 1 }

            for (let i = 0; i < start.length; i++) {
                pos[i] = start[i] + (end[i] - start[i]) * p
            }
        }

        geo.attributes.position.needsUpdate = true
        geo.computeVertexNormals()
    })

    return (
        <group ref={groupRef} scale={0.85} rotation={[0, Math.PI / 4, 0]}>
            <mesh ref={meshRef} geometry={geometry} material={material} />
        </group>
    )
}
