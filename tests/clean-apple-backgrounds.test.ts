import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

interface PixelRgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface DecodedPng {
  width: number;
  height: number;
  getPixel: (x: number, y: number) => PixelRgba;
}

function decodePngRgba(buf: Buffer): DecodedPng {
  let offset = 8;
  let ihdrData: Buffer | null = null;
  const idatBuffers: Buffer[] = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      ihdrData = data;
    } else if (type === "IDAT") {
      idatBuffers.push(data);
    }
    offset += 8 + len + 4;
  }

  if (!ihdrData) {
    throw new Error("Missing IHDR chunk");
  }

  const width = ihdrData.readUInt32BE(0);
  const height = ihdrData.readUInt32BE(4);
  const bitDepth = ihdrData[8];
  const colorType = ihdrData[9];

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatBuffers));
  const bpp = 4;
  const stride = width * bpp;
  const rawRgba = Buffer.alloc(width * height * 4);

  let srcOffset = 0;

  function paethPredictor(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

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
    getPixel(x: number, y: number): PixelRgba {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        throw new Error(`Coordinates out of bounds: (${x}, ${y}) in ${width}x${height}`);
      }
      const idx = (y * width + x) * 4;
      return {
        r: rawRgba[idx],
        g: rawRgba[idx + 1],
        b: rawRgba[idx + 2],
        a: rawRgba[idx + 3],
      };
    },
  };
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

export interface VerificationResult {
  success: boolean;
  totalImages: number;
  passedImages: number;
  failedImages: number;
  errors: string[];
}

export function verifyAppleImagesTransparency(): VerificationResult {
  const rootDir = process.cwd();
  const targetDirs = [
    path.join(rootDir, "public", "images", "products", "apple"),
    path.join(rootDir, "data", "apple"),
  ];

  const allFiles: string[] = [];
  for (const d of targetDirs) {
    allFiles.push(...findPngFiles(d));
  }

  const errors: string[] = [];
  let passedImages = 0;
  let failedImages = 0;

  for (const file of allFiles) {
    try {
      const buf = fs.readFileSync(file);
      const decoded = decodePngRgba(buf);
      const relPath = path.relative(rootDir, file).replace(/\\/g, "/");

      // Background test points:
      // (10, 400), (decoded.width - 40, 400), (10, 600), (decoded.width - 40, 600)
      const testPoints: [number, number][] = [
        [10, 400],
        [decoded.width - 40, 400],
        [10, 600],
        [decoded.width - 40, 600],
      ];

      let imageFailed = false;
      for (const [x, y] of testPoints) {
        const pixel = decoded.getPixel(x, y);
        if (pixel.a !== 0) {
          errors.push(
            `Background not transparent in ${relPath} at (${x}, ${y}): rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${pixel.a}) (expected alpha === 0)`
          );
          imageFailed = true;
          break;
        }
      }

      // Check center phone subject (must NOT be transparent)
      const centerX = Math.floor(decoded.width / 2);
      const centerY = Math.floor(decoded.height / 2);
      const centerPixel = decoded.getPixel(centerX, centerY);
      if (centerPixel.a === 0) {
        errors.push(
          `Phone subject was accidentally cleared in ${relPath} at center (${centerX}, ${centerY}): alpha is 0`
        );
        imageFailed = true;
      }

      if (imageFailed) {
        failedImages++;
      } else {
        passedImages++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to verify ${file}: ${msg}`);
      failedImages++;
    }
  }

  return {
    success: errors.length === 0 && allFiles.length > 0,
    totalImages: allFiles.length,
    passedImages,
    failedImages,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("clean-apple-backgrounds.test")) {
  console.log("====================================================");
  console.log("Verifying Apple PNG Background Transparency");
  console.log("====================================================");

  const result = verifyAppleImagesTransparency();

  console.log(`Total Apple images evaluated: ${result.totalImages}`);
  console.log(`Passed: ${result.passedImages}`);
  console.log(`Failed: ${result.failedImages}`);

  if (!result.success) {
    console.error("\nErrors detected (showing first 10):");
    for (const err of result.errors.slice(0, 10)) {
      console.error(`  - ${err}`);
    }
    if (result.errors.length > 10) {
      console.error(`  ... and ${result.errors.length - 10} more errors.`);
    }
    process.exit(1);
  } else {
    console.log("\nAll Apple images have 100% transparent studio background!");
  }
}
