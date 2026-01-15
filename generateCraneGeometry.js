// Script to parse SVG, triangulate the mesh, and generate folded positions
// Run with: node generateCraneGeometry.js

const fs = require('fs');

// ============================================================================
// PARSED DATA FROM traditionalCrane.svg
// ============================================================================

// Key vertices for crane structure (simplified from full 66-vertex pattern)
// Based on the crease pattern, we identify the PRIMARY 22 vertices that matter
// for the crane shape (corners, wing tips, tail, head, body)

// Looking at the pattern:
// - Corners at (-1,-1), (1,-1), (-1,1), (1,1) -> normalized
// - Center at (0,0)
// - Wing tips on diagonal: (1,1) = bottom-right and (-1,-1) = top-left
// - Tail/Head corners: (-1,1) = top-left, (1,-1) = bottom-right

// Key structural vertices from the SVG (simplified):
const KEY_VERTICES_2D = {
    // Corners (paper boundary)
    TR: [1, 1],        // Top-Right: becomes WING R TIP
    BL: [-1, -1],      // Bottom-Left: becomes WING L TIP  
    TL: [-1, 1],       // Top-Left: becomes TAIL TIP
    BR: [1, -1],       // Bottom-Right: becomes BEAK TIP

    // Edge midpoints (waist)
    TOP: [0, 1],       // Top edge midpoint
    BOTTOM: [0, -1],   // Bottom edge midpoint
    LEFT: [-1, 0],     // Left edge midpoint
    RIGHT: [1, 0],     // Right edge midpoint

    // Center
    CENTER: [0, 0],

    // Inner vertices for body structure
    INNER_TR: [0.5858, 0],      // vertex 3 in parsed data
    INNER_BL: [-0.5858, 0],     // vertex 7
    INNER_TL: [0, 0.5858],      // vertex 8
    INNER_BR: [0, -0.5858],     // vertex 2

    // Wing root points (key for wing attachment)
    WING_R_ROOT_F: [0.3318, 0],  // vertex 4
    WING_R_ROOT_B: [0, 0.3318],  // vertex 9
    WING_L_ROOT_F: [-0.3318, 0], // vertex 26
    WING_L_ROOT_B: [0, -0.3318], // vertex 14
};

// Generate flat (unfolded) vertex positions - XZ plane (Y=0)
const FLAT_POSITIONS = [];
function addVertex(x, y) {
    const idx = FLAT_POSITIONS.length / 3;
    FLAT_POSITIONS.push(x, 0, y); // XZ plane
    return idx;
}

// Build vertex array in order:
// 0: Center
const V_CENTER = addVertex(0, 0);
// 1-4: Corners (will be wing tips and tail/head)
const V_WING_R = addVertex(1, 1);      // TR - Wing R tip
const V_WING_L = addVertex(-1, -1);    // BL - Wing L tip
const V_TAIL = addVertex(-1, 1);       // TL - Tail tip
const V_HEAD = addVertex(1, -1);       // BR - Head/Beak tip
// 5-8: Edge midpoints (waist)
const V_WAIST_RB = addVertex(0, 1);    // Top
const V_WAIST_LB = addVertex(-1, 0);   // Left
const V_WAIST_LF = addVertex(0, -1);   // Bottom
const V_WAIST_RF = addVertex(1, 0);    // Right
// 9-12: Inner body points
const V_BODY_R = addVertex(0.5, 0);
const V_BODY_L = addVertex(-0.5, 0);
const V_BODY_B = addVertex(0, 0.5);
const V_BODY_F = addVertex(0, -0.5);
// 13-16: Wing roots (split points)
const V_WING_R_ROOT_F = addVertex(0.33, -0.33);
const V_WING_R_ROOT_B = addVertex(0.33, 0.33);
const V_WING_L_ROOT_F = addVertex(-0.33, -0.33);
const V_WING_L_ROOT_B = addVertex(-0.33, 0.33);
// 17-20: Tail/Neck knees
const V_TAIL_KNEE = addVertex(-0.5, 0.5);
const V_NECK_KNEE = addVertex(0.5, -0.5);
const V_BEAK_MID = addVertex(0.75, -0.75);

