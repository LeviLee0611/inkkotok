import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { upsertProfile } from "@/lib/profile";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";

function fileExt(name: string, type: string) {
  const byName = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  if (byName) return byName;
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "bin";
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "이미지 파일을 선택해주세요." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있어요." }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "프로필 이미지는 5MB 이하만 업로드할 수 있어요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const ext = fileExt(file.name, file.type);
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const bucketCheck = await supabase.storage.getBucket(AVATAR_BUCKET);
    if (bucketCheck.error) {
      const createBucket = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true,
      });
      if (createBucket.error && !createBucket.error.message?.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { error: createBucket.error.message ?? "아바타 저장소 생성에 실패했어요." },
          { status: 500 }
        );
      }
    }

    const upload = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (upload.error) {
      return NextResponse.json(
        { error: upload.error.message ?? "이미지 업로드에 실패했어요." },
        { status: 500 }
      );
    }

    const publicUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;

    await upsertProfile({
      id: user.id,
      email: user.email,
      image: publicUrl,
      provider: user.provider,
      displayName: user.name,
    });

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("avatar upload failed", error);
    return NextResponse.json(
      { error: "프로필 이미지 업로드 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const update = await supabase
      .from("profiles")
      .update({ image_url: null })
      .eq("id", user.id);

    if (update.error) {
      return NextResponse.json(
        { error: update.error.message ?? "프로필 초기화에 실패했어요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("avatar reset failed", error);
    return NextResponse.json(
      { error: "프로필 이미지 초기화 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
