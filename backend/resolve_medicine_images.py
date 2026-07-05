#!/usr/bin/env python3
"""
Resolve a real product photo for each medicine once and store the URL in the
medicines.image column, so the web admin and the mobile app both read the SAME
stable image (instead of every device looking it up live and getting different
results).

Uses the same free, key-less sources and the same brand → generic → dosage-form
strategy as the frontend MedicineImage components.

Safe to re-run: only medicines whose image is empty are resolved, so any image
an admin uploaded through the portal is left untouched. Pass --force to
re-resolve every medicine.

Run:  python resolve_medicine_images.py [--force]
"""
import json
import re
import sys
import os
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from sqlmodel import Session, select

from app.db import engine
from app.models import Medicine

FORM_QUERY = {
    "Tablet": "pharmaceutical tablets blister pack",
    "Chewable Tablet": "pharmaceutical tablets blister pack",
    "Capsule": "medicine capsules pills",
    "Syrup": "medicine syrup bottle",
    "Lozenge": "throat lozenges pack",
    "Gel": "medicine tube ointment",
    "Liquid": "antiseptic bottle",
    "Cream": "medicine cream tube",
    "Bandage": "gauze bandage roll",
    "Injection": "medicine vial injection",
    "Drops": "eye drops bottle",
    "Ointment": "medicine tube ointment",
}

_BAD = re.compile(
    r"structure|skeletal|formula|displayed|molecul|3d-ball|3d-bs|crystal|"
    r"spacefill|ball-and-stick|chemdraw"
)
_BAD_EXT = re.compile(r"\.(pdf|webm|ogv|ogg|gif|tiff?|svg)")


def is_not_product_photo(url: str) -> bool:
    u = url.lower()
    if _BAD_EXT.search(u):
        return True
    if "page1-" in u or "/page" in u:
        return True
    return bool(_BAD.search(u))


def clean_brand(name: str) -> str:
    n = re.sub(r"\b\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|%|k)\b", "", name, flags=re.I)
    n = re.sub(
        r"\b(tablet|capsule|syrup|injection|cream|gel|drops|suspension|strip|lozenge)s?\b",
        "",
        n,
        flags=re.I,
    )
    return re.sub(r"\s+", " ", n).strip()


def _get_json(url: str, retries: int = 3):
    # Commons throttles rapid requests; retry with backoff so brand/generic
    # lookups don't silently collapse to the duplicate form fallback.
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "medifix-image-resolver/1.0"})
            with urllib.request.urlopen(req, timeout=12) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            time.sleep(0.8 * (attempt + 1))
    return None


def _first_photo(urls):
    for u in urls:
        if isinstance(u, str) and not is_not_product_photo(u):
            return u
    return None


def commons_photo(query: str):
    url = (
        "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*"
        "&generator=search&gsrnamespace=6&gsrlimit=6&gsrsearch="
        + urllib.parse.quote(query)
        + "&prop=imageinfo&iiprop=url|mime&iiurlwidth=400"
    )
    data = _get_json(url)
    pages = (data or {}).get("query", {}).get("pages")
    if not pages:
        return None
    candidates = []
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        mime = info.get("mime", "")
        if info and (mime.startswith("image/jpeg") or mime.startswith("image/png")):
            candidates.append(info.get("thumburl"))
    return _first_photo(candidates)


def openverse_photo(query: str):
    url = (
        "https://api.openverse.org/v1/images/?q="
        + urllib.parse.quote(query)
        + "&page_size=5&mature=false"
    )
    data = _get_json(url)
    results = (data or {}).get("results", [])
    return _first_photo([r.get("thumbnail") or r.get("url") for r in results])


def resolve_image(name: str, generic: str, form: str):
    brand = clean_brand(name)
    g = generic.split("+")[0].strip()
    form = form or "Tablet"

    hit = commons_photo(f"{brand} {form}")
    if hit:
        return hit
    hit = commons_photo(f"{g} {form}")
    if hit:
        return hit
    query = FORM_QUERY.get(form, "pharmaceutical medicine")
    return commons_photo(query) or openverse_photo(query)


def main(force: bool) -> None:
    resolved = 0
    skipped = 0
    failed = 0
    with Session(engine) as session:
        medicines = session.exec(select(Medicine)).all()
        for m in medicines:
            has_image = m.image and (m.image.startswith("http") or m.image.startswith("data:"))
            if has_image and not force:
                skipped += 1
                continue
            url = resolve_image(m.name, m.generic_name, m.dosage_form or "Tablet")
            time.sleep(0.4)  # be polite to the free APIs between medicines
            if url:
                m.image = url
                session.add(m)
                resolved += 1
                print(f"  ✓ {m.name:<20} -> {url[:70]}")
            else:
                failed += 1
                print(f"  ✗ {m.name:<20} -> no image found")
        session.commit()
    print(f"\n✅ Done. Resolved {resolved}, skipped {skipped} (already set), failed {failed}.")


if __name__ == "__main__":
    main(force="--force" in sys.argv)
