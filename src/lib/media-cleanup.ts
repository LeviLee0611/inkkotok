import { getSupabaseAdmin } from "@/lib/supabase-admin";

const POST_MEDIA_BUCKET = "post-media";
const DEFAULT_TTL_HOURS = 24;
const LIST_PAGE_SIZE = 100;
const DELETE_CHUNK_SIZE = 100;

type CleanupResult = {
  scanned: number;
  referenced: number;
  staleCandidates: number;
  deleted: number;
};

function getTimestampFromPath(path: string): number | null {
  const fileName = path.split("/").pop() ?? "";
  const match = fileName.match(/(?:image|gif)-(\d{10,})-/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function normalizeStoragePathFromUrl(url: string) {
  const marker = "/storage/v1/object/public/post-media/";
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

function extractReferencedPathsFromBody(body: string) {
  const found = new Set<string>();
  const markdownPattern = /!?\[[^\]]*]\((https?:\/\/[^\s)]+)\)/g;
  const urlPattern = /(https?:\/\/[^\s)]+)/g;

  for (const match of body.matchAll(markdownPattern)) {
    const path = normalizeStoragePathFromUrl(match[1]);
    if (path) found.add(path);
  }
  for (const match of body.matchAll(urlPattern)) {
    const path = normalizeStoragePathFromUrl(match[1]);
    if (path) found.add(path);
  }

  return found;
}

async function listTopLevelFolders() {
  const supabase = getSupabaseAdmin();
  const folders: string[] = [];
  let offset = 0;

  while (true) {
    const result = await supabase.storage.from(POST_MEDIA_BUCKET).list("", {
      limit: LIST_PAGE_SIZE,
      offset,
    });
    if (result.error) {
      throw new Error(result.error.message ?? "Failed to list storage folders.");
    }
    const items = result.data ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      const id = (item as { id?: string | null }).id;
      const name = (item as { name?: string | null }).name;
      if (!id && typeof name === "string" && name.trim()) {
        folders.push(name);
      }
    }

    if (items.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return folders;
}

async function listAllPostMediaPaths() {
  const supabase = getSupabaseAdmin();
  const folders = await listTopLevelFolders();
  const paths: string[] = [];

  for (const folder of folders) {
    let offset = 0;
    while (true) {
      const result = await supabase.storage.from(POST_MEDIA_BUCKET).list(folder, {
        limit: LIST_PAGE_SIZE,
        offset,
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Failed to list storage files.");
      }
      const items = result.data ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        const id = (item as { id?: string | null }).id;
        const name = (item as { name?: string | null }).name;
        if (id && typeof name === "string" && name.trim()) {
          paths.push(`${folder}/${name}`);
        }
      }

      if (items.length < LIST_PAGE_SIZE) break;
      offset += LIST_PAGE_SIZE;
    }
  }

  return paths;
}

async function collectReferencedPostMediaPaths() {
  const supabase = getSupabaseAdmin();
  const referenced = new Set<string>();
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const result = await supabase
      .from("posts")
      .select("body, media_url")
      .range(from, from + pageSize - 1);

    if (result.error) {
      throw new Error(result.error.message ?? "Failed to scan post references.");
    }

    const rows = (result.data ?? []) as Array<{ body?: string | null; media_url?: string | null }>;
    if (rows.length === 0) break;

    for (const row of rows) {
      const body = row.body ?? "";
      for (const path of extractReferencedPathsFromBody(body)) {
        referenced.add(path);
      }
      if (typeof row.media_url === "string" && row.media_url.trim()) {
        const path = normalizeStoragePathFromUrl(row.media_url.trim());
        if (path) referenced.add(path);
      }
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return referenced;
}

export async function cleanupOrphanPostMedia(ttlHours = DEFAULT_TTL_HOURS): Promise<CleanupResult> {
  const supabase = getSupabaseAdmin();
  const threshold = Date.now() - Math.max(1, ttlHours) * 60 * 60 * 1000;
  const referenced = await collectReferencedPostMediaPaths();
  const allPaths = await listAllPostMediaPaths();

  const staleCandidates = allPaths.filter((path) => {
    if (referenced.has(path)) return false;
    const ts = getTimestampFromPath(path);
    if (!ts) return false;
    return ts < threshold;
  });

  let deleted = 0;
  for (let i = 0; i < staleCandidates.length; i += DELETE_CHUNK_SIZE) {
    const chunk = staleCandidates.slice(i, i + DELETE_CHUNK_SIZE);
    if (!chunk.length) continue;
    const removeResult = await supabase.storage.from(POST_MEDIA_BUCKET).remove(chunk);
    if (removeResult.error) {
      throw new Error(removeResult.error.message ?? "Failed to delete stale media files.");
    }
    deleted += chunk.length;
  }

  return {
    scanned: allPaths.length,
    referenced: referenced.size,
    staleCandidates: staleCandidates.length,
    deleted,
  };
}
