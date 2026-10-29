const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts",
  ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o", ғ: "g", қ: "q", ҳ: "h",
};

/**
 * Generates a URL-safe, clean lowercase slug with support for
 * Cyrillic and Uzbek characters (e.g. o', g').
 */
export function generateSlug(text: string): string {
  if (!text) return "";

  // Normalize Uzbek apostrophe characters (o', g', o‘, g‘, etc.)
  let normalized = text
    .toLowerCase()
    .trim()
    .replace(/o[ʻʼ'`]/g, "o")
    .replace(/g[ʻʼ'`]/g, "g")
    .replace(/[ʻʼ'`]/g, "");

  // Transliterate Cyrillic characters
  normalized = normalized
    .split("")
    .map((char) => CYRILLIC_TO_LATIN_MAP[char] ?? char)
    .join("");

  return normalized
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
