# Environment setup

Historical note, translated from the original English `ENV_SETUP.md`, with the parts that do not match the code called out. The accurate boot path is in [architecture.md](architecture.md).

## What the app actually loads

`src/app/app.config.ts` imports `src/environments/environment.development.ts` for every build, including production. That file is gitignored. `environment.template.ts` is not imported. `.env` is not read by the Angular CLI.

`angular.json` contains a development `fileReplacements` entry from `environment.ts` to `environment.development.ts`. Nothing imports `environment.ts`, so the replacement has no effect.

Until that import is fixed (see the first step of [improvement-plan.md](improvement-plan.md)), local setup is:

1. Copy `src/environments/environment.template.ts` to `src/environments/environment.development.ts`.
2. Replace the placeholder Firebase values with a real project, or with the emulator demo project if you are running the emulator suite.
3. Do not commit `environment.development.ts` or `.env`.

The original note also said to copy `.env.template` to `.env` and then copy those values by hand into the environment file. Angular will not load `.env` on its own.

## Production builds embed the config

`ng build` (the production configuration) inlines whatever object `app.config.ts` imported. Anyone can read the Firebase web config from the bundle. That is normal for a client SDK. Protection has to come from:

1. Firestore and Storage security rules. This repo does not contain any. See [audit.md](audit.md).
2. API key restrictions in Google Cloud.
3. Authorized domains in the Firebase console.

## Hosting

Firebase Hosting fits this app better than a static host that cannot express auth domains:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
ng build
firebase deploy
```

There is no `firebase.json` in the repo yet, so `firebase init` has not been done. The production build writes to `dist/monsterpedia-app/browser`.

If the output is copied to GitHub Pages instead, the Firebase web config is still visible in the bundle. Rules, not secrecy of the web key, are what protect the data.

## The original variable list

| Name | Meaning |
| --- | --- |
| `FIREBASE_API_KEY` | Web API key |
| `FIREBASE_AUTH_DOMAIN` | Auth domain |
| `FIREBASE_PROJECT_ID` | Project id |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Sender id |
| `FIREBASE_APP_ID` | App id |
| `PRODUCTION` | `true` or `false` |

These names are not wired to the build. The running code reads the `firebaseConfig` object.

## Troubleshooting from the original note

**The app cannot reach Firebase.** Confirm `environment.development.ts` exists, the project is the one you intend, and Auth and Firestore are enabled. A missing file fails the build before the app starts.

**Is a visible web API key a leak?** The key identifies the project. It is not a service-account secret. Restrict it, and write rules.

**How is the database protected?** With security rules that check `request.auth`, email verification, and an admin claim. The sample in the README is not deployed, and it does not match the documents the client writes. The original note pointed at `walkthrough.md` for examples. That file is not in the repository.
