# Accessibility and responsive audit (issue #15)

Covers NFR-UX-01 (responsive layout), NFR-UX-02 (accessibility) and NFR-PERF-03 (image loading).

- **Date:** 2026-11-09 (Step 1, before fixes)
- **Status:** findings awaiting a decision; the Status column is filled in after review, and the after scores are added once Step 2 is done.

## Scope

| Item | Covered |
|---|---|
| Pages | /login, /signup, / (feed), /posts/[id], /search (empty, with results, no results), /u/[username] (own: Posts and Saved; someone else's), /notifications, /messages, /messages/[id], /settings |
| Not-found states | unknown user, unknown post, unknown conversation, unknown route |
| Dialogs and menus | create post, edit caption, delete post, delete comment, edit profile, log-out confirmation, post options menu, theme menu, language menu |
| Widths | 1024, 1280, 1366, 1440, 1920 and 2560 px, plus a resize sweep from 1024 to 2560 px in 32 px steps |
| Zoom | 200 % (1280×800 window = 640×400 CSS px, WCAG 1.4.4); reflow at 400 % (1280×1024 window = 320×256 CSS px, WCAG 1.4.10) |
| Themes | Layout, resize and zoom checks in light only, since themes don't change layout. axe, contrast and Lighthouse in light and dark. |
| Languages | English (en) and Sinhala (si) for layout, resize, zoom and axe. Lighthouse in en (si has the same markup). |
| Keyboard | Tab and Shift+Tab walk on every page, focus visibility by pixel diff (focused vs. blurred), skip link, dialog focus trap and return, menus, feed arrow keys, Escape on the post page |
| Other | target size (WCAG 2.5.8), prefers-reduced-motion, next/image request sizes, lazy and eager loading, CLS and LCP |

**Tools:** headless Chrome 156.0.8078.75 driven by puppeteer-core 25.16.0, axe-core 4.14.0 (rules: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice), Lighthouse 12.8.2 (accessibility only, desktop preset), Node 26.13.0. App: Next.js 16.4.5 under `next dev` at http://localhost:3000, rocky-api running locally. None of the tools were added to the project. They ran from a scratch folder, signed in as the existing test accounts A and B.

**Method notes:**
- Browser zoom was emulated through the CSS viewport size and device pixel ratio. 200 % of a 1280×800 window means a 640×400 CSS px viewport at DPR 2.
- Contrast for non-text UI was computed from the design tokens in `src/app/globals.css`, because axe only checks text.
- Every automated result below was checked by hand, against a screenshot, a focus walk or the source. Results that turned out to be tool artifacts are listed under "Checked and dismissed".

## Before scores

axe columns give the number of violated rules (with node counts). Lighthouse is the accessibility category score.

| Page | axe en·light | axe en·dark | axe si·light | axe si·dark | Lighthouse light | Lighthouse dark |
|---|---|---|---|---|---|---|
| login | 1 (region×1) | 1 (region×1) | 1 (region×1) | 1 (region×1) | 100 | 100 |
| signup | 1 (region×1) | 1 (region×1) | 1 (region×1) | 1 (region×1) | 100 | 100 |
| feed | 1 (label-content-name-mismatch×15) | 1 (×15) | 1 (×6) | 1 (×6) | 100 | 100 |
| post | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| search (empty) | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| search (results) | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| search (no results) | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| profile (own, Posts) | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| profile (own, Saved) | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| profile (other) | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| notifications | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| messages | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| thread | 1 (label-content-name-mismatch×2) | 1 (×2) | 1 (×2) | 1 (×2) | 100 | 100 |
| settings | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| user not found | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| post not found | 1 (label-content-name-mismatch×1) | 1 (×1) | 1 (×1) | 1 (×1) | 100 | 100 |
| conversation not found | 2 (label-content-name-mismatch×1, page-has-heading-one×1) | 2 | 2 | 2 | 100 | 100 |
| unknown route | n/a ¹ | n/a ¹ | n/a ¹ | n/a ¹ | 0 ² | 0 ² |

¹ The unknown route renders Next.js's built-in 404 outside the app shell. axe wasn't run against it; its markup was reviewed by hand (see A11Y-09).
² Lighthouse doesn't score a page that returns HTTP 404, so the 0 is a tool limitation, not an accessibility score.

axe found **no colour-contrast violations** in either theme. It left text over photos and videos as "incomplete", which is covered by the text-halo decision in design.md 7.2. Lighthouse's `label-content-name-mismatch` is an unscored manual audit, so it doesn't lower the 100.

## Findings

Severity follows the brief: **blocker** = a task can't be done; **serious** = a WCAG A/AA failure that hurts a core flow; **moderate** = a WCAG A/AA failure with a workaround, or a clear NFR gap; **minor** = best practice, AAA, or low impact.

### Blocker

None.

### Serious

| ID | Page(s) | WCAG / NFR | Evidence | Proposed fix | Status |
|---|---|---|---|---|---|
| A11Y-01 | All signed-in pages | 1.4.4 Resize text, 1.4.10 Reflow, 2.1.1 Keyboard | The sidebar is `sticky top-0 h-dvh` and can't scroll (`src/features/navigation/sidebar.tsx:58`). At 200 % zoom on a 1280×800 or 1366×768 screen, Settings and the theme toggle fall below the viewport and can't be scrolled or tabbed into view. At 400 % only Home, Search and Post stay visible; Notifications, Messages, Profile, Settings and the theme toggle can't be reached. Screenshots: `en-settings-zoom200.png`, `en-feed-reflow400.png`. | Add `overflow-y-auto overscroll-contain` to the sidebar `<aside>`. Optionally tighten its spacing on short viewports (e.g. `[@media(max-height:32rem)]` → smaller logo margin and `gap-0`). | Pending |
| A11Y-02 | /search (all states), /u/[username] (Posts and Saved tabs) | 2.4.7 Focus visible | Radix tab panels get `tabindex="0"`, but `TabsContent` has `outline-none` and no focus style (`src/components/ui/tabs.tsx:73`). Pixel diff of focused vs. blurred: 0 changed pixels. Keyboard users land on an invisible tab stop after the tab list. | Add a visible focus style to `TabsContent`, matching the rest of the app: `rounded-lg focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`. | Pending |
| A11Y-03 | /posts/[id] (delete comment), /settings (log out) | 2.4.3 Focus order | Cancelling the confirmation (Escape or Cancel) drops focus to `<body>`, so keyboard users restart from the top of the page. These dialogs are opened without a Radix trigger and get no `onCloseAutoFocus` (`src/features/comments/comment-item.tsx:59`, `src/features/auth/logout-button.tsx:29`). The post options menu already does this correctly. | Give `ConfirmDialog` a way to return focus: pass `onCloseAutoFocus` that prevents the default and focuses the trigger through a ref, as `post-owner-menu.tsx` does. After a comment is actually deleted, move focus to the comment form or the Comments heading. | Pending |
| A11Y-04 | /messages/[id], and possibly other lists using `Button loading` | 2.4.3 Focus order, 3.2.1 On focus | Tabbing to "Load older messages" scrolls it into view. That trips the infinite-scroll sentinel, the button switches to `loading`, and `Button` sets `disabled` while loading (`src/components/ui/button.tsx`), so the browser drops focus to `<body>`. Traced with focusin/focusout events: `in:DIV(region) → in:BUTTON → out:BUTTON`, then the next Tab reaches the composer. | Keep a loading button focusable. Use `aria-disabled="true"` and ignore clicks while loading, instead of `disabled`. Step 2 will also check the other "Load more" buttons (`infinite-list-footer.tsx`, comments, feed). | Pending |

### Moderate

| ID | Page(s) | WCAG / NFR | Evidence | Proposed fix | Status |
|---|---|---|---|---|---|
| A11Y-05 | / (en, si), /search (si), /notifications (si) | 1.4.10 Reflow | Horizontal scrolling at 320 CSS px (400 % zoom): feed action row 348 px (en) / 361 px (si); search filter tabs 416 px (si, `TabsList` is `w-fit` and can't wrap); notifications "Mark all as read" 357 px (si, `whitespace-nowrap`). | Let the search tab list wrap or scroll inside its own box. Allow the header action button to wrap (`whitespace-normal`, `h-auto`). Fix the feed action row so it fits at 320 px (smaller gap, labels hidden below `sm`). This overlaps with mobile layout work (see Out of scope). | Pending |
| A11Y-06 | /posts/[id] below 1024 px CSS (i.e. 200 % and 400 % zoom) | 1.4.10 Reflow, 2.4.11 Focus not obscured | In the stacked layout the comment form is `sticky bottom-0` (`src/features/posts/post-detail.tsx:154`). At 640×400 it covers the lower 30 % of the viewport, and at 320×256 more than half. The overlap probe shows the details panel running under the form, so focused items in the panel can be hidden behind it. | Make the form sticky only from `lg` (`lg:sticky`), or only when the viewport is tall enough (`[@media(min-height:40rem)]:sticky`). | Pending |
| A11Y-07 | / , /posts/[id], /notifications (light theme) | 1.4.11 Non-text contrast | The brand orange `#f97316` used as a graphic is 2.69:1 on the page background and 2.80:1 on cards: the liked heart (`fill-highlight text-highlight`, `post-actions.tsx:97,220`) and the unread notification dot (`bg-highlight`, `notification-item.tsx:67`). The unread row tint is only 1.16:1. Dark theme passes (8.6:1). | In light theme, draw these with `--highlight-text` (`#c2410c`, 5.0:1), keeping the brand orange for larger fills. Or give the dot and heart a darker outline. The heart already changes shape (outline → filled), which helps, but the filled shape itself still needs 3:1. | Pending |
| A11Y-08 | All pages in Sinhala | 2.4.2 Page titled; project rule "all user-facing text comes from translation dictionaries" | `<title>` stays English with `lang="si"` (e.g. "Home · R.O.C.K.Y."). Titles come from static `metadata`, rendered on the server in the default locale (`src/app/(app)/page.tsx:8` and the other pages). | Update `document.title` on the client from the active locale. For example, a small `useDocumentTitle(key)` hook, or a `<DocumentTitle id="pages.home.title" />` client component rendered by each page, with the server metadata kept as the English fallback. | Pending |
| A11Y-09 | Unknown routes (e.g. /no-such-route) | 2.4.2, 2.4.5 Multiple ways (no way back); project i18n rule | Next's built-in 404: English only, no app shell or landmarks, no link home, and two `<title>` elements ("R.O.C.K.Y." and "404: This page could not be found."). | Add `src/app/not-found.tsx`: a translated title and description in a `<main>` with one `<h1>`, `EmptyState`, and a link to Home. | Pending |
| A11Y-10 | / , /posts/[id], all pages with avatars | NFR-PERF-03 | **Feed:** `sizes="(min-width: 768px) 45vw"`, but the 9:16 frame is limited by height. At 1440×900 it requests 750w for a 457 px box (1.64×); at DPR 2 it requests 1920w for 914 px (2.1×). **Post page at 2560:** `60vw` ignores the 1600 px shell cap and requests 1920w for a 576 px box (3.3×). **Avatars** are raw `<img>` through Radix `AvatarImage` (`src/components/user-avatar.tsx:47`), downloading 256–474 px files for a 44 px avatar (5–11×). No layout shift (CLS 0 on every page). LCP images are eager with `fetchpriority=high`; the rest are lazy. | Feed: `(min-width: 768px) min(45vw, calc((100dvh - 3.5rem) * 9 / 16))`. Post page: add a `(min-width: 1536px)` entry for the capped pane width. Avatars: render through `next/image` with a fixed `sizes` per avatar size (`sm` 32px … `xl` 96px); the Firebase remote pattern already allows them. Optionally add 512 to `images.imageSizes` so profile tiles at DPR 2 don't jump to 640w (1.58×). | Pending |
| A11Y-11 | /messages/[unknown id] | 1.3.1 Info and relationships, 2.4.6 Headings (axe `page-has-heading-one`) | The "conversation not found" state renders only an `EmptyState`, with no `<h1>` (`src/features/messages/conversation-thread.tsx:65`). The other not-found states have one. | Render a page heading for this state (e.g. `PageHeader` or an `sr-only` h1 with the not-found title). | Pending |
| A11Y-12 | / (Sinhala) | 1.4.4 Resize text (content cut off); design rule "layouts must allow longer text" | The feed action column truncates its labels with `max-w-16 truncate` (`post-actions.tsx:158`). In Sinhala, "බෙදාගන්න" (Share) shows as "බෙදාග…" at every width. The accessible name stays complete. Screenshot: `si-feed-w1024.png`. | Allow the label to wrap onto two centred lines (`max-w-20 text-center leading-tight break-words`, no `truncate`), or use a shorter dictionary label. | Pending |

### Minor

| ID | Page(s) | WCAG / NFR | Evidence | Proposed fix | Status |
|---|---|---|---|---|---|
| A11Y-13 | All signed-in pages; feed; thread | 2.5.3 Label in name (axe `label-content-name-mismatch`) | **Sidebar logo link:** `aria-label="R.O.C.K.Y."`, while the visible content is the "R" tile plus the name. **Feed avatar links:** `aria-label="X’s profile"`, while the visible content is the initials. **Thread header link:** `aria-label="View X’s profile"`, while the visible text is the name plus @username. Speech-input users who say the visible text will usually still match, so the impact is low. | Logo: drop `aria-label`, keep the "R" tile `aria-hidden` and the name as `sr-only` below xl. Avatar links: label "{name}" (visible initials are a fallback image, already `aria-hidden`). Thread header: drop `aria-label` so the name comes from the visible name and username, or start the label with the display name. | Pending |
| A11Y-14 | /login, /signup | Best practice (axe `region`) | The brand line ("R R.O.C.K.Y.") and the language/theme toolbar sit outside any landmark (`src/app/(auth)/layout.tsx:13-25`). | Wrap them in a `<header>`. | Pending |
| A11Y-15 | All | 2.3.3 Animation from interactions (AAA) | With `prefers-reduced-motion: reduce`, dialogs, menus and tooltips still fade and zoom (100 ms, `animate-in zoom-in-95`), and skeletons still pulse (`animate-pulse`, 2 s). Feed stepping is instant and videos don't autoplay, as designed. | Add a global reduced-motion rule in `globals.css` that turns off `animate-pulse` and the tw-animate enter/exit animations (spinners stay, since they show progress). | Pending |
| A11Y-16 | All pages for Sinhala users | 3.1.1 Language of page | The server always renders `<html lang="en">`. `I18nProvider` switches it to `si` after hydration (`src/i18n/i18n-provider.tsx:39`). Signed-in pages show a skeleton until then; signed-out pages show Sinhala text under `lang="en"` briefly. | Accept as is (the locale lives in localStorage, which the server can't read), or set `lang` before first paint from a static `beforeInteractive` script. Recommendation: accept. | Pending |
| A11Y-17 | Create post dialog | 1.3.1, 3.3.1 Error identification | Submitting without a file shows "Choose a photo or video to post." in a `role="alert"`, which is announced. The file input isn't marked `aria-invalid` or linked with `aria-describedby`, unlike the other forms. | Link the error to the dropzone's file input (`aria-invalid` and `aria-describedby`), as `FormField` does. | Pending |
| A11Y-18 | Feed and post page (video) | 4.1.2 Name, role, value | Before a video's metadata loads, the progress slider announces "0:00 of 0:00". | Leave out `aria-valuetext`, or use "Loading" until the duration is known. | Pending |

## Checked and passing

- **Desktop layout (NFR-UX-01):** no horizontal scrolling, off-screen content or overlapping controls at 1024–2560 px, nor at any of the 49 resize steps in between, in en or si. Captions clamp to two lines with a working "more" toggle. The right panel appears from 1536 px and the shell is capped at 1600 px on widescreens.
- **Skip link:** it's the first Tab stop on every signed-in page, it's visible when focused, and Enter moves focus to `<main>`.
- **Dialogs** (create post, edit caption, delete post, edit profile): focus moves inside on open, and Tab stays inside (0 escapes in 25 presses). Escape closes, and focus returns to the trigger. Each dialog has `aria-labelledby` and `aria-describedby`, and axe found 0 violations inside them.
- **Menus** (post options, theme, language): Enter opens with focus on the first item, arrow keys move, and Escape returns focus to the trigger.
- **Forms:** login, signup and edit profile mark invalid fields with `aria-invalid`, link the error and hint text with `aria-describedby`, and move focus to the first invalid field.
- **Semantics:** one `<h1>` per page (apart from A11Y-11), a sensible heading order, labelled landmarks (main navigation, feed navigation, suggested users), alt text on every image, and live regions for list loading, new messages and toasts.
- **Text contrast** (both themes): axe found 0 violations. Token pairs are all ≥ 4.5:1: text 17.1/17.5, muted text 5.6–8.6, primary text 4.7–7.1, badges 6.4/8.6, destructive 4.6–7.0. Input borders are 3.3/3.4:1 and solid focus rings 5.5/7.1:1.
- **Focus visible:** every Tab stop on every page shows a visible change, apart from the tab panels (A11Y-02).
- **Target size (2.5.8):** every control is at least 24×24 px or passes the spacing exception (20 px-tall name links in the caption overlay). Slider thumbs are 12 px with a 28 px hit area.
- **Keyboard feed:** ↑/↓ move exactly one post, instantly under reduced motion. Escape on a post page opened directly goes Home.
- **Images:** CLS 0 on every page. LCP image eager with `fetchpriority=high`; images below the fold are lazy.
- **Console:** no errors on any page. The only messages are expected 404 network errors on the not-found states.

## Checked and dismissed (tool artifacts)

- The input ⟷ button overlaps on login, signup and search are the "Show password" and "Clear search" buttons, placed inside their fields on purpose.
- The skip link at 32×16 px and the tab triggers at "4 px" in the target-size scan came from measuring the hidden skip link and the tab underline pseudo-element. When focused, the skip link is 156×24 and the tabs are full height.
- The feed's "no visible focus" readings for the second post came from screenshots taken while snap scrolling was still moving. After it settled the ring is clearly visible (`feed-focus-viewport.png`).
- The character counter's description isn't duplicated: its visible "0 / 50" is `aria-hidden`, so screen readers hear only the full sentence.
- Disabled controls fall below contrast minimums (e.g. a disabled primary button at 2.3:1), but WCAG 1.4.3 and 1.4.11 exempt inactive controls.

## Out of scope (noted, not proposed for #15)

- **Layouts below 768 px** (phone portrait, the feed's action row under the media, etc.). The requirements target ~1024 px and up. A11Y-05 covers only the reflow failures that desktop users hit at 400 % zoom.
- **AAA criteria** beyond A11Y-15 (e.g. 2.4.13 Focus appearance, 1.4.6 Enhanced contrast).
- **The Next.js dev-tools indicator** in the bottom-left corner covers the sidebar theme toggle at 900 px height under `next dev`. It doesn't exist in production builds.
- **API:** one transient HTTP 500 from `POST /api/v1/auth/login` during the run; it succeeded on retry. That's a rocky-api issue, not rocky-web.

## After scores

To be filled in after Step 2.
