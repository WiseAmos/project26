// Binary STL parser - extracts vertices and simplifies the mesh
// Run with: node parseBinaryStl.js

const fs = require('fs');

const stlPath = 'Origami paper crane.stl';
const buffer = fs.readFileSync(stlPath);

// Binary STL format:
// 80 bytes: header
// 4 bytes: number of triangles
// For each triangle (50 bytes):
//   12 bytes: normal (3 floats)
//   12 bytes: vertex1 (3 floats)
//   12 bytes: vertex2 (3 floats)
//   12 bytes: vertex3 (3 floats)
//   2 bytes: attribute

const numTriangles = buffer.readUInt32LE(80);
console.log(`Number of triangles: ${numTriangles}`);

const vertices = [];
const uniqueVertices = new Map();
const triangles = [];

let offset = 84; // Start after header and count

for (let i = 0; i < numTriangles; i++) {
    // Skip normal (12 bytes)
    offset += 12;

    const triIndices = [];

    // Read 3 vertices
    for (let v = 0; v < 3; v++) {
        const x = buffer.readFloatLE(offset);
        const y = buffer.readFloatLE(offset + 4);
        const z = buffer.readFloatLE(offset + 8);
        offset += 12;

        // Round for deduplication
        const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;

        if (!uniqueVertices.has(key)) {
            uniqueVertices.set(key, uniqueVertices.size);
            vertices.push({ x, y, z });
        }

        triIndices.push(uniqueVertices.get(key));
    }

    triangles.push(triIndices);

    // Skip attribute (2 bytes)
    offset += 2;
}

console.log(`\nUnique vertices: ${vertices.length}`);
console.log(`Triangles: ${triangles.length}`);

// Calculate bounding box
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

for (const v of vertices) {
    minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
}

console.log(`\nBounding box:`);
console.log(`  X: ${minX.toFixed(2)} to ${maxX.toFixed(2)} (width: ${(maxX - minX).toFixed(2)})`);
console.log(`  Y: ${minY.toFixed(2)} to ${maxY.toFixed(2)} (height: ${(maxY - minY).toFixed(2)})`);
console.log(`  Z: ${minZ.toFixed(2)} to ${maxZ.toFixed(2)} (depth: ${(maxZ - minZ).toFixed(2)})`);

// Normalize to [-1, 1] range centered at origin
const centerX = (minX + maxX) / 2;
const centerY = (minY + maxY) / 2;
const centerZ = (minZ + maxZ) / 2;
const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
const scale = 2 / maxDim;

console.log(`\nCenter: (${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)})`);
console.log(`Max dimension: ${maxDim.toFixed(2)}`);

// Write simplified data to JSON file for use in React
const normalizedVertices = vertices.map(v => ({
    x: (v.x - centerX) * scale,
    y: (v.y - centerY) * scale,
    z: (v.z - centerZ) * scale
}));

// Since there are too many vertices, let's sample key structural points
// We'll export ALL vertices and let Three.js handle the rendering

// Create Float32Array compatible output
const vertexArray = [];
for (const v of normalizedVertices) {
    vertexArray.push(v.x, v.y, v.z);
}

const indexArray = [];
for (const tri of triangles) {
    indexArray.push(tri[0], tri[1], tri[2]);
}

// Write to JSON
const output = {
    vertices: vertexArray,
    indices: indexArray,
    stats: {
        numVertices: vertices.length,
        numTriangles: triangles.length,
        boundingBox: { minX, maxX, minY, maxY, minZ, maxZ }
    }
};

fs.writeFileSync('craneModel.json', JSON.stringify(output));
console.log(`\nSaved to craneModel.json`);
console.log(`Vertex array length: ${vertexArray.length} (${vertices.length} vertices * 3)`);
console.log(`Index array length: ${indexArray.length} (${triangles.length} triangles * 3)`);
