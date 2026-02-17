import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { upsertProfile } from "@/lib/profile";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await upsertProfile({
      id: user.id,
      email: user.email,
      image: user.picture,
      provider: user.provider,
      displayName: user.name,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("profile bootstrap failed", error);
    return NextResponse.json({ error: "Bootstrap failed." }, { status: 500 });
  }
}
