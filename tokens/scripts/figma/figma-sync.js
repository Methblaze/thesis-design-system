// Native Figma sync for one collection. Paste after `const DATA = <figma-payload output>;
// const SCOPE = "<collection name prefix>";` in a use_figma call. Idempotent:
// finds the collection (or its old name), renames or creates variables, sets every
// mode's value or alias, description, scopes and WEB code syntax.
const cols = await figma.variables.getLocalVariableCollectionsAsync();
let col = cols.find((c) => c.name === DATA.c) || (DATA.old && cols.find((c) => c.name === DATA.old));
const createdCol = !col;
if (!col) col = figma.variables.createVariableCollection(DATA.c);
col.name = DATA.c;
DATA.modes.forEach((m, i) => { if (i < col.modes.length) col.renameMode(col.modes[i].modeId, m); else col.addMode(m); });
const modeId = (n) => col.modes.find((x) => x.name === n).modeId;
const scoped = (await figma.variables.getLocalVariableCollectionsAsync()).filter((c) => c.name.startsWith(SCOPE)).map((c) => c.id);
let all = (await figma.variables.getLocalVariablesAsync()).filter((v) => scoped.includes(v.variableCollectionId));
const rgba = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255, a: h.length > 7 ? parseInt(h.slice(7, 9), 16) / 255 : 1 });
const T = { C: "COLOR", F: "FLOAT", S: "STRING", B: "BOOLEAN" };
const scopesFor = (name, type) => {
  const n = name.replace(/^color\//, "");
  if (DATA.c.includes("Primitives") && type === "C") return [];
  if (/^size\/space/.test(name)) return ["GAP"];
  if (/^size\/radius/.test(name)) return ["CORNER_RADIUS"];
  if (/^font\/family/.test(name)) return ["FONT_FAMILY"];
  if (/^font\/weight/.test(name)) return ["FONT_WEIGHT"];
  if (/^font\/size/.test(name)) return ["FONT_SIZE"];
  if (/^font\/line-height/.test(name)) return ["LINE_HEIGHT"];
  if (/^bg\//.test(n)) return ["FRAME_FILL", "SHAPE_FILL"];
  if (/^(border|focus)\//.test(n) || /-(border|ring)$/.test(n)) return ["STROKE_COLOR"];
  if (/^text\//.test(n)) return ["TEXT_FILL", "SHAPE_FILL", "STROKE_COLOR"];
  if (/^appearance\//.test(n)) return ["FRAME_FILL", "SHAPE_FILL"];
  return ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"];
};
let created = 0, renamed = 0, updated = 0;
const pending = [];
for (const [name, t, vals, di] of DATA.v) {
  let v = all.find((x) => x.variableCollectionId === col.id && x.name === name);
  if (!v && DATA.prefix && name.startsWith(DATA.prefix)) {
    v = all.find((x) => x.variableCollectionId === col.id && x.name === name.slice(DATA.prefix.length));
    if (v) { v.name = name; renamed++; }
  }
  if (!v) { v = figma.variables.createVariable(name, col, T[t]); all.push(v); created++; }
  v.description = DATA.d[di] || "";
  v.scopes = scopesFor(name, t);
  v.setVariableCodeSyntax("WEB", "var(--" + name.replace(/\//g, "-") + ")");
  pending.push([v, t, vals]);
}
const missing = [];
for (const [v, t, vals] of pending) {
  DATA.modes.forEach((m, i) => {
    const raw = vals[i];
    if (typeof raw === "string" && raw.startsWith("{")) {
      const target = all.find((x) => x.name === raw.slice(1, -1));
      if (!target) { missing.push(v.name + " -> " + raw); return; }
      v.setValueForMode(modeId(m), { type: "VARIABLE_ALIAS", id: target.id });
    } else if (t === "C") v.setValueForMode(modeId(m), rgba(raw));
    else v.setValueForMode(modeId(m), raw);
  });
  updated++;
}
return { collection: col.name, createdCol, created, renamed, updated, missing };
