# PALUGADA development guide

This is the single project guide for coding agents. Do not create duplicate agent.md, app/agent.md, or CLAUDE.md files. Next.js automatic agent-file generation is disabled with agentRules: false.

## Sources of truth

- Read docs/PRD.md for product scope and docs/Design.md for the current UI contract. Current user instructions take precedence over older documents.
- Read the relevant bundled framework guide in node_modules/next/dist/docs before changing Next.js APIs or routing; this project uses Next.js 16.3.6.
- README.md explains local setup, credentials, networking, and checks. docs/AUDIT.md records limitations; never represent demo features as production services.
- Existing product, service, user, and business schemas are in lib/firestore/types.ts. Clarify actions, authorization, and fields before adding an unspecified Firebase collection or changing a production schema. Do not ask again for already authorized work.

## Structure

- app/(storefront): customer pages and commerce navigation, including profile and settings.
- app/(auth): login and registration.
- app/(workspace)/seller and super-admin: owner-scoped operations and platform governance. app/(workspace)/admin retains migration sources; proxy.ts redirects old URLs.
- app/api/account, seller, super-admin: server-verified role/ownership APIs; lib/accounts holds contracts/policy and lib/server/account-* holds persistence/auth. Client profile role is never authority.
- app/api/local: development-only authenticated APIs. Keep host/origin validation, role checks, ownership checks, and idempotency.
- components/commerce: reusable customer views; components/monitoring: admin views; components/shared: shared maps, reviews, icons, footer.
- lib/commerce and lib/server: local transaction validation/storage; lib/monitoring: metrics; lib/monitoring/forecast*: forecasting.
- context: authentication, favorites, cart. Cart selection and browser address preferences are presentation state, not new Firestore fields.
- styles/legacy: retained styles required by Firebase management/detail pages. New views use CSS Modules and the shared tokens in app/globals.css.
- public/illustrations: original generated demo assets and provenance. Do not depict them as actual seller photography.
- scripts: reproducible checks and local setup. .local: ignored runtime data and browser verification artifacts.

## Implementation rules

Use TypeScript and CSS Modules; do not add Tailwind or dependencies without explaining and documenting why. Follow docs/Design.md tokens: Plus Jakarta Sans for customer headings/body, green primary, semantic colors for statuses, restrained orange for promotions. Keep mobile touch targets and keyboard focus visible. Do not fabricate discounts, ratings, urgency, balances, ETAs, or tracking.

Keep Firebase configuration and all secrets in ignored environment files. Preserve production Firebase behavior and existing collections. Local demo data must remain development-only; no real payment or messaging side effects. Do not weaken Firestore rules or allow users to grant themselves admin roles.

Run npm run lint and npm run build for code/route changes; npm test for domain logic. When transaction behavior changes, verify local API tests and the browser checkout flow. Check mobile and desktop layouts, errors, empty states, and keyboard navigation. Update docs/Design.md and docs/AUDIT.md when behavior or limitations change.

Git: inspect existing changes before editing. Do not overwrite unrelated work. Push only when requested, to the requested branch, with the requested author identity.

## Stack log

2026-09-29: Next.js 16.3.6, React 19.2.4, TypeScript, Firebase, lucide-react, CSS Modules; SheetJS 0.20.3 from the official distribution. Current redesign adds no runtime dependencies. Route groups now describe product responsibilities instead of contributor names.

## Documentation before each push

The canonical references are docs/PRD.md, docs/Design.md, and docs/AUDIT.md. Root files are navigation pointers only. Follow docs/README.md for versions and the entry template.

Before committing/pushing new work, append an entry to the active developer's log: docs/Lukas Update.md for Lukas/Asricky, docs/Zik Update.md for Zik/Zikri, or docs/Theo Update.md for Theo. Include the reference versions, requested target branch, changes, key files, actual validation results, and limitations. Never invent another developer's work or claim a push succeeded before confirmation.

Before editing reference documents, preserve their current full contents in a new uniquely named docs/history/YYYY-MM-DD-vX.Y/ folder; never overwrite old snapshots. Keep existing decisions/audit history and append new decisions. Update the docs index when versions change. Existing developer log entries are immutable: corrections are new entries. Do not duplicate entries for retries or promotion of already documented commits without new work. This is a developer/agent workflow, not an installed Git hook. Push destination still follows the user's current authorization.
