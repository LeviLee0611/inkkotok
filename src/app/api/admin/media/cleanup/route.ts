import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest, isAdminUser } from "@/lib/auth";
import { cleanupOrphanPostMedia } from "@/lib/media-cleanup";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isAdminUser(user);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { ttlHours?: number } | null;
  const ttlHours =
    payload && typeof payload.ttlHours === "number" && Number.isFinite(payload.ttlHours)
      ? payload.ttlHours
      : 24;

  try {
    const result = await cleanupOrphanPostMedia(ttlHours);
    return NextResponse.json({
      ok: true,
      ttlHours,
      ...result,
    });
  } catch (error) {
    console.error("media cleanup failed", error);
    return NextResponse.json({ error: "Media cleanup failed." }, { status: 500 });
  }
}
