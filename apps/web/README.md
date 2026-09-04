# @todo-app/web

The React frontend of the todo app: [Vite](https://vite.dev) + React + TypeScript, bare React with no
UI component library. This is the scaffold only — todo features land in follow-up tickets.

## Commands

Run from the repository root (turbo delegates to this workspace) or from `apps/web`:

| Command       | Description                                |
| ------------- | ------------------------------------------ |
| `pnpm dev`    | Start the Vite dev server                  |
| `pnpm build`  | Type check (`tsc -b`) and build to `dist/` |
| `pnpm lint`   | Lint with ESLint                           |
| `pnpm test`   | Run the Vitest suite once                  |
| `pnpm format` | Format with Prettier                       |

To target this workspace from the root: `pnpm turbo run build --filter=@todo-app/web`.

## Layout

```
apps/web
├── index.html            # Vite entry point
├── vite.config.ts        # Vite + Vitest config
├── tsconfig.json         # solution config, references the two below
├── tsconfig.app.json     # src/ — browser/DOM target
├── tsconfig.node.json    # vite.config.ts — Node target
└── src
    ├── main.tsx          # React entry point, mounts <App /> on #root
    ├── App.tsx           # root component
    ├── App.test.tsx      # smoke test
    └── test/setup.ts     # Vitest setup (jest-dom matchers)
```

Every tsconfig extends `@repo/typescript-config/base.json` from `packages/typescript-config`.

## Testing

Vitest with jsdom and Testing Library. Test files live next to the code they cover as
`*.test.tsx`.
