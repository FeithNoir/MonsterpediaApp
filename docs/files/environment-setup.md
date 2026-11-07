# Environment setup

Use Node 24.12+ (24.x), npm and Java 21. `npm ci` builds a clean checkout; no copied secret environment file or nonexistent walkthrough is required.

`app.config.ts` uses the shared `FIREBASE` provider, which imports `src/environments/environment.ts`. The development replacement uses `environment.development.ts`; both contain the existing project's **public web SDK config**. Never put a service-account credential, OAuth token or private key in Angular source. See the [README](../../README.md) for the exact project and rollout commands.

`ng serve --configuration emulator` selects `environment.emulator.ts`. It has the same explicit project id and connects Auth/Firestore/Storage to loopback ports 9099/8080/9199 before use. Ordinary development and production do not use those emulators. There is no URL-controlled environment switch.

Enable the existing project's Email/Password Auth provider and authorized domain, and verify its Storage bucket before real deployments. No new Firebase project is required. No production setup was changed by this implementation.
