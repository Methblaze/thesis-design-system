#!/usr/bin/env node
// Proof for the design tokens. Fails (exit 1) on errors, prints warnings.
//  1. Structure: every token has a $type and a value; names are lowercase kebab-case.
//  2. Aliases: every {alias} resolves, with no cycles.
//  3. Layers: the theme files only point at base tokens (no raw colours), so a
//     colour is defined once and themes stay swappable. Transparent is allowed.
//  4. Themes: every theme defines exactly the same tokens.
//  5. Contrast: every pair in tokens/checks.json passes its WCAG minimum in every theme.
//  6. Figma drift: if tokens/figma-export.json exists (exported from the Figma
//     file), every variable and text style matches the tokens.
//  7. Code drift (warning): raw hex colours in the source folders listed in
//     config.codeScan, which should be tokens instead.
// Run: node tokens/scripts/check.mjs
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const config = read("config.json");
const base = read("base.json");
const themes = Object.fromEntries(readdirSync(join(root, "themes")).filter((f) => f.endsWith(".json")).map((f) => [f.replace(".json", ""), JSON.parse(readFileSync(join(root, "themes", f), "utf8"))]));
const errors = [], warnings = [], passes = [];

const flatten = (obj, prefix = [], out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    if (v && typeof v === "object" && "$value" in v) out[[...prefix, k].join(".")] = v;
    else if (v && typeof v === "object") flatten(v, [...prefix, k], out);
  }
  return out;
};
const aliasRe = /^\{([^}]+)\}$/;
const baseFlat = flatten(base);
const themeFlat = Object.fromEntries(Object.entries(themes).map(([n, t]) => [n, flatten(t)]));

// 1. structure and naming
const nameRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const types = new Set(["color", "dimension", "number", "fontFamily", "fontWeight", "typography", "shadow", "duration", "cubicBezier"]);
let count = 0;
for (const [label, flat] of [["base", baseFlat], ...Object.entries(themeFlat)]) {
  for (const [p, t] of Object.entries(flat)) {
    count++;
    if (!t.$type) errors.push(`${label}: ${p} has no $type`);
    else if (!types.has(t.$type)) errors.push(`${label}: ${p} has an unknown $type "${t.$type}"`);
    for (const seg of p.split(".")) if (!nameRe.test(seg)) errors.push(`${label}: "${p}" is not lowercase kebab-case (segment "${seg}")`);
  }
}
passes.push(`${count} tokens have a type and a clean name`);

// 2. aliases
const resolve = (path, tables, seen = new Set()) => {
  if (seen.has(path)) throw new Error("cycle " + [...seen, path].join(" -> "));
  seen.add(path);
  for (const t of tables) if (t[path]) {
    const v = t[path].$value;
    const m = typeof v === "string" && v.match(aliasRe);
    return m ? resolve(m[1], tables, seen) : v;
  }
  throw new Error(`{${path}} does not exist`);
};
const resolvedThemes = {};
for (const [n, flat] of Object.entries(themeFlat)) {
  resolvedThemes[n] = {};
  for (const p of Object.keys(flat)) {
    try { resolvedThemes[n][p] = resolve(p, [flat, baseFlat]); } catch (e) { errors.push(`theme ${n}: ${p}: ${e.message}`); }
  }
}
for (const [p, t] of Object.entries(baseFlat)) {
  const vals = t.$type === "typography" ? Object.values(t.$value) : [t.$value];
  for (const v of vals) { const m = typeof v === "string" && v.match(aliasRe); if (m) try { resolve(m[1], [baseFlat]); } catch (e) { errors.push(`base: ${p}: ${e.message}`); } }
}
passes.push("every alias resolves, with no cycles");

// 3. layers
const transparent = /^#([0-9a-f]{6}00|0000)$/i;
let raw = 0;
for (const [n, flat] of Object.entries(themeFlat)) for (const [p, t] of Object.entries(flat)) {
  const v = t.$value;
  if (t.$type === "color" && typeof v === "string" && !aliasRe.test(v) && !transparent.test(v)) { raw++; errors.push(`theme ${n}: ${p} is a raw colour (${v}); point it at a base token`); }
}
if (!raw) passes.push("theme tokens only point at base tokens");

// 4. theme parity
const names = Object.keys(themeFlat);
const ref = new Set(Object.keys(themeFlat[names[0]]));
for (const n of names.slice(1)) {
  const s = new Set(Object.keys(themeFlat[n]));
  for (const p of ref) if (!s.has(p)) errors.push(`theme ${n} is missing ${p}`);
  for (const p of s) if (!ref.has(p)) errors.push(`theme ${n} has ${p}, which ${names[0]} does not`);
}
passes.push(`${names.length} theme(s) define the same ${ref.size} tokens`);

