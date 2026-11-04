import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/**
 * Clean Apple Backgrounds Script
 *
 * Removes the #f5f5f7 (RGB 240-249) light gray studio background box baked into
 * Apple official CDN assets, producing 100% transparent PNGs matching Samsung assets.
 *
 * Adheres to:
 * - AGENTS.md Rule 3.4 (Zero Emojis Policy)
 * - Strict TypeScript (No `any`)
 * - Pure Node.js (node:zlib, node:fs) without external image processing dependencies
 */

export interface PngChunk {
  type: string;
  data: Buffer;
}

export interface DecodedPng {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  rawRgba: Buffer;
  extraChunks: PngChunk[];
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function calculateCrc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(calculateCrc32(typeAndData), 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function decodePng(buf: Buffer): DecodedPng {
  if (buf.length < 8) {
    throw new Error("Invalid PNG: file buffer too small");
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(signature)) {
    throw new Error("Invalid PNG: header signature mismatch");
  }

  let offset = 8;
  let ihdrData: Buffer | null = null;
  const idatBuffers: Buffer[] = [];
  const extraChunks: PngChunk[] = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buf.subarray(offset + 8, offset + 8 + len);

    if (type === "IHDR") {
      ihdrData = data;
    } else if (type === "IDAT") {
      idatBuffers.push(data);
    } else if (type !== "IEND") {
      extraChunks.push({ type, data });
    }

    offset += 8 + len + 4;
  }

  if (!ihdrData) {
    throw new Error("Invalid PNG: missing IHDR chunk");
  }

  const width = ihdrData.readUInt32BE(0);
  const height = ihdrData.readUInt32BE(4);
  const bitDepth = ihdrData[8];
  const colorType = ihdrData[9];

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Unsupported PNG: bitDepth=${bitDepth}, colorType=${colorType} (requires 8-bit RGBA)`);
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));
  const bpp = 4;
  const stride = width * bpp;
  const rawRgba = Buffer.alloc(width * height * 4);

  let srcOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = decompressed[srcOffset++];
    const prevRowOffset = (y - 1) * stride;
    const currRowOffset = y * stride;

    for (let x = 0; x < stride; x++) {
      const byteVal = decompressed[srcOffset++];
      const a = x >= bpp ? rawRgba[currRowOffset + x - bpp] : 0;
      const b = y > 0 ? rawRgba[prevRowOffset + x] : 0;
      const c = y > 0 && x >= bpp ? rawRgba[prevRowOffset + x - bpp] : 0;

      let val = 0;
      if (filter === 0) val = byteVal;
      else if (filter === 1) val = (byteVal + a) & 0xff;
      else if (filter === 2) val = (byteVal + b) & 0xff;
      else if (filter === 3) val = (byteVal + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) val = (byteVal + paethPredictor(a, b, c)) & 0xff;
      else throw new Error(`Unknown filter method: ${filter}`);

      rawRgba[currRowOffset + x] = val;
    }
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    rawRgba,
    extraChunks,
  };
}

export function cleanBackgroundRgba(rawRgba: Buffer, width: number, height: number): number {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  function isBackgroundCandidate(idx: number): boolean {
    const byteIdx = idx * 4;
    const a = rawRgba[byteIdx + 3];
    if (a === 0) return true;
    const r = rawRgba[byteIdx];
    const g = rawRgba[byteIdx + 1];
    const b = rawRgba[byteIdx + 2];
    // Apple studio background is #f5f5f7 (rgb 245, 245, 247).
    // In edge blending / anti-aliasing it lies within RGB 240-249.
    return r >= 240 && r <= 249 && g >= 240 && g <= 249 && b >= 240 && b <= 249;
  }

  // Seed BFS with outer borders and pre-existing transparent regions
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      const a = rawRgba[idx * 4 + 3];
      if ((a === 0 || isEdge) && isBackgroundCandidate(idx)) {
        visited[idx] = 1;
        queue[tail++] = idx;
      }
    }
  }

  // Flood fill adjacent background pixels
  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    if (cx > 0) {
      const n = curr - 1;
      if (!visited[n] && isBackgroundCandidate(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cx < width - 1) {
      const n = curr + 1;
      if (!visited[n] && isBackgroundCandidate(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cy > 0) {
      const n = curr - width;
      if (!visited[n] && isBackgroundCandidate(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (cy < height - 1) {
      const n = curr + width;
      if (!visited[n] && isBackgroundCandidate(n)) {
        visited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  // Make all connected studio background pixels 100% transparent
  let clearedCount = 0;
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      const idx = i * 4;
      if (rawRgba[idx + 3] !== 0) {
        clearedCount++;
        rawRgba[idx] = 0;
        rawRgba[idx + 1] = 0;
        rawRgba[idx + 2] = 0;
        rawRgba[idx + 3] = 0;
      }
    }
  }

  return clearedCount;
}

export function encodePng(
  width: number,
  height: number,
  rawRgba: Buffer,
  extraChunks: PngChunk[] = []
): Buffer {
  const stride = width * 4;
  const scanlineSize = 1 + stride;
  const scanlines = Buffer.alloc(height * scanlineSize);

  for (let y = 0; y < height; y++) {
    const lineStart = y * scanlineSize;
    scanlines[lineStart] = 0; // Filter 0 (None)
    rawRgba.copy(scanlines, lineStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk data (13 bytes)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Compression deflate
  ihdrData[11] = 0; // Filter method 0
  ihdrData[12] = 0; // Interlace none

  const ihdrChunk = createChunk("IHDR", ihdrData);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  const chunks: Buffer[] = [signature, ihdrChunk];

  // Preserve ancillary chunks (e.g. pHYs)
  for (const chunk of extraChunks) {
    if (chunk.type !== "IHDR" && chunk.type !== "IDAT" && chunk.type !== "IEND") {
      chunks.push(createChunk(chunk.type, chunk.data));
    }
  }

  chunks.push(idatChunk, iendChunk);
  return Buffer.concat(chunks);
}

export function cleanApplePngFile(filePath: string): { changed: boolean; pixelsCleared: number } {
  const originalBuf = fs.readFileSync(filePath);
  const decoded = decodePng(originalBuf);
  const pixelsCleared = cleanBackgroundRgba(decoded.rawRgba, decoded.width, decoded.height);

  if (pixelsCleared > 0) {
    const cleanBuf = encodePng(
      decoded.width,
      decoded.height,
      decoded.rawRgba,
      decoded.extraChunks
    );
    fs.writeFileSync(filePath, cleanBuf);
    return { changed: true, pixelsCleared };
  }

  return { changed: false, pixelsCleared: 0 };
}

function findPngFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPngFiles(full));
    } else if (entry.name.endsWith(".png")) {
      results.push(full);
    }
  }
  return results;
}

export async function cleanAllAppleImages(directories: string[]): Promise<{
  totalFiles: number;
  cleanedFiles: number;
  skippedFiles: number;
  totalPixelsCleared: number;
}> {
  const allFiles: string[] = [];
  for (const d of directories) {
    allFiles.push(...findPngFiles(d));
  }

  let cleanedFiles = 0;
  let skippedFiles = 0;
  let totalPixelsCleared = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    process.stdout.write(`[${i + 1}/${allFiles.length}] ${relPath} ... `);

    const result = cleanApplePngFile(file);
    if (result.changed) {
      cleanedFiles++;
      totalPixelsCleared += result.pixelsCleared;
      process.stdout.write(`CLEANED (${result.pixelsCleared} px)\n`);
    } else {
      skippedFiles++;
      process.stdout.write("SKIPPED (already transparent)\n");
    }
  }

  return {
    totalFiles: allFiles.length,
    cleanedFiles,
    skippedFiles,
    totalPixelsCleared,
  };
}

async function main(): Promise<void> {
  console.log("====================================================");
  console.log("Apple PNG Background Transparency Cleaner");
  console.log("====================================================");

  const startTime = Date.now();
  const rootDir = process.cwd();
  const targetDirs = [
    path.join(rootDir, "public", "images", "products", "apple"),
    path.join(rootDir, "data", "apple"),
  ];

  const summary = await cleanAllAppleImages(targetDirs);
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n====================================================");
  console.log("Processing Complete");
  console.log("====================================================");
  console.log(`Total files inspected: ${summary.totalFiles}`);
  console.log(`Files cleaned: ${summary.cleanedFiles}`);
  console.log(`Files skipped: ${summary.skippedFiles}`);
  console.log(`Total background pixels cleared: ${summary.totalPixelsCleared}`);
  console.log(`Elapsed time: ${durationSec} seconds`);
}

if (require.main === module || process.argv[1]?.includes("clean-apple-backgrounds")) {
  main().catch((err: unknown) => {
    console.error("Fatal error during processing:", err);
    process.exit(1);
  });
}
