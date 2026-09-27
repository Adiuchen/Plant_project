"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export type SaveEmailState = {
  error?: string;
  saved?: boolean;
  email?: string;
} | null;

export async function saveEmail(_prev: SaveEmailState, formData: FormData): Promise<SaveEmailState> {
  const { supabase, profile } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const email = String(formData.get("email") || "").trim();

  if (!email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const { error } = await supabase.from("profiles").update({ email }).eq("uuid", profile.uuid);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { saved: true, email };
}
