"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecord } from "@/app/botanist/actions";
import {
  cacheSpecies,
  draftFromForm,
  listDrafts,
  loadCachedSpecies,
  saveDraft,
  syncDrafts,
  type CachedSpecies,
  type FieldDraft,
} from "@/lib/field-drafts";
import type { Copy } from "@/lib/i18n";

export function FieldRecordForm({
  species,
  t,
  serverError,
}: {
  species: CachedSpecies[];
  t: Copy;
  serverError?: string;
}) {
  const router = useRouter();
  const [choices, setChoices] = useState(species);
  const [drafts, setDrafts] = useState<FieldDraft[]>([]);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function refreshDrafts() {
    setDrafts(await listDrafts());
  }

  async function uploadWaiting() {
    setUploading(true);
    const result = await syncDrafts();
    await refreshDrafts();
    setUploading(false);
    if (result.error) setMessage(result.error);
    else if (result.uploaded > 0) {
      setMessage(`${t.uploadedCount}: ${result.uploaded}`);
      router.refresh();
    }
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    cacheSpecies(species).catch(() => undefined);
    loadCachedSpecies().then((cached) => {
      if (species.length === 0 && cached.length > 0) setChoices(cached);
    });
    listDrafts().then(setDrafts);
    if (navigator.onLine) uploadWaiting();

    function onOnline() {
      setOnline(true);
      uploadWaiting();
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // Upload once when this form opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage(t.locationFailed);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = document.querySelector<HTMLInputElement>("input[name=latitude]");
        const longitude = document.querySelector<HTMLInputElement>("input[name=longitude]");
        if (latitude) latitude.value = position.coords.latitude.toFixed(6);
        if (longitude) longitude.value = position.coords.longitude.toFixed(6);
      },
      () => setMessage(t.locationFailed),
    );
  }

  return (
    <form
      action={createRecord}
      className="space-y-3"
      onSubmit={async (event) => {
        if (navigator.onLine) return;
        event.preventDefault();
        const draft = draftFromForm(new FormData(event.currentTarget), choices);
        await saveDraft(draft);
        event.currentTarget.reset();
        setMessage(t.savedOnPhone);
        await refreshDrafts();
      }}
    >
      <p className={`rounded px-3 py-2 text-sm ${online ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
        {online ? t.onlineNotice : t.offlineNotice}
      </p>
      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-800">{serverError}</p>}
      {message && <p className="text-sm text-neutral-700">{message}</p>}
      <label className="block text-sm">
        {t.species}
        <select className="mt-1 w-full rounded border px-2 py-1" name="species_id">
          <option value="">{t.notIdentified}</option>
          {choices.map((item) => (
            <option key={item.uuid} value={item.uuid}>
              {item.id} · {item.scientific_name}
              {item.common_name ? ` (${item.common_name})` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field name="height_m" label={t.height} />
        <Field name="trunk_diameter_cm" label={t.trunk} />
        <Field name="latitude" label={t.latitude} />
        <Field name="longitude" label={t.longitude} />
      </div>
      <button className="rounded border px-3 py-1 text-sm" type="button" onClick={useMyLocation}>
        {t.useMyLocation}
      </button>
      <Field name="location_name" label={t.placeName} />
      <Field name="leaf_traits" label={t.leafTraits} />
      <Field name="flower_fruit_traits" label={t.flowerFruit} />
      <Field name="health_status" label={t.health} />
      <Field name="other_traits" label={t.otherTraits} area />
      <Field name="photo_url" label={t.photoUrl} />
      <Field name="photo_caption" label={t.photoCaption} />
      <label className="block text-sm">
        {t.saveAs}
        <select className="mt-1 w-full rounded border px-2 py-1" name="status" defaultValue="submitted">
          <option value="draft">{t.draft}</option>
          <option value="submitted">{t.submitForReview}</option>
        </select>
      </label>
      <button className="btn" type="submit">
        {t.save}
      </button>
      {drafts.length > 0 && (
        <section className="surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium">
              {t.pendingUploads} ({drafts.length})
            </h2>
            <button className="btn" type="button" disabled={!online || uploading} onClick={uploadWaiting}>
              {t.syncNow}
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {drafts.map((draft) => (
              <li key={draft.localId}>
                {draft.speciesLabel || t.unidentified}
                {draft.locationName ? ` · ${draft.locationName}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </form>
  );
}

function Field({ name, label, area }: { name: string; label: string; area?: boolean }) {
  return (
    <label className="block text-sm">
      {label}
      {area ? (
        <textarea className="mt-1 w-full rounded border px-2 py-1" name={name} rows={3} />
      ) : (
        <input className="mt-1 w-full rounded border px-2 py-1" name={name} />
      )}
    </label>
  );
}
