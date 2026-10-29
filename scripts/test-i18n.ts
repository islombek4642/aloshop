import fs from "node:fs";
import path from "node:path";
import { LOCALES } from "../lib/constants/locales";

interface KeyValueEntry {
  path: string;
  value: string;
}

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

function flattenDictionary(
  obj: Record<string, unknown>,
  prefix = ""
): KeyValueEntry[] {
  const entries: KeyValueEntry[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      entries.push(
        ...flattenDictionary(value as Record<string, unknown>, fullPath)
      );
    } else if (typeof value === "string") {
      entries.push({ path: fullPath, value });
    } else {
      throw new Error(
        `Invalid entry at "${fullPath}": expected string or object, got ${typeof value}`
      );
    }
  }

  return entries;
}

function runI18nParityTest(): void {
  console.log("Starting i18n parity & quality audit...\n");

  const dictionaries: Record<string, KeyValueEntry[]> = {};
  const rootDir = process.cwd();

  // 1. Check dictionary files existence & load
  for (const locale of LOCALES) {
    const filePath = path.join(rootDir, "messages", `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] Dictionary missing: messages/${locale}.json`);
      process.exit(1);
    }

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      dictionaries[locale] = flattenDictionary(parsed);
      console.log(`[LOADED] messages/${locale}.json (${dictionaries[locale].length} keys)`);
    } catch (err) {
      console.error(`[FAIL] Could not parse messages/${locale}.json:`, err);
      process.exit(1);
    }
  }

  const uzEntries = dictionaries.uz;
  const uzKeys = new Set(uzEntries.map((e) => e.path));
  let hasErrors = false;

  // 2. Parity verification against UZ
  for (const locale of LOCALES) {
    if (locale === "uz") continue;

    const currentEntries = dictionaries[locale];
    const currentKeys = new Set(currentEntries.map((e) => e.path));

    // Missing in locale
    const missingInCurrent = [...uzKeys].filter((k) => !currentKeys.has(k));
    if (missingInCurrent.length > 0) {
      hasErrors = true;
      console.error(
        `\n[FAIL] ${missingInCurrent.length} key(s) missing in "${locale}":`
      );
      for (const k of missingInCurrent) {
        console.error(`  - ${k}`);
      }
    }

    // Extra keys in locale not in UZ
    const extraInCurrent = [...currentKeys].filter((k) => !uzKeys.has(k));
    if (extraInCurrent.length > 0) {
      hasErrors = true;
      console.error(
        `\n[FAIL] ${extraInCurrent.length} unexpected extra key(s) in "${locale}":`
      );
      for (const k of extraInCurrent) {
        console.error(`  + ${k}`);
      }
    }
  }

  // 3. Quality audits: Zero emojis and non-empty strings
  for (const locale of LOCALES) {
    const entries = dictionaries[locale];
    for (const { path: keyPath, value } of entries) {
      if (value.trim().length === 0) {
        hasErrors = true;
        console.error(`[FAIL] Empty value at "${locale}.${keyPath}"`);
      }

      if (EMOJI_REGEX.test(value)) {
        hasErrors = true;
        console.error(
          `[FAIL] Zero Emojis violation at "${locale}.${keyPath}": "${value}"`
        );
      }
    }
  }

  if (hasErrors) {
    console.error("\n[RESULT] i18n parity check FAILED with errors above.");
    process.exit(1);
  }

  console.log(
    `\n[PASS] All ${uzKeys.size} keys match 1:1 across all locales (${LOCALES.join(
      ", "
    )}).`
  );
  console.log("[PASS] Zero emojis verified across all dictionaries.");
  console.log("[PASS] No empty or malformed translation values found.");
  console.log("\ni18n test passed successfully!\n");
}

runI18nParityTest();
