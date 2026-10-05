"use client";

import { useState } from "react";

export function PlantGallery({
  photos,
  emptyLabel,
  fieldLabel,
}: {
  photos: { id: string; src: string; caption: string | null }[];
  emptyLabel: string;
  fieldLabel: string;
}) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) {
    return <p className="rounded-xl border border-dashed px-4 py-16 text-center text-sm text-neutral-500">{emptyLabel}</p>;
  }

  const current = photos[active] ?? photos[0];
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.src} alt={current.caption || fieldLabel} className="aspect-[4/3] w-full rounded-2xl object-cover" />
      {current.caption && <p className="mt-3 text-sm text-neutral-700">{current.caption}</p>}
      <p className="mt-1 text-xs text-neutral-500">{fieldLabel}</p>
      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className={`overflow-hidden rounded-lg ${index === active ? "ring-2 ring-forest" : "opacity-80"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt="" className="h-16 w-16 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
