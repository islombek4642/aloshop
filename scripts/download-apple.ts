import path from 'node:path';
import { getAppleCatalog } from './lib/apple-api';
import {
  saveAppleModelSpecs,
  downloadAppleImage,
  getModelDirectory,
} from './lib/apple-storage';

/**
 * Apple Rasmiy Katalog va Rasmlarni Yuklab Olish Skripti
 * Standartlar: AGENTS.md (Zero Emojis, Strict TypeScript, Separation of Concerns)
 */

async function main() {
  console.log('====================================================');
  console.log('Apple Rasmiy Katalog va Rasmlarini Yuklash Jarayoni');
  console.log('====================================================');

  const startTime = Date.now();
  const catalog = getAppleCatalog();
  const baseDir = path.resolve(process.cwd(), 'data/apple');

  console.log(`Jami qamrab olingan modellar soni: ${catalog.length}`);
  console.log(`Saqlash katalogi: ${baseDir}\n`);

  let totalImagesDownloaded = 0;
  let totalImagesSkipped = 0;
  let totalImagesFailed = 0;

  for (let i = 0; i < catalog.length; i++) {
    const model = catalog[i];
    console.log(`[${i + 1}/${catalog.length}] ${model.series} -> ${model.model} (${model.modelCode})`);

    // 1. specs.json ni saqlash
    const specsPath = saveAppleModelSpecs(model, baseDir);
    const modelDir = getModelDirectory(model, baseDir);
    const imagesDir = path.join(modelDir, 'images');

    // 2. Har bir rang uchun rasmni yuklab olish
    for (const color of model.colors) {
      const destImagePath = path.join(imagesDir, color.imageFile);
      process.stdout.write(`  - Rang: ${color.name} (${color.imageFile}) ... `);

      const success = await downloadAppleImage(color.imageUrl, destImagePath);
      if (success) {
        totalImagesDownloaded++;
        process.stdout.write('TAYYOR\n');
      } else {
        totalImagesFailed++;
        process.stdout.write('XATOLIK\n');
      }

      // Xizmat ko'rsatuvchi serverni ortiqcha yuklamaslik uchun qisqa tanaffus
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n====================================================');
  console.log('Yuklash Muvaffaqiyatli Yakunlandi');
  console.log('====================================================');
  console.log(`Jami modellar: ${catalog.length}`);
  console.log(`Yuklangan rasmlar: ${totalImagesDownloaded}`);
  console.log(`Xatoliklar: ${totalImagesFailed}`);
  console.log(`Ketgan vaqt: ${durationSec} soniya`);
  console.log(`Katalog: ${baseDir}`);
}

main().catch((error) => {
  console.error('Kutilmagan xatolik yuz berdi:', error);
  process.exit(1);
});
