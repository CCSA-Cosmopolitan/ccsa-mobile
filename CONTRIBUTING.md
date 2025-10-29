# Contributing to CCSA Mobile

Thanks for your interest in contributing to the CCSA mobile app. This guide explains how to open issues, create branches, submit pull requests, run the app locally, and what reviewers look for. It's written for contributors who are new to this codebase.

Table of contents

- Before you start
- Filing a good issue
- Branching & commit messages
- Working locally (setup & run)
- Tests, linting and type checking
- Creating a pull request
- Code review checklist
- Merging and releases
- Communication and etiquette

Before you start

- Fork the repository and clone your fork locally.
- Create a new branch for each change. Use descriptive names, for example:

  ```bash
  git checkout -b feat/registration-nin-validation
  git checkout -b fix/map-rendering-android
  git checkout -b chore/update-deps
  ```

- Keep your branch focused on a single change or small related set of changes.
- Pull the latest changes from the main remote before starting work:

  ```bash
  git remote add upstream <original-repo-url>
  git fetch upstream
  git merge upstream/main
  ```

Filing a good issue

When something is broken or you have a feature idea, open an issue with:

- A short, descriptive title.
- A clear summary of the problem or feature.
- Steps to reproduce (for bugs) including device, OS and app version.
- Expected vs actual behavior.
- Relevant logs, screenshots or stack traces.
- (Optional) A suggested fix or notes about how you’d approach it.

Label your issue when appropriate: `bug`, `enhancement`, `question`, `docs`, etc.

Branching & commit messages

- Use short, meaningful branch names: `feat/`, `fix/`, `chore/`, `docs/`.
- Commit messages should be concise and structured. Example pattern:

  ```text
  feat(auth): add NIN validation to registration form
  ```

- Use present-tense messages and include the reason when helpful.

Working locally (setup & run)

Prerequisites

- Node.js (LTS recommended)
- Yarn or npm
- For full native builds: Android Studio (Android SDK) or Xcode for iOS

Install dependencies

```bash
cd ccsa-mobile
npm install
# or
yarn install
```

Run Expo (development)

```bash
# start Metro / Expo dev server
npm run start

# run on Android emulator or connected device
npm run android

# run on iOS simulator (macOS + Xcode required)
npm run ios

# run on web
npm run web
```

Helpful tips

- If bundling errors occur: restart Metro with cache clear `expo start -c`.
- For native build issues, ensure emulator/device is connected and `adb devices` shows it.
- Use the app's `src/config` or `app.config.js` to check required environment variables.

Tests, linting and type checking

- Run any available linters and type checks before committing.
- Type check (if using TypeScript):

  ```bash
  # from project root if configured
  tsc --noEmit
  ```

- Run the app and manual tests for UI flows that changed.

Creating a pull request

1. Push your branch to your fork:

   ```bash
   git push origin feat/your-branch-name
   ```

2. Open a PR against `main` on the original repository.
3. In your PR description include:
   - A concise summary of the change
   - Linked issue (if any)
   - Testing steps and devices/emulators used
   - Screenshots or recording for visual changes
4. Run the CI (if any) and fix any failing checks.

Code review checklist (what reviewers will check)

- Does the code compile and the app run? No runtime errors.
- Are the changes scoped and minimal? No unrelated files edited.
- Are UI changes accessible and responsive across common devices?
- Are form validations and error states handled?
- Is the new code covered by tests where appropriate (unit or integration)?
- Any schema or API changes documented and communicated?
- Style: follow existing patterns and nativewind/tailwind utility usage.

Merging and releases

- Squash or rebase: keep history readable. Prefer a single meaningful commit per PR.
- For release builds, use EAS and follow `eas.json` configuration. Example build commands:

  ```bash
  npm run build:android:prod
  npm run build:ios:prod
  ```

Communication and etiquette

- Be respectful and descriptive in reviews — explain the why, not just the what.
- If you need help, open an issue or ask in the project's communication channel (Slack, Teams, Discord, etc.).
- If a PR needs changes, update the branch and comment to explain fixes.

Thanks for contributing — your help keeps this project healthy!
