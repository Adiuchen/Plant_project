"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { numberOrNull, textOrNull } from "@/lib/format";

export async function createRecord(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const status = String(formData.get("status") || "draft");

  const { data, error } = await supabase
    .from("plant_records")
    .insert({
      botanist_id: user.id,
      species_id: textOrNull(formData.get("species_id")),
      height_m: numberOrNull(formData.get("height_m")),
      trunk_diameter_cm: numberOrNull(formData.get("trunk_diameter_cm")),
      leaf_traits: textOrNull(formData.get("leaf_traits")),
      flower_fruit_traits: textOrNull(formData.get("flower_fruit_traits")),
      health_status: textOrNull(formData.get("health_status")),
      other_traits: textOrNull(formData.get("other_traits")),
      location_name: textOrNull(formData.get("location_name")),
      latitude: numberOrNull(formData.get("latitude")),
      longitude: numberOrNull(formData.get("longitude")),
      status: status === "submitted" ? "submitted" : "draft",
      sync_status: "synced",
    })
    .select("uuid")
    .single();

  if (error || !data) {
    redirect(`/botanist/new?error=${encodeURIComponent(error?.message ?? "Could not save")}`);
  }

  const photoUrl = textOrNull(formData.get("photo_url"));
  if (photoUrl) {
    await supabase.from("plant_photos").insert({
      plant_record_id: data.uuid,
      storage_path: photoUrl,
      caption: textOrNull(formData.get("photo_caption")),
      uploaded_by: user.id,
    });
  }

  redirect(`/botanist/${data.uuid}`);
}

export async function generateQr(formData: FormData) {
  const { supabase } = await requireUser(["botanist"]);
  const id = String(formData.get("id"));
  const qrCode = `plant-${id.slice(0, 8)}`;

  const { error } = await supabase.from("plant_records").update({ qr_code: qrCode }).eq("uuid", id);
  if (error) {
    redirect(`/botanist/${id}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/botanist/${id}`);
}

export async function resubmit(formData: FormData) {
  const { supabase, user } = await requireUser(["botanist"]);
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("plant_records")
    .update({
      species_id: textOrNull(formData.get("species_id")),
      height_m: numberOrNull(formData.get("height_m")),
      trunk_diameter_cm: numberOrNull(formData.get("trunk_diameter_cm")),
      leaf_traits: textOrNull(formData.get("leaf_traits")),
      flower_fruit_traits: textOrNull(formData.get("flower_fruit_traits")),
      health_status: textOrNull(formData.get("health_status")),
      other_traits: textOrNull(formData.get("other_traits")),
      location_name: textOrNull(formData.get("location_name")),
      latitude: numberOrNull(formData.get("latitude")),
      longitude: numberOrNull(formData.get("longitude")),
      status: "submitted",
    })
    .eq("uuid", id)
    .eq("botanist_id", user.id);

  if (error) {
    redirect(`/botanist/${id}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/botanist/${id}`);
}
