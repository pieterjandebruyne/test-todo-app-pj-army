# test-todo-app-pj-army

A [Turborepo](https://turborepo.com) monorepo skeleton for the todo app. This repository currently
contains the monorepo shell only — the React frontend and the NestJS backend are added by their own
tickets.

## Prerequisites

- **Node.js** >= 20 (developed on v24)
- **pnpm** 11.22.0 — the version is pinned via the `packageManager` field in the root `package.json`

## Getting started

```bash
pnpm install
```

## Layout

```
.
├── apps/                        # applications (web, api, …) — added by follow-up tickets
├── packages/                    # shared packages
│   └── typescript-config/       # @repo/typescript-config — shared tsconfig base
├── package.json                 # root scripts, delegating to turbo
├── pnpm-workspace.yaml          # workspace globs: apps/*, packages/*
└── turbo.json                   # turbo task pipeline
```

Any new workspace dropped into `apps/*` or `packages/*` is picked up automatically by pnpm and by
`turbo run <task>`; it only needs a `package.json` with the matching scripts.

## Commands

All commands are run from the repository root.

| Command       | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| `pnpm build`  | Build every workspace (`turbo run build`)                       |
| `pnpm dev`    | Run every workspace in watch mode (`turbo run dev`)             |
| `pnpm lint`   | Lint every workspace (`turbo run lint`)                         |
| `pnpm test`   | Test every workspace (`turbo run test`)                         |
| `pnpm format` | Run the `format` task of every workspace (`turbo run format`)   |

A task that no workspace defines is simply a no-op — turbo exits 0 with "No tasks were executed".

To run a task for a single workspace:

```bash
pnpm turbo run build --filter=@repo/typescript-config
```

## Shared TypeScript config

Workspaces extend the shared base config instead of redefining compiler options:

```jsonc
// apps/<app>/tsconfig.json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Add the package as a workspace dependency first:

```json
"devDependencies": {
  "@repo/typescript-config": "workspace:*"
}
```

## Conventions

- **Package manager: pnpm.** `pnpm-workspace.yaml` is the idiomatic Turborepo workspace setup and the
  version is pinned so every machine and CI run resolves identically. `pnpm-lock.yaml` is committed.
- **Shared packages are namespaced `@repo/*`** and stay `private`.
- **Default branch is `master`.** Work happens on branches cut from `master` and lands via pull request.
- Build output (`dist/`, `build/`), `node_modules/` and `.turbo/` are git-ignored; `.env*` files are
  ignored except `.env.example`.
