# Genesis Engine Branding Guide

## Brand Overview

**Genesis Engine** is the flagship AI image generation platform from **Seraphonix Studios**, powered by **Sovereign** technology.

### Brand Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    Seraphonix Studios                    │
│              (Parent Company / Creator)                  │
│                    🔥 Mystical Fire                     │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Creates
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Genesis Engine                         │
│              (AI Image Generation Platform)              │
│              "In the beginning, there was the prompt"    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Powered by
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Sovereign                          │
│              (Technology / Engine Core)                │
│              👑 Winged V with Crown                     │
└─────────────────────────────────────────────────────────┘
```

## Brand Elements

### 1. Seraphonix Studios

**Symbol:** Golden diamond with mystical fire at center
**Meaning:** 
- Diamond = Unbreakable quality, precious creation
- Fire = Creative spark, divine inspiration, burning passion
- Mystical symbols = Ancient wisdom meets modern technology

**Usage:**
- Primary company logo
- Footer on all materials
- Creator credit

### 2. Sovereign

**Symbol:** Golden winged "V" with crown and tail
**Meaning:**
- V = Victory, Vision, Virtuosity
- Wings = Freedom, elevation, boundless creativity
- Crown = Premium quality, sovereignty over AI generation
- Tail/Leash = Control and mastery

**Usage:**
- "Powered by Sovereign" badge
- Technology branding
- Engine core representation

### 3. Genesis Engine

**Symbol:** 🌟 Star emoji + Text
**Tagline:** "In the beginning, there was the prompt"
**Meaning:**
- Genesis = Ultimate act of creation
- Engine = Power, machinery, systematic creation
- Biblical reference = Transforming void into reality

## Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Sovereign Gold** | `#D4AF37` | rgb(212, 175, 55) | Primary brand color |
| **Mystic Gold** | `#F4E5C2` | rgb(244, 229, 194) | Light accents |
| **Deep Blue** | `#0F3460` | rgb(15, 52, 96) | Background gradient |
| **Midnight** | `#1A1A2E` | rgb(26, 26, 46) | Dark backgrounds |
| **Royal Blue** | `#16213E` | rgb(22, 33, 62) | Secondary background |

### Secondary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Creation Indigo** | `#6366F1` | Genesis Engine primary |
| **Creation Pink** | `#EC4899` | Genesis Engine secondary |
| **Success Green** | `#10B981` | Success states |
| **Warning Amber** | `#F59E0B` | Warning states |
| **Error Red** | `#EF4444` | Error states |

## Typography

### Primary Font
- **Headers:** Inter, SF Pro Display, or system-ui
- **Weights:** 600, 700, 800
- **Style:** Modern, clean, bold

### Secondary Font
- **Body:** Inter, -apple-system, sans-serif
- **Weights:** 400, 500
- **Style:** Readable, professional

### Usage Guidelines

```css
/* Genesis Engine Headers */
h1 {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* Tagline/Subtitle */
.subtitle {
  font-style: italic;
  font-weight: 400;
  letter-spacing: 0.5px;
}

/* Brand Labels */
.brand-label {
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 0.75rem;
}
```

## Logo Usage

### Seraphonix Studios Logo

**File:** `seraphonix-logo.png`
**Placement:** 
- Top left of header
- Footer on all pages
- About/Team pages

**Minimum Size:** 60px width
**Clear Space:** 20px around all sides

### Sovereign Logo

**File:** `sovereign-logo.png`
**Placement:**
- Top right of header
- "Powered by" badges
- Technology documentation

**Minimum Size:** 40px width
**Clear Space:** 15px around all sides

### Logo Placement Example

```
┌──────────────────────────────────────────────────────┐
│  [Seraphonix]          GENESIS ENGINE          [V]  │
│    Studios              🌟 🌟 🌟              Crown  │
│                         "In the beginning..."        │
└──────────────────────────────────────────────────────┘
```

## Voice & Tone

### Genesis Engine Voice

**Inspirational yet Technical**
- Biblical references (creation, genesis, seven modes)
- Technical precision (seven modes, four pillars)
- Empowering language (unleash, transform, create)

### Examples

**Good:**
- "Transform your visions into reality"
- "Seven modes of creation await"
- "The Word becomes Vision"
- "Twenty free creations daily"

