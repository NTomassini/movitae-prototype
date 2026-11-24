// Converte l'export delle variabili Figma (tokens/figma-export.json) in file DTCG per Style Dictionary.
import fs from 'node:fs';
const src = JSON.parse(fs.readFileSync('tokens/figma-export.json', 'utf8'));
const ref = (v) => (typeof v === 'string' && v.startsWith('{') ? '{prim.' + v.slice(1, -1).replace(/\//g, '.') + '}' : v);
const set = (obj, path, leaf) => { const parts = path.split('/'); let o = obj; for (const p of parts.slice(0, -1)) o = o[p] ??= {}; o[parts.at(-1)] = leaf; };
const prim = {}; for (const [k, v] of Object.entries(src.primitives)) set(prim, k, { $type: 'color', $value: v });
fs.mkdirSync('tokens/dtcg', { recursive: true });
fs.writeFileSync('tokens/dtcg/primitives.json', JSON.stringify({ prim }, null, 2));
for (const mode of ['light', 'dark']) { const c = {}; for (const [k, v] of Object.entries(src.colors[mode])) set(c, k, { $type: 'color', $value: ref(v) }); fs.writeFileSync(`tokens/dtcg/color.${mode}.json`, JSON.stringify(c, null, 2)); }
const base = {};
for (const [k, v] of Object.entries(src.sizes)) set(base, k, { $type: 'dimension', $value: `${v}px` });
for (const [k, t] of Object.entries(src.text)) set(base, `font/${k}`, { $type: 'typography', $value: { fontFamily: 'Inter Variable', fontWeight: t.weight, fontSize: `${t.size}px`, lineHeight: `${t.lineHeight}px` } });
for (const [k, v] of Object.entries(src.effects)) set(base, `effect/${k}`, { $type: 'shadow', $value: v });
for (const [k, v] of Object.entries(src.motion)) set(base, `motion/${k}`, { $type: 'other', $value: v.visualDuration !== undefined ? `${v.visualDuration}s ${v.bounce}` : `${v.duration}s` });
fs.writeFileSync('tokens/dtcg/base.json', JSON.stringify(base, null, 2));
console.log('DTCG scritto in tokens/dtcg');
