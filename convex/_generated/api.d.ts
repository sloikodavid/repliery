/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as businessMemberships from "../businessMemberships.js";
import type * as businessMembershipsActions from "../businessMembershipsActions.js";
import type * as businesses from "../businesses.js";
import type * as clerkWebhooks from "../clerkWebhooks.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as model_auth from "../model/auth.js";
import type * as model_businessMemberships from "../model/businessMemberships.js";
import type * as model_businesses from "../model/businesses.js";
import type * as model_clerkWebhookRequest from "../model/clerkWebhookRequest.js";
import type * as model_clerkWebhooks from "../model/clerkWebhooks.js";
import type * as model_conversations from "../model/conversations.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  businessMemberships: typeof businessMemberships;
  businessMembershipsActions: typeof businessMembershipsActions;
  businesses: typeof businesses;
  clerkWebhooks: typeof clerkWebhooks;
  conversations: typeof conversations;
  http: typeof http;
  "model/auth": typeof model_auth;
  "model/businessMemberships": typeof model_businessMemberships;
  "model/businesses": typeof model_businesses;
  "model/clerkWebhookRequest": typeof model_clerkWebhookRequest;
  "model/clerkWebhooks": typeof model_clerkWebhooks;
  "model/conversations": typeof model_conversations;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
