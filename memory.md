# THAAW Browser — Operational Memory & Solved Issues Registry

> **Agent Memory Document**  
> Consult this document before making any changes. It details solved root causes, hard constraints, and technical gotchas to prevent regressions across sessions.

---

## 1. Solved Issues Registry

### Issue 1: Audio Cracking & Video Latency Across All Video Sites
- **Symptom**: Audio popping, clicking, cracking, and video stutter/latency occurring on YouTube and other media sites.
- **Root Causes**:
  1. **Audio Buffer Underruns**: Linux systems running PipeWire/PulseAudio with Bluetooth sinks (`bluez_output`) experience buffer underruns when Chromium uses its default 512-sample audio buffer.
  2. **Thread Scheduling Block**: Chromium's `AudioServiceSandbox` prevented the browser audio process from acquiring real-time scheduling priority via RTKit on Linux.
  3. **GPU Compositor Stalls**: The `--enable-zero-copy` flag caused synchronization stalls between the Intel CometLake-U GT2 [UHD Graphics] driver (`iHD`) and the Chromium compositor.
  4. **Aggressive Background Throttling**: `TabManager` applied `setBackgroundThrottling(true)` indiscriminately to views, which throttled active and background video tabs.
- **Permanent Solution Applied**:
  - In `browser/main/index.ts`:
    - Added `--audio-buffer-size=2048`.
    - Added `AudioServiceSandbox` to `disable-features`.
    - Removed `enable-zero-copy`.
    - Added `--enable-accelerated-video-decode`, `--enable-accelerated-mjpeg-decode`, and `VaapiVideoDecodeLinuxGL`.
    - Added `--disable-backgrounding-occluded-windows` and `--disable-renderer-backgrounding`.
  - In `browser/main/tab-manager.ts`:
    - Dynamically set `setBackgroundThrottling(false)` on active views in `switchTab`.
    - On `media-started-playing`, immediately set `setBackgroundThrottling(false)`.
    - On `media-paused`, only restore throttling if the tab is not the currently active tab.

### Issue 2: Destructive Left-Click Image Hijacking in Untrusted Webviews
- **Symptom**: Left-clicking links, buttons, thumbnails, or interactive elements containing `<img>` tags on web pages (e.g., YouTube thumbnails, e-commerce products, social media avatars) failed to open or navigate.
- **Root Cause**: `browser/main/preload.ts` had an unrestricted capture-phase `click` event listener on `img` elements that called `e.preventDefault()` and `e.stopPropagation()` for any click that wasn't Ctrl/Cmd clicked, hijacking all normal web navigation.
- **Permanent Solution Applied**:
  - Gated the fullscreen image preview feature strictly to `e.altKey` (Alt+Click). Normal left-clicks now pass through to web pages untouched.

### Issue 3: Incomplete Ad Blocking & Missing YouTube Ad Handling
- **Symptom**: `TrackerBlocker` had only 32 tracking domains, zero ad network filtering, no cosmetic hiding of empty ad slots, and YouTube in-stream video ads were not blocked or skipped.
- **Permanent Solution Applied**:
  - Implemented `AdBlocker` (`browser/privacy/ad-blocker.ts`) with 150+ ad networks, popup scripts, trackers, and telemetry domains.
  - Implemented cosmetic element hiding CSS (`AdBlocker.COSMETIC_FILTERS_CSS`) injected on `dom-ready`.
  - Implemented automated YouTube in-stream ad fast-forwarder and skip-button clicker in `browser/main/preload.ts`.
  - Exposed `adblock:*` IPC channels (`get-status`, `toggle`, `toggle-site`) and integrated into `settings.html`.

### Issue 4: Downloads Popover Broken & Inert
- **Symptom**: Clicking the Downloads toolbar button opened an empty popover that never populated recent downloads or responded to "Clear" or "Show more".
- **Root Cause**: ID mismatch between `index.html` (`dlClearCompletedBtn`, `dlPopoverList`, `dlPopoverEmpty`, `dlShowMoreBtn`) and `renderer.ts` (`downloadClearBtn`, `downloadPopoverList`, `downloadPopoverEmpty`, `downloadShowMoreBtn`). Because `downloadPopoverList` was `null`, `renderDownloadPopover()` exited on line 1.
- **Permanent Solution Applied**:
  - Synchronized the IDs in `browser/ui/index.html` to `downloadClearBtn`, `downloadPopoverList`, `downloadPopoverEmpty`, and `downloadShowMoreBtn`.

