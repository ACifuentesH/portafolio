# Portafolio — We can work in any field

Landing de portafolio (Web Developer & UX/UI) animada con scroll: un dashboard financiero cuya línea de ingresos se convierte en un latido, una web de clínica que agenda una cita sola, y luego música, moda, estilos y culturas.

Todo es HTML, CSS y JavaScript (canvas para las líneas): nada de video.

## Correr en local

Requiere Node 18 o superior.

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente http://localhost:5173).

## Build de producción

```bash
npm run build
npm run preview
```

El resultado queda en `dist/`.

## Estructura

- `index.html`: el marcado de todas las escenas.
- `src/style.css`: estilos (finanzas, clínica, escenas de estilos y culturas).
- `src/main.js`: el scroll, la cámara del dashboard, el latido, la demo de reserva y los canvas.

## Despliegue

Vercel detecta Vite solo: importa el repo, deja los valores por defecto (build `npm run build`, salida `dist`) y despliega.

## Estudio 3D (moda)

El maniquí y toda la ropa se generan por código en `src/studio.js` con three.js: no hay modelos ni texturas externas. Las telas (jaspeado, punto, denim, estampado) se pintan en canvas al cargar.