**Avoid:**
- "AI tool for pics"
- "Generate images fast"
- Technical jargon without context

### Brand Voice Matrix

| Context | Tone | Example |
|---------|------|---------|
| Header | Majestic | "🌟 GENESIS ENGINE 🌟" |
| Features | Empowering | "Seven Modes of Creation" |
| Error | Helpful | "The engine requires a moment to restart" |
| Success | Celebratory | "Creation complete! Your vision lives." |
| Pricing | Clear | "20 free generations, resets at midnight UTC" |

## Application Guidelines

### Web Application

**Header:**
- Seraphonix (left) | Genesis Engine (center) | Sovereign (right)
- Golden gradient background
- Mystical blue undertones

**Footer:**
```
Created by Seraphonix Studios
Powered by Sovereign Technology
© 2026 Genesis Engine. All rights reserved.
```

### Marketing Materials

**Hierarchy:**
1. Genesis Engine (product name - largest)
2. "Created by Seraphonix Studios" (credit - medium)
3. "Powered by Sovereign" (tech badge - small)

### GitHub Repository

**README Header:**
- Center: Seraphonix logo (200px)
- Text: "Created by Seraphonix Studios"
- Sub: "Powered by Sovereign"

## File Assets

### Required Logo Files

Place these in `client/public/` and reference from root:

```
client/public/
├── seraphonix-logo.png     # Seraphonix Studios brand
├── seraphonix-logo-dark.png   # Dark variant
├── sovereign-logo.png      # Sovereign brand
├── sovereign-logo-dark.png    # Dark variant
├── genesis-icon.png        # App icon
├── favicon.ico             # Browser favicon
└── apple-touch-icon.png    # iOS icon
```

### Logo Specifications

**Seraphonix Logo:**
- Format: PNG with transparency
- Size: 400x400px (displays at 80px)
- Color: Golden yellow (#D4AF37)
- Background: Transparent or dark

**Sovereign Logo:**
- Format: PNG with transparency
- Size: 400x400px (displays at 60px)
- Color: Golden (#D4AF37)
- Background: Transparent

## CSS Implementation

### Brand Colors as CSS Variables

```css
:root {
  /* Sovereign / Seraphonix Gold Palette */
  --sovereign-gold: #D4AF37;
  --mystic-gold: #F4E5C2;
  --deep-blue: #0F3460;
  --midnight: #1A1A2E;
  --royal-blue: #16213E;
  
  /* Genesis Engine Gradient */
  --genesis-gradient: linear-gradient(135deg, 
    var(--midnight) 0%, 
    var(--royal-blue) 50%, 
    var(--deep-blue) 100%
  );
  
  /* Gold Glow Effect */
  --gold-glow: 0 0 40px rgba(212, 175, 55, 0.3);
}
```

### Header Styling

```css
.genesis-engine-header {
  background: var(--genesis-gradient);
  border: 2px solid rgba(212, 175, 55, 0.3);
  box-shadow: var(--gold-glow), var(--shadow-glow);
}

.genesis-engine-header h1 {
  background: linear-gradient(90deg, 
    var(--sovereign-gold), 
    var(--mystic-gold), 
    var(--sovereign-gold)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.5);
}
```

## Legal & Trademark

### Attribution Requirements

When using Genesis Engine:

```html
<!-- Minimum required attribution -->
<p>Created by Seraphonix Studios • Powered by Sovereign</p>
```

### Copyright Notices

**Code:** MIT License (see LICENSE)
**Brands:** 
- Seraphonix Studios™
- Sovereign™
- Genesis Engine™

## Quick Reference Card

```
┌────────────────────────────────────┐
│     GENESIS ENGINE BRAND          │
├────────────────────────────────────┤
│ Colors:                            │
│   Gold: #D4AF37                    │
│   Blue: #0F3460                    │
│   Midnight: #1A1A2E                │
├────────────────────────────────────┤
│ Fonts:                             │
│   Headers: Inter 800               │
│   Body: Inter 400                 │
├────────────────────────────────────┤
│ Tagline:                           │
│   "In the beginning, there was     │
│    the prompt"                     │
├────────────────────────────────────┤
│ Logos:                             │
│   Left: Seraphonix 🔥             │
│   Right: Sovereign 👑             │
└────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Brand Owner:** Seraphonix Studios
