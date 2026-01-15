// Script to parse the STL file and extract vertex data
// Run with: node parseStl.js

const fs = require('fs');

const stlPath = 'Origami paper crane.stl';
const content = fs.readFileSync(stlPath, 'utf8');

// Check if it's ASCII STL (starts with "solid")
const isAscii = content.trim().startsWith('solid');

if (!isAscii) {
    console.log('Binary STL detected. Converting...');
    // For binary STL, we'd need a different parser
    // Let's try to read the first few bytes to understand format
    const buffer = fs.readFileSync(stlPath);
    console.log('File size:', buffer.length, 'bytes');
    console.log('First 80 bytes (header):', buffer.slice(0, 80).toString('ascii'));
    console.log('Triangles count:', buffer.readUInt32LE(80));
    process.exit(1);
}

console.log('ASCII STL detected. Parsing...');

// Parse ASCII STL
const vertices = [];
const uniqueVertices = new Map();
const triangles = [];

const lines = content.split('\n');
let currentTriangle = [];

for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('vertex ')) {
        const parts = trimmed.split(/\s+/);
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);

        // Round for deduplication
        const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;

        if (!uniqueVertices.has(key)) {
            uniqueVertices.set(key, uniqueVertices.size);
            vertices.push({ x, y, z });
        }

        currentTriangle.push(uniqueVertices.get(key));

        if (currentTriangle.length === 3) {
            triangles.push([...currentTriangle]);
            currentTriangle = [];
        }
    }
}

// Calculate bounding box
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;
let minZ = Infinity, maxZ = -Infinity;

for (const v of vertices) {
    minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
}

console.log('\n=== STL ANALYSIS ===');
console.log(`Unique vertices: ${vertices.length}`);
console.log(`Triangles: ${triangles.length}`);
console.log(`Bounding box:`);
console.log(`  X: ${minX.toFixed(4)} to ${maxX.toFixed(4)} (width: ${(maxX - minX).toFixed(4)})`);
console.log(`  Y: ${minY.toFixed(4)} to ${maxY.toFixed(4)} (height: ${(maxY - minY).toFixed(4)})`);
console.log(`  Z: ${minZ.toFixed(4)} to ${maxZ.toFixed(4)} (depth: ${(maxZ - minZ).toFixed(4)})`);

// Normalize vertices to fit in [-1, 1] range centered at origin
const centerX = (minX + maxX) / 2;
const centerY = (minY + maxY) / 2;
const centerZ = (minZ + maxZ) / 2;
const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);

console.log('\n=== NORMALIZED VERTICES ===');
console.log('const STL_VERTICES = [');
for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const nx = ((v.x - centerX) / maxDim * 2).toFixed(4);
    const ny = ((v.y - centerY) / maxDim * 2).toFixed(4);
    const nz = ((v.z - centerZ) / maxDim * 2).toFixed(4);
    console.log(`    ${nx}, ${ny}, ${nz},  // ${i}`);
}
console.log('];');

console.log('\nconst STL_INDICES = [');
for (const tri of triangles) {
    console.log(`    ${tri[0]}, ${tri[1]}, ${tri[2]},`);
}
console.log('];');
