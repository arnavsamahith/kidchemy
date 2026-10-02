# Kidchemy brand

## The mark

A K whose upper arm is a leaf. The letter carries the name; the leaf carries
the promise, which is growth rather than measurement.

It was chosen over five alternates because it is the only one that survived
all four tests at once: it reads as a K, it is legible at 16px, it works in a
single colour, and it says something true about the product. The runners up
are kept in `public/logo/` in case a future round revisits them.

| File | Use |
| --- | --- |
| `kidchemy-mark.svg` | Primary. Ink K, teal leaf, on light surfaces. |
| `kidchemy-mark-light.svg` | Reversed. White K, teal leaf, on dark surfaces. |
| `kidchemy-mark-white.svg` | All white. Over the teal block or over photography. |
| `kidchemy-mark-ink.svg` | All ink. Print, stamps, embroidery, fax. |
| `kidchemy-mark-teal.svg` | All teal. Single-colour digital. |
| `kidchemy-appicon.svg` | Teal tile, white mark. App icon and the rail. |
| `../favicon.svg` | Paper tile, so it reads on light and dark browser chrome. |

Clear space: at least the width of the K's stem on every side. Never put the
mark on a busy photograph without the tile behind it. Never recolour the leaf
to anything but the brand teal or white.

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| `--color-accent` | `#0E6E70` | Primary. Buttons, active state, the mark. |
| `--color-accent-hover` | `#0A585A` | Hover and pressed. |
| `--color-accent-ink` | `#08464A` | Accent text on a tint. |
| `--color-accent-tint` | `#E3F0F0` | Accent surfaces. |
| `--color-moss` | `#3D7A53` | Secondary. The parent side, and strengths. |
| `--color-paper` | `#F6F4EF` | App ground. |
| `--color-ink` | `#16130D` | Body text. |

White text on the accent measures 6.03:1, so the accent can carry a button
anywhere without a contrast exception.

There is deliberately no orange in the product. The one warm colour left is
`--color-warn` at `#7A5626`, a dark bronze, and it is a status colour only: it
marks growth edges and overdue children. It never appears as a brand surface.

## Chart colours

Categorical series are separated first by lightness and second by hue, because
lightness is the one channel that survives every kind of colour blindness.

```
--color-series-1  #6D1B33   wine
--color-series-2  #2F4191   indigo
--color-series-3  #B35A6D   rose
--color-series-4  #5580CE   cornflower
```

Worst-case OKLab dE across normal vision, protanopia, deuteranopia and
tritanopia: **15.0**, against a threshold of 12.

This matters because the palette this replaced scored **1.7**. Its purple and
its blue were, to a deuteranope, the same colour, which means any chart with
both was unreadable for roughly one man in twelve. The claim in the old code
comment that it had been validated was not true. The validator that produced
the new set is in the session notes; re-run it before changing these values.

Hand-picked palettes fail this test almost every time. Green and plum at
similar lightness collapse to a dE of 2.5. If you want to change a series
colour, change its lightness, not just its hue.

The sequential ramp is one hue, the brand teal, in even OKLab lightness steps,
ending exactly on `--color-accent`. Text on the ramp switches from ink to
paper only at the last step.

## Type

- **Display: Source Serif 4.** Headings, the wordmark, numbers that matter.
  A professional humanist serif with an optical size axis, so large headings
  tighten and small ones open up. It reads as a document about a person rather
  than a dashboard.
- **UI: Plus Jakarta Sans.** Everything else. 15px base.

The wordmark is Source Serif 4 Semibold at a tracking of -0.015em. Outline it
before sending artwork to a printer.

Do not set body copy in the serif, and do not set a heading in the sans. The
split is the whole system.

## Tone

Verbs, not labels. "Reaches for the second answer once the first one is found",
never "creative child". This is not a style preference: a fixed-trait sentence
is the thing the product exists to replace, and there is a language guard in
`src/data/pedagogy.js` that warns teachers who type one.

No em-dashes.
