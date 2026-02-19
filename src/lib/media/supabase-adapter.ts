import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  MediaStorageAdapter,
  UploadPublicObjectInput,
  UploadPublicObjectResult,
} from "@/lib/media/types";

function isAlreadyExistsError(message?: string) {
  return (message ?? "").toLowerCase().includes("already exists");
}

export class SupabaseMediaAdapter implements MediaStorageAdapter {
  async ensurePublicBucket(bucket: string) {
    const supabase = getSupabaseAdmin();
    const bucketCheck = await supabase.storage.getBucket(bucket);
    if (!bucketCheck.error) return;

    const createBucket = await supabase.storage.createBucket(bucket, { public: true });
    if (createBucket.error && !isAlreadyExistsError(createBucket.error.message)) {
      throw new Error(createBucket.error.message ?? "Failed to create storage bucket.");
    }
  }

  async uploadPublicObject(input: UploadPublicObjectInput): Promise<UploadPublicObjectResult> {
    const supabase = getSupabaseAdmin();
    const upload = await supabase.storage
      .from(input.bucket)
      .upload(input.path, input.bytes, {
        contentType: input.contentType,
        upsert: input.upsert ?? true,
      });

    if (upload.error) {
      throw new Error(upload.error.message ?? "Failed to upload storage object.");
    }

    const publicUrl = supabase.storage.from(input.bucket).getPublicUrl(input.path).data.publicUrl;
    return { path: input.path, publicUrl };
  }
}
