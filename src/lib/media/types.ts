export type UploadPublicObjectInput = {
  bucket: string;
  path: string;
  bytes: Uint8Array;
  contentType: string;
  upsert?: boolean;
};

export type UploadPublicObjectResult = {
  path: string;
  publicUrl: string;
};

export interface MediaStorageAdapter {
  ensurePublicBucket(bucket: string): Promise<void>;
  uploadPublicObject(input: UploadPublicObjectInput): Promise<UploadPublicObjectResult>;
}
