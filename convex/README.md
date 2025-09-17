# Convex Backend Guide

This directory houses the Convex schema, queries, mutations, and scripts that power EvalATS. Convex delivers a fully managed, real-time datastore, while the generated TypeScript client keeps frontend data operations type-safe and ergonomic.

## Contents
- [`schema.ts`](./schema.ts) – strongly-typed data model covering candidates, jobs, interviews, compliance reporting, and collaboration features.
- Feature-specific modules such as [`candidates.ts`](./candidates.ts), [`jobs.ts`](./jobs.ts), [`interviews.ts`](./interviews.ts), [`emails.ts`](./emails.ts), [`workflows.ts`](./workflows.ts), and more.
- Seed utilities in [`seed.ts`](./seed.ts) and [`emailSeeds.ts`](./emailSeeds.ts) for bootstrapping demo data.
- Generated files in [`_generated/`](./_generated) (do not edit manually) that expose typed APIs and server context helpers.

## Local Development Workflow
1. **Authenticate with Convex**
   ```bash
   npx convex dev
   ```
   The CLI prompts you to sign in and either create or select a project. Keep this process running while you develop.

2. **Interact with data**
   - Use the generated `api` helper in your React components:
     ```ts
     import { useQuery, useMutation } from 'convex/react'
     import { api } from '@/../convex/_generated/api'

     const candidates = useQuery(api.candidates.list, { status: 'screening' })
     const updateStatus = useMutation(api.candidates.updateStatus)
     ```
   - Server routes can instantiate `ConvexHttpClient` for backend-to-backend calls (see `src/app/api/files/download/[storageId]/route.ts`).

3. **Run seeds and utilities**
   ```bash
   # Populate demo candidates, jobs, and related entities
   npx convex run seed:seedData

   # Seed communication templates
   npx convex run emailSeeds:seedEmailTemplates

   # Clear demo data
   npx convex run seed:clearData
   ```
   These commands expect `CONVEX_DEPLOYMENT` to be set in `.env.local`.

4. **Deploy changes**
   Promote schema and function updates with:
   ```bash
   npx convex deploy
   ```

## Authoring Queries and Mutations
- Import `query` or `mutation` from `./_generated/server` and validate inputs with `convex/values` validators.
- Favor indexed lookups (`.withIndex(...)`) where supported in `schema.ts` to keep queries efficient.
- Return fully composed objects from the server to reduce frontend joins (see `candidates.get` for an example that bundles timeline, assessments, notes, and interviews).
- Keep business logic colocated with the resource module (e.g., interview scheduling logic belongs in `interviews.ts`).

## Tips
- When schema changes are made, restart `npx convex dev` so the generated types refresh.
- Generated files are intentionally committed; avoid editing files within `_generated/` directly.
- Use `npx convex docs` for inline documentation and API references while iterating.
