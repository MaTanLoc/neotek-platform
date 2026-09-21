# NEOTEK — AGENTS.md

> Project: Neotek Enterprise ERP Website
> Role: Modern Enterprise SaaS / ERP Website
> Primary Stack: ReactJS
> Design Direction: Modernize the experience, not the identity.

---

# 01. PROJECT CONTEXT

Neotek is redesigning its website as a modern enterprise ERP / business management platform website.

The website must not feel like a traditional corporate IT company website.

It should feel like:

> A modern enterprise SaaS product website for a real ERP platform.

The experience must balance:

- Enterprise credibility
- Modern SaaS aesthetics
- ERP product clarity
- Business value
- Trust
- Conversion
- Neotek's existing brand identity

The final experience should communicate:

> "Neotek is a real enterprise management platform."

Not:

> "Neotek is simply an IT company website."

---

# 02. AGENT ROLE

When working on this project, act as:

- Senior Product Designer
- Senior UI/UX Designer
- Senior Frontend Engineer
- Frontend Architect
- Design System Engineer
- SaaS Website Strategist

All implementation decisions must be evaluated in the context of:

**ERP + Enterprise SaaS + B2B + Business Management + Modern Web**

Do not make generic landing-page decisions without considering the ERP / enterprise context.

---

# 03. CORE DESIGN PRINCIPLE

## Modernize the experience, not the identity.

Neotek already has an existing brand identity and logo.

Do not attempt to replace the identity with a completely new visual language.

The intended transformation is:

