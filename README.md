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
  (cómo se sintió, qué comió, medicación, turnos). Un día puede tener sólo
  nota, sin ninguna toma.
- **Llevar al médico**: en *Métricas* se descarga el período como PDF, con un
  resumen de promedio, mínimo y máximo por métrica, una fila por día y las
  notas al final. En el teléfono aparece además *Compartir*, que abre el menú
  del sistema para mandarlo por WhatsApp, mail o lo que haya instalado.
- **Rangos de referencia**: los valores fuera del rango habitual se muestran en
  color y los gráficos pintan la franja normal de fondo. Es orientativo, no
  reemplaza al médico.

## Página de ejemplo (`/demo`)

`/demo` es la única ruta pública: se entra sin usuario ni contraseña y sirve
como referencia de cómo funciona la app.

- Los datos son **ficticios**, generados con una semilla fija en
  [demo-data.ts](src/lib/demo-data.ts). No sale ninguna consulta a la base.
- Los formularios funcionan de verdad (misma validación que la app real, desde
  [measurement-input.ts](src/lib/measurement-input.ts)): se puede agregar una
  toma, editarla y borrarla, y los promedios y gráficos se recalculan.
- Todo eso vive en el estado del navegador. No hay server actions en esta
  página, así que **nada se escribe en la base** y al recargar vuelve al punto
  de partida.
- La página se marca `noindex` y hay un enlace hacia ella desde la pantalla de
  ingreso.

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
    api/metricas/pdf/ el informe del período, para descargar o compartir
    login/            ingreso con usuario y contraseña
    demo/             página pública de ejemplo, sin acceso a la base
  components/         formularios, gráficos y piezas de UI
  lib/
    actions.ts        server actions (validación incluida)
    auth.ts           credenciales y cookie de sesión
    queries.ts        acceso a la base
    metrics.ts        definición de cada métrica y sus rangos
    pdf.ts            armado del informe en PDF
    tz.ts             todo lo relativo al horario de Mendoza
  proxy.ts            protege las rutas y redirige al login (deja pasar /demo)
scripts/init-db.mjs   creación de tablas
```
