// Rasterizes the SVG logo into the PNG sizes the PWA manifest needs.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const rounded = readFileSync(join(pub, 'favicon.svg'))

// Maskable variant: full-bleed background (no rounded corners), clock kept inside the safe zone.
const maskable = Buffer.from(
  `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
     <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stop-color="#5b7cfa"/><stop offset="1" stop-color="#9b6cf2"/>
     </linearGradient></defs>
     <rect width="512" height="512" fill="url(#bg)"/>
     <circle cx="256" cy="256" r="118" fill="none" stroke="#fff" stroke-width="24"/>
     <line x1="256" y1="256" x2="256" y2="180" stroke="#fff" stroke-width="24" stroke-linecap="round"/>
     <line x1="256" y1="256" x2="312" y2="286" stroke="#fff" stroke-width="24" stroke-linecap="round"/>
     <circle cx="256" cy="256" r="16" fill="#fff"/>
   </svg>`,
)

await sharp(rounded).resize(192, 192).png().toFile(join(pub, 'pwa-192.png'))
await sharp(rounded).resize(512, 512).png().toFile(join(pub, 'pwa-512.png'))
await sharp(maskable).resize(512, 512).png().toFile(join(pub, 'pwa-maskable-512.png'))
console.log('✓ PWA icons generated (pwa-192, pwa-512, pwa-maskable-512)')
