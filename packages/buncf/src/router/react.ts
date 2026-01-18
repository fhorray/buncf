/**
 * Buncf Router - Client-side Exports
 * 
 * This entry point is safe for browser environments.
 * It strictly exports React components and hooks.
 */

export {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
  useFetcher,
  useSubmit
} from "./hooks";

export { useAction } from "./rpc";
export { defineAction } from "../action";

export { Link } from "./Link";
export { routerStore, type RouteState } from "./client";
export { BuncfRouter } from "./RouterProvider";
