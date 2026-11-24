// Style Dictionary: variabili CSS con gli stessi nomi di Figma (bg/default -> --bg-default).
import StyleDictionary from 'style-dictionary';
const name = { name: 'name/figma', type: 'name', transform: (t) => t.path.filter((p) => p !== 'prim').join('-') };
StyleDictionary.registerTransform(name);
StyleDictionary.registerFormat({
  name: 'css/typography-classes',
  format: ({ dictionary }) => dictionary.allTokens.filter((t) => t.$type === 'typography').map((t) => { const v = t.$value; return `.t-${t.path.slice(1).join('-')} { font-family: '${v.fontFamily}', system-ui, sans-serif; font-weight: ${v.fontWeight}; font-size: ${+(parseFloat(v.fontSize) / 17).toFixed(4)}rem; line-height: ${+(parseFloat(v.lineHeight) / parseFloat(v.fontSize)).toFixed(4)}; }`; }).join('\n') + '\n',
});
const transforms = ['attribute/cti', 'name/figma', 'color/css'];
const run = async (files, source, selector, filter) => {
  const sd = new StyleDictionary({ source, log: { verbosity: 'silent' }, platforms: { css: { transforms, buildPath: 'src/styles/', files: files.map((f) => ({ ...f, filter, options: { selector, outputReferences: false } })) } } });
  await sd.buildAllPlatforms();
};
const notPrim = (t) => t.path[0] !== 'prim';
await run([{ destination: 'tokens.base.css', format: 'css/variables' }], ['tokens/dtcg/base.json'], ':root', (t) => t.$type !== 'typography');
await run([{ destination: 'typography.css', format: 'css/typography-classes' }], ['tokens/dtcg/base.json'], ':root', (t) => t.$type === 'typography');
await run([{ destination: 'tokens.light.css', format: 'css/variables' }], ['tokens/dtcg/primitives.json', 'tokens/dtcg/color.light.json'], ':root, [data-theme="light"]', notPrim);
await run([{ destination: 'tokens.dark.css', format: 'css/variables' }], ['tokens/dtcg/primitives.json', 'tokens/dtcg/color.dark.json'], '[data-theme="dark"]', notPrim);
console.log('CSS scritto in src/styles');
