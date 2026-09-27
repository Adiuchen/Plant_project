export function PhotoList({
  photos,
}: {
  photos: { id: string; storage_path: string; caption: string | null }[];
}) {
  if (photos.length === 0) return null;
  return (
    <ul className="mt-6 space-y-3">
      {photos.map((photo) => (
        <li key={photo.id}>
          {photo.storage_path.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.storage_path} alt={photo.caption || "Plant"} className="max-h-80 rounded border" />
          ) : (
            <p className="text-sm">{photo.storage_path}</p>
          )}
          {photo.caption && <p className="text-sm text-neutral-600">{photo.caption}</p>}
        </li>
      ))}
    </ul>
  );
}
