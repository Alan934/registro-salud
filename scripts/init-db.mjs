/**
 * Crea las tablas en Neon. Se ejecuta con: npm run db:init
 * Es idempotente, se puede correr las veces que haga falta.
 */
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Falta DATABASE_URL (revisa el archivo .env).");
  process.exit(1);
}

const sql = neon(connectionString);

const statements = [
  `CREATE TABLE IF NOT EXISTS measurements (
     id           BIGSERIAL PRIMARY KEY,
     measured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     weight       NUMERIC(5,2),
     systolic     SMALLINT,
     diastolic    SMALLINT,
     glucose      SMALLINT,
     spo2         SMALLINT,
     pulse        SMALLINT,
     temperature  NUMERIC(4,1),
     note         TEXT,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS measurements_measured_at_idx
     ON measurements (measured_at DESC)`,
  // Etiquetas de contexto de cada toma ("en reposo", "en ayunas"...).
  // Se guardan los ids del catalogo de src/lib/tags.ts.
  `ALTER TABLE measurements ADD COLUMN IF NOT EXISTS tags TEXT[]`,
  `CREATE TABLE IF NOT EXISTS daily_notes (
     day        DATE PRIMARY KEY,
     note       TEXT NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Ajustes sueltos de la app (por ahora, la altura para calcular el IMC).
  `CREATE TABLE IF NOT EXISTS settings (
     key        TEXT PRIMARY KEY,
     value      TEXT NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  // Como se sintio: un puntaje de 0 a 10, los sintomas y una nota.
  `CREATE TABLE IF NOT EXISTS mood_logs (
     id         BIGSERIAL PRIMARY KEY,
     logged_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     mood       SMALLINT NOT NULL,
     symptoms   TEXT[],
     note       TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS mood_logs_logged_at_idx
     ON mood_logs (logged_at DESC)`,
];

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.split("\n")[0].trim());
}

const [{ count }] = await sql.query(
  "SELECT count(*)::int AS count FROM measurements",
);
const [{ moods }] = await sql.query(
  "SELECT count(*)::int AS moods FROM mood_logs",
);
console.log(`Listo. Tomas: ${count} · Registros de cómo se sintió: ${moods}`);
