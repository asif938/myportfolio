#!/usr/bin/env node
/**
 * WCAG contrast guard. Reads every app/palettes/*.css, and for each palette x mode checks
 * the text/background pairs below. Exits 1 if any pair is under its threshold
 * (4.5 normal text, 3 for large text / UI). Translucent colors are composited over --bg.
 *
 *   npm run design:contrast
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "palettes");

/* ---------- parsing ---------- */
function parseBlocks(css) {
  const out = {};
  // matches root blocks and ".band" sub-blocks: [data-palette="x"] { } / .dark[data-palette="x"] .band { }
  const re = /(\.dark)?\[data-palette="([\w-]+)"\](\s+\.band)?\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(css))) {
    const key = `${m[2]}:${m[1] ? "dark" : "light"}${m[3] ? ":band" : ""}`;
    const vars = {};
    for (const line of m[4].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[line[1]] = line[2].trim();
    out[key] = vars;
  }
  // a band inherits its mode's root tokens, then the shared band block, then its mode override
  for (const key of Object.keys(out)) {
    if (!key.endsWith(":band")) continue;
    const [palette, mode] = key.split(":");
    const base = out[`${palette}:${mode}`] ?? {};
    const shared = mode === "dark" ? (out[`${palette}:light:band`] ?? {}) : {};
    out[key] = { ...base, ...shared, ...out[key] };
  }
  return out;
}

function resolve(vars, name, depth = 0) {
  let v = vars[name];
  if (v === undefined || depth > 5) return v;
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolve(vars, ref[1], depth + 1) : v;
}

/** Every color literal in a value (a gradient yields several). */
function colorsIn(value) {
  const found = [];
  for (const m of value.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(([^)]+)\)/gi)) {
    if (m[1]) {
      let h = m[1];
      if (h.length === 3) h = [...h].map((c) => c + c).join("");
      found.push({
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: 1,
      });
    } else {
      const p = m[2].split(",").map((s) => parseFloat(s));
      found.push({ r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 });
    }
  }
  return found;
}

const over = (top, base) => ({
  r: top.r * top.a + base.r * (1 - top.a),
  g: top.g * top.a + base.g * (1 - top.a),
  b: top.b * top.a + base.b * (1 - top.a),
  a: 1,
});
const lum = ({ r, g, b }) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* ---------- checks ---------- */
const results = [];
let failures = 0;

function check(palette, mode, label, fgs, bgs, min) {
  for (const fg of fgs) {
    for (const bg of bgs) {
      const r = ratio(fg, bg);
      const ok = r >= min;
      if (!ok) failures++;
      results.push({ palette, mode, label, ratio: r, min, ok });
    }
  }
}

const blocks = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
  Object.assign(blocks, parseBlocks(readFileSync(join(dir, f), "utf8")));
}