### Issue 5: Missing Toolbar Main Menu (`#menuBtn` / `#mainMenu`)
- **Symptom**: `renderer.ts` had listeners for `#menuBtn` and `#mainMenu`, zoom controls, history, downloads, passwords, settings, extensions, and exit, but the HTML elements were missing from `index.html`.
- **Permanent Solution Applied**:
  - Added `#menuBtn` to `.toolbar-actions` and implemented the complete glassmorphic `#mainMenu` dropdown with zoom controls (+, -, 100%, fullscreen), navigation shortcuts, and page actions.

### Issue 6: Missing SVG Icons in Floating Custom Context Menu
- **Symptom**: Context menu items for `maximize`, `moon`, `history`, `user`, `edit`, `settings` were rendered without icons.
- **Permanent Solution Applied**:
  - Added SVG path definitions for `maximize`, `moon`, `history`, `user`, `edit`, and `settings` to the `ICONS` registry in `browser/ui/context-menu.html`.

### Issue 7: Settings Internal Page Hash Navigation Not Working
- **Symptom**: Navigating to `thaaw://settings#extensions`, `thaaw://settings#privacy`, etc., opened `settings.html` but remained stuck on the default "General" category.
- **Permanent Solution Applied**:
  - Added hash routing in `browser/internal-pages/settings.html`: reads `window.location.hash` on load, listens to `hashchange`, and activates the corresponding category section.
  - Added `#section-extensions` and sidebar button for "Extensions & Ad Blocker".
  - Mapped `thaaw://extensions` to `settings.html#extensions` in both `handleThaawProtocol` and `ipc-validator.ts`.

### Issue 8: Tab WebContentsView Disappearing on Popover Open (`setModalOpen`)
- **Symptom**: Clicking download popover, profile popover, or other toolbar options caused the active tab's web content to disappear, revealing the window wallpaper background.
- **Root Cause**: `TabManager.setModalOpen(isOpen)` called `active.view.setVisible(!isOpen)`. When any modal or flyout opened, `setModalOpen(true)` hid the active `WebContentsView`.
- **Permanent Solution Applied**:
  - In `browser/main/tab-manager.ts`: Removed `active.view.setVisible(!isOpen)` from `setModalOpen()` so tabs remain visible under popovers.
  - In `browser/ui/renderer.ts`: Removed redundant `setModalOpen(true)` calls on non-modal popovers (`downloadsBtn`, `profileBtn`).

### Issue 9: Download Popover Unclickable Due to `flyoutBackdrop` Stacking Context
- **Symptom**: Items in the download popover (clear button, individual downloads, "Show more") were completely unclickable.
- **Root Cause**: `.toolbar` had `z-index: 45` while `flyoutBackdrop` had `z-index: 990`. Because `downloadPopover` was nested inside `.toolbar`, `flyoutBackdrop` covered it and intercepted all click events.
- **Permanent Solution Applied**:
  - In `browser/ui/styles.css`: Raised `.toolbar` `z-index` to `1000`, ensuring the popovers inside it render in front of `flyoutBackdrop` (z-index 990).
  - In `browser/ui/renderer.ts`: Attached click handlers to `.download-popover-item` to open downloaded files with `shell.openPath` via `thaawAPI.downloads.openFile()`, added `stopPropagation` on clear and show-more buttons, and styled hover states.

### Issue 10: Omnibox & New Tab Autocomplete Dropdowns Style Mismatch & Inconsistencies
- **Symptom**: Autocomplete suggestions in the URL omnibox had broken/missing styles; recent search dropdown in `newtab.html` had dark-only styles clashing on light backgrounds, with inconsistent border and glassmorphism styling.
- **Root Causes**:
  1. Class name mismatch: `renderer.ts` created `.omnibox-autocomplete-item`, `.omnibox-autocomplete-title`, etc., but `styles.css` only defined `.autocomplete-item`.
  2. Duplicate `.newtab-search-history-dropdown` definitions in `internal.css` with missing light-theme backdrop-filter and glass border support.
