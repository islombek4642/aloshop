import fs from "node:fs";
import path from "node:path";
import { LOCALES } from "../lib/constants/locales";

const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;

function flattenDictionary(
  obj: Record<string, unknown>,
  prefix = ""
): { path: string; value: string }[] {
  const entries: { path: string; value: string }[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      entries.push(
        ...flattenDictionary(value as Record<string, unknown>, fullPath)
      );
    } else if (typeof value === "string") {
      entries.push({ path: fullPath, value });
    }
  }

  return entries;
}

export function verifyI18nParity(): {
  success: boolean;
  keyCount: number;
  errors: string[];
} {
  const rootDir = process.cwd();
  const dictionaries: Record<string, { path: string; value: string }[]> = {};
  const errors: string[] = [];

  for (const locale of LOCALES) {
    const filePath = path.join(rootDir, "messages", `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing dictionary: messages/${locale}.json`);
      continue;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    dictionaries[locale] = flattenDictionary(parsed);
  }

  if (errors.length > 0) {
    return { success: false, keyCount: 0, errors };
  }

  const uzKeys = new Set(dictionaries.uz.map((e) => e.path));

  for (const locale of LOCALES) {
    if (locale === "uz") continue;
    const currentKeys = new Set(dictionaries[locale].map((e) => e.path));

    const missing = [...uzKeys].filter((k) => !currentKeys.has(k));
    for (const m of missing) {
      errors.push(`Key "${m}" missing in "${locale}"`);
    }

    const extra = [...currentKeys].filter((k) => !uzKeys.has(k));
    for (const x of extra) {
      errors.push(`Unexpected extra key "${x}" in "${locale}"`);
    }
  }

  for (const locale of LOCALES) {
    for (const { path: keyPath, value } of dictionaries[locale]) {
      if (value.trim().length === 0) {
        errors.push(`Empty value at "${locale}.${keyPath}"`);
      }
      if (EMOJI_REGEX.test(value)) {
        errors.push(`Emoji violation at "${locale}.${keyPath}"`);
      }
    }
  }

  return {
    success: errors.length === 0,
    keyCount: uzKeys.size,
    errors,
  };
}
