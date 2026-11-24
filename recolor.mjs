// Run from the project root:  node recolor.mjs
// Swaps every hard-coded purple (and the old teal accent) under src/ for the new teal + amber palette.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const hex = {
  // accent: teal -> amber
  '#4FD1C0': '#FFB366', '#2FB3A3': '#F2994A',
  // primary: purple -> teal
  '#674D9F': '#0E7C7B', '#4B3680': '#095E5F', '#8C74C4': '#3FB5AE', '#7A5FB5': '#1B9693',
  '#A68FE0': '#4FD1C5', '#C4B3EE': '#8BE8DF', '#8A6FD0': '#2BB3A8', '#9B83D6': '#26A69A', '#B7A3EA': '#7ADCD3',
  '#3A2A66': '#064B4C', '#2B2050': '#0F3B3C', '#1E1639': '#0B2A2B', '#140F28': '#071C1D',
  '#E9E1FA': '#D7F3F0', '#3E2C73': '#0B5655', '#F4EFFB': '#EAF5F4', '#F1ECFA': '#E4F4F2',
  // surfaces and text: purple-tinted -> teal-tinted
  '#0E0C14': '#0A1112', '#17141F': '#101B1C', '#F7F6FB': '#F4F9F9', '#1B1530': '#0F2022', '#6B6580': '#52686A',
  '#F3F0FA': '#EAF6F5', '#A29BB8': '#8FA9A8', '#15111F': '#06201F', '#5E5775': '#46605F',
};
const rgb = {
  '103,77,159': '14,124,123', '166,143,224': '79,209,197', '140,116,196': '63,181,174', '155,131,214': '38,166,154',
  '183,163,234': '122,220,211', '196,179,238': '139,232,223', '75,54,128': '9,94,95',
  '47,179,163': '242,153,74', '79,209,192': '255,179,102',
  '31,18,66': '6,32,33', '20,10,50': '6,32,33', '30,15,70': '6,32,33', '23,20,31': '16,27,28', '27,21,48': '15,32,34',
};
const hexRe = new RegExp(Object.keys(hex).join('|'), 'gi');
const upper = Object.fromEntries(Object.entries(hex).map(([k, v]) => [k.toUpperCase(), v]));
let files = 0, changed = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|css)$/.test(name)) continue;
    files++;
    const src = readFileSync(p, 'utf8');
    const out = src
      .replace(hexRe, m => upper[m.toUpperCase()])
      .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g, (m, r, g, b) => (rgb[`${r},${g},${b}`] ? `rgba(${rgb[`${r},${g},${b}`]}` : m));
    if (out !== src) { writeFileSync(p, out); changed++; console.log('updated', p); }
  }
})('src');
console.log(`Done. ${changed} of ${files} files updated.`);