// FOLDED positions (crane shape - on ground, wings spread)
// Reference: Standard origami crane proportions
const FOLDED_POSITIONS = [
    // 0: Center - raised to form body hump
    0, 0.2, 0,

    // 1: Wing R tip - extends right and slightly up
    1.5, 0.35, 0,

    // 2: Wing L tip - extends left and slightly up
    -1.5, 0.35, 0,

    // 3: Tail tip - rises up and back
    0, 0.9, 0.8,

    // 4: Beak tip - extends forward and slightly down
    0, 0.3, -1.1,

    // 5-8: Waist forms body base (diamond shape)
    0.25, -0.1, 0.25,   // RB
    -0.25, -0.1, 0.25,  // LB
    -0.25, -0.1, -0.25, // LF
    0.25, -0.1, -0.25,  // RF

    // 9-12: Body inner points (raised center)
    0.3, 0.1, 0,        // Body R
    -0.3, 0.1, 0,       // Body L
    0, 0.15, 0.2,       // Body B
    0, 0.15, -0.2,      // Body F

    // 13-16: Wing roots
    0.4, 0.15, -0.15,   // Wing R Root F
    0.4, 0.15, 0.15,    // Wing R Root B
    -0.4, 0.15, -0.15,  // Wing L Root F
    -0.4, 0.15, 0.15,   // Wing L Root B

    // 17-20: Tail/Neck knees
    0, 0.5, 0.4,        // Tail knee
    0, 0.5, -0.4,       // Neck knee
    0, 0.35, -0.7,      // Beak mid
];

// Triangle indices for the crane mesh
const INDICES = [
    // Body center (4 triangles)
    0, 9, 11,   // Center-R-Back
    0, 11, 10,  // Center-Back-L
    0, 10, 12,  // Center-L-Front
    0, 12, 9,   // Center-Front-R

    // Right wing (2 triangles for surface)
    1, 14, 13,  // Tip-RootB-RootF
    9, 1, 14,   // Body-Tip-RootB
    9, 13, 1,   // Body-RootF-Tip

    // Left wing (2 triangles)
    2, 15, 16,  // Tip-RootF-RootB
    10, 2, 16,  // Body-Tip-RootB
    10, 15, 2,  // Body-RootF-Tip

    // Tail section
    11, 17, 3,  // Body-Knee-Tip
    0, 11, 17,  // Center-Body-Knee

    // Neck section  
    12, 18, 4,  // Body-NeckKnee-Beak
    0, 12, 18,  // Center-Body-NeckKnee
    18, 19, 4,  // NeckKnee-BeakMid-Beak
];

console.log('// FLAT VERTICES (21 vertices)');
console.log('const FLAT_VERTICES = [');
for (let i = 0; i < FLAT_POSITIONS.length; i += 3) {
    console.log(`    ${FLAT_POSITIONS[i]}, ${FLAT_POSITIONS[i + 1]}, ${FLAT_POSITIONS[i + 2]},  // ${i / 3}`);
}
console.log('];');

console.log('\n// FOLDED VERTICES (crane shape)');
console.log('const FOLDED_VERTICES = [');
for (let i = 0; i < FOLDED_POSITIONS.length; i += 3) {
    console.log(`    ${FOLDED_POSITIONS[i]}, ${FOLDED_POSITIONS[i + 1]}, ${FOLDED_POSITIONS[i + 2]},  // ${i / 3}`);
}
console.log('];');

console.log('\n// INDICES');
console.log('const INDICES = [');
for (let i = 0; i < INDICES.length; i += 3) {
    console.log(`    ${INDICES[i]}, ${INDICES[i + 1]}, ${INDICES[i + 2]},`);
}
console.log('];');

console.log(`\n// Total: ${FLAT_POSITIONS.length / 3} vertices, ${INDICES.length / 3} triangles`);
