# Registro de Salud

App privada para llevar el registro diario de controles: peso, presión arterial,
glucosa, oxígeno en sangre, pulsaciones y temperatura, más una observación por
toma y una nota por día.

Hecha con **Next.js 16** (App Router + Server Actions), **Tailwind CSS 4**,
**Neon Postgres** y **Recharts**. Todo el manejo de fechas usa el huso de
**Mendoza, Argentina** (`America/Argentina/Mendoza`).

## Cómo funciona

- **Pantalla *Hoy***: arriba, la fecha, el resumen del día y el botón para
  cargar. Debajo, *Tus categorías*: una baldosa por métrica con el último
  valor, en qué zona quedó y cómo viene la línea de los últimos días. Cada
  baldosa lleva al gráfico de esa métrica.
- **Cargar una toma**: en la pantalla *Hoy* se completa solo lo que se midió.
  Se guarda con la fecha y hora del momento; si hace falta cargar un día
  anterior, se abre *Fecha y hora* y se elige otra.
- **Varias tomas por día**: se pueden cargar todas las que se quieran. La app
  calcula el **promedio del día** por métrica (indicando de cuántas tomas sale)
  y a la vez guarda cada toma con su horario.
- **Métricas**: gráficos por período (7 / 30 / 90 días / 1 año) con dos vistas,
  *Por día* (promedios) y *Cada toma* (valor por valor). Abajo, el detalle de
  cada día se despliega para ver toma por toma, con su hora, su observación y
  botón para editar o borrar. Las tomas de cada día se piden recién al
  desplegarlo ([/api/dia/[day]](src/app/api/dia/[day]/route.ts)): con un año
  de datos son miles, y mandarlas todas de entrada para que queden escondidas
  atrás de un desplegable cerrado es puro peso.
- **Nota del día**: un campo libre por fecha para lo que no es un número
  (cómo se sintió, qué comió, medicación, turnos). Un día puede tener sólo
  nota, sin ninguna toma.
- **Llevar al médico**: en *Métricas* se descarga el período como PDF, con un
  resumen de promedio, mínimo y máximo por métrica, una fila por día y las
  notas al final. En el teléfono aparece además *Compartir*, que abre el menú
  del sistema para mandarlo por WhatsApp, mail o lo que haya instalado.
- **Período a medida**: además de los atajos (7 / 30 / 90 días / 1 año), en
  *Otras fechas* se elige un desde y un hasta, por ejemplo para ver lo que
  pasó entre un turno y el siguiente.
- **Tendencia**: cada período se compara contra el anterior del mismo largo y
  se muestra en qué dirección se movió el promedio de cada métrica. La flecha
  dice la dirección, no si está bien o mal: bajar de peso y bajar el oxígeno
  en sangre no significan lo mismo.
- **Zonas de referencia**: cada valor viene con una barra que muestra los
  tramos de la métrica (baja / normal / elevada / alta) y un marcador donde
  cayó la lectura, más una pastilla que lo dice con palabras. Los gráficos
  pintan además la franja normal de fondo. Los cortes están en
  [zones.ts](src/lib/zones.ts) y son orientativos: no reemplazan al médico.
- **Constancia**: una tira con un cuadradito por día muestra qué días quedaron
  registrados y cuáles no, con el total del período y cuántos días seguidos se
  viene midiendo. Los huecos son lo primero que se pregunta al mirar un
  promedio.
- **Patrón por momento del día**: el promedio de la mañana, de la tarde y de la
  noche por separado ([dayparts.ts](src/lib/dayparts.ts)). Todo junto en un
  solo número esa diferencia se pierde, y es justo lo que se mira cuando la
  presión sube siempre a la misma hora.

## En el teléfono

Las dos pantallas y el botón de cargar viven en una barra fija abajo, al
alcance del pulgar. En pantalla grande esa barra no aparece: la navegación
queda en el encabezado.

## Instalarla en el teléfono

La app es una PWA: se instala en la pantalla de inicio y se abre sin la barra
del navegador, como cualquier otra aplicación.

- **Android (Chrome)**: menú de tres puntos → *Instalar aplicación*.
- **iPhone (Safari)**: botón de compartir → *Agregar a pantalla de inicio*.

Hace falta que esté servida por **HTTPS** (en Vercel ya lo está); por
`http://localhost` funciona para probar, pero no desde la IP de la red local.

Sin conexión la app muestra un aviso en vez del error del navegador. Los datos
no se guardan en el teléfono: son datos de salud y mostrar un valor viejo sería
peor que no mostrar nada, así que hace falta señal para ver o cargar tomas. El
service worker ([public/sw.js](public/sw.js)) sólo guarda los archivos
estáticos de Next, que llevan hash en el nombre.

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
    api/dia/[day]/    las tomas de un día, para el detalle desplegable
    api/metricas/pdf/ el informe del período, para descargar o compartir
    login/            ingreso con usuario y contraseña
    demo/             página pública de ejemplo, sin acceso a la base
    sin-conexion/     aviso que muestra el service worker sin señal
    manifest.ts       datos de instalación de la PWA
  components/         formularios, gráficos y piezas de UI
  lib/
    actions.ts        server actions (validación incluida)
    zones.ts          tramos de referencia de cada métrica (la barra de colores)
    insights.ts       constancia: días registrados y racha
    dayparts.ts       mañana / tarde / noche (en SQL y en la demo)
    auth.ts           credenciales y cookie de sesión
    queries.ts        acceso a la base (los rangos filtran por measured_at,
                      no por la fecha local calculada, para usar el índice)
    metrics.ts        definición de cada métrica y sus rangos
    period.ts         el período mirado: atajos y fechas a mano
    trends.ts         comparación contra el período anterior
    pdf.ts            armado del informe en PDF
    tz.ts             todo lo relativo al horario de Mendoza
  proxy.ts            protege las rutas y redirige al login
public/sw.js          service worker de la app instalada
scripts/init-db.mjs   creación de tablas
```
