# Handoff prompt for another AI

Copy the prompt below when asking another AI to continue this project. This records the publishing and usability issues that already happened so they do not get repeated.

---

## Project and goal

Continue the existing **OBD AI Diagnostic Center** project in its one canonical repository:

- GitHub repository: <https://github.com/mdshazeb9963-code/obd-ai-diagnostic-center>
- Live website: <https://mdshazeb9963-code.github.io/obd-ai-diagnostic-center/>
- Main branch: `main`

The user wants a working website they can open and use without signing in, entering commands, configuring an API key, or setting up a backend. Keep the existing GitHub Pages site usable as a simple browser demo. Improve it only when you can test the result and publish it to this same repository. Do not create a second repository or a second website.

## Earlier mistakes to avoid

1. **GitHub showed a README instead of the app.** The site was initially published from the repository root, where GitHub Pages rendered the README. The actual React app is in `frontend/`. Keep the existing GitHub Actions Pages workflow, which builds the Vite app and deploys `frontend/dist`. Do not configure Pages to publish the root README or a source folder that has no built `index.html`.
2. **The first page looked like a sign-in screen and said “API not connected.”** That made a user think an API key or keyboard command was required just to open the website. The public static demo must open straight into its no-login browser demo. A visitor should be able to try the sample or select a scanner export immediately.
3. **The live static site was confused with the full backend product.** GitHub Pages serves static files; it does not run the Spring API, MySQL, Redis, verified diagnostic-data providers, user accounts, or an AI service. Do not say those features are live or fully working on Pages. An API key is not required to open and try the browser demo. Optional provider and AI credentials belong only to a separately deployed backend and must never be placed in client-side code or committed to Git.
4. **The first screen had too many dashboard controls for a demo.** Keep the path obvious: upload a scan or try the sample. Use short labels and explain the next step in plain language. Do not put account, subscription, notification, or unavailable AI setup controls in front of a visitor.
5. **Do not invent diagnostic certainty.** The browser demo can find DTC-shaped codes in scanner text and save reports locally. That alone does not verify a code's meaning, cause, severity, repair, estimated cost, or whether the vehicle is safe to drive. Preserve clear, nearby wording that says so. Never present sample data as a real scan.

## Current intended website behavior

- The Pages URL above loads without account creation, sign-in, commands, or API keys.
- On the first screen, offer two clear actions: **Upload a scan** and **Try sample report**.
- The demo reads supported text scanner exports and selectable-text PDFs in the browser. Image-only/scanned PDFs need OCR first. It stores demo reports, vehicles, and service notes in that browser's local storage; clearing the browser's site data removes them. Do not claim records sync between devices or are backed up.
- The sample scan is synthetic and visibly a sample. Only extracted code-shaped text is shown as found; its interpretation remains unverified.
- Keep the demo navigation compact and useful. A user should be able to reach Home, Upload, Garage, and Reports without hunting. Avoid showing backend-only settings and account controls in this static demo.
- The full-stack source can remain in the repository, but its backend-dependent features must be clearly identified as requiring separate service deployment. Do not add a login wall to the GitHub Pages demo.

## Publishing and verification requirements

Before changing code, inspect the existing workflow, Vite configuration, current Git state, and repository. Preserve this single repository and current Pages deployment. The Vite Pages build must keep the repository subpath base (`/obd-ai-diagnostic-center/`) and enable the static preview mode (`VITE_STATIC_PREVIEW=true`). Publish using the existing Actions workflow from `main`.

After a change:

1. Run the existing frontend tests and production build. Fix failures rather than claiming success. Exercise repeated navigation/button clicks, uploading a supported sample text file and a selectable-text PDF, opening reports, and refreshing to verify local persistence when those flows are affected. Confirm an image-only PDF gets a helpful OCR explanation.
2. Check that build output has a root `index.html` and that asset paths use the GitHub repository subpath. Do not treat a README rendering as a deployed app.
3. Commit and push the finished change to the existing `main` branch. Check the Pages Actions run until it succeeds, then open the live Pages URL and verify the actual deployed UI, including its no-login entry screen.
4. Give the user the direct live website link and concise directions. State plainly which features require a separate backend or provider. Never ask them to paste secrets into the frontend or claim 100% correctness.
5. Do not create, merge, or delete repositories as cleanup. Repositories named `obd-diagnostic-report` and `Smart-OBD-library` are older unrelated account repositories; leave them alone unless the user explicitly asks to change them.

The repository contains the source of truth. Re-check actual files and current GitHub Actions status before reporting anything; this prompt can become stale as the project changes.

---
