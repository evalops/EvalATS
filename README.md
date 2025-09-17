# EvalATS – Modern Applicant Tracking System

EvalATS is a full-stack Applicant Tracking System (ATS) built with Next.js 14, TypeScript, Convex, and Clerk. The application streamlines hiring workflows with real-time collaboration, structured evaluations, and compliance tooling so teams can move faster while staying aligned.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Authentication](#authentication)
- [Feature Highlights](#feature-highlights)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Convex Data Model](#convex-data-model)
- [Development Workflow](#development-workflow)
- [Seeding and Demo Data](#seeding-and-demo-data)
- [Deployment](#deployment)
- [Additional Documentation](#additional-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview
EvalATS centralizes job, candidate, interview, and communication management into a single experience. The UI is powered by the Next.js App Router and a library of composable shadcn-inspired components, while Convex provides a reactive backend with real-time updates. Clerk handles authentication, multi-tenancy, and secure session management.

## Architecture

### Frontend
- **Framework**: Next.js 14 with the App Router and TypeScript.
- **Styling**: Tailwind CSS with dark mode and component primitives located in `src/components/ui`.
- **State/Data**: Convex React client for real-time data and TanStack Query for local caching where needed.
- **Key Experiences**:
  - Dashboard with stats, recent activity, and pipeline board (`src/app/page.tsx`).
  - Candidate management (`src/app/candidates`) with profile views, notes, assessments, and timeline.
  - Job, interview, analytics, compliance, and settings sections under `src/app/*`.
  - API routes in `src/app/api` for file downloads and resume parsing.

### Backend
- **Convex** provides the application database, mutations, and query endpoints located in the `convex/` directory.
- Strongly-typed schema defined in `convex/schema.ts` with indexes for efficient querying.
- Dedicated modules for core resources such as candidates, jobs, interviews, workflows, and compliance reporting.
- Utility mutations for seeding (`convex/seed.ts`) and templated email content (`convex/emailSeeds.ts`).

### Authentication
- **Clerk** protects routes and exposes user context through providers in `src/providers/auth-provider.tsx`.
- Supports email/password plus optional SSO as configured in the Clerk dashboard.
- JWT template named `convex` enables Convex server integration (see [CLERK_SETUP.md](./CLERK_SETUP.md)).

## Feature Highlights
- **Pipeline dashboard**: KPI cards, activity feed, and drag-friendly pipeline view keep hiring progress visible.
- **Candidate workspace**: Search, filter, and status management backed by Convex queries; each profile surfaces interviews, assessments, notes, and evaluation scores.
- **Job management**: CRUD operations for open roles with urgency, salary ranges, and department tracking.
- **Interview scheduling & scorecards**: Schedule interviews, capture structured feedback, and aggregate ratings.
- **Email & templates**: Send, draft, and template candidate communications with attachment support via Convex storage.
- **Compliance & analytics**: EEOC/OFCCP data capture, AI audit logging, and reporting dashboards for bias monitoring and hiring metrics.
- **Collaboration tooling**: Comments, tasks, hiring team assignments, and workflow automation tables enable coordinated hiring.

## Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/evalats.git
   cd evalats
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file (see [Environment Variables](#environment-variables)) and populate it with your Convex and Clerk credentials. Optional integrations (e.g., resume parsing) require additional keys.

4. **Run Convex locally**
   ```bash
   npx convex dev
   ```
   Log in or create a Convex project when prompted. Leave this process running to serve the real-time backend.

5. **Start the Next.js development server** (in a new terminal)
   ```bash
   pnpm dev
   ```

6. **Access the app**
   Visit [http://localhost:3000](http://localhost:3000). You will be prompted to sign in via Clerk before accessing the dashboard.

## Environment Variables
Create `.env.local` in the project root with the following keys:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL returned from `npx convex dev` or the production deployment. |
| `CONVEX_DEPLOYMENT` | Name of the Convex deployment (e.g., `dev:YOUR_PROJECT`). Required for running Convex CLI commands. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key used by the frontend provider. |
| `CLERK_SECRET_KEY` | Clerk secret key used for server-side operations. |
| `CLERK_JWT_ISSUER_DOMAIN` | Issuer URL from the Clerk JWT template named `convex`. |
| `OPENAI_API_KEY` (optional) | Enables resume parsing via the `/api/parse-resume` endpoint. |

> 📘 Detailed Clerk setup instructions live in [CLERK_SETUP.md](./CLERK_SETUP.md).

## Project Structure
```
.
├── src/
│   ├── app/                  # Next.js routes, pages, and API handlers
│   ├── components/           # Reusable UI and feature components (dashboard, emails, pipeline, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and helpers
│   ├── providers/            # Context providers (Clerk, Convex)
│   └── middleware.ts         # Clerk auth middleware
├── convex/                   # Convex schema, queries, mutations, and seeds
├── public/                   # Static assets
├── CLERK_SETUP.md            # Authentication configuration guide
├── README.md                 # Project overview (this file)
└── package.json              # Scripts and dependencies
```

## Convex Data Model
Key tables defined in `convex/schema.ts`:
- **candidates**: Core candidate profile, evaluation scores, and resume metadata.
- **jobs**: Job postings, department associations, and salary ranges.
- **interviews** & **interviewFeedback**: Scheduling details, participants, structured feedback, and recommendations.
- **timeline**, **assessments**, **notes**: Chronological history, test results, and collaborative annotations for each candidate.
- **emails** & **emailTemplates**: Outbound messages, delivery status, and reusable templates.
- **applications**: Links candidates to jobs with status tracking.
- **compliance tables** (`eeoData`, `biasAudits`, `aiDecisions`, `complianceSettings`): Support reporting and regulatory requirements.
- **collaboration tables** (`teamMembers`, `hiringTeams`, `comments`, `tasks`, `activityFeed`, `workflows`): Drive automation, tasking, and visibility across the hiring team.

The Convex client auto-generates typed APIs in `convex/_generated/api.ts` for use within React components and server routes.

## Development Workflow
- **Linting**: `pnpm lint`
- **Type checking**: `pnpm type-check`
- **Formatting**: The project relies on Prettier through the IDE; ensure Markdown and TypeScript stay consistent.
- **Convex CLI**: Use `npx convex` for schema pushes, running mutations locally, and deploying.
- **Recommended flow**:
  1. Start `npx convex dev`.
  2. Run `pnpm dev` for the Next.js server.
  3. Use Convex mutations/queries via the generated `api` helper.

## Seeding and Demo Data
- **Email templates**: Populate default candidate communication templates:
  ```bash
  npx convex run emailSeeds:seedEmailTemplates
  ```
- **Sample data**: Create demo candidates, jobs, applications, and related records:
  ```bash
  npx convex run seed:seedData
  ```
- **Reset data**: Remove previously seeded records:
  ```bash
  npx convex run seed:clearData
  ```

These commands require `CONVEX_DEPLOYMENT` to be set and an active Convex session (`npx convex dev`).

## Deployment
1. **Deploy the Next.js app** – Vercel is recommended for seamless Next.js hosting.
2. **Set production environment variables** – Configure Convex and Clerk credentials in your hosting platform.
3. **Deploy Convex** – Promote your Convex functions and schema:
   ```bash
   npx convex deploy
   ```
4. **Update frontend configuration** – Point `NEXT_PUBLIC_CONVEX_URL` and Clerk keys to the production values.

## Additional Documentation
- [CLERK_SETUP.md](./CLERK_SETUP.md): step-by-step authentication setup guide.
- [`convex/README.md`](./convex/README.md): working with Convex functions, schema, and CLI tips.

## Contributing
Contributions are welcome! Please:
1. Fork the repository.
2. Create a descriptive branch (`git checkout -b feature/amazing-feature`).
3. Run linting and type checks before committing.
4. Submit a Pull Request describing your changes and testing strategy.

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Support
Open an issue on GitHub for bugs or feature requests, or reach out to the maintainers directly.

---

**EvalATS** – Streamlining the hiring process with modern technology 🚀
