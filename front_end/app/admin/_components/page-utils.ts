export type AdminSearchParams = Record<string, string | string[] | undefined>;

export function valueOf(params: AdminSearchParams, key: string, fallback = "") {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export function numberOf(params: AdminSearchParams, key: string, fallback: number) {
  const value = Number(valueOf(params, key, String(fallback)));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function optionalBool(value: string) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}
