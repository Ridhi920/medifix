import { useState, useEffect } from "react";
import { View, Image, Text, ActivityIndicator } from "react-native";

/**
 * Image fetch strategy (all free, no API key) — kept identical to the web admin
 * component (web/src/components/MedicineImage.tsx) so a medicine shows the SAME
 * photo in the app and in the admin portal.
 *  1. Wikimedia Commons — brand photo (cleaned brand name + dosage form)
 *  2. Wikimedia Commons — generic-name photo
 *  3. Dosage-form photo (Commons → Openverse) — guarantees a real image
 *  4. Emoji + category colour — only if the network is unreachable
 *
 * Any candidate that looks like a chemical structure (an SVG render, or a
 * filename mentioning structure/skeletal/formula) is rejected.
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

// Wikimedia blocks image requests that lack a descriptive User-Agent (returns
// 403). Sending one lets upload.wikimedia.org photos load in the RN <Image>.
const IMAGE_USER_AGENT = "MedifixApp/1.0 (https://medifix.app; support@medifix.app)";

// Module-level cache — one lookup per brand name for the whole session.
const cache = new Map<string, string | null>();

// The stored `image` field often holds an emoji placeholder (e.g. "💊") rather
// than a real URL. Rendering an emoji as an <Image> uri shows a blank box, so
// only treat the stored value as an image when it's an actual URL / data URI —
// otherwise fall through to the live photo lookup (matches the web admin).
function isUsableImageUri(uri?: string): uri is string {
  return !!uri && /^(https?:|data:|file:|content:)\S/i.test(uri.trim());
}

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
  return /structure|skeletal|formula|displayed|molecul|3d-ball|3d-bs|crystal|spacefill|ball-and-stick|chemdraw/.test(u);
}

// Drop dosage / form noise from a brand name: "Crocin 500mg Tablet" → "Crocin"
function cleanBrand(name: string): string {
  return name
    .replace(/\b\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|%|k)\b/gi, "")
    .replace(/\b(tablet|capsule|syrup|injection|cream|gel|drops|suspension|strip|lozenge)s?\b/gi, "")
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
// Kept identical to the web component so the same file is selected on both.
async function commonsPhoto(query: string): Promise<string | null> {
  const data = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
      `&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=${encodeURIComponent(query)}` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=300`
  );
  const pages = data?.query?.pages;
  if (!pages) return null;
  return (
    firstPhoto(
      Object.values(pages)
        .map((p: any) => p?.imageinfo?.[0])
        .filter((i: any) => i && /^image\/(jpeg|png)/.test(i.mime || ""))
        .map((i: any) => i.thumburl)
    ) ?? null
  );
}

// Map a dosage form to a search phrase that reliably returns a real product
// photo, so the final fallback never has to show an emoji. Keyed by the
// medicine's own `type` field — no per-medicine data is hard-coded here.
const FORM_QUERY: Record<string, string> = {
  Tablet: "pharmaceutical tablets blister pack",
  "Chewable Tablet": "pharmaceutical tablets blister pack",
  Capsule: "medicine capsules pills",
  Syrup: "medicine syrup bottle",
  Lozenge: "throat lozenges pack",
  Gel: "medicine tube ointment",
  Liquid: "antiseptic bottle",
  Cream: "medicine cream tube",
  Bandage: "gauze bandage roll",
  Injection: "medicine vial injection",
  Drops: "eye drops bottle",
};

// Real photo representing the medicine's dosage form. Tries Commons first
// (best quality), then Openverse (covers forms Commons lacks, e.g. creams).
async function formPhoto(type: string): Promise<string | null> {
  const query = FORM_QUERY[type] ?? "pharmaceutical medicine";
  return (await commonsPhoto(query)) ?? (await openversePhoto(query));
}

async function fetchMedicineImage(
  brandName: string,
  genericName: string,
  type: string,
): Promise<string | null> {
  const brand = cleanBrand(brandName);
  // Strip combination suffixes so "Ibuprofen + Paracetamol" → "Ibuprofen"
  const generic = genericName.split("+")[0].trim();

  // 1. Wikimedia Commons — photo for the actual brand
  const brandHit = await commonsPhoto(`${brand} ${type}`);
  if (brandHit) return brandHit;

  // 2. Wikimedia Commons — photo by generic name
  const genericHit = await commonsPhoto(`${generic} ${type}`);
  if (genericHit) return genericHit;

  // 3. Dosage-form photo — guarantees a real image for every medicine
  return await formPhoto(type);
}

interface Props {
  genericName: string;
  category: string;
  type?: string;       // dosage form, e.g. "Tablet" — drives the guaranteed fallback photo
  name?: string;       // brand name, e.g. "Crocin 500mg" — preferred for product photos
  imageUri?: string;   // stored image from the backend — preferred; matches the admin portal
  size?: number;
  perStrip?: number;   // e.g. 10 → shows "10 PC" badge on image
}

export default function MedicineImage({ genericName, category, type = "Tablet", name, imageUri, size = 80, perStrip }: Props) {
  const brand = name ?? genericName;
  const [url, setUrl] = useState<string | null | undefined>(() => {
    if (isUsableImageUri(imageUri)) return imageUri;
    const key = brand.toLowerCase().trim();
    return cache.has(key) ? cache.get(key) : undefined;
  });

  useEffect(() => {
    // Prefer a stored backend image URL so the app matches the admin portal;
    // fall back to a live lookup when there's no real image (e.g. emoji seed).
    if (isUsableImageUri(imageUri)) {
      setUrl(imageUri);
      return;
    }

    const key = brand.toLowerCase().trim();
    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      return;
    }

    let cancelled = false;
    fetchMedicineImage(brand, genericName, type).then((result) => {
      if (cancelled) return;
      cache.set(key, result);
      setUrl(result);
    });

    return () => { cancelled = true; };
  }, [brand, genericName, type, imageUri]);

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
          // Wikimedia (upload.wikimedia.org) returns 403 to clients without a
          // descriptive User-Agent, so send one — otherwise the photo loads in
          // the browser (admin portal) but shows blank in the app.
          source={{ uri: url, headers: { "User-Agent": IMAGE_USER_AGENT } }}
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
