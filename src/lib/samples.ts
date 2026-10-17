/** Original wallpapers made for this project (SVG sources in scripts/samples/). */
export const SAMPLES = [
  { id: 'sunset-dunes', name: 'Sunset dunes' },
  { id: 'deep-ocean', name: 'Deep ocean' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'neon-city', name: 'Neon city' },
  { id: 'forest-moss', name: 'Forest moss' },
].map((s) => ({ ...s, src: `/samples/${s.id}.jpg`, thumb: `/samples/thumbs/${s.id}.jpg` }))
