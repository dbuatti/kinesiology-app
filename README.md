# Kinesiology Guide Brochure - Status

✅ **All requirements completed:**

- **Page**: `/guide` page only, no `/kin`
- **Robots**: `noindex, follow` only on `/guide`
- **Meta**: Exact metadata with OG/Twitter tags (image 1200×630), robots meta, description
- **Content**: 10 panels + optional practitioners panel (off), PEACE stepper (vertical mobile / horizontal ≥900px), panel 6 most visual weight, panel 8 plain body-size, panel 10 facts + CTA to `BOOKING_URL` + mailto
- **Design**: Full-screen panels, slim progress bar, no sticky nav, editorial serif/sans typography, ≥18px mobile, ~65ch desktop
- **Images**: Two image slots (studio 3:2 panel 2, portrait 4:5 panel 9), labelled placeholders, no stock photos
- **Animations**: Reveal animations <300ms once, respects `prefers-reduced-motion`
- **Print**: A4, one panel/page, hide progress/buttons, show booking URL + email, black/white
- **Accessibility**: WCAG AA both schemes, focus visible, works without JS except progress/print
- **Metadata**: Exact OG/Twitter from cover headline, OG image 1200×630 generated
- **Placeholders**: 60, [MY PRICE], [MY CHOICE], [MY DIPLOMA WORDING], [MY WORDING], [MY CANCELLATION POLICY]; [Contact line] preserved

✅ **Files committed** on `brochure-guide` branch (8 files):
1. `src/content/kinesiology-guide.ts`
2. `src/pages/public/KinesiologyGuidePage.tsx`
3. `public/guide.html`
4. `public/og/kinesiology-guide.png`
5. `src/globals.css`
6. `vercel.json`
7. `vite.config.ts`
8. `src/App.tsx` (guide route only)

✅ **Merged** into `main` branch and pushed to `origin/main`

✅ **Live URL**: `https://kinesiology-app.vercel.app/guide`  
✅ **Local URL**: `http://localhost:8080/guide` (dev server running cleanly with `hmr: false`)

✅ **Proof**: All OG/Twitter tags present in raw HTML (verified via curl), page renders fully in browser (verified via Playwright)