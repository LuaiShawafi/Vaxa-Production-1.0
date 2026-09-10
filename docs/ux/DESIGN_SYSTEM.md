# Växa Production — High-Fidelity UI Design Reference
Version: 0.1
Status: Design reference for Codex/Cursor
Scope: Dashboard + reusable visual language for the Växa Production application

## 1. Design intent

Build a modern internal production-management application that feels calm, practical, operational and trustworthy.

The visual language must NOT resemble:
- a generic SaaS admin template
- a glossy corporate dashboard
- a fashion/e-commerce interface
- an over-designed analytics product

The design should feel like a professional production tool used every day by cultivation management and production teams.

Core visual principles:
1. Calm green-led palette.
2. High information clarity without visual noise.
3. White cards on a very light warm/green-gray background.
4. Strong hierarchy, restrained decoration.
5. Status colors communicate operational meaning, not decoration.
6. Production actions remain large and obvious.
7. Management screens can be denser than production-floor screens.
8. Preserve the team's familiar Excel mental model for weekly planning.

## 2. Exact dashboard visual system

### Application shell

Desktop:
- Left sidebar: 236 px wide.
- Main content: flexible remaining width.
- Sidebar is dark green (#1F2D24 in the current dashboard shell).
- Main background: #F5F7F4.
- Main horizontal padding: 32 px.
- Main top padding: 28 px.
- Primary grid gap: 16 px.

Sidebar:
- Brand mark: 34 × 34 px, 10 px radius.
- Brand title: 15 px, semibold/bold.
- Brand subtitle: 11 px.
- Navigation items: 11 px vertical padding, 12 px horizontal padding.
- Navigation item radius: 10 px.
- Active nav state uses a low-opacity white surface over the dark sidebar.
- Bottom user block separated with a subtle 1 px translucent border.

## 3. Typography

Use this exact font stack unless the product environment provides an equivalent Inter family:

Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

Hierarchy:
- H1: 28 px, 800 weight, tight letter spacing (-0.02em).
- H2: 22 px, 750–800 weight.
- H3/card section title: 14 px, 700 weight.
- Body: 14 px.
- Supporting/body-small: 12–13 px.
- Eyebrow labels: 11 px, uppercase, 700 weight, letter spacing 0.12em.
- Table body: 11 px.
- Table header: 10 px, uppercase, 0.06em letter spacing.
- Caption/meta: 10 px.
- KPI numeric value: 27 px, 800 weight.
- Hero KPI numeric value: 34 px, 800 weight.

Avoid excessive font weights. Use 700/750/800 only where hierarchy requires it.

## 4. Exact color palette

### Core
- Background: #F5F7F4
- Surface: #FFFFFF
- Surface 2: #EEF2ED
- Primary text: #18201B
- Muted text: #6B756D
- Border/divider: #DFE5DF

### Brand green
- Primary green: #2F6B48
- Dark green / primary action: #214D35
- Soft green background: #E4EFE7

### Semantic amber
- Amber: #B67818
- Soft amber: #FBF0DC
- Dark amber text used in pills: #8C5E12

### Semantic red
- Red: #B34B44
- Soft red: #F8E4E2
- Dark red text used in pills: #943B35

### Informational blue
- Blue: #426B8F
- Soft blue: #E7EEF5
- Dark blue text used in pills: #355A79

### Sidebar
- Sidebar background: #1F2D24
- Sidebar primary text: #FFFFFF
- Sidebar secondary text: #B9C7BD
- Sidebar muted/utility text: #AEBBB1
- Sidebar divider: rgba(255,255,255,.10)

Do not introduce additional accent colors without design-system approval.

## 5. Radius system

- Small: 8 px
- Medium: 10 px
- Large: 12 px
- Standard card: 16 px
- Hero: 20 px
- Pill: fully rounded / 999 px

The interface should look soft and modern, but not playful.

## 6. Shadows

Standard card shadow:
0 8px 24px rgba(24,32,27,.06)

Standard button shadow:
0 1px 2px rgba(0,0,0,.02)

Use shadows sparingly. Borders define structure; shadows provide only subtle elevation.

## 7. Dashboard composition

The dashboard is a morning production control center.

Header:
- Eyebrow: "MORNING PRODUCTION VIEW"
- H1: "Good morning, cultivation."
- Date beneath H1 in muted text.
- Right-side actions:
  - Search
  - Notifications with small count pill
  - Primary action: "View today's plan"

Hero:
- Full-width green gradient.
- Gradient starts around #244C35 and ends around #35694A.
- White heading and muted light-green supporting text.
- Border radius: 20 px.
- Padding: 23 px.
- Right KPI: 34 px numeric.
- Message should summarize whether today's production is broadly on track.

KPI row:
- Four equal cards at desktop.
- 3-column/2-column responsive behavior is acceptable at smaller widths.
- Each KPI card uses 18 px padding.
- Small uppercase-ish label.
- Large numeric value.
- Small explanatory note.
- Optional semantic pill.

The four dashboard KPI concepts are:
1. Today's production
2. Needs attention
3. Open issues
4. Batches in production

## 8. Status system

Green:
- On track
- Completed
- Ready
- Healthy/normal

Amber:
- Review
- Attention
- Upcoming
- Needs assessment

Red:
- Action required
- Open serious issue
- Blocked/critical

Blue:
- Planned
- Informational/live state

Never use red for ordinary delays unless action is actually required.

## 9. Today's production table

Desktop table:
- 5 columns:
  Time | Activity | Team | Plan | Status
- Header text is 10 px uppercase.
- Body is 11 px.
- 10 px vertical cell padding and 8 px horizontal padding.
- Last row has no bottom border.
- Status should be textual + semantic color, not huge colored badges.

Example row structure:
08:00 | Seeding · PU_RED_RADISH | 402 | 35 trays | Completed

The table should be visually dense enough for management but still easy to scan.

## 10. Attention panel

Use compact issue rows:
- 38 px leading grid column.
- Severity icon container: 30 × 30 px.
- Rounded 9 px.
- Title: 11 px, semibold.
- Description: 10 px muted.
- Time: 10 px muted.

Do not turn every issue into a large card. The panel should support quick morning review.

## 11. Weekly plan preview

Use 5 day columns:
MON | TUE | WED | THU | FRI

Each day:
- Background: #EEF2ED
- Radius: 12 px.
- Padding: 12 px.
- Day label: 10 px muted/semibold.
- Date number: 18 px bold.
- Small white task cards inside.

This is intentionally a lightweight preview. The actual weekly planning module will use the Excel-familiar table structure established by the production team.

## 12. Responsive behavior

At <= 1050 px:
- Sidebar collapses to an icon rail around 84 px.
- KPI cards become 6-column / 2-per-row.
- Wide/narrow content cards can become full-width.

At <= 700 px:
- Sidebar becomes a compact horizontal/mobile navigation.
- Main horizontal padding: about 14 px.
- Header stacks vertically.
- Hero becomes vertical.
- KPI cards become full-width.
- Weekly days can become a two-column or horizontally scrollable presentation.

Touch targets for production-floor interfaces should be at least 44 px high; prefer 48 px where practical.

## 13. Production-floor visual mode

The production-floor UI shares the same design system but is optimized for speed:
- Larger buttons.
- Larger typography.
- Fewer fields.
- Strong single primary action.
- Minimal typing.
- Clear worker selection.
- Strong success/blocked feedback.
- No dense management tables unless necessary.

Do NOT copy the dashboard's information density directly into the worker interface.

## 14. Component rules

Buttons:
- Primary: dark green #214D35, white text.
- Secondary: white surface, dark text, 1 px border.
- Avoid multiple competing primary buttons.
- Radius: 10 px.
- Minimum comfortable height: 40 px management, 44–48 px production.

Inputs:
- White background.
- Border #DFE5DF.
- 10 px radius.
- Clear focus state using green, not blue.

Tables:
- Minimal borders.
- Bottom dividers.
- Strong header hierarchy.
- No zebra striping unless a table becomes too dense.
- Avoid excessive cell padding.

Cards:
- 1 px #DFE5DF border.
- 16 px radius.
- Soft shadow.
- White surface.

Pills:
- 10 px text.
- 6 × 8 px internal padding.
- Fully rounded.
- Semantic only.

## 15. Dashboard behavior

The dashboard should prioritize:
1. Today
2. Attention
3. Recent issues
4. Important changes

It should not become a generic analytics screen.

The morning meeting is the primary use case.

## 16. Data behavior

All dashboard data shown in a real application must come from the production domain model.

Do not hard-code visual relationships that belong in business logic.

The dashboard should consume:
- today's production plan/tasks
- current batch states
- issues/deviations
- weekly plan data

The current HTML preview uses mock data only.

## 17. Do-not-break rules for Codex/Cursor

1. Do not replace the palette with Tailwind's default palette.
2. Do not introduce a generic blue SaaS theme.
3. Do not use gradients everywhere. The hero is the exception.
4. Do not turn every status into a large colored badge.
5. Do not make production-floor screens dense.
6. Do not remove the Excel-familiar weekly planning mental model.
7. Do not change the established border/radius hierarchy without a design-system revision.
8. Do not introduce arbitrary colors.
9. Reuse shared components and tokens rather than styling each page independently.
10. Keep responsive behavior intentional, not merely browser-default.

## 18. Implementation guidance

Create reusable design tokens first.

Recommended files:
- `design-tokens.css`
- `design-tokens.json`
- shared UI components for Button, Card, Pill, Table, Status, Sidebar, SectionHeader, KPI, IssueRow, DayColumn.

When implementing in a modern React/Next.js application:
- Use the same token values in Tailwind/theme configuration.
- Do not hard-code different colors inside individual pages.
- Prefer semantic token names over raw hex values in components.
- Keep the dashboard as the visual reference page for management mode.

## 19. Reference artifact

`Vaxa_Dashboard_High_Fidelity_Preview.html` is the exact visual reference used for this specification.

When reproducing the design, treat the HTML/CSS structure and this document together as the reference.

## 20. Design status

This is V0.1 of the visual system. It is intentionally concrete enough for implementation, while still allowing later refinement after real-user testing in 402.
