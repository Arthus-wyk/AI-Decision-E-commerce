import "server-only";

export { apiFetch, buildUrl, fetchJson, postJson } from "./core";
export {
  getBrands,
  getCategories,
  getProductById,
  getProductBySlug,
  getProducts,
} from "./products";
export {
  createCompareSession,
  getHydratedCompareSessions,
  getSessions,
  hydrateCompareSession,
  joinCompareSession,
} from "./compare";
export type {
  CreateCompareSessionResponse,
  HydratedCompareSession,
  HydratedSessionProduct,
  SessionListResponse,
} from "./compare";
