import { createClient } from "@/lib/supabase/server";
import { PHOTO_BUCKET } from "@/lib/photos";

export async function PhotoList({
  photos,
}: {
  photos: { id: string; storage_path: string; caption: string | null }[];
}) {
  if (photos.length === 0) return null;
  const supabase = await createClient();
  const resolved = await Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      src: await photoSource(supabase, photo.storage_path),
    })),
  );

  return (
    <ul className="mt-6 space-y-3">
      {resolved.map((photo) => (
        <li key={photo.id}>
          {photo.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.src} alt={photo.caption || "Plant"} className="max-h-80 rounded border" />
          )}
          {photo.caption && <p className="text-sm text-neutral-600">{photo.caption}</p>}
        </li>
      ))}
    </ul>
  );
}

async function photoSource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string,
) {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) return storagePath;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(storagePath, 60 * 60);
  return data?.signedUrl ?? "";
}
