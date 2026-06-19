# Design Brief

## Direction
Pączki — playful arcade 3D donut playground with vibrant pastry aesthetics and tactile visual delight

## Tone
Maximalist playfulness with retro-arcade energy; bright, celebration-ready donut colors pop against dark void

## Differentiation
Edible, touchable pastry experience through color choreography and warm typography; 3D donuts are the showpiece, UI overlay is secondary and playful

## Color Palette
| Token      | OKLCH         | Role                           |
| ---------- | ------------- | ------------------------------ |
| background | 0.12 0.02 50  | Deep warm charcoal void        |
| foreground | 0.95 0.01 60  | Light text on dark             |
| card       | 0.16 0.018 50 | Elevated surface               |
| primary    | 0.68 0.22 30  | Warm amber/cream accent        |
| accent     | 0.65 0.24 310 | Vivid magenta/pink pop         |
| chart-1    | 0.65 0.24 20  | Glazed pink (donut)            |
| chart-2    | 0.5 0.22 30   | Chocolate brown (donut)        |
| chart-3    | 0.65 0.2 15   | Sugar white (donut)            |
| chart-4    | 0.6 0.18 50   | Jam red (donut)                |
| chart-5    | 0.7 0.22 85   | Cream yellow (donut)           |

## Typography
- Display: Nunito — playful, rounded, arcade-friendly; all headers and HUD labels
- Body: Nunito — same warm roundness for consistency; instructions and UI text
- Mono: Space Grotesk — fallback technical detail
- Scale: hero title `text-6xl font-bold`, instructions `text-base`, labels `text-sm font-semibold uppercase`

## Elevation & Depth
3D canvas anchors spatial hierarchy; UI overlay floats above with subtle shadows; no depth competition — 3D donuts are the focus

## Structural Zones
| Zone      | Background       | Border | Notes                        |
| --------- | ---------------- | ------ | ---------------------------- |
| Canvas    | chart colors     | —      | Full viewport 3D render      |
| HUD Title | transparent      | —      | Floating centered overlay     |
| HUD Info  | bg-card/40       | —      | Bottom-right corner, faded   |
| Controls  | bg-primary/20    | —      | Pill-shaped buttons on HUD   |

## Spacing & Rhythm
Tight clustering around HUD elements; generous whitespace in 3D canvas; pill-buttons with `px-6 py-3` padding; `gap-4` between controls

## Component Patterns
- Buttons: rounded pills (`rounded-full`), warm primary color on hover, slight elevation, playful font
- Labels: `text-sm uppercase tracking-widest`, warm foreground, optional accent highlight
- Badges: chart colors (donut palette), rounded, full opacity for high impact

## Motion
- Entrance: fade-in titles on load (0.6s)
- Hover: button color shift to accent, subtle scale-up (1.05), transition-smooth
- Decorative: 3D torus spin, camera orbit in background; no particle effects per constraints

## Constraints
- Dark mode only — no light variant
- No particle effects (sprinkles, sugar dust) on interaction
- No sound effects (bounce, success chime)
- No difficulty levels or leaderboard
- High contrast for 3D canvas readability
- Minimal UI chrome — let donuts dominate

## Signature Detail
Warm dark background (0.12 L charcoal) with saturated chart-color palette makes 3D donuts glow with edible tactility; playful Nunito font throughout creates retro-arcade personality that feels approachable and fun
