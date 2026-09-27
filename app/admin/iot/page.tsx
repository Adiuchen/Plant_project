import { requireUser } from "@/lib/auth";
import { statusLabel } from "@/lib/format";
import { addReading, createSensor, handleAlert, markOffline } from "../actions";

export default async function IotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { supabase } = await requireUser(["administrator"]);

  const { data: sensors } = await supabase.from("sensors").select("*").order("name");
  const { data: readings } = await supabase
    .from("sensor_readings")
    .select("id, sensor_id, temperature, humidity, movement_detected, latitude, longitude, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(20);
  const { data: alerts } = await supabase
    .from("alerts")
    .select("id, sensor_id, alert_type, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  const { data: plants } = await supabase
    .from("plant_records")
    .select("uuid, id, location_name, species(scientific_name)")
    .eq("status", "approved");

  const sensorName = new Map((sensors ?? []).map((sensor) => [sensor.id, sensor.name]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">IoT dashboard</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Add a sensor, then submit a reading. Low humidity, high temperature, movement, a moved sensor, or an offline sensor creates an alert.
      </p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <form action={createSensor} className="mt-4 grid gap-2 surface p-4 sm:grid-cols-2">
        <h2 className="font-medium sm:col-span-2">New sensor</h2>
        <input className="rounded border px-2 py-1" name="name" placeholder="Sensor name" required />
        <select className="rounded border px-2 py-1" name="plant_record_id">
          <option value="">Not linked to a plant</option>
          {(plants ?? []).map((plant) => {
            const species = Array.isArray(plant.species) ? plant.species[0] : plant.species;
            return (
              <option key={plant.uuid} value={plant.uuid}>
                {plant.id} · {species?.scientific_name || "Plant"} {plant.location_name ? `· ${plant.location_name}` : ""}
              </option>
            );
          })}
        </select>
        <input className="rounded border px-2 py-1" name="latitude" placeholder="Latitude" />
        <input className="rounded border px-2 py-1" name="longitude" placeholder="Longitude" />
        <button className="btn sm:col-span-2" type="submit">Save sensor</button>
      </form>

      <section className="mt-6 space-y-3">
        {(sensors ?? []).map((sensor) => (
          <article key={sensor.id} className="surface p-4 text-sm">
            <h2 className="font-medium">{sensor.name}</h2>
            <p>{statusLabel(sensor.status)} · Last seen {sensor.last_seen_at ? new Date(sensor.last_seen_at).toLocaleString() : "never"}</p>
            <p>{sensor.latitude ?? "—"}, {sensor.longitude ?? "—"}</p>
            <form action={addReading} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="sensor_id" value={sensor.id} />
              <input className="rounded border px-2 py-1" name="temperature" placeholder="Temperature °C" />
              <input className="rounded border px-2 py-1" name="humidity" placeholder="Humidity %" />
              <input className="rounded border px-2 py-1" name="latitude" placeholder="Latitude" defaultValue={sensor.latitude ?? ""} />
              <input className="rounded border px-2 py-1" name="longitude" placeholder="Longitude" defaultValue={sensor.longitude ?? ""} />
              <label className="flex items-center gap-2">
                <input name="movement_detected" type="checkbox" /> Movement
              </label>
              <button className="btn" type="submit">Save reading</button>
            </form>
            <form action={markOffline} className="mt-2">
              <input type="hidden" name="sensor_id" value={sensor.id} />
              <button className="text-sm underline" type="submit">Mark sensor offline</button>
            </form>
          </article>
        ))}
        {(sensors ?? []).length === 0 && <p className="text-sm text-neutral-500">No sensors yet.</p>}
      </section>

      <h2 className="mt-8 text-xl font-semibold">Recent readings</h2>
      <ul className="mt-2 divide-y surface text-sm">
        {(readings ?? []).map((reading) => (
          <li key={reading.id} className="px-3 py-2">
            {sensorName.get(reading.sensor_id) || "Sensor"} · {reading.temperature ?? "—"}°C · {reading.humidity ?? "—"}% · movement {reading.movement_detected ? "yes" : "no"} · {new Date(reading.recorded_at).toLocaleString()}
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Alerts</h2>
      <ul className="mt-2 space-y-2">
        {(alerts ?? []).map((alert) => (
          <li key={alert.id} className="surface p-3 text-sm">
            <p className="font-medium">{statusLabel(alert.alert_type)} · {statusLabel(alert.status)}</p>
            <p>{alert.message}</p>
            <p className="text-neutral-500">{sensorName.get(alert.sensor_id)} · {new Date(alert.created_at).toLocaleString()}</p>
            {alert.status !== "resolved" && (
              <form action={handleAlert} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={alert.id} />
                <button className="rounded border px-2 py-1" name="status" value="acknowledged">Acknowledge</button>
                <button className="rounded border px-2 py-1" name="status" value="resolved">Resolve</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
