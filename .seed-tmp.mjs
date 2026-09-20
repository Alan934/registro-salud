// Datos de prueba para verificar promedios y graficos. Se borran despues.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

if (process.argv.includes("--clean")) {
  await sql.query("DELETE FROM measurements");
  await sql.query("DELETE FROM daily_notes");
  const [{ count }] = await sql.query(
    "SELECT count(*)::int AS count FROM measurements",
  );
  console.log("Limpio. Filas restantes:", count);
  process.exit(0);
}

const MS_DAY = 86_400_000;
const now = Date.now();
const rnd = (min, max) => Math.round(min + Math.random() * (max - min));

const rows = [];
for (let d = 18; d >= 0; d--) {
  const takes = d === 0 ? 2 : d % 3 === 0 ? 1 : d % 4 === 0 ? 3 : 1;
  for (let t = 0; t < takes; t++) {
    const hour = 8 + t * 6;
    const base = new Date(now - d * MS_DAY);
    // Se fija la hora en huso de Mendoza (-03:00).
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Mendoza",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(base);
    const at = new Date(
      `${day}T${String(hour).padStart(2, "0")}:${t === 1 ? "30" : "15"}:00-03:00`,
    );
    if (at.getTime() > now) continue;
    rows.push([
      at.toISOString(),
      t === 0 ? (68 + Math.random() * 1.5).toFixed(1) : null,
      rnd(112, 148),
      rnd(68, 92),
      rnd(82, 145),
      rnd(93, 99),
      rnd(58, 96),
      t === 0 ? (36.2 + Math.random() * 0.9).toFixed(1) : null,
      t === 0 ? "[prueba] en ayunas" : "[prueba] control de la tarde",
    ]);
  }
}

for (const r of rows) {
  await sql.query(
    `INSERT INTO measurements
      (measured_at, weight, systolic, diastolic, glucose, spo2, pulse, temperature, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    r,
  );
}

await sql.query(
  `INSERT INTO daily_notes (day, note)
   VALUES ((now() AT TIME ZONE 'America/Argentina/Mendoza')::date, $1)
   ON CONFLICT (day) DO UPDATE SET note = EXCLUDED.note`,
  ["[prueba] durmio bien, camino 20 minutos"],
);

console.log("Insertadas", rows.length, "tomas de prueba.");