- **Permanent Solution Applied**:
  - In `browser/ui/styles.css`: Added complete glassmorphic styling for `.omnibox-autocomplete-dropdown`, `.omnibox-autocomplete-item`, `.omnibox-autocomplete-icon`, `.omnibox-autocomplete-content`, `.omnibox-autocomplete-title`, `.omnibox-autocomplete-url`, and `.omnibox-autocomplete-action` with light and dark mode adaptations.
  - In `browser/internal-pages/internal.css`: Consolidated and refined `.newtab-search-history-dropdown` styles with full light-mode translucent glass support, theme transitions, and consistent border radii.

### Issue 11: New Tab Floating Navigation Rail Internal Route Resolution
- **Symptom**: Clicking floating navigation rail buttons (Settings, History, Downloads, Home) on `newtab.html` did not open their respective pages.
- **Root Cause**: Rail links in `newtab.html` used relative links like `href="settings.html"`, which Chromium resolved to `thaaw://newtab/settings.html`. `handleThaawProtocol` in `browser/main/index.ts` only evaluated `url.hostname` (which was `'newtab'`) and always served `newtab.html`.
- **Permanent Solution Applied**:
  - In `browser/internal-pages/newtab.html`: Updated navigation links to `thaaw://newtab`, `thaaw://history`, `thaaw://downloads`, and `thaaw://settings`, and added explicit JavaScript click event listeners to call `window.location.href = target`.
  - In `browser/main/index.ts`: Enhanced `handleThaawProtocol()` to extract pathname subpaths (e.g., `url.pathname.replace(/^\//, '')`), allowing subpath routing like `thaaw://newtab/settings.html` to gracefully resolve to `settings.html`.

### Issue 12: Search Engine Selection Consolidation & Settings Synchronization
- **Symptom**: The new tab page had a redundant, out-of-place search engine dropdown in its search bar. The search engine selector in `settings.html` was not propagating changes live to tabs or new tab search queries.
- **Permanent Solution Applied**:
  - In `browser/internal-pages/newtab.html`: Removed `.search-engine-selector` dropdown from the new tab search bar. Added `loadSearchEngine()` on page load via `thaawAPI.settings.get()` and added a listener for the `browser:engine-updated` IPC event to dynamically synchronize the default search engine and placeholder.
  - In `browser/main/index.ts`: Updated `settings:update` handler to persist `customSearchUrl` and broadcast `browser:engine-updated` to both `mainWindow` and all active web tabs.
  - In `browser/main/tab-manager.ts`: Enhanced `setDefaultSearchEngine(engine, customUrl)` to accept custom URLs and pass `customSearchUrl` to `sanitizeNavigationUrl()`.

### Issue 13: Local `file://` Scheme Navigation Support & Form Element Styling
- **Symptom**: Pasting or typing `file:///...` links (such as `file:///home/mujtaba/Downloads/browser-test-elements.html`) failed to navigate or open in the browser. Standard HTML elements (`select`, `progress`, `range`, `meter`, `details`, etc.) lacked custom styling.
- **Root Causes**:
  1. `browser/security/ipc-validator.ts` explicitly rejected any URL starting with `file:`.
  2. `browser/internal-pages/newtab.html` `isUrl()` and `normalizeUrl()` regexes did not recognize `file://`.
  3. No custom CSS design system existed for native HTML elements.
- **Permanent Solution Applied**:
  - In `browser/security/ipc-validator.ts`: Updated `sanitizeNavigationUrl()` to permit safe `file://` URLs while strictly blocking sensitive system files (`/etc/passwd`, `/etc/shadow`, `C:/Windows/System32/cmd.exe`, etc.).
  - In `browser/internal-pages/newtab.html`: Updated `isUrl()` and `normalizeUrl()` to accept `file://` URIs.
  - In `browser/main/preload.ts`: Enforced that `thaawAPI` is strictly NOT exposed to `file:` protocol pages. Injected custom CSS for HTML5 form elements (`select`, `progress`, `input[type="range"]`, `input[type="checkbox"]`, `input[type="radio"]`, `meter`, `details`, `summary`, scrollbars) on `DOMContentLoaded` for `file://` pages.
