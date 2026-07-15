# Design QA — v3 graphite

- Source reference: `/var/folders/y_/hyjx3w5n59sf6hv_2zh5mjg1s_3t7m/T/codex-clipboard-d8be0256-4ae8-4d13-8bba-51db67dba915.png`
- Implementation: `http://127.0.0.1:4317/`
- Viewport: 1342 × 1242
- State: first listing, first photo, critical condition report expanded

## Visual evidence

- Graphite palette and specified orange/green/red tokens are applied.
- Gallery is 16:9 with a real eCarsTrade listing image, source, price, VAT marker, critical warning, caption, arrows, and thumbnails.
- Parameter pills remain visible and use the specified three-state treatment.
- The 68 px Yes/No action row is visible within the initial viewport and remains sticky while scrolling.
- Critical condition report is expanded on initial load and duplicated over the photograph.
- No purple/lime v2 styling or Unsplash assets remain in the active source or production bundle.

## Interaction evidence

- Gallery arrow changed active thumbnail from photo 1 to photo 2.
- All inspected listing images completed loading with natural width 780 px.
- Pill cycle produced `positive`, then `negative`, then neutral state.
- Condition report collapsed to zero visible rows and updated `aria-expanded`.
- Yes/No sends the decision and current pill snapshot to the local API and is debounced for 300 ms.
- Keyboard mapping: ArrowLeft/ArrowRight gallery; Y/Up/Enter Yes; N/Down No.
- Touch gallery swipe is enabled and navigation wraps in both directions.

## Verification

- TypeScript: passed.
- Unit tests: 3 passed.
- Production build: passed.
- Source scan for Unsplash assets: clean.

## Iteration history

1. Replaced the earlier purple/lime and mock-photo card with the graphite specification.
2. Widened the card to 1280 px and fixed the gallery to 16:9.
3. Removed the legacy mock feed from the active entry point and connected decision persistence.
4. Verified real listing media, gallery controls, pill states, report collapse, and initial action visibility.

final result: passed
