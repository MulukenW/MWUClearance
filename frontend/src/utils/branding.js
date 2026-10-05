import { useState, useEffect } from "react";

// ─── Runtime brand & institution theming ──────────────────────────────────────
// The admin can configure university name, system name, and brand color in Admin → Settings.
// This module provides dynamic branding to login, auth layouts, sidebars, and public pages.

const BRAND_API = "/api/branding/color";

export const DEFAULT_BRANDING = {
  university_name: "Madda Walabu University",
  system_name: "Student Clearance Management System",
  address: "Bale Robe",
  phone: "",
  email: "",
  website: "",
  primary_color: "#042791",
};

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
  const base = /^#([0-9a-f]{6})$/i.test(color)
    ? color.toLowerCase()
    : DEFAULT_BRANDING.primary_color;
  const root = document.documentElement.style;
  root.setProperty("--color-mwu-blue", base);
  root.setProperty("--color-mwu-blue-dark", shade(base, -0.35));
  root.setProperty("--color-mwu-blue-light", shade(base, +0.15));
}

export function getBrandInfo() {
  try {
    const cached = localStorage.getItem("mwu_public_branding");
    if (cached) {
      const parsed = JSON.parse(cached);
      const uni = parsed.university_name || DEFAULT_BRANDING.university_name;
      const sys = parsed.system_name || (uni !== "Madda Walabu University" ? `${uni} Student Clearance System` : DEFAULT_BRANDING.system_name);
      return {
        ...DEFAULT_BRANDING,
        ...parsed,
        university_name: uni,
        system_name: sys,
      };
    }
  } catch {
    /* fallback to defaults */
  }
  return { ...DEFAULT_BRANDING };
}

export function applyBrandSettings(data = {}) {
  const current = getBrandInfo();
  const nextUni = (data.university_name !== undefined && data.university_name !== null)
    ? data.university_name
    : current.university_name;
  const nextSys = (data.system_name !== undefined && data.system_name !== null)
    ? data.system_name
    : current.system_name;

  const resolvedUni = nextUni || DEFAULT_BRANDING.university_name;
  const resolvedSys = nextSys || (resolvedUni !== "Madda Walabu University" ? `${resolvedUni} Student Clearance System` : DEFAULT_BRANDING.system_name);

  const next = {
    ...current,
    ...data,
    university_name: resolvedUni,
    system_name: resolvedSys,
  };

  try {
    localStorage.setItem("mwu_public_branding", JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }

  if (next.primary_color) {
    applyBrandColor(next.primary_color);
  }

  if (next.system_name) {
    document.title = `${next.system_name}${next.university_name ? ` - ${next.university_name}` : ""}`;
  }

  window.dispatchEvent(new CustomEvent("mwu-brand-updated", { detail: next }));
  return next;
}

/** Fetch the saved brand and institution settings from the backend and apply it. */
export async function loadBrandColor() {
  const cached = getBrandInfo();
  if (cached.primary_color) {
    applyBrandColor(cached.primary_color);
  }

  try {
    const res = await fetch(BRAND_API, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const json = await res.json();
    if (json?.data) {
      applyBrandSettings(json.data);
    }
  } catch {
    /* offline / API down — keep CSS defaults & cached info */
  }
}

/**
 * React hook for components needing dynamic university/system branding.
 */
export function useBrandInfo() {
  const [brandInfo, setBrandInfo] = useState(getBrandInfo);

  useEffect(() => {
    const onBrandUpdate = () => {
      setBrandInfo(getBrandInfo());
    };
    window.addEventListener("mwu-brand-updated", onBrandUpdate);
    return () => {
      window.removeEventListener("mwu-brand-updated", onBrandUpdate);
    };
  }, []);

  return brandInfo;
}
