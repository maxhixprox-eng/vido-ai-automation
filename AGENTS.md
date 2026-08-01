# AI Agent Guidelines & Project Rules

This document defines the core rules, behavioral standards, workflow instructions, architecture, and UI/UX design specifications for AI agents working in this repository.

---

## 1. Core Behavioral Rules

- **Verify Before Declaring Success**: Never declare a task complete without running relevant build, lint, or test verification commands.
- **Root Cause Fixes Only**: Never introduce superficial symptom patches (e.g., swallowing exceptions, commenting out failing tests, or returning dummy fallbacks). Address the underlying cause.
- **Preserve Documentation & Comments**: Maintain existing code structure, docstrings, and comments unless explicitly instructed to update them.
- **Strict Scope**: Keep modifications strictly focused on the requested scope. Do not alter unrelated files or refactor code unnecessarily.
- **No Unverified Assumptions**: Verify file paths, signatures, schemas, and dependencies before writing code that relies on them.

---

## 2. Code Quality & Standards

- **Modularity & Readability**: Keep functions and components focused, modular, and easy to test.
- **Error Handling**: Use explicit error handling. Avoid catch-all broad exceptions unless logging and re-throwing appropriately.
- **Naming Conventions**: Follow standard naming conventions consistent with the project language and framework.
- **Clean Codebase**: Do not leave dead code, debug logs, or unused imports in production-ready files.

---

## 3. Workflow & Verification Guidelines

1. **Inspect Before Modifying**: Read and analyze existing code and log tracebacks before applying changes.
2. **Incremental Development**: Implement changes in clear, logical steps.
3. **Testing**: Run relevant tests after every significant logic update.
4. **Documentation**: Update user docs or API references whenever feature behavior or interfaces change.

---

## 4. Platform Architecture & Integrations

- **Dashboard Controls**: Provide UI controls (e.g., checkboxes/toggles) allowing users to select active social media target platforms (TikTok, X/Twitter, Instagram, Facebook).
- **API Key Management**: Securely collect and store user API keys and tokens in `.env` or encrypted storage (TikTok Content Posting API, X Developer API, Instagram Graph API).
- **Automation Pipeline**: Support selectable automated workflows:
  - Trend Scraping (Google Trends via `pytrends`, Reddit via `praw`).
  - Content Generation (AI Prompt Engineering for Thriller/Comedy Stories using Gemini API).
  - Image Generation (FLUX / DALL-E 3 API for cinematic visuals).
  - Multi-Platform Publishing (TikTok API, `tweepy`, Meta Graph API).
- **Adaptive Feedback Loop (Learning Algorithm)**:
  - Fetch post analytics (likes, comments, shares, saves) 24h post-publication.
  - Store metrics in a local DB (e.g., SQLite/Firebase).
  - Dynamically tune future AI prompts based on top-performing content strategies.

---

## 5. UI/UX & Aesthetic Design Rules

### 🎨 Color Palette
- **Primary Background**: Deep Charcoal Dark Gradient (`#12161A` to `#1A1F24`).
- **Cards & Containers**: Subtle dark slate blue (`#1E252B`) with faint borders.
- **Accent Color (CTA/Active)**: Vibrant Warm Orange (`#FF5722` or `#F05423`) for primary actions, active states, and highlights.
- **Typography Colors**:
  - **Headings**: Pure White (`#FFFFFF`).
  - **Secondary/Body Text**: Muted Ice Blue/Gray (`#8A96A3`).
  - **Inactive Items**: Dark Gray (`#3A444C`).

### 📐 Layout & Components
- **Dark Theme Aesthetic**: High-contrast dark UI, rounded corners (8px–12px), and backdrop blur (glassmorphism) on floating elements.
- **Navigation & Controls**:
  - Top header with logo on the left, search and menu controls on the right.
  - Vertical step/pagination indicators (e.g., `01`, `02`, `- 03`, `04`) highlighting active configuration steps.
  - Vertical social links sidebar on the right margin (e.g., `Facebook` — `Twitter` — `Instagram` — `TikTok`).
- **Typography & Buttons**:
  - Bold, heavy sans-serif typography for main titles.
  - Primary CTA buttons: Vibrant orange rectangle with clean white text and smooth hover transitions.
