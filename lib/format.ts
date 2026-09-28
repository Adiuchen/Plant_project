export function numberOrNull(value: FormDataEntryValue | string | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function textOrNull(value: FormDataEntryValue | string | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