### Issue 14: Profiles Not Showing in Profile Picker ("Who's using THAAW?")
- **Symptom**: The profile picker window opened with only "Browse as Guest" and "Show profile selector on startup" visible, with no profiles rendered in the grid.
- **Root Cause**: `profile-picker.html` is loaded as an internal Electron window file via `pickerWindow.loadFile(...)` using the `file:` scheme. When `preload.ts` restricted `thaawAPI` strictly to URLs where `window.location.protocol.startsWith('thaaw:')`, `profile-picker.html` was denied `thaawAPI`. Thus `window.thaawAPI.listProfiles` was `undefined`, and `loadProfiles()` exited early without rendering any profile cards.
- **Permanent Solution Applied**:
  - In `browser/main/preload.ts`: Updated `isInternalThaaw` to recognize internal chrome UI and profile picker files (`normalizedPath.endsWith('/ui/index.html')`, `normalizedPath.endsWith('/profiles/profile-picker.html')`, etc.), ensuring `thaawAPI` is securely exposed to internal application windows while remaining strictly blocked from arbitrary user `file://` pages.
  - In `browser/profiles/profile-picker.html`: Added defensive handling in `loadProfiles()` and initialized on DOM readiness (`document.readyState`).

### Issue 15: Popover & Command Panel Overlap with WebContentsView & New Tab Controls
- **Symptom**: Popovers (Download Popover, Profile Popover, Main Menu) and the Command Panel (`#paletteModal`) appeared "behind" the new tab page controls (top-right profile/theme controls and center shortcut buttons). In addition, the Download Popover and Command Panel lacked modern styling.
- **Root Causes**:
  1. `mainWindow` hosts the top chrome toolbar and floating popovers/modals in its base window DOM. The active tab is a native Chromium `WebContentsView` (`active.view`), attached to `mainWindow.contentView` at `y = 76px`. In Electron, child `WebContentsView`s render on top of the host window's base DOM. On `newtab.html`, the view background is transparent (`#00000000`), so the new tab page's top-right controls (`.newtab-top-controls`) and center shortcuts (`#shortcutsSection`) rendered directly in front of the popovers and command palette.
  2. CSS class mismatch in `#downloadPopover`: `index.html` used `.dl-popover-*` while `styles.css` defined `.download-popover-*`, causing unstyled light/dark appearance.
  3. `#paletteModal` lacked modern search wrapper, shortcut indicators, and glassmorphic card styling.
- **Permanent Solution Applied**:
  - In `browser/main/tab-manager.ts`: Updated `setModalOpen(isOpen)` to broadcast `browser:modal-state` with `{ isOpen }` to all tab views without blanking or hiding active tab web contents.
  - In `browser/main/index.ts`: Added IPC handler for `tab:modal-state` to forward state between `mainWindow` and tabs.
  - In `browser/main/preload.ts`: Exposed `onModalStateChanged` in `thaawAPI`.
  - In `browser/ui/index.html` & `styles.css`: Modernized `#paletteModal` and unified `#downloadPopover` / `#downloadModal` with glassmorphic cards, search wrapper, ESC badge, status badges, progress bars, and comprehensive light/dark theme support.

### Issue 16: Popovers and Modals Unclickable & Misaligned due to WebContentsView Input Interception
- **Symptom**: Buttons inside the Downloads popover, Profile popover, Main menu, and Command Palette were completely unclickable. Popovers overlapped the toolbar, misaligned on window resize, and the Command Palette modal was vertically centered over search bar content and cut off.
- **Root Causes**:
  1. **OS-Level Input Occlusion**: In Electron, child `WebContentsView`s (`active.view`) render as native OS compositor surfaces directly on top of `mainWindow`'s base DOM starting at `y: 84px`. Because `active.view` covered `y >= 84px`, any mouse click inside the popover or modal rectangle was captured by `active.view` and never reached `mainWindow`'s DOM buttons.
  2. **Hardcoded Offsets & Missing Anchor Calculation**: Popovers had hardcoded `top: 76px` (overlapping the 82px toolbar) and static `right: 88px` or `right: 12px`, causing misalignment with the toolbar buttons that opened them.
  3. **Command Palette Centering Collisions**: `.modal-backdrop` used `align-items: center`, vertically centering the Command Palette in the middle of the screen over the new tab search bar and news cards, causing layout jumping as search queries filtered.
