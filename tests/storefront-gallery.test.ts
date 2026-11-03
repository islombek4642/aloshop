import * as fs from "node:fs";
import * as path from "node:path";
import {
  CAROUSEL_AUTOPLAY_INTERVAL_MS,
  getNextGalleryIndex,
  getPrevGalleryIndex,
  computeAutoAdvanceState,
  aggregateModelImages,
} from "../components/store/product-gallery";

export function testStorefrontGallery() {
  const checks: string[] = [];
  const errors: string[] = [];

  // 1. Verify interval constant
  if (CAROUSEL_AUTOPLAY_INTERVAL_MS !== 4000) {
    errors.push(`Expected CAROUSEL_AUTOPLAY_INTERVAL_MS to be 4000, got ${CAROUSEL_AUTOPLAY_INTERVAL_MS}`);
  } else {
    checks.push("Auto-advance interval verified as 4000ms");
  }

  // 2. Verify getNextGalleryIndex cycling
  const total = 3;
  if (getNextGalleryIndex(0, total) !== 1) {
    errors.push(`Expected getNextGalleryIndex(0, 3) to be 1, got ${getNextGalleryIndex(0, total)}`);
  }
  if (getNextGalleryIndex(1, total) !== 2) {
    errors.push(`Expected getNextGalleryIndex(1, 3) to be 2, got ${getNextGalleryIndex(1, total)}`);
  }
  if (getNextGalleryIndex(2, total) !== 0) {
    errors.push(`Expected getNextGalleryIndex(2, 3) to wrap to 0, got ${getNextGalleryIndex(2, total)}`);
  }
  if (getNextGalleryIndex(0, 1) !== 0) {
    errors.push(`Expected getNextGalleryIndex(0, 1) to remain 0 for single image`);
  }
  if (getNextGalleryIndex(0, 0) !== 0) {
    errors.push(`Expected getNextGalleryIndex(0, 0) to be 0 for empty images`);
  }

  if (errors.length === 0) {
    checks.push("Next index helper correctly advances and wraps at boundary");
  }

  // 3. Verify getPrevGalleryIndex cycling
  if (getPrevGalleryIndex(0, total) !== 2) {
    errors.push(`Expected getPrevGalleryIndex(0, 3) to wrap to 2, got ${getPrevGalleryIndex(0, total)}`);
  }
  if (getPrevGalleryIndex(2, total) !== 1) {
    errors.push(`Expected getPrevGalleryIndex(2, 3) to be 1, got ${getPrevGalleryIndex(2, total)}`);
  }
  if (getPrevGalleryIndex(1, total) !== 0) {
    errors.push(`Expected getPrevGalleryIndex(1, 3) to be 0, got ${getPrevGalleryIndex(1, total)}`);
  }

  if (errors.length === 0) {
    checks.push("Prev index helper correctly decrements and wraps at boundary");
  }

  // 4. Verify computeAutoAdvanceState
  // Case A: Normal unpaused advancement
  const unpausedState = computeAutoAdvanceState({
    currentIndex: 1,
    totalImages: 3,
    isPaused: false,
  });
  if (!unpausedState.shouldAdvance || unpausedState.nextIndex !== 2) {
    errors.push(`Failed unpaused advancement: expected nextIndex=2, shouldAdvance=true; got ${JSON.stringify(unpausedState)}`);
  } else {
    checks.push("Auto-advance state correctly advances when unpaused with multiple images");
  }

  // Case B: Paused on hover / touch
  const pausedState = computeAutoAdvanceState({
    currentIndex: 1,
    totalImages: 3,
    isPaused: true,
  });
  if (pausedState.shouldAdvance || pausedState.nextIndex !== 1) {
    errors.push(`Failed paused state: expected nextIndex=1, shouldAdvance=false; got ${JSON.stringify(pausedState)}`);
  } else {
    checks.push("Auto-advance state pauses correctly when isPaused=true");
  }

  // Case C: Single image (no auto-advancing)
  const singleImageState = computeAutoAdvanceState({
    currentIndex: 0,
    totalImages: 1,
    isPaused: false,
  });
  if (singleImageState.shouldAdvance || singleImageState.nextIndex !== 0) {
    errors.push(`Failed single image: expected nextIndex=0, shouldAdvance=false; got ${JSON.stringify(singleImageState)}`);
  } else {
    checks.push("Auto-advance does not trigger for single image");
  }

  // 5. Lifecycle simulation test: hover, touch, manual click reset
  let simulatedIndex = 0;
  let simulatedPaused = false;
  const numImages = 4;

  const tick = () => {
    const res = computeAutoAdvanceState({
      currentIndex: simulatedIndex,
      totalImages: numImages,
      isPaused: simulatedPaused,
    });
    simulatedIndex = res.nextIndex;
    return res.shouldAdvance;
  };

  // Step 1: Normal auto-advance
  tick(); // 0 -> 1
  if (simulatedIndex !== 1) errors.push(`Simulation step 1 failed: index is ${simulatedIndex}`);
  tick(); // 1 -> 2
  if (simulatedIndex !== 2) errors.push(`Simulation step 2 failed: index is ${simulatedIndex}`);

  // Step 2: Hover pauses advancement (mouseEnter)
  simulatedPaused = true;
  tick(); // remains 2
  if (simulatedIndex !== 2) errors.push(`Simulation hover failed: index changed to ${simulatedIndex}`);

  // Step 3: Mouse leave resumes advancement (mouseLeave)
  simulatedPaused = false;
  tick(); // 2 -> 3
  if (simulatedIndex !== 3) errors.push(`Simulation resume failed: index is ${simulatedIndex}`);
  tick(); // 3 -> 0 (wraps around)
  if (simulatedIndex !== 0) errors.push(`Simulation wrap failed: index is ${simulatedIndex}`);

  // Step 4: Mobile touch interaction pause (touchStart -> touchEnd)
  simulatedPaused = true; // touchStart
  tick(); // paused at 0
  if (simulatedIndex !== 0) errors.push(`Simulation touch start failed: index changed while touched`);
  simulatedPaused = false; // touchEnd
  tick(); // resumes: 0 -> 1
  if (simulatedIndex !== 1) errors.push(`Simulation touch end failed: index is ${simulatedIndex}`);

  // Step 5: Manual thumbnail jump
  simulatedIndex = 3; // user clicks thumbnail 3
  tick(); // 3 -> 0
  if (simulatedIndex !== 0) errors.push(`Simulation manual selection failed: index is ${simulatedIndex}`);

  if (errors.length === 0) {
    checks.push("Full lifecycle simulation (hover, touch, wrap, manual jump) passed cleanly");
  }

  // 6. Test Model Image Aggregation across variants
  const mockVariants = [
    { images: ["/img/black-1.webp", "/img/black-2.webp"] },
    { images: ["/img/white-1.webp"] },
    { images: ["/img/black-1.webp", "/img/blue-1.webp"] }, // duplicate black-1
  ];
  const activeVar = { images: ["/img/white-1.webp"] };
  const aggregated = aggregateModelImages(mockVariants, activeVar);

  // Active variant image must come first
  if (aggregated[0] !== "/img/white-1.webp") {
    errors.push(`Expected aggregated[0] to be active variant image '/img/white-1.webp', got ${aggregated[0]}`);
  }
  // Total unique images: white-1, black-1, black-2, blue-1 = 4
  if (aggregated.length !== 4) {
    errors.push(`Expected 4 aggregated unique images, got ${aggregated.length} (${JSON.stringify(aggregated)})`);
  } else {
    checks.push("aggregateModelImages correctly collects unique images prioritizing active variant");
  }

  // 7. Verify ProductGallery and ProductDetailsClient integration
  const clientSourcePath = path.resolve(__dirname, "../components/store/product-details-client.tsx");
  const clientSource = fs.readFileSync(clientSourcePath, "utf-8");
  if (!clientSource.includes("allImages")) {
    errors.push("ProductDetailsClient does not define 'allImages' for unified model gallery");
  } else {
    checks.push("ProductDetailsClient verified with 'allImages' aggregation");
  }

  const gallerySourcePath = path.resolve(__dirname, "../components/store/product-gallery.tsx");
  const gallerySource = fs.readFileSync(gallerySourcePath, "utf-8");
  if (!gallerySource.includes("initialIndex")) {
    errors.push("ProductGallery does not support 'initialIndex' prop for swatch synchronization");
  } else {
    checks.push("ProductGallery verified with 'initialIndex' swatch synchronization");
  }

  return {
    success: errors.length === 0,
    checks,
    errors,
  };
}

if (require.main === module || process.argv[1]?.includes("storefront-gallery.test")) {
  try {
    const res = testStorefrontGallery();
    console.log("Storefront Gallery Carousel Tests:");
    console.log(`Status: ${res.success ? "PASSED" : "FAILED"}`);
    for (const c of res.checks) {
      console.log(`  + ${c}`);
    }
    if (!res.success) {
      console.error("Errors found:");
      for (const err of res.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution threw an error:", err?.message || err);
    process.exit(1);
  }
}
