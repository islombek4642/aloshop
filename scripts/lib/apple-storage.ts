import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { AppleModelEntry } from './apple-api';

/**
 * Apple Smartfonlari Fayl Tizimi va Saqlash Menejeri
 * Standartlar: AGENTS.md (Zero Emojis, TypeScript Strict, Separation of Concerns)
 */

export function getSeriesSlug(series: string): string {
  return series.toLowerCase().replace(/\s+/g, '-');
}

export function getModelDirectory(model: AppleModelEntry, baseDir?: string): string {
  const rootDir = baseDir || path.resolve(process.cwd(), 'data/apple');
  const seriesSlug = getSeriesSlug(model.series);
  return path.join(rootDir, seriesSlug, model.modelCode);
}

export function saveAppleModelSpecs(model: AppleModelEntry, baseDir?: string): string {
  const modelDir = getModelDirectory(model, baseDir);
  const imagesDir = path.join(modelDir, 'images');

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const specsPath = path.join(modelDir, 'specs.json');
  fs.writeFileSync(specsPath, JSON.stringify(model, null, 2), 'utf-8');

  return specsPath;
}

export async function downloadAppleImage(
  imageUrl: string,
  destPath: string,
  retries = 2
): Promise<boolean> {
  // Idempotency tekshiruvi: fayl mavjud va hajmi 1KB dan katta bo'lsa qayta yuklamaymiz
  if (fs.existsSync(destPath)) {
    const stats = fs.statSync(destPath);
    if (stats.size > 1024) {
      return true;
    }
  }

  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const fileStream = fs.createWriteStream(destPath);
      // @ts-expect-error Node fetch stream vs Web stream
      await pipeline(Readable.fromWeb(response.body), fileStream);

      return true;
    } catch (error) {
      if (attempt <= retries) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      } else {
        console.error(`Rasmni yuklashda xatolik yuz berdi (${imageUrl}):`, error);
        return false;
      }
    }
  }

  return false;
}

