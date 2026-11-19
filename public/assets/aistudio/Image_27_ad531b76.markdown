---
name: Academic Reciprocal Modern
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#4953bc'
  on-secondary: '#ffffff'
  secondary-container: '#8792fe'
  on-secondary-container: '#17228f'
  tertiary: '#553300'
  on-tertiary: '#ffffff'
  tertiary-container: '#744800'
  on-tertiary-container: '#ffb759'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#2f3aa3'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a clear, capable, and vibrant academic peer-to-peer exchange environment. Designed for university students seeking authentic reciprocity, the aesthetic blends collegiate structure with warm, human accessibility. It avoids cold corporate sterility, synthetic Web3/AI tropes, gamified novelty, and juvenile cartoon illustration.

The design movement centers on modern editorial utility—characterized by purposeful structural borders, deliberate typographic hierarchy, spacious rhythm, and focused functional color. The interface feels dependable, collegiate, and focused on interpersonal value: teaching what you know and learning what you need.

## Colors

The palette establishes an intentional hierarchy:
- **Primary (`#4338CA`)**: A grounded, authoritative deep indigo representing trust, focused study, and platform stability. Used for primary interactions, active navigational states, and core branding anchors.
- **Secondary (`#818CF8`)**: A balanced soft violet-lavender providing harmonious pairing for secondary buttons, soft surface tints (`#EEF2FF`, `#E0E7FF`), and 'Teaching' categorical distinction.
- **Tertiary (`#F59E0B`)**: Honey amber reserved strictly for high-value focal moments: mutual match highlights, star ratings, and transactional calls-to-action that require distinct emphasis from the indigo primary.
- **Neutrals**: Crisp white (`#FFFFFF`) for elevated cards, off-white slate (`#F8FAFC`, `#F1F5F9`) for page canvases, structural borders (`#E2E8F0`, `#CBD5E1`), muted text (`#64748B`), and dense slate-charcoal (`#1E293B`, `#0F172A`) for high-contrast, readable text adhering strictly to WCAG AA guidelines.
- **Functional Semantics**: Emerald (`#10B981`) for confirmed sessions and approvals, Crimson (`#EF4444`) for declines and cancellations, and Indigo (`#6366F1`) for informative contextual alerts.

## Typography

The type system balances structure and approachability through two complementary typefaces:
- **Headings (Plus Jakarta Sans)**: Delivers geometric warmth with contemporary structural proportions. Tight negative letter spacing is applied to larger scales to maintain structural unity.
- **Body & Controls (Inter)**: Provides legible micro-typography across lists, metadata arrays, data chips, and interactive states.
- **Hierarchy Rules**: Display scales are reserved for primary screen entries. Section titles utilize `headline-md` with `label-md` for categorical subtitles. Metadata, time stamps, and auxiliary labels rely on `label-sm` or `caption` in neutral slate tones (`#64748B`).

## Layout & Spacing

This design system utilizes an 8pt-based spatial model paired with a responsive 12-column grid.

- **Desktop (1024px and above)**: 12-column layout, 24px (`1.5rem`) gutters, with maximum content width capped at 1280px. Permanent 260px vertical navigation sidebar on internal views.
- **Tablet (768px - 1023px)**: 8-column layout, 16px (`1rem`) gutters, 24px margins. Navigation shifts to a slim icon rail (72px) or collapsible top bar.
- **Mobile (below 768px)**: 4-column layout, 16px gutters, 16px outer margins. Navigation relocates to an off-canvas drawer or bottom navigation dock.

Spacial rhythm between unrelated component groupings adheres strictly to `space-xl` (32px), internal card padding utilizes `space-lg` (24px) for desktop and `space-md` (16px) for mobile, and close inline micro-elements (icons, badges, chips) maintain a consistent `space-xs` (4px) to `space-sm` (8px) gap.

## Elevation & Depth

Visual hierarchy relies primarily on structural boundaries, tonal background shifts, and restrained ambient diffusion rather than heavy physical drops:

- **Level 0 (Base Canvas)**: Clean matte finish on `#F8FAFC`. Zero elevation.
- **Level 1 (Cards, Modules, Input Fields)**: `#FFFFFF` surface resting on `#F8FAFC`, defined by a crisp 1px border of `#E2E8F0` and an ultra-subtle ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hover States, Interactive Cards)**: On hover, cards transition to a lifted ambient state: `0 4px 6px -1px rgba(67, 56, 202, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`, slightly darkening the boundary stroke to `#CBD5E1`.
- **Level 3 (Popovers, Select Menus, Dropdowns)**: Floating contextual menus use `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)` with a 1px `#E2E8F0` border.
- **Level 4 (Modals & Focus Dialogs)**: Overlaid with a neutral backdrop scrim (`#0F172A` at 40% opacity), dialog surfaces use an elevated shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

