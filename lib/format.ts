export function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function textOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    needs_revision: "Changes requested",
    open: "Open",
    acknowledged: "Acknowledged",
    resolved: "Resolved",
    online: "Online",
    offline: "Offline",
    dry_condition: "Dry condition",
    high_temperature: "High temperature",
    possible_disturbance: "Possible disturbance",
    possible_theft: "Possible theft",
    sensor_offline: "Sensor offline",
    botanist: "Botanist",
    conservation_officer: "Conservation Officer",
    administrator: "Administrator",
    visitor: "Visitor",
    active: "Active",
    suspended: "Suspended",
  };
  return labels[status] ?? status;
}
