/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as candidates from "../candidates.js";
import type * as compliance from "../compliance.js";
import type * as emailSeeds from "../emailSeeds.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as interviews from "../interviews.js";
import type * as jobs from "../jobs.js";
import type * as seed from "../seed.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as workflows from "../workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  candidates: typeof candidates;
  compliance: typeof compliance;
  emailSeeds: typeof emailSeeds;
  emails: typeof emails;
  files: typeof files;
  interviews: typeof interviews;
  jobs: typeof jobs;
  seed: typeof seed;
  teams: typeof teams;
  users: typeof users;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
