#!/usr/bin/env node
/**
 * Generates placeholder assets for Triple Trio using only Node built-ins.
 * Run: node scripts/generate-placeholders.cjs
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');

// CRC32 table and function (PNG uses CRC-32)
const crcTable = (function () {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Minimal silent OGG
const SILENT_OGG_B64 =
  'T2dnUwACAAAAAAAAAAAyzN3NAAAAAGFf2X8BM39GTEFDAQAAAWZMYUMAAAAiEgASAAAAAAAkFQrEQPAAAAAAAAAAAAAAAAAAAAAAAAAAAE9nZ1MAAAAAAAAAAAAAMszdzQEAAAD5LKCSATeEAAAzDQAAAExhdmY1NS40OC4xMDABAAAAGgAAAGVuY29kZXI9TGF2YzU1LjY5LjEwMCBmbGFjT2dnUwAEARIAAAAAAAAyzN3NAgAAAKWVljkCDAD/+GkIAAAdAAABICI=';

const UI_COLORS = {
  'card-frame-blue': 0x2563eb,
  'card-frame-red': 0xdc2626,
  'card-back': 0x374151,
  'board-bg': 0x0f172a,
  'cell-normal': 0x1e3a5f,
  'cell-fire': 0x7f1d1d,
  'cell-ice': 0x0c4a6e,
  'cell-thunder': 0x4c1d95,
  'cell-earth': 0x422006,
  'cell-water': 0x164e63,
  'cell-wind': 0x14532d,
  'cell-holy': 0x713f12,
  'cell-poison': 0x3f1d38,
};

function writeU32(buf, offset, val) {
  buf[offset] = (val >> 24) & 0xff;
  buf[offset + 1] = (val >> 16) & 0xff;
  buf[offset + 2] = (val >> 8) & 0xff;
  buf[offset + 3] = val & 0xff;
}

function createPng(filePath, width, height, color) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  // Build raw scanlines: each row starts with filter byte 0, then RGBA per pixel
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const i = y * rowSize + 1 + x * 4;
      rawData[i] = r;
      rawData[i + 1] = g;
      rawData[i + 2] = b;
      rawData[i + 3] = 255;
    }
  }
  const idat = zlib.deflateSync(rawData, { level: 9 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]),
    Buffer.from('IHDR'),
    ihdr,
  ]);
  const ihdrCrc = Buffer.alloc(4);
  writeU32(ihdrCrc, 0, crc32(Buffer.concat([Buffer.from('IHDR'), ihdr])));
  const idatLen = Buffer.alloc(4);
  writeU32(idatLen, 0, idat.length);
  const idatCrc = Buffer.alloc(4);
  writeU32(idatCrc, 0, crc32(Buffer.concat([Buffer.from('IDAT'), idat])));
  const iend = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const png = Buffer.concat([
    signature,
    ihdrChunk,
    ihdrCrc,
    idatLen,
    Buffer.from('IDAT'),
    idat,
    idatCrc,
    iend,
  ]);
  fs.writeFileSync(filePath, png);
  console.log('Created', filePath);
}

function getSize(name) {
  if (name.startsWith('card-')) return [100, 140];
  if (name.startsWith('board')) return [360, 360];
  return [120, 120];
}

function main() {
  const dirs = [
    path.join(publicDir, 'assets', 'ui'),
    path.join(publicDir, 'assets', 'sfx'),
    path.join(publicDir, 'assets', 'music'),
    path.join(publicDir, 'cards'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (const [name, color] of Object.entries(UI_COLORS)) {
    const [w, h] = getSize(name);
    createPng(path.join(publicDir, 'assets', 'ui', name + '.png'), w, h, color);
  }

  createPng(path.join(publicDir, 'assets', 'bg.png'), 1024, 768, 0x028af8);
  createPng(path.join(publicDir, 'assets', 'logo.png'), 200, 100, 0xffffff);
  createPng(path.join(publicDir, 'assets', 'star.png'), 32, 32, 0xffd700);

  const silentOgg = Buffer.from(SILENT_OGG_B64, 'base64');
  ['card-place', 'card-flip', 'card-capture', 'victory', 'defeat'].forEach((name) => {
    fs.writeFileSync(path.join(publicDir, 'assets', 'sfx', name + '.ogg'), silentOgg);
    console.log('Created', path.join(publicDir, 'assets', 'sfx', name + '.ogg'));
  });
  fs.writeFileSync(path.join(publicDir, 'assets', 'music', 'battle-theme.ogg'), silentOgg);
  console.log('Created', path.join(publicDir, 'assets', 'music', 'battle-theme.ogg'));

  for (let i = 1; i <= 15; i++) {
    const key = 'card_' + String(i).padStart(3, '0');
    createPng(path.join(publicDir, 'cards', key + '.png'), 256, 256, 0x1f2937);
  }

  console.log('Done. Placeholder assets generated.');
}

main();
