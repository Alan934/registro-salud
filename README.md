# Registro de Salud

App privada para llevar el registro diario de controles: peso, presión arterial,
glucosa, oxígeno en sangre, pulsaciones y temperatura, más una observación por
toma y una nota por día.

Hecha con **Next.js 16** (App Router + Server Actions), **Tailwind CSS 4**,
**Neon Postgres** y **Recharts**. Todo el manejo de fechas usa el huso de
**Mendoza, Argentina** (`America/Argentina/Mendoza`).

## Cómo funciona

- **Cargar una toma**: en la pantalla *Hoy* se completa solo lo que se midió.
  Se guarda con la fecha y hora del momento; si hace falta cargar un día
  anterior, se abre *Fecha y hora* y se elige otra.
- **Varias tomas por día**: se pueden cargar todas las que se quieran. La app
  calcula el **promedio del día** por métrica (indicando de cuántas tomas sale)
  y a la vez guarda cada toma con su horario.
- **Métricas**: gráficos por período (7 / 30 / 90 días / 1 año) con dos vistas,
  *Por día* (promedios) y *Cada toma* (valor por valor). Abajo, el detalle de
  cada día se despliega para ver toma por toma, con su hora, su observación y
  botón para editar o borrar.
- **Nota del día**: un campo libre por fecha para lo que no es un número
  (cómo se sintió, qué comió, medicación, turnos).
- **Rangos de referencia**: los valores fuera del rango habitual se muestran en
  color y los gráficos pintan la franja normal de fondo. Es orientativo, no
  reemplaza al médico.

## Configuración

Las variables van en `.env` (hay un `.env.example` de referencia):

| Variable | Para qué sirve |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de Neon Postgres. |
| `AUTH_USER` | Usuario para entrar. |
| `AUTH_PASSWORD` | Contraseña para entrar. |
| `AUTH_SECRET` | Secreto con el que se firma la cookie de sesión. |

La sesión se guarda en una cookie `HttpOnly` firmada (JWT HS256) y **dura 30
días**, así no hay que iniciar sesión todo el tiempo. Para cerrarla antes está
el botón *Salir*.

Para generar un `AUTH_SECRET` nuevo:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Puesta en marcha

```bash
npm install
```

```bash
npm run db:init
```

```bash
npm run dev
```

La app queda en `http://localhost:3000`.

`npm run db:init` crea las tablas `measurements` y `daily_notes` en Neon. Es
idempotente: se puede correr las veces que haga falta.

## Deploy en Vercel

Subí el repo y cargá las cuatro variables de entorno en *Project Settings →
Environment Variables*. `.env` está fuera del control de versiones, así que las
credenciales nunca viajan al repositorio.

## Estructura

```
src/
  app/
    (app)/            pantallas con sesión iniciada
      page.tsx        Hoy: cargar toma, promedio del día, nota del día
      metricas/       gráficos, promedios diarios y detalle por horario
      toma/[id]/      editar o borrar una toma
    login/            ingreso con usuario y contraseña
  components/         formularios, gráficos y piezas de UI
  lib/
    actions.ts        server actions (validación incluida)
    auth.ts           credenciales y cookie de sesión
    queries.ts        acceso a la base
    metrics.ts        definición de cada métrica y sus rangos
    tz.ts             todo lo relativo al horario de Mendoza
  proxy.ts            protege las rutas y redirige al login
scripts/init-db.mjs   creación de tablas
```
