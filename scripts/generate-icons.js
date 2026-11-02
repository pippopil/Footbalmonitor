import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Gradient / radial distance to center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.45;
      if (dist < radius) {
        // Glowing emerald green center
        const factor = Math.max(0, 1 - dist / radius);
        rawData[pxOffset] = Math.min(255, Math.floor(16 + factor * 20)); // R
        rawData[pxOffset + 1] = Math.min(255, Math.floor(185 + factor * 70)); // G
        rawData[pxOffset + 2] = Math.min(255, Math.floor(129 + factor * 50)); // B
      } else {
        // Dark slate background
        rawData[pxOffset] = 2; // R #020617
        rawData[pxOffset + 1] = 6; // G
        rawData[pxOffset + 2] = 23; // B
      }
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c >>> 0;
}

const outDir = path.resolve('public/assets');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, 192, 16, 185, 129));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, 512, 16, 185, 129));
fs.writeFileSync(path.join(outDir, 'icon-maskable-192.png'), createPNG(192, 192, 16, 185, 129));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), createPNG(512, 512, 16, 185, 129));

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#020617"/>
  <circle cx="256" cy="256" r="180" stroke="#10b981" stroke-width="24" stroke-opacity="0.3"/>
  <circle cx="256" cy="256" r="120" stroke="#10b981" stroke-width="28" stroke-dasharray="24 16"/>
  <circle cx="256" cy="256" r="60" fill="#10b981" fill-opacity="0.2" stroke="#34d399" stroke-width="20"/>
  <path d="M256 136V256L340 340" stroke="#10b981" stroke-width="28" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="24" fill="#34d399"/>
</svg>`;

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgIcon);
console.log('Icons generated successfully in public/assets/');
