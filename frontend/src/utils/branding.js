// ─── Runtime brand theming ──────────────────────────────────────────────────
// The admin can change the app's primary color in Admin → Settings. The
// Tailwind theme defines --color-mwu-blue* in index.css; this module overrides
// those CSS variables on :root at runtime so every bg-mwu-blue / text-mwu-blue
// / from-mwu-blue utility instantly picks up the new color.

const BRAND_API = "/api/branding/color";

const DEFAULT_COLOR = "#042791";

/** Mix `color` with black (t < 0) or white (t > 0) by fraction t ∈ [-1, 1]. */
function shade(hex, t) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  const mix = (c) =>
    Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

export function applyBrandColor(color) {
  const base = /^#([0-9a-f]{6})$/i.test(color) ? color.toLowerCase() : DEFAULT_COLOR;
  const root = document.documentElement.style;
  root.setProperty("--color-mwu-blue", base);
  root.setProperty("--color-mwu-blue-dark", shade(base, -0.35));
  root.setProperty("--color-mwu-blue-light", shade(base, +0.15));
}

/** Fetch the saved brand color from the backend and apply it. */
export async function loadBrandColor() {
  try {
    const res = await fetch(BRAND_API, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const json = await res.json();
    applyBrandColor(json?.data?.primary_color);
  } catch {
    /* offline / API down — keep CSS defaults */
  }
}
