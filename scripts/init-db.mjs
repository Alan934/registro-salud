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
  `CREATE TABLE IF NOT EXISTS daily_notes (
     day        DATE PRIMARY KEY,
     note       TEXT NOT NULL,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.split("\n")[0].trim());
}

const [{ count }] = await sql.query(
  "SELECT count(*)::int AS count FROM measurements",
);
console.log(`Listo. Tomas registradas hasta ahora: ${count}`);
