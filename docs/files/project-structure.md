# Project structure

Historical note, translated from the original Spanish `PROJECT_STRUCTURE.md`. For the system as it actually behaves, read [architecture.md](architecture.md). A few paths below were already wrong when this note was written: guards, interceptors, interfaces, and services live under `src/app/core/`, and the entry page is the editor, not a public article.

## Repository root

- **.angular/**: Angular CLI cache.
- **.git/**: Git history and configuration.
- **.vscode/**: Workspace settings, recommended extensions, and launch configuration.
- **node_modules/**: Third-party packages installed by npm.
- **public/**: Static files served as-is, including `favicon.ico` and `lamia.jpg`.
- **src/**: Application source.

## Root files

- **.editorconfig**: Shared editor formatting.
- **.gitignore**: Files Git should not record. Environment files are listed here.
- **.postcssrc.json**: PostCSS configuration. Tailwind is loaded from here.
- **angular.json**: Angular CLI project, build, and serve configuration.
- **LICENSE**: MIT license.
- **package-lock.json**: Exact dependency tree.
- **package.json**: Dependencies and npm scripts.
- **README.md**: Project overview and setup.
- **docs/files/refactoring-guide.md**: Notes on aligning components with the design tokens.
- **tsconfig.app.json**: TypeScript config for the application.
- **tsconfig.json**: Base TypeScript config.
- **tsconfig.spec.json**: TypeScript config for unit tests. The tree currently has no spec files.

## `src`

- **index.html**: Host page. The Angular app boots into `<app-root>`.
- **main.ts**: Browser entry. Bootstraps `AppComponent`.
- **styles.css**: Global tokens, Tailwind, PrimeIcons, and a small set of utility classes.

## `src/app`

- **app.component.ts**: Root component. Its template is a single router outlet.
- **app.config.ts**: Router, Firebase, HTTP, and animations providers.
- **app.routes.ts**: Route table.

### Areas

- **auth/**: Sign-in, registration, and password reset.
- **core/**: Guards, the HTTP interceptor, interfaces, the role enum, and services.
- **pages/**: Home, layout, dashboard, the entry editor, profile, and the wiki index.
- **shared/**: Header, hero, sidebar, article of the day, and the see-more list.

## `src/environments`

- **environment.template.ts**: Placeholder Firebase config. The running app does not import this file. See [environment-setup.md](environment-setup.md).
