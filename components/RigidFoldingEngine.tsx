'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// RIGID FOLDING ENGINE (SEGMENTED SQUARE)
// ============================================================================
// A physically segmented model where each paper section is a separate mesh.
// This guarantees a perfect "Flat Square" start and authentic rigid folding.
// ============================================================================

// -- GEOMETRY HELPERS --

// Creates a shape for the Center Body (Diamond)
// Vertices: Top(0, 1), Right(1, 0), Bottom(0, -1), Left(-1, 0) (Normalized)
// We scale this to our desired size.
const createDiamondShape = (scale: number) => {
    const s = new THREE.Shape()
    s.moveTo(0, scale)
    s.lineTo(scale, 0)
    s.lineTo(0, -scale)
    s.lineTo(-scale, 0)
    s.lineTo(0, scale)
    return s
}

// Creates a Triangle Shape (Standard Right Triangle for Wings)
// Base on Y axis?
// We define shapes such that their "Hinge" is along the Y-axis or X-axis for easy rotation.
// Let's stick to the visual orientation.
const createTriangleShape = (width: number, height: number) => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.lineTo(width, height / 2) // Tip
    s.lineTo(0, height)
    s.lineTo(0, 0)
    return s
}

// -- PROPS --
interface RigidFoldingEngineProps {
    step: number // 0 to 3
    progress: number // 0 to 1
    isReleasing?: boolean
    color?: string
}

