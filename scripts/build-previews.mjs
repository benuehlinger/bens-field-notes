import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { areas, areaSources, kinds } from '../src/lib/knowledge.mjs';

// Run explicitly when the brand or source collection changes. Committed PNGs keep
// normal site builds independent of browser installations and image services.
const palette = ['#6683ff', '#23baff', '#27dca3', '#b084ff', '#ff68a9', '#ffc259'];
const font = await readFile(
  new URL(
    '../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
    import.meta.url,
  ),
);
const root = new URL('../src/assets/social/', import.meta.url);
await mkdir(root, { recursive: true });
const rect = (x, y, w, h, fill, radius = 0, stroke = 'none') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1, y1, x2, y2, color = '#303036', width = 2) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none"/>`;
const circle = (x, y, r, fill, stroke = 'none') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const frame = (
  art,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
${rect(0, 0, 1200, 630, '#080808')}
<text x="66" y="390" fill="#f5f5f7" font-size="310" font-weight="650" letter-spacing="-25">b.</text>
${art}
${line(72, 514, 1128, 514, '#28282d', 1)}
<text x="72" y="570" fill="#f5f5f7" font-size="28" font-weight="500" letter-spacing="-1">Ben’s Field Notes</text>
<text x="1128" y="568" text-anchor="end" fill="#a1a1aa" font-size="21">bensnotes.fyi</text>
</svg>`;

function atlas() {
  let art = '';
  for (let i = 0; i < 5; i++) art += line(430 + i * 170, 90, 430 + i * 170, 462, '#202024', 1);
  areas.forEach((area, row) => {
    let x = 430;
    const records = areaSources(area);
    kinds.forEach((kind, column) => {
      const count = records.filter((source) => source.source_type === kind.id).length;
      const width = count * 17;
      if (width) art += rect(x, 92 + row * 31, width - 2, 22, palette[column], 3);
      x += width;
    });
  });
  return frame(art);
}

function portfolio() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
${rect(0, 0, 1200, 630, '#080808')}
<text x="72" y="145" fill="#a1a1aa" font-size="28">Ben’s Field Notes</text>
<text x="66" y="304" fill="#f5f5f7" font-size="126" font-weight="620" letter-spacing="-9">Ben Uehlinger</text>
${line(72, 372, 1128, 372, '#28282d', 1)}
<text x="72" y="453" fill="#9cb8ff" font-size="38" font-weight="520" letter-spacing="-1">Applied AI</text>
<text x="395" y="453" fill="#f5f5f7" font-size="38" font-weight="520" letter-spacing="-1">Data Engineering</text>
<text x="826" y="453" fill="#f5f5f7" font-size="38" font-weight="520" letter-spacing="-1">Data Science</text>
<text x="72" y="554" fill="#a1a1aa" font-size="23">bensnotes.fyi</text>
</svg>`;
}
function reading() {
  let art = '';
  [palette[4], palette[0], palette[5]].forEach((color, row) => {
    const y = 90 + row * 126;
    art += rect(430, y, 680, 106, '#111113', 18, '#28282d');
    art += rect(454, y + 23, 60, 60, color, 12);
    art += `<path d="M472 ${y + 39}h12v29h-12zm14 0h10v29h-10" stroke="#080808" stroke-width="2.5" fill="none"/>`;
    art += rect(542, y + 29, [304, 246, 340][row], 13, '#e7e7ed', 4);
    art += rect(542, y + 58, [438, 374, 404][row], 9, '#63636d', 3);
  });
  return frame(art);
}
function involved() {
  let art = '';
  const nodes = [
    [493, 135],
    [770, 95],
    [1055, 135],
    [493, 420],
    [770, 460],
    [1055, 420],
  ];
  for (const [x, y] of nodes) art += line(x, y, 774, 277, '#565663', 2);
  art += rect(690, 215, 168, 124, '#121b18', 24, palette[2]);
  art += `<path d="m747 254-22 23 22 23m55-46 22 23-22 23m-22-56-13 66" stroke="${palette[2]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  nodes.forEach(([x, y], i) => {
    art += circle(x, y, 36, '#20192c', palette[3]);
    art += circle(x, y - 7, 8, palette[3]);
    art += `<path d="M${x - 15} ${y + 18}a15 14 0 0 1 30 0" fill="none" stroke="${palette[3]}" stroke-width="3"/>`;
  });
  return frame(art);
}
function agents() {
  let art = '';
  art += line(430, 277, 1090, 277, '#28282d', 1);
  for (const [y, color] of [
    [166, palette[0]],
    [388, palette[2]],
  ]) {
    const points = [
      [466, y],
      [657, y],
      [850, y],
      [1060, y],
    ];
    for (let i = 0; i < points.length - 1; i++) {
      art += line(points[i][0], y, points[i + 1][0], y, color, 3);
    }
    art += `<path d="M657 ${y}C657 ${y - 120} 850 ${y - 120} 850 ${y}" stroke="${color}" stroke-width="2" fill="none" opacity=".5"/>`;
    points.forEach(([x, py], i) => {
      art += rect(x - 32, py - 32, 64, 64, '#111113', i === 0 || i === 3 ? 32 : 13, color);
      art += circle(x, py, 5, color);
    });
  }
  return frame(art);
}

let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath && process.platform === 'darwin') {
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try {
    await access(chrome);
    executablePath = chrome;
  } catch {}
}
const browser = await chromium.launch({ executablePath });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  async function render(svg, file, width, height) {
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<style>@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font.toString('base64')})}*{box-sizing:border-box}body{margin:0}svg{display:block;font-family:Geist,sans-serif}</style>${svg}`,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: file, type: 'png' });
  }
  for (const [name, svg] of Object.entries({
    atlas: atlas(),
    reading: reading(),
    involved: involved(),
    agents: agents(),
    portfolio: portfolio(),
  })) {
    await writeFile(new URL(`${name}.svg`, root), svg);
    await render(svg, new URL(`${name}.png`, root).pathname, 1200, 630);
    console.log(`${name}: 1200 × 630`);
  }
  const icon = (size) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">${rect(0, 0, 512, 512, '#080808', 96)}<text x="90" y="356" font-size="340" font-weight="650" letter-spacing="-25" fill="#f5f5f7">b.</text></svg>`;
  for (const [size, filename] of [
    [180, 'apple-touch-icon.png'],
    [32, 'favicon-32.png'],
  ]) {
    await render(
      icon(size),
      new URL(`../public/${filename}`, import.meta.url).pathname,
      size,
      size,
    );
    console.log(`${filename}: ${size} × ${size}`);
  }
} finally {
  await browser.close();
}