```text
Existing Neotek Brand
        ↓
Modern Design System
        ↓
Modern SaaS Experience
        ↓
Enterprise ERP Product Presentation

The website should make the existing Neotek logo feel appropriate inside a modern digital product environment.

04. EXISTING BRAND IDENTITY

The existing Neotek logo contains:

Red Neotek wordmark
Gear / technology-inspired symbol
Gray / dark elements
Traditional corporate technology character
Rules

DO:

Preserve the existing logo.
Preserve its proportions.
Preserve its recognizable identity.
Preserve the brand red.
Build a modern interface around it.

DO NOT:

Redesign the logo.
Replace the logo.
Change the logo proportions.
Apply unnecessary effects to the logo.
Turn the brand into a completely different visual identity.

Modernization should come from:

Typography
Layout
Grid
Spacing
UI components
Product visualization
Data visualization
Motion
Iconography
White space
Interaction design
05. VISUAL DIRECTION

The overall visual direction is:

Modern Enterprise SaaS × ERP × Technology × Premium Corporate

The interface should feel:

Reliable
Intelligent
Efficient
Connected
Scalable
Professional
Structured
Premium
Technology-driven

Avoid:

Generic corporate templates
Excessive stock photography
Startup cartoon aesthetics
Playful SaaS styling
Cyberpunk
Sci-fi aesthetics
Excessive gradients
Excessive glassmorphism
Neumorphism
Excessive 3D decoration
Decorative blobs without meaning
Random abstract graphics

Visual elements should communicate real business concepts such as:

ERP
Data
Workflow
Finance
HR
Sales
Inventory
Manufacturing
Reporting
Management
Automation
AI
Business intelligence
06. DESIGN PRINCIPLES

Always prioritize:

Clarity over decoration
Product over decoration
Business value over generic marketing
Trust over hype
Real data over invented claims
Consistency over unnecessary creativity
Interaction over static presentation
07. BRAND COLOR SYSTEM

The primary Neotek brand red is:

#EC1C24

Primary hover:

#D91820

Primary soft:

#FFF1F2

Main dark:

#111111

White:

#FFFFFF

Neutral palette:

#FAFAFA
#F4F4F5
#E4E4E7
#D4D4D8
#A1A1AA
#71717A
#52525B
#3F3F46
#27272A
#18181B

Semantic status colors:

Success: #16A34A
Warning: #F59E0B
Error:   #DC2626
Info:    #2563EB
08. COLOR USAGE

Neotek Red is a brand accent.

It is NOT the default background color for the website.

Use red primarily for:

Primary CTA
Active state
Important highlight
Key metric
Accent line
Product interaction
Important UI state
Selected state
Relevant links / hover states

Prefer:

White
↓
Light Gray
↓
Dark
↓
White
↓
Dark

with red used strategically as an accent.

Avoid creating a website dominated by large red sections.

Approximate visual balance:

White / Off-white: 45–50%
Light Gray:        20–25%
Black / Dark:      15–20%
Neutral Gray:      10–15%
Neotek Red:        5–8%

These are design guidelines, not strict mathematical requirements.

09. DESIGN TOKEN ARCHITECTURE

All Neotek-specific design tokens MUST use:

--neotek-*

Never create generic global tokens such as:

--primary
--color-primary
--font-primary
--space-md
--radius-lg

Prefer:

--neotek-color-primary
--neotek-font-family-base
--neotek-space-4
--neotek-radius-lg

The namespace is mandatory.

10. TOKEN LAYERS

Use a two-level token architecture:

Primitive Tokens
        ↓
Semantic Tokens
        ↓
Components
Primitive Tokens

Represent raw design values.

Example:

--neotek-red-500: #EC1C24;
--neotek-gray-900: #18181B;
--neotek-white: #FFFFFF;
Semantic Tokens

Represent design meaning.

Example:

--neotek-color-primary: var(--neotek-red-500);
--neotek-color-text-primary: var(--neotek-gray-900);
--neotek-color-background: var(--neotek-white);

Components should primarily consume semantic tokens.

11. COLOR TOKENS

Use:

:root {
  /* ========================================
     NEOTEK — COLOR PRIMITIVES
     ======================================== */

  --neotek-red-50: #FFF1F2;
  --neotek-red-100: #FFE4E6;
  --neotek-red-200: #FECDD3;
  --neotek-red-300: #FDA4AF;
  --neotek-red-400: #FB7185;
  --neotek-red-500: #EC1C24;
  --neotek-red-600: #D91820;
  --neotek-red-700: #B91C1C;
  --neotek-red-800: #991B1B;
  --neotek-red-900: #7F1D1D;

  --neotek-gray-50: #FAFAFA;
  --neotek-gray-100: #F4F4F5;
  --neotek-gray-200: #E4E4E7;
  --neotek-gray-300: #D4D4D8;
  --neotek-gray-400: #A1A1AA;
  --neotek-gray-500: #71717A;
  --neotek-gray-600: #52525B;
  --neotek-gray-700: #3F3F46;
  --neotek-gray-800: #27272A;
  --neotek-gray-900: #18181B;

  --neotek-black: #111111;
  --neotek-white: #FFFFFF;


  /* ========================================
     NEOTEK — SEMANTIC COLORS
     ======================================== */

  --neotek-color-primary: var(--neotek-red-500);
  --neotek-color-primary-hover: var(--neotek-red-600);
  --neotek-color-primary-active: var(--neotek-red-700);
  --neotek-color-primary-soft: var(--neotek-red-50);

  --neotek-color-text-primary: var(--neotek-gray-900);
  --neotek-color-text-secondary: var(--neotek-gray-600);
  --neotek-color-text-tertiary: var(--neotek-gray-500);
  --neotek-color-text-disabled: var(--neotek-gray-400);
  --neotek-color-text-inverse: var(--neotek-white);

  --neotek-color-background: var(--neotek-white);
  --neotek-color-background-subtle: var(--neotek-gray-50);
  --neotek-color-background-muted: var(--neotek-gray-100);
  --neotek-color-background-dark: var(--neotek-gray-900);

  --neotek-color-border: var(--neotek-gray-200);
  --neotek-color-border-strong: var(--neotek-gray-300);
  --neotek-color-border-focus: var(--neotek-red-500);

  --neotek-color-success: #16A34A;
  --neotek-color-warning: #F59E0B;
  --neotek-color-error: #DC2626;
  --neotek-color-info: #2563EB;
}

Do not hard-code these values inside components when an appropriate token exists.

12. TYPOGRAPHY

Primary font:

Inter

Inter should be used throughout the website unless there is a specific documented reason to use another font.

Inter should support:

Marketing pages
Product UI
Dashboard visuals
Tables
Forms
Navigation
Numbers
Buttons

Font weights:

400 — Regular
500 — Medium
600 — Semibold
700 — Bold
800 — ExtraBold
13. TYPOGRAPHY TOKENS

Use:

:root {
  --neotek-font-family-base:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  --neotek-font-size-xs: 12px;
  --neotek-font-size-sm: 14px;
  --neotek-font-size-md: 16px;
  --neotek-font-size-lg: 18px;
  --neotek-font-size-xl: 20px;
  --neotek-font-size-2xl: 24px;
  --neotek-font-size-3xl: 32px;
  --neotek-font-size-4xl: 40px;
  --neotek-font-size-5xl: 48px;
  --neotek-font-size-6xl: 64px;
  --neotek-font-size-7xl: 72px;

  --neotek-font-weight-regular: 400;
  --neotek-font-weight-medium: 500;
  --neotek-font-weight-semibold: 600;
  --neotek-font-weight-bold: 700;
  --neotek-font-weight-extrabold: 800;

  --neotek-line-height-tight: 1.1;
  --neotek-line-height-snug: 1.25;
  --neotek-line-height-normal: 1.5;
  --neotek-line-height-relaxed: 1.6;
}
14. TYPOGRAPHY SCALE

Desktop baseline:

Display     72px / 800 / 1.05
H1          64px / 700–800 / 1.08
H2          48px / 700 / 1.10
H3          32px / 700 / 1.20
H4          24px / 600–700 / 1.25
Body Large  20px / 400 / 1.60
Body        16px / 400 / 1.60
Small       14px / 400–500 / 1.50
Caption     12px / 500 / 1.40

Suggested mobile baseline:

Display     40px
H1          36–40px
H2          32px
H3          24px
H4          20px
Body        16px
Small       14px

Do not use huge typography everywhere.

Typography hierarchy should communicate importance.

15. TYPOGRAPHY CONTENT PRINCIPLE

Prefer:

Strong headline
+
Short supporting copy
+
Clear CTA
+
Product visual

Avoid:

Large headline
+
Long marketing paragraph
+
Multiple paragraphs
+
Multiple unrelated CTAs

Copy should generally follow:

Problem
↓
Solution
↓
Benefit
↓
Proof
↓
CTA
16. SPACING TOKENS

Use:

:root {
  --neotek-space-1: 4px;
  --neotek-space-2: 8px;
  --neotek-space-3: 12px;
  --neotek-space-4: 16px;
  --neotek-space-5: 20px;
  --neotek-space-6: 24px;
  --neotek-space-8: 32px;
  --neotek-space-10: 40px;
  --neotek-space-12: 48px;
  --neotek-space-16: 64px;
  --neotek-space-20: 80px;
  --neotek-space-24: 96px;
  --neotek-space-32: 128px;
}

Use tokens instead of arbitrary spacing values whenever possible.

17. RADIUS TOKENS

Use:

:root {
  --neotek-radius-sm: 6px;
  --neotek-radius-md: 8px;
  --neotek-radius-lg: 12px;
  --neotek-radius-xl: 16px;
  --neotek-radius-2xl: 20px;
  --neotek-radius-full: 9999px;
}

Do not make every element heavily rounded.

The overall interface should remain enterprise-oriented.

18. SHADOW TOKENS

Use subtle shadows:

:root {
  --neotek-shadow-sm:
    0 1px 2px rgb(0 0 0 / 0.05);

  --neotek-shadow-md:
    0 4px 12px rgb(0 0 0 / 0.08);

  --neotek-shadow-lg:
    0 12px 32px rgb(0 0 0 / 0.10);
}

Prefer borders and surface contrast over heavy shadows.

19. LAYOUT TOKENS

Use:

:root {
  --neotek-container-max-width: 1280px;

  --neotek-container-padding-desktop: 24px;
  --neotek-container-padding-tablet: 24px;
  --neotek-container-padding-mobile: 20px;

  --neotek-section-spacing-desktop: 128px;
  --neotek-section-spacing-tablet: 96px;
  --neotek-section-spacing-mobile: 72px;
}
20. MOTION TOKENS

Use:

:root {
  --neotek-duration-fast: 150ms;
  --neotek-duration-normal: 250ms;
  --neotek-duration-slow: 400ms;

  --neotek-ease-standard:
    cubic-bezier(0.2, 0.8, 0.2, 1);

  --neotek-ease-emphasized:
    cubic-bezier(0.16, 1, 0.3, 1);
}

Motion must be:

Subtle + Premium + Purposeful

Avoid:

Excessive bounce
Aggressive parallax
Constant animation
Distracting movement
21. COMPONENT NAMING

Use the Neotek namespace for reusable components where appropriate.

Examples:

NeotekButton
NeotekCard
NeotekContainer
NeotekSection
NeotekNavbar
NeotekFooter
NeotekBadge
NeotekAIChat

CSS naming should preferably use:

.neotek-*

Examples:

.neotek-button
.neotek-card
.neotek-container
.neotek-section
.neotek-navbar
.neotek-footer
.neotek-chatbot

If CSS Modules are used, local class naming may follow the project convention.

The --neotek-* design token namespace remains mandatory.

22. RECOMMENDED PROJECT STRUCTURE

Prefer:

src/
├── assets/
│
├── components/
│   ├── common/
│   │   ├── NeotekButton/
│   │   ├── NeotekContainer/
│   │   ├── NeotekSection/
│   │   └── NeotekBadge/
│   │
│   ├── layout/
│   │   ├── NeotekNavbar/
│   │   └── NeotekFooter/
│   │
│   ├── sections/
│   │   ├── Hero/
│   │   ├── SocialProof/
│   │   ├── Solutions/
│   │   ├── Product/
│   │   ├── Integrations/
│   │   ├── CaseStudies/
│   │   ├── Trust/
│   │   ├── Pricing/
│   │   ├── Resources/
│   │   ├── About/
│   │   ├── FAQ/
│   │   └── Contact/
│   │
│   ├── product/
│   │
│   ├── chatbot/
│   │   └── NeotekAIChat/
│   │
│   └── ui/
│
├── pages/
├── data/
├── hooks/
├── utils/
│
├── styles/
│   ├── neotek-tokens.css
│   ├── neotek-typography.css
│   ├── neotek-global.css
│   └── neotek-utilities.css
│
├── App.jsx
└── main.jsx

Adapt this structure to the existing repository.

Do not destroy an existing working architecture without a clear reason.

23. CSS ARCHITECTURE

Use:

neotek-tokens.css
        ↓
neotek-typography.css
        ↓
neotek-global.css
        ↓
neotek-utilities.css
        ↓
component styles

Design tokens must be centralized.

Do not scatter global variables across component files.

24. NO HARDCODED DESIGN VALUES

When a Neotek design token exists, use it.

Avoid:

background: #EC1C24;
border-radius: 12px;
padding: 24px;

Prefer:

background: var(--neotek-color-primary);
border-radius: var(--neotek-radius-lg);
padding: var(--neotek-space-6);

Avoid arbitrary design values unless there is a documented component-specific reason.

25. GLOBAL CSS

The global stylesheet should establish:

Box sizing
Body reset
Font family
Background
Text color
Image defaults
Button/input font inheritance
Links
Focus states
Selection
Basic accessibility behavior

Example:

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--neotek-color-background);
  color: var(--neotek-color-text-primary);
  font-family: var(--neotek-font-family-base);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

img {
  display: block;
  max-width: 100%;
}

button,
input,
textarea,
select {
  font: inherit;
}

Adapt to the existing application.

26. BASE COMPONENTS

Create reusable foundations for:

NeotekContainer

Responsibilities:

Maximum content width
Horizontal padding
Responsive behavior
NeotekSection

Responsibilities:

Vertical spacing
Section background
Layout consistency

Variants may include:

Default
Compact
Large
Light
Dark
NeotekButton

Variants:

Primary
Secondary
Outline
Ghost
NeotekCard

Variants:

Default
Elevated
Interactive
Dark

These components should consume Neotek design tokens.

27. NAVIGATION

The website should use a modern enterprise SaaS navigation pattern.

Potential structure:

Solutions
Products
Industries
Resources
Company
Pricing

Primary CTA:

Đăng ký Demo

Mega menu may be used if required.

Navigation must support:

Desktop
Tablet
Mobile
Keyboard interaction
Focus states
28. WEBSITE INFORMATION ARCHITECTURE

The website may contain:

Brand
Logo
Brand name
Visual identity
Brand positioning
Hero
Value proposition
Product visual
Primary CTA
Secondary CTA
Social Proof
Customer logos
Key metrics
Real traction
Testimonials
Product / Solution
Features
Solutions
USP
Integrations
ERP Modules

Potential categories:

Finance
Accounting
Human Resources
Sales
CRM
Purchasing
Inventory
Manufacturing
Project Management
Workflow
Reporting
Business Intelligence
AI

Only include capabilities that are verified as part of Neotek.

Case Studies
Customer
Problem
Solution
Implementation
Results
Customer quote
Certifications / Awards
Certifications
Awards
Partnerships
Technology partners
Pricing

If public:

Plans
Feature comparison
CTA

If not public:

Request a Quote
Contact Sales
Book a Demo

Never invent pricing.

Resources
Blog
Guides
Industry insights
Documentation
Case studies
Product updates
Whitepapers
FAQ
Careers
About
Company introduction
History
Vision
Mission
Core values
Team
Leadership
Milestones
Partnerships
FAQ
General
Product
Pricing
Support
Contact / Demo
Contact information
Contact form
Book a Demo
Request consultation
Trial / Sign up if actually available
Footer
Company
Products
Solutions
Resources
Contact
Privacy Policy
Terms
Sitemap
Social media
29. HERO DIRECTION

The Hero must quickly communicate:

What Neotek is.
Who it is for.
What problem it solves.
What action the user can take.

Preferred structure:

Eyebrow
↓
Strong H1
↓
Supporting statement
↓
Primary CTA + Secondary CTA
↓
Product visual

The product visual should preferably represent an actual ERP / business management interface.

Avoid generic stock photography as the main Hero visual.

30. PRODUCT VISUALIZATION

Product visualization is a core part of the website.

Prefer:

Dashboard
KPI
Charts
Tables
Reports
Workflow
Product screenshots
UI mockups
Business data
Interactive product previews

The visual should make the visitor understand:

"This is an actual ERP platform."

Do not use random dashboard UI unrelated to the actual product.

31. ERP STORYTELLING

Do not present ERP only as a feature list.

Explain it through:

Business
↓
Department
↓
Process
↓
Data
↓
Result

The website should communicate how different business functions connect.

32. SOCIAL PROOF

Social proof may include:

Customer logos
Customer count
User count
Years of experience
Projects
Industry coverage
Testimonials
Case studies
Certifications
Awards
Partnerships

Only use verified information.

If information is missing:

[NEED VERIFIED DATA]

Do not invent metrics.

33. USP

USP should explain why a company would use Neotek rather than managing business operations through disconnected tools.

Potential dimensions:

Unified platform
Centralized data
Automation
Customization
Integration
Scalability
AI
Reporting
Industry-specific solutions
Support

Only communicate capabilities that are verified.

34. INTEGRATIONS

If Neotek supports integrations, communicate them as an ecosystem.

Potential categories:

Accounting
CRM
HR
Banking
E-commerce
Zalo
Email
API
Third-party systems

Do not claim an integration without verification.

35. CASE STUDIES

Structure case studies as:

Customer
↓
Problem
↓
Solution
↓
Implementation
↓
Results
↓
Customer Quote

Focus on measurable business outcomes when real data exists.

36. TRUST

Trust should come from:

Real customers
Real testimonials
Real case studies
Certifications
Awards
Partnerships
Product screenshots
Verified metrics
Company history

Do not fabricate trust signals.

37. PRICING

If Neotek provides public pricing, communicate:

Plans
Features
Comparison
CTA

If pricing is not public:

Use:

Request a Quote
Contact Sales
Book a Demo

Do not invent prices.

38. RESOURCES

Resources should be treated as a:

Knowledge Hub

Potential content:

Blog
ERP guides
Business insights
Industry insights
Case studies
Documentation
Product updates
Whitepapers
FAQ
Hiring
39. AI CHATBOT

The website will support an AI assistant.

The conceptual name is:

Neotek AI Assistant

Potential capabilities:

Explain Neotek
Explain ERP
Explain modules
Answer FAQs
Recommend solutions
Collect leads
Request consultation
Book a demo
Transfer to human support

UI states should include:

Floating button
Closed state
Open state
Chat panel
Suggested questions
Message state
Loading state
Typing state
Error state
Lead CTA
Human handoff

The chatbot must not obstruct important content or the primary CTA.

40. ZALO

Zalo may be integrated for:

Contact
Customer support
Consultation
Lead generation

AI chatbot and Zalo must have clearly differentiated purposes.

Do not allow multiple floating buttons to visually compete.

Use the correct terminology based on the actual implementation.

41. RESPONSIVE DESIGN

Support:

Desktop
Laptop
Tablet
Mobile

Do not simply shrink the desktop layout.

Mobile requires dedicated design decisions for:

Navigation
Hero
Product visuals
Cards
Tables
Pricing
Forms
Chatbot
CTA
Mega menus
42. ACCESSIBILITY

Use:

Semantic HTML
Logical heading hierarchy
Keyboard navigation
Visible focus states
Appropriate color contrast
Accessible forms
Alt text
ARIA only where necessary

Do not sacrifice accessibility for visual effects.

43. PERFORMANCE

Prioritize:

Fast initial load
Optimized images
Lazy loading
WebP / AVIF when appropriate
Code splitting
Minimal unnecessary JavaScript
Component optimization
Lightweight animation
Minimal dependency bloat
44. SEO

Support:

Semantic HTML
Page titles
Meta descriptions
Open Graph
Heading hierarchy
Structured data where appropriate
Internal linking
SEO-friendly URLs
Sitemap
Robots.txt
Image alt text

Potential content topics include:

ERP
ERP Việt Nam
Phần mềm quản trị doanh nghiệp
Quản trị doanh nghiệp
Chuyển đổi số
Quản trị tài chính
Quản trị nhân sự
Quản trị bán hàng
ERP theo ngành

Do not keyword stuff.

45. COPYWRITING

Default website language:

Professional Vietnamese

Tone:

Clear
Confident
Concise
Business-oriented
Technology-oriented

Avoid unsupported claims such as:

"Số 1"
"Tốt nhất"
"Đột phá"
"Hàng đầu thế giới"
"Tối ưu mọi thứ"

unless supported by verified evidence.

Prefer:

Problem
→ Solution
→ Benefit
→ Proof
→ CTA
46. REAL DATA POLICY

This is a strict rule.

Never fabricate:

Customer numbers
User numbers
Revenue
Awards
Certifications
Integrations
Product capabilities
Pricing
Testimonials
Customer results
Business metrics

If data is unavailable, use:

[NEED VERIFIED DATA]

or ask for the required information.

47. REFERENCE WEBSITES

Use the following websites as design and information references.

Neotek Inovasi

https://www.neotekinovasi.com/

Use for:

ERP positioning
Enterprise messaging
Solution presentation
Product structure

Do not copy the visual design.

MISA

https://www.misa.vn/

MISA AMIS

https://amis.misa.vn/

Use for understanding:

ERP information architecture
Product modules
Enterprise trust
Customer proof
Awards
Certifications
Business solutions
Industry solutions
AI
Product ecosystem

Use MISA primarily to understand:

What information an ERP website needs to communicate.

Do not copy its visual identity.

Monday

https://monday.com/

Use for:

Product storytelling
Product visualization
Workflow
SaaS interaction
Motion
Product-led presentation
HubSpot

https://www.hubspot.com/

Use for:

SaaS storytelling
Product ecosystem
CTA structure
Social proof
Product modules
Integrations
AI positioning
Resources
Conversion
48. REFERENCE ANALYSIS RULE

When given a reference website or screenshot, analyze it using:

Content

What is being communicated?

UX

How is the user guided?

UI

Analyze:

Layout
Grid
Typography
Color
Cards
Navigation
Spacing
Components
Interaction

Analyze:

Hover
Scroll
Animation
Transitions
Product interaction
Conversion

Analyze:

CTA
Demo
Contact
Trial
Form
Social proof
Neotek Adaptation

Explain:

What should Neotek borrow?
Why is it useful?
How should it be transformed into Neotek's visual language?
What should NOT be copied?

Never reproduce another website's design directly.

49. SECTION DESIGN PROCESS

When asked to design a section, think through these layers before coding:

1. Purpose

What is this section supposed to accomplish?

2. User Question

What does the visitor need to understand?

3. Content

What information is required?

4. Layout

How should the information be structured?

5. Visual

What visual best communicates the idea?

6. Interaction

What interaction improves understanding?

7. CTA

What action should the user take?

8. Responsive

How should the section behave on mobile?

Then implement:

UI structure
Component structure
React
CSS
Animation
50. REACT DEVELOPMENT RULES

React code must be:

Component-based
Reusable
Maintainable
Semantic
Responsive
Production-oriented

Avoid:

Giant components
Repeated JSX
Repeated CSS
Hard-coded design values
Unnecessary abstraction
Unnecessary dependencies

Separate:

Presentation
Data
Business logic
Utilities

where practical.

51. DEPENDENCY RULE

Before installing a dependency:

Inspect package.json.
Check whether the existing project already has a suitable solution.
Reuse existing dependencies when possible.
Only add a new dependency when it provides a clear benefit.
Avoid dependency bloat.

Potential libraries include:

React Router
Framer Motion
Lucide React
shadcn/ui
Radix UI
Ant Design
Recharts
ECharts
Chart.js
React Hook Form
Zod
FullCalendar

Do not install all of these by default.

Use only what the actual project requires.

52. ASSET RULES

Use the existing Neotek assets when available.

Do not recreate the logo.

Do not redraw the logo.

Do not replace the logo with a generated logo.

Do not modify its proportions.

Use optimized image formats where appropriate.

If an important asset is missing:

[ASSET REQUIRED]

Do not silently invent a replacement that could be mistaken for official branding.

53. PRODUCT UI RULE

When creating ERP dashboard mockups or product visuals for marketing purposes:

The visual should be:

Believable
Structured
Business-oriented
Consistent with the Neotek Design System
Data-oriented

Use:

KPI
Charts
Tables
Status
Filters
Navigation
Reports
Business workflows

Avoid meaningless fake UI.

If actual product screenshots are available, prefer them.

54. DESIGN REVIEW

When reviewing a design, evaluate:

Category	Question
Brand	Does it feel like Neotek?
UX	Is it easy to understand?
UI	Does it feel modern?
Enterprise	Does it feel professional and trustworthy?
Product	Does it communicate ERP clearly?
Business	Does it communicate value?
Conversion	Is the CTA clear?
Trust	Is there enough proof?
Accessibility	Is it usable?
Responsive	Does it work on mobile?
Performance	Is it unnecessarily heavy?
Consistency	Does it follow the design system?

Do not simply say:

"Looks good."

Explain why.

55. DESIGN SYSTEM CONSISTENCY

Every new component should first ask:

Does an existing Neotek component already solve this?
Does an existing Neotek token already represent this value?
Can the component be reused elsewhere?
Does this introduce unnecessary visual inconsistency?

Do not create a new style for every section.

56. NO SECTION SHOULD EXIST JUST TO FILL SPACE

Every section must have a purpose.

Ask:

Does this section help the user understand, trust, or act?

If not:

Remove it
Merge it
Simplify it
Reconsider its purpose
57. WEBSITE STORYTELLING

A possible storytelling flow is:

Brand
↓
What is Neotek?
↓
Business Problem
↓
ERP Solution
↓
How It Works
↓
Product / Modules
↓
Business Benefits
↓
Integrations
↓
AI
↓
Customers / Proof
↓
Case Studies
↓
Trust / Certifications
↓
Resources
↓
CTA / Demo

This is a guideline, not a rigid requirement.

The final information architecture should be adjusted if UX research or actual content suggests a better flow.

58. THREE-LAYER PRODUCT MODEL

Think about Neotek through three connected layers:

                    NEOTEK
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
        BRAND        PRODUCT      BUSINESS
          │            │            │
       Logo         ERP Modules   Solutions
       Identity     Dashboard     Industries
       Trust        Workflow      Case Studies
       Visual       AI            Results
                    Integration

Every major design decision should consider these three layers.

59. INITIAL PROJECT SETUP

When first entering the repository:

Step 1

Inspect the existing project.

Identify:

Framework
React version
Build tool
Package manager
Dependencies
Folder structure
Existing components
Existing CSS architecture
Existing routing
Existing assets
Step 2

Do not immediately redesign the application.

First understand the current architecture.

Step 3

Establish the Neotek Design System foundation:

Color tokens
Typography tokens
Spacing tokens
Radius tokens
Shadow tokens
Motion tokens
Layout tokens
Step 4

Establish global CSS.

Step 5

Create reusable foundation components.

Step 6

Verify that the existing project still builds.

Step 7

Only after the foundation is stable should major website sections be implemented.

60. INITIAL IMPLEMENTATION SCOPE

During the initial setup, focus on:

Design Tokens
↓
Global CSS
↓
Typography
↓
Layout
↓
Base Components
↓
Navbar Foundation
↓
Footer Foundation
↓
Build Validation

Do NOT automatically implement the entire website during initial setup.

Do not build all sections just because the architecture lists them.

61. INITIAL COMPONENTS

The initial reusable foundation should include, where appropriate:

NeotekButton
NeotekContainer
NeotekSection
NeotekCard
NeotekBadge
NeotekNavbar
NeotekFooter

Additional components should only be introduced when they are actually needed.

62. VALIDATION

After implementation:

Run lint if available.
Run build.
Fix errors.
Check responsive behavior.
Verify design tokens.
Verify typography.
Verify primary brand color.
Verify existing functionality.
Check console for unnecessary errors.
Confirm no unnecessary dependencies were added.
63. DEVELOPMENT WORKFLOW

For every task:

Understand
↓
Inspect existing code
↓
Plan
↓
Implement
↓
Reuse existing system
↓
Validate
↓
Review

Do not jump directly into coding.

For larger tasks, explain the implementation plan before making substantial changes.

64. WHEN REQUIREMENTS ARE UNCLEAR

If a missing requirement materially affects implementation:

Ask for clarification.

Do not invent business requirements.

If the missing information is non-critical:

Use a clearly marked placeholder.
Continue implementation.
Document the assumption.

Use:

[NEED VERIFIED DATA]

for missing business information.

65. WHEN USER PROVIDES A SCREENSHOT

Analyze:

Layout
Grid
Typography
Color
Spacing
Components
Interaction
Animation
UX
Responsive behavior

Then translate the visual idea into:

Neotek Design Language

Do not copy the reference literally.

66. WHEN USER REQUESTS A COMPONENT

Before implementation, consider:

Purpose
Reusability
Variants
Responsive behavior
Accessibility
Design tokens
Existing components
Data requirements

Prefer reusable APIs over one-off implementations.

67. WHEN USER REQUESTS A PAGE

First define:

Page Goal
↓
Target User
↓
Information Hierarchy
↓
Section Structure
↓
CTA Strategy
↓
Responsive Strategy
↓
Implementation

Do not blindly implement every possible section.

68. CONTENT SAFETY / ACCURACY

Do not fabricate official Neotek information.

If information is not verified, clearly mark it.

Never present placeholder data as real business data.

This applies especially to:

Customers
Metrics
Pricing
Awards
Certifications
Product capabilities
Integrations
Testimonials
Business results
69. FINAL QUALITY BAR

The final website should feel:

Modern
+
Professional
+
Enterprise
+
Product-focused
+
Trustworthy
+
Clear
+
Fast
+
Consistent

while preserving:

Neotek Brand Identity

The final experience should make the existing Neotek logo feel natural inside a modern enterprise SaaS environment.

70. FINAL DESIGN STATEMENT

Always remember:

Modernize the experience, not the identity.

The target experience is:

Existing Neotek Brand
        +
Modern Typography
        +
Red / Black / White / Neutral Gray
        +
Enterprise SaaS UX
        +
Real ERP Product Visualization
        +
Business-focused Storytelling
        +
Trust
        +
Conversion

This is the foundation for all future Neotek website work.