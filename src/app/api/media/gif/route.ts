import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { uploadPublicImageFile } from "@/lib/media";

export const runtime = "edge";

const MAX_GIF_SIZE = 12 * 1024 * 1024;
const POST_MEDIA_BUCKET = "post-media";

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "GIF 파일을 선택해 주세요." }, { status: 400 });
    }

    if (file.type !== "image/gif") {
      return NextResponse.json({ error: "GIF 파일만 업로드할 수 있어요." }, { status: 400 });
    }

    if (file.size > MAX_GIF_SIZE) {
      return NextResponse.json(
        { error: "GIF는 12MB 이하만 업로드할 수 있어요." },
        { status: 400 }
      );
    }

    const { publicUrl } = await uploadPublicImageFile({
      bucket: POST_MEDIA_BUCKET,
      file,
      ownerId: user.id,
      filePrefix: "gif",
      maxBytes: MAX_GIF_SIZE,
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("gif upload failed", error);
    return NextResponse.json(
      { error: "GIF 업로드 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
