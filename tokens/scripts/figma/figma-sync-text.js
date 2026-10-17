// Native Figma sync for text styles. Paste after `const DATA = <figma-payload text output>;
// const SCOPE = "<collection name prefix>";`. Creates or updates each style and binds
// family, weight, size and line height to the matching variables.
const scoped = (await figma.variables.getLocalVariableCollectionsAsync()).filter((c) => c.name.startsWith(SCOPE)).map((c) => c.id);
const vars = (await figma.variables.getLocalVariablesAsync()).filter((v) => scoped.includes(v.variableCollectionId));
const fonts = await figma.listAvailableFontsAsync();
const styleFor = (family, weight) => {
  const names = { 400: ["Regular"], 500: ["Medium"], 600: ["Semi Bold", "SemiBold"], 700: ["Bold"] }[weight] || ["Regular"];
  const f = fonts.find((x) => x.fontName.family === family && names.includes(x.fontName.style));
  return f ? f.fontName : null;
};
const styles = await figma.getLocalTextStylesAsync();
const out = { created: 0, updated: 0, bound: 0, missingVars: [], missingFonts: [] };
for (const [name, family, weight, size, lh, ls, tc, bind, di] of DATA.t) {
  const fontName = styleFor(family, weight);
  if (!fontName) { out.missingFonts.push(family + " " + weight); continue; }
  await figma.loadFontAsync(fontName);
  let s = styles.find((x) => x.name === name);
  if (!s) { s = figma.createTextStyle(); s.name = name; out.created++; } else out.updated++;
  s.fontName = fontName; s.fontSize = size;
  s.lineHeight = { unit: "PIXELS", value: lh };
  s.letterSpacing = { unit: "PERCENT", value: ls };
  s.textCase = tc;
  s.description = DATA.d[di] || "";
  for (const [field, varName] of Object.entries(bind)) {
    const v = vars.find((x) => x.name === varName);
    if (!v) { out.missingVars.push(name + " " + field + " -> " + varName); continue; }
    s.setBoundVariable(field, v);
    out.bound++;
  }
}
return out;
