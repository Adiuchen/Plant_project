"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getCopy, type Locale } from "@/lib/i18n";

export type SaveEmailState = {
  error?: string;
  saved?: boolean;
  email?: string;
} | null;

export async function saveEmail(_prev: SaveEmailState, formData: FormData): Promise<SaveEmailState> {
  const { supabase, profile } = await requireUser(["botanist", "conservation_officer", "administrator"]);
  const email = String(formData.get("email") || "").trim();

  const { t } = await getCopy();
  if (!email.includes("@")) {
    return { error: t.invalidEmail };
  }

  const { error } = await supabase.from("profiles").update({ email }).eq("uuid", profile.uuid);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { saved: true, email };
}

export async function setLocale(formData: FormData) {
  const locale: Locale = formData.get("locale") === "ms" ? "ms" : "en";
  const store = await cookies();
  store.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
