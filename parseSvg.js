// Script to parse traditionalCrane.svg and extract vertex/edge data
// Run with: node parseSvg.js

const fs = require('fs');

const svgContent = fs.readFileSync('traditionalCrane.svg', 'utf8');

// Paper boundary from SVG: rect x="428.459" y="288" width="588.544" height="588.544"
const PAPER_X = 428.459;
const PAPER_Y = 288;
const PAPER_SIZE = 588.544;

// Normalize to [-1, 1] range
function normalizeCoord(x, y) {
    const nx = ((x - PAPER_X) / PAPER_SIZE) * 2 - 1;
    const ny = ((y - PAPER_Y) / PAPER_SIZE) * 2 - 1;
    return [parseFloat(nx.toFixed(4)), parseFloat(ny.toFixed(4))];
}

// Parse all lines from SVG
const lineRegex = /<line[^>]*x1="([^"]+)"[^>]*y1="([^"]+)"[^>]*x2="([^"]+)"[^>]*y2="([^"]+)"[^>]*\/>/g;
const colorRegex = /stroke="#([A-F0-9]+)"/i;

const vertices = new Map(); // Use map to dedupe by coordinate string
const edges = [];

let match;
while ((match = lineRegex.exec(svgContent)) !== null) {
    const fullLine = match[0];
    const x1 = parseFloat(match[1]);
    const y1 = parseFloat(match[2]);
    const x2 = parseFloat(match[3]);
    const y2 = parseFloat(match[4]);

    const colorMatch = fullLine.match(colorRegex);
    let foldType = 'boundary';
    if (colorMatch) {
        const color = colorMatch[1].toUpperCase();
        if (color === '0000FF') foldType = 'valley';
        else if (color === 'FF0000') foldType = 'mountain';
        else if (color === 'FFFF00') foldType = 'flat';
    }

    const [nx1, ny1] = normalizeCoord(x1, y1);
    const [nx2, ny2] = normalizeCoord(x2, y2);

    // Add vertices
    const key1 = `${nx1},${ny1}`;
    const key2 = `${nx2},${ny2}`;

    if (!vertices.has(key1)) {
        vertices.set(key1, { x: nx1, y: ny1, index: vertices.size });
    }
    if (!vertices.has(key2)) {
        vertices.set(key2, { x: nx2, y: ny2, index: vertices.size });
    }

    edges.push({
        v1: vertices.get(key1).index,
        v2: vertices.get(key2).index,
        type: foldType
    });
}

// Output results
console.log('// VERTICES (normalized to [-1, 1])');
console.log('const VERTICES = [');
const sortedVertices = [...vertices.values()].sort((a, b) => a.index - b.index);
sortedVertices.forEach((v, i) => {
    console.log(`    ${v.x}, 0, ${v.y},  // ${i}`);
});
console.log('];');

console.log('\n// EDGES');
console.log('const EDGES = [');
edges.forEach(e => {
    console.log(`    { v1: ${e.v1}, v2: ${e.v2}, type: '${e.type}' },`);
});
console.log('];');

console.log(`\n// Total: ${vertices.size} vertices, ${edges.length} edges`);