export function RigidFoldingEngine({ step, progress, isReleasing, color = '#e0e0e0' }: RigidFoldingEngineProps) {
    const groupRef = useRef<THREE.Group>(null)

    // -- PIVOT REFS --
    const wingLeftPivot = useRef<THREE.Group>(null)
    const wingRightPivot = useRef<THREE.Group>(null)
    const tailPivot = useRef<THREE.Group>(null)
    const tailTipPivot = useRef<THREE.Group>(null)
    const neckPivot = useRef<THREE.Group>(null)
    const headPivot = useRef<THREE.Group>(null)

    // -- MATERIAL --
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        roughness: 0.6,
        metalness: 0.1,
    }), [color])

    // -- GEOMETRIES --
    // We construct a 2x2 Square (Diamond orientation) from 5 parts.
    // Center: Small Diamond (Radius 0.5)
    // Wings: Large Triangles attaching to Left/Right
    // Tail/Neck: Triangles attaching to Top/Bottom

    // Defined Dimensions (for a visually nice crane)
    const BODY_R = 0.5 // Radius of center diamond

    const centerGeo = useMemo(() => new THREE.ShapeGeometry(createDiamondShape(BODY_R)), [])

    // Wing: Attached to the Right Edge of Diamond
    // Right Edge goes from (0, -0.5) to (0.35?? No, (0.5, 0)). 
    // Wait, Diamond (0, 0.5), (0.5, 0), (0, -0.5), (-0.5, 0).
    // Edge length: Sqrt(0.5^2 + 0.5^2) = Sqrt(0.5) = 0.707
    // We want the Wing to be a Triangle that completes the Large Square.
    // Large Square Corner would be at (1.5, 0)?
    // If Center is 0.5.

    // Let's define shapes ALIGNED TO THEIR PIVOTS for easy rotation.
    // Pivot 0,0 is the hinge.

    // WING RIGHT GEOMETRY: 
    // Hinge line is the Diamond Right Edge.
    // We can define the geometry in a local space where X=0 is the hinge line.
    // Vertices: (0, 0.5), (0, -0.5), (1.5, 0)? 
    // This creates a triangle pointing +X.
    const wingGeo = useMemo(() => {
        const s = new THREE.Shape()
        s.moveTo(0, BODY_R)    // Top of hinge
        s.lineTo(0, -BODY_R)   // Bottom of hinge
        s.lineTo(1.5, 0)       // Wing Tip
        s.lineTo(0, BODY_R)
        return new THREE.ShapeGeometry(s)
    }, [])

    // TAIL/NECK GEOMETRY:
    // Hinge line is Diamond Top Edge (for Tail) / Bottom Edge (for Neck).
    // Tail Hinge: Top Edge of Diamond? Or usually the crane tail rises from the "Back".
    // In Bird Base, Tail/Neck are the "Points" coming from the center split.
    // Let's use a simple long triangle.
    // Hinge width: 0.4 (narrower than body width)
    // Length: 1.2
    const stripGeo = useMemo(() => {
        const s = new THREE.Shape()
        s.moveTo(-0.15, 0) // Hinge Left
        s.lineTo(0.15, 0)  // Hinge Right
        s.lineTo(0, 1.2)   // Tip
        s.lineTo(-0.15, 0)
        return new THREE.ShapeGeometry(s)
    }, [])

    // HEAD/TAIL TIP GEOMETRY (Reverse Fold)
    const tipGeo = useMemo(() => {
        const s = new THREE.Shape()
        s.moveTo(0, 0)       // Pivot
        s.lineTo(-0.1, 0.4)  // Back
        s.lineTo(0.1, 0.3)   // Front
        s.lineTo(0, 0)
        return new THREE.ShapeGeometry(s)
    }, [])


    // -- ANIMATION LOOP --
    useFrame((state, delta) => {
        // Flight Release
        if (isReleasing && groupRef.current) {
            groupRef.current.position.z -= delta * 5
            groupRef.current.position.y += delta * 2
            groupRef.current.rotation.x -= delta * 0.5
            return
        }

        // FOLDING LOGIC
        // Map step (0-3) + progress (0-1) to Rotations.
        // T = 0: All Flat.
        // T = 4: Fully Folded.
        const t = step + progress

        // 1. WINGS FOLD DOWN (Step 0 -> 2)
        // Wings start flat (Angle 0). Fold down to ~90 deg (-PI/2).
        // Actually for a crane they fold down about 80 degrees.
        const wingProgress = Math.min(t / 2, 1) // Completes by step 2
        const wingAngle = wingProgress * (Math.PI / 2.2)

        if (wingRightPivot.current) wingRightPivot.current.rotation.z = -wingAngle
        if (wingLeftPivot.current) wingLeftPivot.current.rotation.z = wingAngle

        // 2. NECK & TAIL LIFT UP (Step 1 -> 3)
        // Start lifting after step 0 starts.
        const liftProgress = Math.min(Math.max((t - 0.5) / 2, 0), 1)
        const liftAngle = liftProgress * (Math.PI / 1.8) // Almost vertical (100 deg)
        // Tail lifts "Up" (Rotation X negative? depending on orientation)

        // Pivot orientation:
        // Tail is attached to Body Top. 
        // We rotated it 45 deg to align with Diamond Edge.
        // Local Rotation X will lift it out of plane.

        if (tailPivot.current) {
            // Local axis rotation
            tailPivot.current.rotation.x = liftAngle
        }
        if (neckPivot.current) {
            neckPivot.current.rotation.x = liftAngle
        }

        // 3. REVERSE FOLDS (Head/TailTip) (Step 2.5 -> 3.5)
        const tipProgress = Math.min(Math.max((t - 2.5) / 1, 0), 1)

        if (headPivot.current) {
            // Head bends DOWN
            headPivot.current.rotation.x = tipProgress * (Math.PI / 1.5)
        }
        if (tailTipPivot.current) {
            // Tail tip bends OUT? Or just straightens?
            // Usually tail tip folds IN then OUT. 
            // Simple: moderate bend
            tailTipPivot.current.rotation.x = tipProgress * (Math.PI / 4)
        }
    })

    // -- RENDER --
    // We assemble the crane flat on the XY plane.
    // Body is Diamond.
    // WingRight attaches to Body Right Edge.
    //   Body Right Edge center is (0.25, 0.25)? No.
    //   Diamond vertices: (0, 0.5), (0.5, 0), (0, -0.5), (-0.5, 0).
    //   Right Edge is from (0.5, 0) to (0, -0.5). Midpoint (0.25, -0.25).
    //   Angle: -45 deg? 
    //   Vector (0.5, 0) -> (0, -0.5) is (-0.5, -0.5). Direction (-1, -1). 225 deg?
    //   Wall angle is -45 degrees.

    return (
        <group ref={groupRef} rotation={[0, 0, 0]} scale={0.8}>
            {/* CENTER BODY */}
            <mesh geometry={centerGeo} material={material} />

            {/* WING RIGHT */}
            {/* Pivot must align with the Right-Bottom Edge of Diamond */}
            {/* Edge Center: (0.25, -0.25). Angle: -45 deg (Z axis) ?? */}
            {/* Actually, let's look at the shape. Edge is diagonal. */}
            {/* We position the pivot at the edge center, rotate it to match edge angle. */}
            <group position={[0.25, -0.25, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <group ref={wingRightPivot}>
                    {/* Wing mesh starts at local 0,0 and extends. */}
                    {/* We need to offset the mesh so its hinge line matches the pivot Y axis? */}
                    {/* Our wingGeo hinge is vertical Y axis from -0.5 to 0.5. */}
                    {/* We rotate the mesh +90? */}
                    {/* Let's try: No rotation, just usage. */}
                    <mesh geometry={wingGeo} material={material} />
                </group>
            </group>

            {/* WING LEFT */}
            {/* Edge Center: (-0.25, -0.25). Angle: -135 deg? or 225? */}
            <group position={[-0.25, -0.25, 0]} rotation={[0, 0, Math.PI + Math.PI / 4]}>
                <group ref={wingLeftPivot}>
                    <mesh geometry={wingGeo} material={material} />
                </group>
            </group>

            {/* TAIL (Top Left Edge) */}
            {/* Edge from (0, 0.5) to (-0.5, 0). Mid (-0.25, 0.25). Angle 135 deg? */}
            <group position={[-0.25, 0.25, 0]} rotation={[0, 0, Math.PI / 4]}>
                <group ref={tailPivot}>
                    {/* Strip geo hinge is X axis (-0.15 to 0.15). Length Y. */}
                    {/* We need to rotate it so Y points OUT. */}
                    {/* And rotate so X axis aligns with Body Edge. */}
                    {/* Parent Group rotation handles alignment. */}
                    {/* We just need to ensure Strip extends correctly. */}
                    <mesh geometry={stripGeo} material={material} rotation={[0, 0, -Math.PI / 2]} />

                    {/* Tail Tip */}
                    <group ref={tailTipPivot} position={[1.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                        <mesh geometry={tipGeo} material={material} />
                    </group>
                </group>
            </group>

            {/* NECK (Top Right Edge) */}
            {/* Edge from (0.5, 0) to (0, 0.5). Mid (0.25, 0.25). Angle 45 deg? */}
            {/* Wait, Top Right edge. (0, 0.5) -> (0.5, 0). */}
            <group position={[0.25, 0.25, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <group ref={neckPivot}>
                    <mesh geometry={stripGeo} material={material} rotation={[0, 0, -Math.PI / 2]} />

                    {/* Head Tip */}
                    <group ref={headPivot} position={[1.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                        <mesh geometry={tipGeo} material={material} />
                    </group>
                </group>
            </group>

        </group>
    )
}