## Shapes

The interface embraces a balanced curvature:
- **Base Components (`rounded-md`, 8px / 0.5rem)**: Used for buttons, form inputs, skill tags, select controls, dropdown menus, and standard interactive tiles.
- **Structural Containers (`rounded-lg`, 16px / 1rem)**: Used for student profiles, exchange request cards, session panels, and modal shells.
- **Pill Geometry (`rounded-full`, 9999px)**: Reserved strictly for notification badges, status indicators, avatar masks, and user feedback rating chips to distinguish meta-information from actionable containers.

## Components

### Buttons
- **Primary**: Solid Deep Indigo (`#4338CA`), text in `#FFFFFF`, font weight 600. Focus ring: 3px `#C7D2FE`. Hover state transitions to `#3730A3`.
- **Secondary**: Tinted Lavender (`#EEF2FF`), text in `#4338CA`, border 1px solid `#C7D2FE`. Hover: `#E0E7FF`.
- **Accent (Key Match)**: Warm Honey Amber (`#F59E0B`), text in `#0F172A`, font weight 600. Reserved for high-intent matching prompts. Hover: `#D97706`.
- **Destructive**: White background with 1px border `#FCA5A5`, text `#DC2626`. Hover: `#FEF2F2`.
- **Ghost / Text**: Transparent background, text `#475569`. Hover: `#F1F5F9`, text `#0F172A`.

### Form Elements & Search
- **Input Fields & Textarea**: Background `#FFFFFF`, 1px border `#CBD5E1`, text `#0F172A`, placeholder `#94A3B8`. Active/Focus: 1px border `#4338CA` with an ambient 3px `#E0E7FF` ring.
- **Search Bar**: Prepended with a 16px slate search glyph, includes an inline clear ("×") button when active, paired with quick-filter chip toggles underneath.
- **Checkboxes & Radios**: 16px square (rounded 4px) and 16px circle respectively; unselected border `#CBD5E1`, checked state `#4338CA` with crisp white checkmark/dot.

### Skill Tags (Dual-Mode Exchange)
- **'Teaches' Pill**: Background `#EEF2FF`, border 1px solid `#C7D2FE`, text `#3730A3`, prefixed with a subtle directional arrow up-right or "Teaches:" label in `label-sm`.
- **'Learning' Pill**: Background `#F8FAFC`, border 1px solid `#E2E8F0`, text `#475569`, prefixed with an arrow down-left or "Learning:" label.
- **Editable Variant**: Houses an accessible 12px dismiss icon (`#64748B` hover `#DC2626`) for rapid profile adjustments.

### Avatars & Identity
- **Student Avatar**: Circular container with 1px stroke `#E2E8F0`. Displays image or 2-letter uppercase initials on `#E0E7FF` (text `#3730A3`).
- **Presence & Major**: Accompanied by a 10px circular online indicator (`#10B981` with 2px white border) at the bottom-right corner and a text caption displaying "Major • Class Year" (e.g., "Computer Science • '26").

### Cards
- **Student Profile Card**: Outlined white container displaying avatar, student name, university department, horizontal split section for skills offered vs. skills sought, mutual exchange star rating (amber `#F59E0B` icon + average score), and a persistent "Request Exchange" secondary action button.
- **Request Card**: Highlights incoming vs outgoing directionality. Features a visual bidirectional exchange lockup: `[Teaching Skill] ⇄ [Learning Skill]`, requested meeting window, status badge, and clear dual actions: Primary "Accept" and Destructive "Decline".
- **Session Card**: Outlined schedule card with clean calendar date anchor on the left, partner identification in center, designated channel/room details, and auxiliary links to "Reschedule" or "Cancel".

### Badges & Status Indicators
- **Pending**: Background `#FEF3C7`, text `#92400E`, border 1px solid `#FDE68A`.
- **Scheduled**: Background `#E0E7FF`, text `#3730A3`, border 1px solid `#C7D2FE`.
- **Completed**: Background `#D1FAE5`, text `#065F46`, border 1px solid `#A7F3D0`.
- **Canceled / Declined**: Background `#FEE2E2`, text `#991B1B`, border 1px solid `#FECACA`.

### Dialogs & Modals
- Central floating cards with clear structural title bars, accessible dismiss icon in top right, formatted form fields with standard spacing rhythm, and bottom actions anchored to the right (Cancel on left, Confirmation Action on right).