/**
 * Buncf API Definition Helpers
 * 
 * These helpers provide type-safe endpoint definitions that enable
 * automatic client generation with full TypeScript support.
 * 
 * @example
 * ```ts
 * // src/api/users/[id].ts
 * import { defineHandler } from "buncf";
 * 
 * interface User { id: string; name: string; email: string; }
 * 
 * export const GET = defineHandler<{ id: string }, User>((req) => {
 *   const user = getUser(req.params.id);
 *   return Response.json(user);
 * });
 * ```
 */

/**
 * Request type with typed params
 */
export type TypedRequest<TParams = Record<string, string>> = Request & {
  params: TParams;
};

/**
 * Request type with typed body and optional params
 */
export type TypedBodyRequest<TBody, TParams = Record<string, string>> = Request & {
  params: TParams;
  json: () => Promise<TBody>;
};

/**
 * Handler function type for GET/DELETE methods (no body)
 */
export type Handler<TParams, TResponse> = (
  req: TypedRequest<TParams>
) => Response | Promise<Response>;

/**
 * Handler function type for POST/PUT/PATCH methods (with body)
 */
export type BodyHandler<TParams, TBody, TResponse> = (
  req: TypedBodyRequest<TBody, TParams>
) => Response | Promise<Response>;

/**
 * Define a type-safe handler for GET/DELETE endpoints
 * 
 * @template TParams - URL parameters type (e.g., { id: string })
 * @template TResponse - Response body type (for client generation)
 * 
 * @example
 * ```ts
 * export const GET = defineHandler<{ id: string }, User>((req) => {
 *   return Response.json({ id: req.params.id, name: "Alice" });
 * });
 * ```
 */
export function defineHandler<
  TParams extends Record<string, string> = Record<string, string>,
  TResponse = unknown
>(handler: Handler<TParams, TResponse>): Handler<TParams, TResponse> {
  // Runtime: just pass through the handler
  // The magic happens at build time when we extract TParams and TResponse
  return handler;
}

/**
 * Define a type-safe handler for POST/PUT/PATCH endpoints
 * 
 * @template TParams - URL parameters type
 * @template TBody - Request body type
 * @template TResponse - Response body type (for client generation)
 * 
 * @example
 * ```ts
 * interface CreateUserBody { name: string; email: string; }
 * interface User { id: string; name: string; email: string; }
 * 
 * export const POST = defineBody<{}, CreateUserBody, User>(async (req) => {
 *   const body = await req.json();
 *   const user = await createUser(body);
 *   return Response.json(user);
 * });
 * ```
 */
export function defineBody<
  TParams extends Record<string, string> = Record<string, string>,
  TBody = unknown,
  TResponse = unknown
>(handler: BodyHandler<TParams, TBody, TResponse>): BodyHandler<TParams, TBody, TResponse> {
  return handler;
}

/**
 * Type metadata symbols for build-time extraction
 * These are used by the codegen to identify typed handlers
 */
export const HANDLER_TYPE_SYMBOL = Symbol.for("buncf.handler.type");
export const BODY_HANDLER_TYPE_SYMBOL = Symbol.for("buncf.body-handler.type");
