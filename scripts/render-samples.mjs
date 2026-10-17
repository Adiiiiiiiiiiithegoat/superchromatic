// Procedurally builds the 5 sample wallpapers as SVG (layered gradients, blurred blobs, noise),
// saves the sources to scripts/samples/, then rasterises them to JPEG with headless Chromium.
// Run: node scripts/render-samples.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const W = 1600
const H = 1000

function rng(seed) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const noise = (opacity = 0.5, seed = 2) => `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer>
  </filter>
  </defs><rect width="${W}" height="${H}" filter="url(#grain)" opacity="${opacity}" style="mix-blend-mode:overlay"/>`

const blur = (id, sd) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${body}</svg>`

function sunsetDunes() {
  return svg(`<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#24104f"/><stop offset=".32" stop-color="#6d2a72"/><stop offset=".55" stop-color="#d9516c"/>
      <stop offset=".7" stop-color="#ff8f5a"/><stop offset=".8" stop-color="#ffcf7d"/>
    </linearGradient>
    <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d2"/><stop offset=".7" stop-color="#ffd27e"/><stop offset="1" stop-color="#ffb35c"/></radialGradient>
    <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd59a" stop-opacity=".75"/><stop offset="1" stop-color="#ff7b6b" stop-opacity="0"/></radialGradient>
    <linearGradient id="near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b2141"/><stop offset="1" stop-color="#2a0c2a"/></linearGradient>
    <linearGradient id="mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2493f"/><stop offset="1" stop-color="#7c2640"/></linearGradient>
    ${blur('soft', 6)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="1060" cy="610" r="420" fill="url(#halo)"/>
  <circle cx="1060" cy="610" r="135" fill="url(#sun)"/>
  <path d="M0 690 C 300 610 540 590 820 650 S 1300 760 1600 630 V1000 H0Z" fill="#e0734f" opacity=".9" filter="url(#soft)"/>
  <path d="M0 770 C 260 690 610 710 920 780 S 1410 820 1600 740 V1000 H0Z" fill="url(#mid)"/>
  <path d="M0 860 C 380 770 760 810 1100 895 S 1460 930 1600 870 V1000 H0Z" fill="url(#near)"/>
  <path d="M120 835 C 420 770 720 800 1000 870" stroke="#ff9e6e" stroke-opacity=".35" stroke-width="3" fill="none"/>
  <defs>${noise(0.55, 4)}`)
}

function deepOcean() {
  const r = rng(11)
  const bubbles = Array.from({ length: 46 }, () => {
    const x = r() * W, y = 300 + r() * 700, s = 2 + r() * 9
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(1)}" fill="none" stroke="#c9f6ff" stroke-opacity="${(0.15 + r() * 0.35).toFixed(2)}" stroke-width="1.5"/>`
  }).join('')
  const rays = Array.from({ length: 6 }, (_, i) => {
    const x = 250 + i * 230 + r() * 80
    return `<polygon points="${x},-20 ${x + 90},-20 ${x + 420},1000 ${x + 160},1000" fill="#9beaff" opacity="${(0.06 + r() * 0.07).toFixed(2)}"/>`
  }).join('')
  return svg(`<defs>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d4c6e"/><stop offset=".45" stop-color="#062a47"/><stop offset="1" stop-color="#020a19"/></linearGradient>
    ${blur('b80', 80)}${blur('b30', 30)}${blur('b10', 10)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sea)"/>
  <g filter="url(#b30)">${rays}</g>
  <g filter="url(#b80)">
    <ellipse cx="300" cy="760" rx="420" ry="220" fill="#0f6f7c" opacity=".75"/>
    <ellipse cx="1250" cy="300" rx="380" ry="200" fill="#1d3f94" opacity=".7"/>
    <ellipse cx="900" cy="820" rx="520" ry="160" fill="#073a52"/>
    <ellipse cx="760" cy="150" rx="360" ry="120" fill="#2ec7c9" opacity=".45"/>
  </g>
  <g filter="url(#b10)"><ellipse cx="1180" cy="640" rx="46" ry="38" fill="#ff73b8" opacity=".85"/><ellipse cx="1180" cy="640" rx="90" ry="70" fill="#ff73b8" opacity=".25"/></g>
  ${bubbles}
  <defs>${noise(0.45, 7)}`)
}

function aurora() {
  const r = rng(23)
  const stars = Array.from({ length: 140 }, () => {
    const x = r() * W, y = r() * 620, s = r() < 0.9 ? 0.8 + r() * 1.2 : 2 + r()
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(1)}" fill="#ffffff" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`
  }).join('')
  return svg(`<defs>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040714"/><stop offset=".6" stop-color="#0b1a35"/><stop offset="1" stop-color="#132447"/></linearGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2dffa6"/><stop offset=".45" stop-color="#22d3ee"/><stop offset=".8" stop-color="#8b5cf6"/><stop offset="1" stop-color="#d946ef"/></linearGradient>
    ${blur('b50', 50)}${blur('b14', 14)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#night)"/>
  ${stars}
  <g filter="url(#b50)" opacity=".8">
    <path d="M-100 420 C 250 180 520 520 820 300 S 1350 120 1700 330" stroke="url(#band)" stroke-width="150" fill="none"/>
    <path d="M-100 560 C 300 380 640 640 980 430 S 1420 330 1700 480" stroke="url(#band)" stroke-width="90" fill="none" opacity=".7"/>
  </g>
  <g filter="url(#b14)" opacity=".9">
    <path d="M-100 420 C 250 180 520 520 820 300 S 1350 120 1700 330" stroke="#b7ffe0" stroke-width="10" fill="none" opacity=".55"/>
  </g>
  <path d="M0 760 L 160 640 L 290 720 L 470 560 L 640 700 L 780 610 L 960 730 L 1120 600 L 1310 710 L 1450 640 L 1600 700 V1000 H0Z" fill="#0a1222"/>
  <path d="M0 840 L 210 760 L 420 820 L 640 740 L 900 830 L 1150 760 L 1400 820 L 1600 780 V1000 H0Z" fill="#050913"/>
  <defs>${noise(0.4, 9)}`)
}