for (const [key, vars] of Object.entries(blocks)) {
  const [palette, modeRaw, band] = key.split(":");
  const mode = band ? `${modeRaw} band` : modeRaw;
  const get = (name) => {
    const v = resolve(vars, name);
    if (v === undefined) throw new Error(`${key}: missing token ${name}`);
    return colorsIn(v);
  };
  const bg = get("--bg")[0];
  const solid = (name) => get(name).map((c) => over(c, bg)); // composite translucent over page bg
  const bgs = {
    bg: solid("--bg"),
    "bg-2": solid("--bg-2"),
    surface: solid("--surface"),
    "surface-2": solid("--surface-2"),
  };
  // surfaces drawn on top of a surface must be composited over that surface's color
  const surfaceOnBg2 = get("--surface").map((c) => over(c, bgs["bg-2"][0]));
  const cardBgs = [...bgs.bg, ...bgs["bg-2"], ...bgs.surface, ...surfaceOnBg2, ...bgs["surface-2"]];

  check(palette, mode, "fg on neutrals", solid("--fg"), cardBgs, 4.5);
  check(palette, mode, "muted on neutrals", solid("--muted"), cardBgs, 4.5);
  check(palette, mode, "accent-text on neutrals", solid("--accent-text"), cardBgs, 4.5);
  check(
    palette,
    mode,
    "highlight-fg on highlight",
    solid("--highlight-fg"),
    solid("--highlight-bg"),
    4.5,
  );
  check(
    palette,
    mode,
    "cta-fg on cta-bg (every gradient stop)",
    solid("--cta-fg"),
    solid("--cta-bg"),
    4.5,
  );
  check(
    palette,
    mode,
    "cta-chip-fg on cta-chip-bg",
    solid("--cta-chip-fg"),
    solid("--cta-chip-bg"),
    4.5,
  );
  check(
    palette,
    mode,
    "white on brand-gradient-deep (monogram)",
    [{ r: 255, g: 255, b: 255, a: 1 }],
    solid("--brand-gradient-deep"),
    4.5,
  );
  check(
    palette,
    mode,
    "focus ring vs page (UI 3:1)",
    solid("--focus"),
    [...bgs.bg, ...bgs["bg-2"]],
    3,
  );
  for (const kind of ["danger", "success", "warning"]) {
    const kindBg = over(get(`--${kind}-bg`)[0], bgs.bg[0]);
    check(palette, mode, `${kind} text on ${kind}-bg`, solid(`--${kind}`), [kindBg], 4.5);
    check(palette, mode, `${kind} text on page`, solid(`--${kind}`), bgs.bg, 4.5);
  }
  check(palette, mode, "nav text (muted) on nav-bg", solid("--muted"), solid("--nav-bg"), 4.5);

  for (let i = 1; i <= 6; i++) {
    for (const base of [bgs.bg[0], bgs["bg-2"][0], bgs["surface-2"][0]]) {
      const tintBg = over(get(`--tint-${i}-bg`)[0], base);
      check(palette, mode, `tint-${i} fg on tint bg`, solid(`--tint-${i}-fg`), [tintBg], 4.5);
    }
  }
  // education icon tile: icon (UI 3:1) on its tint, composited over the card surface
  for (const base of [bgs.surface[0], surfaceOnBg2[0]]) {
    check(
      palette,
      mode,
      "edu-icon-fg on edu-icon-bg (UI 3:1)",
      solid("--edu-icon-fg"),
      [over(get("--edu-icon-bg")[0], base)],
      3,
    );
  }
  // experience featured card (white text on every stop of the gradient, chips composited on each stop)
  const white = [{ r: 255, g: 255, b: 255, a: 1 }];
  const featureStops = solid("--feature-bg");
  check(
    palette,
    mode,
    "feature-fg on feature-bg (every stop)",
    solid("--feature-fg"),
    featureStops,
    4.5,
  );
  check(
    palette,
    mode,
    "feature-fg-soft on feature-bg (every stop)",
    get("--feature-fg-soft").flatMap((c) => featureStops.map((st) => over(c, st))),
    featureStops,
    4.5,
  );
  check(
    palette,
    mode,
    "feature-chip-fg on chip over feature-bg",
    white,
    get("--feature-chip-bg").flatMap((c) => featureStops.map((st) => over(c, st))),
    4.5,
  );
  check(
    palette,
    mode,
    "feature-box-1-fg on feature-box-1-bg",
    solid("--feature-box-1-fg"),
    solid("--feature-box-1-bg"),
    4.5,
  );
  check(
    palette,
    mode,
    "feature-box-2-fg on feature-box-2-bg",
    solid("--feature-box-2-fg"),
    solid("--feature-box-2-bg"),
    4.5,
  );
  check(
    palette,
    mode,
    "highlight pill on feature-bg (UI 3:1)",
    solid("--highlight-bg"),
    featureStops,
    3,
  );
  // skills band: text/tab/tile pairs over every stop of the band gradient
  const bandStops = solid("--skills-band-bg");
  const onBand = (name, base = bandStops) =>
    get(name).flatMap((c) => base.map((st) => over(c, st)));
  check(palette, mode, "skills fg on band", solid("--skills-fg"), bandStops, 4.5);
  check(palette, mode, "skills muted on band", solid("--skills-muted"), bandStops, 4.5);
  check(palette, mode, "skills eyebrow on band", solid("--skills-eyebrow"), bandStops, 4.5);
  check(palette, mode, "skills focus ring on band (UI 3:1)", solid("--skills-focus"), bandStops, 3);
  check(
    palette,
    mode,
    "skill name on tile (rest) over band",
    solid("--skills-fg"),
    onBand("--skills-tile-bg"),
    4.5,
  );
  check(
    palette,
    mode,
    "skill name on tile (hover) over band",
    solid("--skills-fg"),
    onBand("--skills-tile-bg-hover"),
    4.5,
  );
  const tabBgs = onBand("--skills-tab-bg");
  check(palette, mode, "tab text (unselected) over band", solid("--skills-tab-fg"), tabBgs, 4.5);
  check(
    palette,
    mode,
    "tab badge text (unselected)",
    solid("--skills-tab-fg"),
    get("--skills-tab-badge-bg").flatMap((c) => tabBgs.map((b) => over(c, b))),
    4.5,
  );
  const activeBgs = solid("--skills-tab-active-bg");
  check(
    palette,
    mode,
    "tab text (selected) on gradient",
    solid("--skills-tab-active-fg"),
    activeBgs,
    4.5,
  );
  check(
    palette,
    mode,
    "tab badge text (selected)",
    solid("--skills-tab-active-fg"),
    get("--skills-tab-active-badge-bg").flatMap((c) => activeBgs.map((b) => over(c, b))),
    4.5,
  );
  // the band class remaps the tints to light-on-dark; the dots only ever render inside it
  for (let i = 1; i <= 6 && band; i++) {
    check(
      palette,
      mode,
      "category dot (tint fg) on tile (UI 3:1)",
      solid(`--tint-${i}-fg`),
      onBand("--skills-tile-bg"),
      3,
    );
  }
}

/* ---------- report ---------- */
const quiet = process.argv.includes("--quiet");
const groups = new Map();
for (const r of results) {
  const k = `${r.palette} · ${r.mode}`;
  const g = groups.get(k) ?? new Map();
  const cur = g.get(r.label);
  if (!cur || r.ratio < cur.ratio) g.set(r.label, r); // worst case per label
  groups.set(k, g);
}
for (const [k, g] of groups) {
  console.log(`\n${k}`);
  for (const [label, r] of g) {
    if (quiet && r.ok) continue;
    console.log(
      `  ${r.ok ? "PASS" : "FAIL"}  ${r.ratio.toFixed(2).padStart(5)}  (min ${r.min})  ${label}`,
    );
  }
}
console.log(`\n${results.length} checks, ${failures} failing`);
process.exit(failures ? 1 : 0);