// 5. contrast
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h) => { const [r, g, b] = hex2(h).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const lookup = (theme, p) => (p in resolvedThemes[theme] ? resolvedThemes[theme][p] : resolve(p, [baseFlat]));
if (existsSync(join(root, "checks.json"))) {
  const checks = read("checks.json");
  let n = 0, low = { r: 99 };
  for (const theme of names) for (const [fg, bg, min] of checks.contrast) {
    try {
      const r = ratio(lookup(theme, fg), lookup(theme, bg));
      n++;
      if (r < low.r) low = { r, s: `${fg} on ${bg} (${theme})` };
      if (r < min) errors.push(`contrast ${theme}: ${fg} on ${bg} is ${r.toFixed(2)}:1, needs ${min}:1`);
    } catch (e) { errors.push(`contrast ${theme}: ${fg} on ${bg}: ${e.message}`); }
  }
  passes.push(`${n} contrast pairs checked; lowest ${low.r.toFixed(2)}:1, ${low.s}`);
}

// 5b. descriptions: every token is documented (own, descriptions.json, or its group)
{
  const descFile = existsSync(join(root, "descriptions.json")) ? read("descriptions.json") : {};
  const groupDesc = (obj, path) => { const parts = path.split("."); let cur = obj, found; for (const k of parts.slice(0, -1)) { cur = cur?.[k]; if (cur?.$description) found = cur.$description; } return found; };
  const missing = [];
  for (const [p, t] of Object.entries(baseFlat)) if (!(t.$description || descFile[p] || groupDesc(base, p))) missing.push(p);
  const first = themes[names[0]];
  for (const [p, t] of Object.entries(themeFlat[names[0]])) if (!(t.$description || descFile[p] || groupDesc(first, p))) missing.push(p);
  if (missing.length) errors.push(`${missing.length} token(s) have no description: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? " …" : ""}`);
  else passes.push("every token has a description");
}

// 6. figma drift
if (existsSync(join(root, "figma-export.json"))) {
  const fx = read("figma-export.json");
  const built = read("build/figma.json");
  let checked = 0;
  for (const c of built.collections) {
    const fc = fx.collections[c.name];
    if (!fc) { errors.push(`Figma has no collection "${c.name}"`); continue; }
    for (const v of c.vars) {
      const f = fc.vars[v.name];
      if (!f) { errors.push(`Figma ${c.name} is missing ${v.name}`); continue; }
      for (const [mode, val] of Object.entries(v.values)) {
        const want = typeof val === "object" ? `{${val.alias}}` : typeof val === "string" ? val.toUpperCase() : val;
        const got = typeof f[mode] === "string" ? f[mode].toUpperCase() : f[mode];
        if (String(want).toUpperCase() !== String(got).toUpperCase()) errors.push(`Figma drift: ${c.name} ${v.name} (${mode}) is ${got}, tokens say ${want}`);
        checked++;
      }
    }
    for (const name of Object.keys(fc.vars)) if (!c.vars.some((v) => v.name === name)) warnings.push(`Figma ${c.name} has ${name}, which is not in the tokens`);
  }
  for (const t of built.text) {
    const f = fx.text?.[t.name];
    if (!f) { errors.push(`Figma is missing text style ${t.name}`); continue; }
    for (const k of ["fontSize", "lineHeight"]) if (Number(f[k]) !== Number(t[k])) errors.push(`Figma drift: ${t.name} ${k} is ${f[k]}, tokens say ${t[k]}`);
    checked++;
  }
  passes.push(`${checked} Figma values match the tokens`);
} else warnings.push("No tokens/figma-export.json yet, so Figma drift was not checked");

// 7. code drift
if (config.codeScan) {
  const hexRe = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
  const hits = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) { if (!["node_modules", "build", "dist"].includes(f)) walk(p); continue; }
      if (!exts.has(extname(f)) || (config.codeScan.ignore || []).some((i) => p.replace(/\\/g, "/").includes(i))) continue;
      const lines = readFileSync(p, "utf8").split("\n");
      lines.forEach((l, i) => { const m = l.match(hexRe); if (m && !/^\s*(\/\/|\*|\/\*)/.test(l)) hits.push(`${p.slice(join(root, "..").length + 1)}:${i + 1} ${m.join(" ")}`); });
    }
  };
  for (const d of config.codeScan.dirs) if (existsSync(join(root, "..", d))) walk(join(root, "..", d));
  if (hits.length) warnings.push(`${hits.length} raw hex colour(s) in code that should be tokens:\n    ` + hits.slice(0, 25).join("\n    "));
  else passes.push("no raw hex colours in the scanned code");
}

for (const p of passes) console.log("  ok    " + p);
for (const w of warnings) console.log("  warn  " + w);
for (const e of errors) console.log("  FAIL  " + e);
console.log(errors.length ? `\n${errors.length} error(s)` : "\nAll token checks passed" + (warnings.length ? ` (${warnings.length} warning(s))` : ""));
process.exit(errors.length ? 1 : 0);
