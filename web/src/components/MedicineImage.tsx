import { useState, useEffect } from 'react';

/**
 * Fetches a real medicine photo at runtime from free, key-less image sources —
 * mirrors the mobile app's MedicineImage so the admin catalogue shows the same
 * kind of pictures. No image URLs are stored; everything is looked up live and
 * cached per session.
 *
 * Strategy: Wikimedia Commons (brand → generic) → dosage-form photo (guaranteed
 * fallback derived from the medicine's own dosage_form) → emoji only if offline.
 */

const CATEGORY_EMOJI: Record<string, string> = {
  'Pain Relief': '💊',
  Antibiotics: '🧬',
  Vitamins: '🌿',
  'Cough & Cold': '🤧',
  Acidity: '🧴',
  Allergy: '🌸',
  Diabetes: '💉',
  'Blood Pressure': '❤️',
  'First Aid': '🩹',
};

// Search phrase per dosage form that reliably returns a real product photo.
const FORM_QUERY: Record<string, string> = {
  Tablet: 'pharmaceutical tablets blister pack',
  'Chewable Tablet': 'pharmaceutical tablets blister pack',
  Capsule: 'medicine capsules pills',
  Syrup: 'medicine syrup bottle',
  Lozenge: 'throat lozenges pack',
  Gel: 'medicine tube ointment',
  Liquid: 'antiseptic bottle',
  Cream: 'medicine cream tube',
  Bandage: 'gauze bandage roll',
  Injection: 'medicine vial injection',
  Drops: 'eye drops bottle',
};

// Module-level cache — one lookup per brand name for the whole session.
const cache = new Map<string, string | null>();

// Reject anything that isn't a real product photo (chemical structures, molecular
// models, non-photo media Wikipedia leads drug articles with).
function isNotProductPhoto(url: string): boolean {
  const u = url.toLowerCase();
  if (/\.(pdf|webm|ogv|ogg|gif|tiff?|svg)/.test(u)) return true;
  if (u.includes('page1-') || u.includes('/page')) return true;
  return /structure|skeletal|formula|displayed|molecul|3d-ball|3d-bs|crystal|spacefill|ball-and-stick|chemdraw/.test(u);
}

// Drop dosage / form noise from a brand name: "Crocin 500mg Tablet" → "Crocin"
function cleanBrand(name: string): string {
  return name
    .replace(/\b\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|%|k)\b/gi, '')
    .replace(/\b(tablet|capsule|syrup|injection|cream|gel|drops|suspension|strip|lozenge)s?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(url: string): Promise<any | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const firstPhoto = (urls: (string | undefined)[]): string | undefined =>
  urls.find((u): u is string => typeof u === 'string' && !isNotProductPhoto(u));

// Wikimedia Commons image search — strong source of medicine product photos.
async function commonsPhoto(query: string): Promise<string | null> {
  const data = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
      `&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch=${encodeURIComponent(query)}` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=200`
  );
  const pages = data?.query?.pages;
  if (!pages) return null;
  return (
    firstPhoto(
      Object.values(pages)
        .map((p: any) => p?.imageinfo?.[0])
        .filter((i: any) => i && /^image\/(jpeg|png)/.test(i.mime || ''))
        .map((i: any) => i.thumburl)
    ) ?? null
  );
}

// Openverse — covers dosage forms Commons has no photo of (creams, gels).
async function openversePhoto(query: string): Promise<string | null> {
  const data = await fetchJson(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=5&mature=false`
  );
  return firstPhoto((data?.results ?? []).map((r: any) => r?.thumbnail || r?.url)) ?? null;
}

async function fetchMedicineImage(brandName: string, genericName: string, form: string): Promise<string | null> {
  const brand = cleanBrand(brandName);
  const generic = genericName.split('+')[0].trim();

  const brandHit = await commonsPhoto(`${brand} ${form}`);
  if (brandHit) return brandHit;

  const genericHit = await commonsPhoto(`${generic} ${form}`);
  if (genericHit) return genericHit;

  // Dosage-form photo — guarantees a real image for every medicine.
  const query = FORM_QUERY[form] ?? 'pharmaceutical medicine';
  return (await commonsPhoto(query)) ?? (await openversePhoto(query));
}

interface Props {
  name: string;
  genericName: string;
  category: string;
  dosageForm?: string | null;
  size?: number;
}

export default function MedicineImage({ name, genericName, category, dosageForm, size = 40 }: Props) {
  const form = dosageForm || 'Tablet';
  const [url, setUrl] = useState<string | null | undefined>(() => {
    const key = name.toLowerCase().trim();
    return cache.has(key) ? cache.get(key) : undefined;
  });

  useEffect(() => {
    const key = name.toLowerCase().trim();
    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      return;
    }
    let cancelled = false;
    fetchMedicineImage(name, genericName, form).then((result) => {
      if (cancelled) return;
      cache.set(key, result);
      setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [name, genericName, form]);

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size, borderRadius: 8, objectFit: 'contain', background: '#f5f5f5' }}
      />
    );
  }

  // Emoji fallback (loading or offline).
  return <span style={{ fontSize: size * 0.8 }}>{CATEGORY_EMOJI[category] || '💊'}</span>;
}
