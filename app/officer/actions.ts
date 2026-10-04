"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { textOrNull } from "@/lib/format";

function officerReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "").trim();
  if (path !== "/officer" && !path.startsWith("/officer?") && !path.startsWith("/officer/records/")) {
    return "/officer";
  }
  if (path.includes("://") || path.includes("\\") || path.includes("\n") || path.includes("\r")) {
    return "/officer";
  }
  return path;
}

export async function reviewRecord(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const destination = officerReturnPath(formData.get("next"));
  const { error } = await supabase
    .from("plant_records")
    .update({
      status,
      review_note: textOrNull(formData.get("review_note")),
    })
    .eq("uuid", id);

  if (error) {
    const joiner = destination.includes("?") ? "&" : "?";
    redirect(`${destination}${joiner}error=${encodeURIComponent(error.message)}`);
  }
  redirect(destination);
}

function speciesPayload(formData: FormData) {
  return {
    scientific_name: String(formData.get("scientific_name") || "").trim(),
    common_name: textOrNull(formData.get("common_name")),
    local_name: textOrNull(formData.get("local_name")),
    family: textOrNull(formData.get("family")),
    genus: textOrNull(formData.get("genus")),
    description: textOrNull(formData.get("description")),
    conservation_status: textOrNull(formData.get("conservation_status")),
    distribution: textOrNull(formData.get("distribution")),
    ecological_info: textOrNull(formData.get("ecological_info")),
    cultural_significance: textOrNull(formData.get("cultural_significance")),
  };
}

export async function createSpecies(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const { data, error } = await supabase
    .from("species")
    .insert({ ...speciesPayload(formData), created_by: user.id })
    .select("uuid")
    .single();

  if (error || !data) {
    redirect(`/officer/species/new?error=${encodeURIComponent(error?.message ?? "Could not save")}`);
  }

  const photoUrl = textOrNull(formData.get("photo_url"));
  if (photoUrl) {
    await supabase.from("plant_photos").insert({
      species_id: data.uuid,
      storage_path: photoUrl,
      caption: textOrNull(formData.get("photo_caption")),
      uploaded_by: user.id,
    });
  }
  redirect(`/officer/species/${data.uuid}`);
}

export async function updateSpecies(formData: FormData) {
  const { supabase, user } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const { error } = await supabase.from("species").update(speciesPayload(formData)).eq("uuid", id);
  if (error) redirect(`/officer/species/${id}?error=${encodeURIComponent(error.message)}`);

  const photoUrl = textOrNull(formData.get("photo_url"));
  if (photoUrl) {
    await supabase.from("plant_photos").insert({
      species_id: id,
      storage_path: photoUrl,
      caption: textOrNull(formData.get("photo_caption")),
      uploaded_by: user.id,
    });
  }
  redirect(`/officer/species/${id}`);
}

function speciesReturnPath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value ?? "").trim();
  if (path === "/officer/species" || /^\/officer\/species\/[0-9a-f-]{36}$/i.test(path)) return path;
  return fallback;
}

export async function deleteSpecies(formData: FormData) {
  const { supabase } = await requireUser(["conservation_officer"]);
  const id = String(formData.get("id"));
  const { error } = await supabase.from("species").delete().eq("uuid", id);
  if (error) {
    const destination = speciesReturnPath(formData.get("next"), `/officer/species/${id}`);
    const joiner = destination.includes("?") ? "&" : "?";
    redirect(`${destination}${joiner}error=${encodeURIComponent(error.message)}`);
  }
  redirect("/officer/species");
}
