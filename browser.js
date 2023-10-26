const fs = require('fs');
const path = require('path');
const Uglify = require('uglify-js');

const filePath = path.join(__dirname, 'dist-browser/index.js');
const filePathMin = path.join(__dirname, 'dist-browser/index.min.js');
const filePathMod = path.join(__dirname, 'dist-browser/index.mjs');
const filePathModMin = path.join(__dirname, 'dist-browser/index.min.mjs');

let js = fs.readFileSync(filePath).toString().replace(/import .+/, '');
fs.writeFileSync(filePathMod, js);
const scriptMod = Uglify.minify(js);
if (scriptMod.error) { throw scriptMod.error; }
fs.writeFileSync(filePathModMin, scriptMod.code);

// const __constants = [];
const __window = [];

[...js.matchAll(/export const (.+?) /g)].forEach((match) => {
  __window.push(match[1]);
  js = js.replace(match[0], `const ${match[1]} `);
});

[...js.matchAll(/export function (.+)\(/g)].forEach((match) => {
  __window.push(match[1])
  js = js.replace(match[0], `function ${match[1]}(`);
});

const script = ['(() => {']
  .concat([js])
  // .concat(__constants.map((e) => { return `ulid.${e} = ${e};`}))
  .concat(__window.map((e) => { return `window.${e} = ${e};`}))
  .concat(['})();'])
  .join('\n');

const minified = Uglify.minify(script);
if (minified.error) { throw minified.error; }

fs.writeFileSync(filePath, script);
fs.writeFileSync(filePathMin, minified.code);
