import { firebaseAuth } from "@/lib/firebase-client";

type AuthFetchInit = RequestInit & {
  retryOnUnauthorized?: boolean;
};

async function buildAuthHeaders(headers?: HeadersInit, forceRefresh = false) {
  const user = firebaseAuth.currentUser;
  if (!user) return headers;

  const token = await user.getIdToken(forceRefresh);
  const nextHeaders = new Headers(headers ?? undefined);
  nextHeaders.set("authorization", `Bearer ${token}`);
  return nextHeaders;
}

export async function authFetch(input: RequestInfo | URL, init?: AuthFetchInit) {
  const retryOnUnauthorized = init?.retryOnUnauthorized ?? true;
  const fetchInit: RequestInit = { ...(init ?? {}) };
  delete (fetchInit as AuthFetchInit).retryOnUnauthorized;

  const firstHeaders = await buildAuthHeaders(fetchInit.headers, false);
  const first = await fetch(input, {
    ...fetchInit,
    headers: firstHeaders,
  });

  if (first.status !== 401 || !retryOnUnauthorized || !firebaseAuth.currentUser) {
    return first;
  }

  const secondHeaders = await buildAuthHeaders(fetchInit.headers, true);
  return fetch(input, {
    ...fetchInit,
    headers: secondHeaders,
  });
}
