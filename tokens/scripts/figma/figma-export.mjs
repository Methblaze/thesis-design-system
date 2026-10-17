// Turn the compact Figma export (rows of "name|value,value") into tokens/figma-export.json,
// the shape check.mjs compares against. Usage: node figma-export.mjs raw.json <project>/tokens
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const [, , rawFile, dir] = process.argv;
const raw = JSON.parse(readFileSync(rawFile, "utf8"));
const fx = { exportedAt: new Date().toISOString().slice(0, 10), collections: {}, text: {} };
for (const [name, rows] of Object.entries(raw)) {
  if (name === "text") continue;
  const [modeRow, ...rest] = rows;
  const modes = modeRow.split(",");
  const vars = {};
  for (const r of rest) {
    const i = r.indexOf("|");
    const vals = r.slice(i + 1).split(",");
    vars[r.slice(0, i)] = Object.fromEntries(modes.map((m, k) => [m, isNaN(Number(vals[k])) ? vals[k] : Number(vals[k])]));
  }
  fx.collections[name] = { modes, vars };
}
for (const r of raw.text || []) { const [n, fs, lh] = r.split("|"); fx.text[n] = { fontSize: Number(fs), lineHeight: Number(lh) }; }
writeFileSync(join(dir, "figma-export.json"), JSON.stringify(fx, null, 1) + "\n");
console.log("figma-export.json:", Object.keys(fx.collections).length, "collections,", Object.keys(fx.text).length, "text styles");