- **Permanent Solution Applied**:
  - In `browser/main/tab-manager.ts`: On `setModalOpen(true)`, captures a pixel-perfect snapshot of `active.view` via `capturePage()`, sends `browser:tab-snapshot` to `mainWindow`, and hides `active.view` (`setVisible(false)`). On `setModalOpen(false)`, restores `active.view.setVisible(true)` and hides the snapshot.
  - In `browser/main/preload.ts`: Exposed `onTabSnapshot` in `thaawAPI`.
  - In `browser/ui/index.html` & `styles.css`: Added `.tab-snapshot-layer` (`z-index: 1`, `pointer-events: none`) behind popovers/modals so tabs remain 100% visible while all popovers/modals receive full click events.
  - In `browser/ui/styles.css`: Anchored `#paletteModal` and `#tabSearchModal` at `align-items: flex-start; padding-top: 80px;` with `max-height: calc(100vh - 120px)` and scrollable `palette-list`.
  - In `browser/ui/renderer.ts`: Added dynamic bounding-box anchoring (`positionDownloadPopover`, `positionProfileMenu`, `positionMainMenu`) based on `getBoundingClientRect()` with automatic repositioning on window resize.

### Issue 15: Native OS File Chooser Shown on Download & Missing Automatic Download Popover
- **Symptom**: Downloading files (e.g., clicking "Download ZIP" on GitHub) displayed Chromium's native OS GTK "Save As" file chooser dialog, and THAAW's custom download popover with progress bar was not automatically opened.
- **Root Causes**:
  1. In Electron's `targetSession.on('will-download')` handler, `item.setSavePath(...)` was not called synchronously, causing Chromium to fall back to the native OS file chooser.
  2. In `browser/ui/renderer.ts`, `onDownloadStarted` only re-rendered `#downloadPopover` if it was already manually opened, never opening it automatically.
- **Permanent Solution Applied**:
  - In `browser/main/index.ts`: Computed sanitized target path inside `app.getPath('downloads')` with collision deduplication (`filename (1).ext`), and synchronously called `item.setSavePath(targetPath)` to completely suppress the native OS GTK file chooser dialog.
  - In `browser/ui/renderer.ts`: Updated `onDownloadStarted` to animate `#downloadsBtn`, add `.downloading-active` glowing pulse, and automatically open `#downloadPopover` so the user immediately sees the active download with live progress bar, speed, and ETA.
  - In `browser/ui/styles.css`: Added `#downloadsBtn.downloading-active` styling with a cyan glowing pulse ring (`@keyframes downloadBtnPulse`).

---

## 2. Critical Constraints & Gotchas

1. **Zero-Emoji Mandate**:
   - **NEVER** use unicode emoji characters anywhere in HTML, TS, or JS files.
   - Always use SVG icons (`<svg>...</svg>` or `window.getSvgIcon()` / `ICONS[...]`).
   - The test `tests/unit/no-emojis.test.ts` scans the codebase and fails the build if any emoji is found.

2. **Session Partition Isolation**:
   - Every profile uses partition `persist:thaaw_profile_<id>`.
   - Never use the default session (`session.defaultSession`) for web views.

3. **Background Throttling Rules**:
   - Do NOT call `setBackgroundThrottling(true)` on the active tab or on any tab currently playing media.

4. **Downloads Security Policy**:
   - Never automatically open downloads or launch the system file manager upon download completion without user confirmation.

5. **Intel GPU Compositor Stability**:
   - Do NOT add `--enable-zero-copy` back to `app.commandLine` on Linux platforms; it triggers compositor frame stalls on Intel Mesa drivers.

6. **Local `file://` Security Policy**:
   - `file://` URLs are permitted for local HTML testing and viewing.
   - `thaawAPI` MUST NEVER be exposed to `file:` protocol pages (strictly restricted to `thaaw:` internal pages).
   - Sensitive system files (`/etc/passwd`, `/etc/shadow`, `/etc/sudoers`, Windows System32 executables) are blocked at the IPC validation layer in `sanitizeNavigationUrl()`.