function neonCity() {
  const r = rng(5)
  let x = -20
  const buildings = []
  while (x < W) {
    const w = 50 + r() * 90, h = 120 + r() * 300
    buildings.push(`<rect x="${x.toFixed(0)}" y="${(640 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 4).toFixed(0)}" fill="#14052e"/>`)
    for (let wy = 640 - h + 14; wy < 625; wy += 22) {
      for (let wx = x + 10; wx < x + w - 12; wx += 16) {
        if (r() < 0.32) buildings.push(`<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="6" height="9" fill="${r() < 0.5 ? '#3cf2ff' : '#ff4fd8'}" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`)
      }
    }
    x += w + 6
  }
  const grid = []
  for (let i = -16; i <= 16; i++) grid.push(`<line x1="${800 + i * 30}" y1="640" x2="${800 + i * 260}" y2="1000"/>`)
  for (let i = 0; i < 9; i++) {
    const y = 640 + Math.pow(i / 8, 1.8) * 360
    grid.push(`<line x1="0" y1="${y.toFixed(0)}" x2="${W}" y2="${y.toFixed(0)}"/>`)
  }
  return svg(`<defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0221"/><stop offset=".45" stop-color="#2a0b52"/><stop offset=".64" stop-color="#b3186d"/><stop offset=".64" stop-color="#0b0220"/><stop offset="1" stop-color="#1b0638"/></linearGradient>
    <linearGradient id="sunfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe46b"/><stop offset=".55" stop-color="#ff7a59"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
    <mask id="stripes"><rect width="${W}" height="${H}" fill="#fff"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="0" y="${480 + i * 30}" width="${W}" height="${4 + i * 3}" fill="#000"/>`).join('')}</mask>
    ${blur('b60', 60)}${blur('b4', 4)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#dusk)"/>
  <circle cx="800" cy="470" r="260" fill="#ff3d8b" opacity=".35" filter="url(#b60)"/>
  <circle cx="800" cy="470" r="190" fill="url(#sunfill)" mask="url(#stripes)"/>
  ${buildings.join('')}
  <g stroke="#ff3fd2" stroke-width="2" opacity=".8" filter="url(#b4)">${grid.join('')}</g>
  <g stroke="#ff9cf0" stroke-width="1" opacity=".9">${grid.join('')}</g>
  <ellipse cx="200" cy="200" rx="260" ry="140" fill="#00e5ff" opacity=".18" filter="url(#b60)"/>
  <defs>${noise(0.45, 13)}`)
}

function forestMoss() {
  const r = rng(31)
  const bokeh = Array.from({ length: 60 }, () => {
    const cx = r() * W, cy = r() * H, rx = 20 + r() * 90
    const fill = ['#a8cf4f', '#6f9a2b', '#c9e27a', '#3f7a3a', '#e9d98c'][Math.floor(r() * 5)]
    return `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${(rx * (0.5 + r() * 0.5)).toFixed(0)}" transform="rotate(${(r() * 180).toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})" fill="${fill}" opacity="${(0.12 + r() * 0.3).toFixed(2)}"/>`
  }).join('')
  return svg(`<defs>
    <linearGradient id="canopy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c2418"/><stop offset=".5" stop-color="#1d4529"/><stop offset="1" stop-color="#3a6a2c"/></linearGradient>
    <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b0" stop-opacity=".5"/><stop offset="1" stop-color="#fff1b0" stop-opacity="0"/></linearGradient>
    ${blur('b90', 90)}${blur('b18', 18)}${blur('b40', 40)}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#canopy)"/>
  <g filter="url(#b90)">
    <ellipse cx="260" cy="260" rx="380" ry="260" fill="#0a1d12"/>
    <ellipse cx="1240" cy="760" rx="480" ry="260" fill="#6b8e23" opacity=".8"/>
    <ellipse cx="760" cy="520" rx="360" ry="220" fill="#556b2f" opacity=".9"/>
    <ellipse cx="1400" cy="200" rx="300" ry="200" fill="#9cbf4a" opacity=".55"/>
  </g>
  <g filter="url(#b40)" opacity=".7">
    <polygon points="980,-40 1110,-40 760,1040 560,1040" fill="url(#shaft)"/>
    <polygon points="1240,-40 1310,-40 1060,1040 940,1040" fill="url(#shaft)"/>
  </g>
  <g filter="url(#b18)">${bokeh}</g>
  <defs>${noise(0.5, 17)}`)
}

const SAMPLES = { 'sunset-dunes': sunsetDunes, 'deep-ocean': deepOcean, aurora, 'neon-city': neonCity, 'forest-moss': forestMoss }

mkdirSync('scripts/samples', { recursive: true })
mkdirSync('public/samples/thumbs', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, make] of Object.entries(SAMPLES)) {
  const source = make()
  writeFileSync(`scripts/samples/${name}.svg`, source)
  const html = `<html><body style="margin:0;overflow:hidden">${source}</body></html>`
  for (const [w, h, path, quality] of [[W, H, `public/samples/${name}.jpg`, 86], [320, 200, `public/samples/thumbs/${name}.jpg`, 80]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.setContent(html)
    await page.screenshot({ path, type: 'jpeg', quality })
  }
  console.log('rendered', name)
}
await browser.close()
