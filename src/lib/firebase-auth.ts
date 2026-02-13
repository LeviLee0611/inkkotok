import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type FirebaseClaims = JWTPayload & {
  email?: string;
  name?: string;
  picture?: string;
  firebase?: {
    sign_in_provider?: string;
  };
};

export type FirebaseVerifiedUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  provider: string;
  claims: FirebaseClaims;
};

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function getProjectId() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID.");
  }
  return projectId;
}

export function getBearerToken(headers: Headers | Record<string, string>) {
  const resolved = headers instanceof Headers ? headers : new Headers(headers);
  const auth = resolved.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseVerifiedUser> {
  const projectId = getProjectId();

  const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const claims = payload as FirebaseClaims;
  if (!claims.sub) {
    throw new Error("Invalid Firebase token subject.");
  }

  const provider = claims.firebase?.sign_in_provider ?? "unknown";

  return {
    uid: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    name: typeof claims.name === "string" ? claims.name : null,
    picture: typeof claims.picture === "string" ? claims.picture : null,
    provider,
    claims,
  };
}

export async function verifyFirebaseBearer(
  headers: Headers | Record<string, string>
): Promise<FirebaseVerifiedUser | null> {
  const token = getBearerToken(headers);
  if (!token) return null;

  try {
    return await verifyFirebaseIdToken(token);
  } catch {
    return null;
  }
}
