# SuperChromatic — E-Cell NITK Task 3 (image-based theming engine)

- Full build spec: `KICKOFF_PROMPT.md`. Official brief: `docs/TASK_BRIEF.md`. Decisions and progress log: `NOTES.md`.
- Deadline: 20 Oct 2026, 11:59 PM IST.
- Stack: React 18, Vite, TypeScript (strict), Tailwind v4 (chrome only), culori, zustand, motion, vitest, Playwright.
- Hard rule: preview components get colours ONLY from CSS variables produced by `generateTheme()` in `src/lib/theme/generate.ts`. No hard-coded colours in `src/preview/`.
- All colour maths in OKLCH/OKLab; gamut-map to sRGB at the end.
- Extraction runs in a Web Worker; never block the main thread.
- Write the extraction and theme logic by hand (originality is judged). No AI APIs, no backend.
- Respect `prefers-reduced-motion`. Keep everything keyboard accessible.
- Before calling work done: `npm run typecheck && npm run test && npm run build` plus the Playwright smoke test.
- Platform: Windows. Avoid interactive CLI prompts; use `--yes` flags.
- Commit small and often with clear messages.
