import { useState, useEffect } from "react";
import { View, Image, Text, ActivityIndicator } from "react-native";

/**
 * Image fetch strategy (all free, no API key) — returns real product photos,
 * never chemical-structure / skeletal-formula diagrams.
 *  1. Openverse image search — photographs of the actual brand/medicine
 *  2. Wikipedia REST API — brand article, then generic article thumbnail
 *  3. Emoji + category colour — guaranteed fallback
 *
 * Any candidate that looks like a chemical structure (an SVG render, or a
 * filename mentioning structure/skeletal/formula) is rejected, so the chemical
 * formula diagrams Wikipedia returns for generic compound names never show.
 */

const CATEGORY_STYLE: Record<string, { emoji: string; bg: string }> = {
  "Pain Relief":    { emoji: "💊", bg: "#FFF3E0" },
  "Antibiotics":    { emoji: "🧬", bg: "#E3F2FD" },
  "Vitamins":       { emoji: "🌿", bg: "#E8F5E9" },
  "Cough & Cold":   { emoji: "🤧", bg: "#EDE7F6" },
  "Acidity":        { emoji: "🧴", bg: "#E0F7FA" },
  "Allergy":        { emoji: "🌸", bg: "#FFF8E1" },
  "Diabetes":       { emoji: "💉", bg: "#FCE4EC" },
  "Blood Pressure": { emoji: "❤️", bg: "#FFEBEE" },
  "First Aid":      { emoji: "🩹", bg: "#F1F8E9" },
  default:          { emoji: "💊", bg: "#F5F5F5" },
};

// Module-level cache — one lookup per brand name for the whole session.
const cache = new Map<string, string | null>();

// Reject anything that isn't a real product photo: chemical-structure /
// skeletal-formula / 3D molecular-model diagrams (Wikipedia leads drug articles
// with these), plus non-photo media a search may return (PDFs, videos, book
// scans). Product photos are plain JPG/PNG.
function isNotProductPhoto(url: string): boolean {
  const u = url.toLowerCase();
  // non-photo media or rendered document pages
  if (/\.(pdf|webm|ogv|ogg|gif|tiff?|svg)/.test(u)) return true;
  if (u.includes("page1-") || u.includes("/page")) return true;
  // chemical structures & molecular models
  return /structure|skeletal|formula|displayed|molecul|3d-ball|3d-bs|3d-balls|-xtal|from-xtal|crystal|spacefill|ball-and-stick/.test(u);
}

// Drop dosage / form noise from a brand name: "Crocin 500mg Tablet" → "Crocin"
function cleanBrand(name: string): string {
  return name
    .replace(/\b\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|%)\b/gi, "")
    .replace(/\b(tablet|capsule|syrup|injection|cream|gel|drops|suspension|strip)s?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url: string, headers?: Record<string, string>): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers });
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const firstPhoto = (urls: (string | undefined)[]): string | undefined =>
  urls.find((u): u is string => typeof u === "string" && !isNotProductPhoto(u));

// Openverse photo search — real photographs from Flickr, Wikimedia, etc.
async function openversePhoto(query: string): Promise<string | null> {
  const data = await fetchJson(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=5&mature=false`
  );
  return firstPhoto((data?.results ?? []).map((r: any) => r?.thumbnail || r?.url)) ?? null;
}

// Wikimedia Commons image search — strong source of medicine product photos.
async function commonsPhoto(query: string): Promise<string | null> {
  const data = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
      `&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=${encodeURIComponent(query)}` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=300`
  );
  const pages = data?.query?.pages;
  if (!pages) return null;
  return firstPhoto(Object.values(pages).map((p: any) => p?.imageinfo?.[0]?.thumburl)) ?? null;
}

// Wikipedia article thumbnail for a term, rejecting non-photo diagrams.
async function wikiPhoto(term: string): Promise<string | null> {
  const data = await fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
    { Accept: "application/json" }
  );
  const url: string | undefined = data?.thumbnail?.source;
  return url && !isNotProductPhoto(url) ? url : null;
}

async function fetchMedicineImage(brandName: string, genericName: string): Promise<string | null> {
  const brand = cleanBrand(brandName);
  // Strip combination suffixes so "Ibuprofen + Paracetamol" → "Ibuprofen"
  const generic = genericName.split("+")[0].trim();

  // 1. Openverse — photographs of the actual brand
  const ov = await openversePhoto(`${brand} tablet medicine`);
  if (ov) return ov;

  // 2. Wikimedia Commons — product photos by generic name (most reliable)
  const commons = await commonsPhoto(`${generic} tablet`);
  if (commons) return commons;

  // 3. Wikipedia — brand article, then generic article
  const brandWiki = await wikiPhoto(brand);
  if (brandWiki) return brandWiki;

  const genericWiki = await wikiPhoto(generic);
  if (genericWiki) return genericWiki;

  return null;
}

interface Props {
  genericName: string;
  category: string;
  name?: string;       // brand name, e.g. "Crocin 500mg" — preferred for product photos
  size?: number;
  perStrip?: number;   // e.g. 10 → shows "10 PC" badge on image
}

export default function MedicineImage({ genericName, category, name, size = 80, perStrip }: Props) {
  const brand = name ?? genericName;
  const [url, setUrl] = useState<string | null | undefined>(() => {
    const key = brand.toLowerCase().trim();
    return cache.has(key) ? cache.get(key) : undefined;
  });

  useEffect(() => {
    const key = brand.toLowerCase().trim();
    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      return;
    }

    let cancelled = false;
    fetchMedicineImage(brand, genericName).then((result) => {
      if (cancelled) return;
      cache.set(key, result);
      setUrl(result);
    });

    return () => { cancelled = true; };
  }, [brand, genericName]);

  const { emoji, bg } = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.default;
  const radius = 12;

  const stripBadge = perStrip ? (
    <View style={{
      position: "absolute",
      bottom: 5,
      left: 5,
      backgroundColor: "#FF6B35",
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 2,
    }}>
      <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>
        {perStrip} PC
      </Text>
    </View>
  ) : null;

  // ── Loading ──
  if (url === undefined) {
    return (
      <View style={{
        width: size, height: size, borderRadius: radius,
        backgroundColor: bg, justifyContent: "center", alignItems: "center",
      }}>
        <ActivityIndicator size="small" color="#FF6B35" />
      </View>
    );
  }

  // ── Image found ──
  if (url) {
    return (
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg }}
          resizeMode="contain"
        />
        {stripBadge}
      </View>
    );
  }

  // ── Emoji fallback ──
  return (
    <View style={{
      width: size, height: size, borderRadius: radius,
      backgroundColor: bg, justifyContent: "center", alignItems: "center",
    }}>
      <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
      {stripBadge}
    </View>
  );
}
