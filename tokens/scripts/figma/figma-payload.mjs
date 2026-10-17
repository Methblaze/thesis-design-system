// Print a compact payload of tokens/build/figma.json for the native Figma sync,
// one collection (by index) or the text styles ("text") per call.
// Usage: node figma-payload.mjs <project>/tokens <index|text>
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [, , dir, which] = process.argv;
const fig = JSON.parse(readFileSync(join(dir, "build/figma.json"), "utf8"));
const config = JSON.parse(readFileSync(join(dir, "config.json"), "utf8"));
const renames = config.figma.renames || {};
if (which === "text") {
  const d = [...new Set(fig.text.map((t) => t.description || ""))];
  const out = fig.text.map((t) => [t.name, t.fontFamily, t.fontWeight, t.fontSize, t.lineHeight, t.letterSpacingPercent, t.textCase, t.bind, d.indexOf(t.description || "")]);
  console.log(JSON.stringify({ d, t: out }));
} else {
  const c = fig.collections[Number(which)];
  const d = [...new Set(c.vars.map((v) => v.description || ""))];
  const old = Object.entries(renames.collections || {}).find(([, n]) => n === c.name)?.[0] || null;
  const v = c.vars.map((x) => [x.name, x.type[0], c.modes.map((m) => { const val = x.values[m]; return val && typeof val === "object" ? `{${val.alias}}` : val; }), d.indexOf(x.description || "")]);
  console.log(JSON.stringify({ c: c.name, old, prefix: renames.variablePrefix?.[c.name] || null, modes: c.modes, d, v }));
}
