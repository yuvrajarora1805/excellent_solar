---
name: Industrial Solar Intelligence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#504533'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#837560'
  outline-variant: '#d5c4ac'
  surface-tint: '#7c5800'
  primary: '#7c5800'
  on-primary: '#ffffff'
  primary-container: '#fdb813'
  on-primary-container: '#6b4b00'
  inverse-primary: '#ffbb1e'
  secondary: '#5d5e64'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe6'
  on-secondary-container: '#616268'
  tertiary: '#466559'
  on-tertiary: '#ffffff'
  tertiary-container: '#aaccbd'
  on-tertiary-container: '#39574c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea7'
  primary-fixed-dim: '#ffbb1e'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#e2e2e9'
  secondary-fixed-dim: '#c6c6cd'
  on-secondary-fixed: '#1a1c20'
  on-secondary-fixed-variant: '#45474c'
  tertiary-fixed: '#c8eadb'
  tertiary-fixed-dim: '#accebf'
  on-tertiary-fixed: '#012017'
  on-tertiary-fixed-variant: '#2e4d42'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  technical-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built for high-stakes utility and industrial reliability. It targets professional installers, project managers, and engineers who require high data density and absolute clarity. 

The aesthetic is **Corporate Modern with a Technical Edge**. It prioritizes function and trust through structural rigors, utilizing clean lines and a systematic layout that feels as engineered as the hardware it monitors. The interface should feel like a high-end industrial control panel: precise, robust, and dependable. 

Key visual principles:
- **Clarity over Decoration:** Every element serves a functional purpose.
- **Industrial Precision:** Alignment and spacing follow a strict geometric logic.
- **Reliability:** Heavy use of "Solar Yellow" is reserved for key interactions and brand moments, while "Coal" provides a grounded, stable foundation.

## Colors

The palette is anchored in industrial durability. 

- **Primary (Solar Yellow):** Used for primary call-to-actions, active states, and highlighting key performance metrics. It represents energy and action.
- **Secondary (Coal/Navy):** Used for sidebar backgrounds, primary headings, and deep-contrast elements. It provides the "heavy" professional weight required for a trust-based platform.
- **Success (Sage Green):** A muted, professional green used to signify sustainability, completed installations, and healthy system status.
- **Neutrals:** A range of cool grays (from #F4F5F6 for backgrounds to #D1D5DB for borders) ensures the interface remains clean and data-focused.

## Typography

The typography system prioritizes legibility in complex data environments. 

- **Headlines:** Use **Hanken Grotesk** for a sharp, contemporary engineering feel. It conveys modernism and efficiency.
- **Body & Forms:** Use **Inter** for its exceptional readability in dense UI layouts and forms.
- **Technical Data:** Use **JetBrains Mono** specifically for Serial Numbers, Coordinates, and Hardware IDs to ensure zero ambiguity between characters (e.g., '0' vs 'O', '1' vs 'l').

Scale headlines down by 20% for the mobile Field App to maintain visual hierarchy on smaller viewports.

## Layout & Spacing

The system uses a **12-column fixed grid** for the Staff Portal (desktop) to ensure data-heavy dashboards remain structured. 

- **Desktop (Staff Portal):** 32px side margins with 24px gutters. Use a sidebar navigation (280px fixed) to maximize horizontal space for data tables and charts.
- **Mobile (Field App):** Shifts to a single-column fluid layout with 16px margins. Elements like project cards and forms should span the full width of the screen.
- **Rhythm:** All spacing is based on a 4px baseline grid. Use `stack-md` (16px) for standard vertical spacing between form fields and `stack-lg` (32px) for spacing between major sections or cards.

## Elevation & Depth

To maintain an industrial feel, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than dramatic shadows.

- **Surface Levels:** The base background is light gray (#F4F5F6). Content lives on white (#FFFFFF) cards.
- **Borders:** All cards and interactive elements must have a 1px solid border (#E5E7EB). This defines the "physical" boundaries of UI components.
- **Shadows:** Use a single, subtle "Industrial Shadow" for elevated elements like Modals or Hovering Cards: `0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -1px rgba(0, 0, 0, 0.03)`. 
- **Active State:** Highlight selected items with a 2px left-border stroke in Solar Yellow.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a professional balance—sharp enough to feel technical and precise, but slightly softened to feel modern and accessible.

- **Standard Buttons & Inputs:** 4px (0.25rem) corner radius.
- **Cards & Containers:** 8px (0.5rem) corner radius for a more prominent structure.
- **Status Badges:** Use a 2px radius for a sharper, more label-like appearance. 
- **Icons:** Use 2px stroke weights with squared-off terminals to match the industrial aesthetic.

## Components

### Buttons
- **Primary:** Solar Yellow background with Coal (#1A1C21) text. No gradient. Bold weight.
- **Secondary:** Coal background with White text for high-importance alternative actions.
- **Tertiary/Ghost:** 1px gray border with Coal text for low-priority actions.

### Project Status Badges
Badges are critical for identifying project states. Use a "Subtle-Fill" style:
- **Lead:** Gray background, Dark Gray text.
- **Survey:** Blue background, Dark Blue text.
- **Installation:** Yellow background, Coal text.
- **Completed:** Sage Green background, White text.

### Input Fields
Inputs must have a defined 1px border (#D1D5DB). On focus, the border changes to Coal (#1A1C21) with a 2px thickness. Labels are always positioned above the field in `label-bold` style for high scanability.

### Data Cards
Dashboards should utilize white cards with 1px borders. Header sections within cards should have a subtle bottom border to separate titles from the data body.

### Navigation
- **Desktop:** Vertical sidebar with Coal background. Active items use Solar Yellow as an accent (left border or icon color).
- **Mobile:** Bottom navigation bar for core Field App functions (Map, Tasks, Upload, Profile).