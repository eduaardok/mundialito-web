# Torneo Amigos FC 26 — Especificación para Claude Code

## Objetivo
Construir una aplicación web completa (sin backend, sin base de datos) para gestionar un torneo de fútbol entre amigos inspirado en el Mundial 2026. Toda la persistencia usa `localStorage`. La app debe funcionar abriendo `index.html` directamente en el navegador móvil (Android).

---

## Stack técnico
- **HTML5** (`index.html`)
- **CSS3** (`styles.css`) + **Tailwind CSS via CDN**
- **JavaScript ES6+** (`app.js`)
- **Font Awesome** via CDN (iconos)
- **Google Fonts** — usar "Bebas Neue" para títulos y "Inter" para texto
- Sin build tools, sin Node, sin bundlers. Todo funciona abriendo `index.html`.

---

## Archivos a generar
```
index.html   — estructura y CDN links
styles.css   — estilos custom (lo que Tailwind no cubra, animaciones, tema)
app.js       — toda la lógica (bien comentado, modular)
```

---

## Diseño visual — Tema Mundial 2026
- **Paleta:** azul marino oscuro `#0a1628`, dorado `#c9a84c`, blanco `#ffffff`, rojo acento `#e63946`
- **Estilo:** app deportiva moderna — gradientes oscuros, cards con bordes dorados, tipografía impactante
- **Mobile-first** y responsive. Optimizado para Android (pantallas 360px–430px de ancho)
- **Tema oscuro** por defecto (toggle para cambiar a claro)
- **Accesible:** contraste suficiente, touch targets mínimo 44px, labels en todos los inputs
- Logo del torneo: el usuario puede subir una imagen O escribir un nombre que se muestre como título estilizado
- Nombre del torneo configurable (se guarda en localStorage)

---

## Flujo de la aplicación

### Pantalla 0 — Setup inicial
- Ingresar nombre del torneo (input destacado, tipografía grande)
- Subir logo (opcional, se guarda como base64 en localStorage) — mostrar preview inmediato al subir
- Definir cantidad de jugadores (mínimo 4, sin máximo fijo — el usuario decide lo que tiene sentido)
- **Registro de jugadores — UX cuidado:**
  - Al definir la cantidad, aparecen los inputs dinámicamente (uno por jugador)
  - Cada input tiene: número de jugador como label visual (#1, #2...), campo de nombre con placeholder "Nombre del jugador"
  - Botones para añadir (+) o quitar (−) jugadores en cualquier momento antes de confirmar
  - Validación en tiempo real: nombres vacíos o duplicados se marcan en rojo con mensaje claro
  - El foco avanza automáticamente al siguiente input al presionar Enter (mobile-friendly)
  - Botón "Confirmar jugadores" solo habilitado cuando todos los nombres están válidos
- Asignar equipo de FC 26 a cada jugador:
  - **Opción A — Aleatorio:** la app sortea equipos del pool de FC 26 sin repetir
  - **Opción B — Manual:** el usuario elige el equipo de cada jugador desde un dropdown
  - Pool de equipos FC 26 disponibles (los 15 mejores por defecto, hardcodeados en `app.js`):
    Argentina, Francia, Brasil, Inglaterra, Portugal, España, Alemania, Países Bajos, Bélgica, Italia, Uruguay, Colombia, Croacia, Marruecos, Estados Unidos
  - Si hay más jugadores que equipos en el pool, el usuario puede añadir equipos extra manualmente

### Pantalla 1 — Configuración de grupos
- El usuario define:
  - Cantidad de grupos
  - Cantidad de equipos por grupo (la app sugiere una distribución razonable según el total de jugadores, pero el usuario puede cambiarla)
  - Ejemplo sugerido: 9 jugadores → 3 grupos de 3; 10 jugadores → 2 grupos de 3 + 1 grupo de 4; 12 jugadores → 3 grupos de 4
- **Sorteo:**
  - El usuario puede marcar jugadores como "cabeza de grupo" (uno por grupo máximo)
  - Los cabezas de grupo se fijan como primeros de su grupo antes del sorteo
  - El resto se sortea aleatoriamente
  - Botón "Realizar sorteo" con animación visual de bombos
  - **Alternativa manual:** el usuario puede arrastrar/asignar jugadores a grupos directamente sin sorteo
- Mostrar resultado del sorteo antes de confirmar
- Una vez confirmado, el torneo se marca como "iniciado" y la configuración se bloquea

### Pantalla 2 — Fase de grupos
- Mostrar todos los grupos con sus tablas de posiciones
- Columnas de la tabla: Jugador | Equipo | PJ | PG | PE | PP | GF | GC | DG | PTS
- Calendario de partidos generado automáticamente (todos contra todos dentro del grupo, round-robin)
- Cada partido muestra: Jugador A (Equipo A) vs Jugador B (Equipo B) — resultado editable
- Al registrar resultado (goles de cada lado), la tabla se actualiza inmediatamente
- Se permiten empates (0-0, 1-1, etc.)
- Criterios de desempate para ordenar tabla (en orden):
  1. Puntos
  2. Diferencia de goles
  3. Goles a favor
  4. Resultado directo entre empatados
- Partidos con resultado registrado se muestran distintos (check verde) de los pendientes

### Pantalla 3 — Clasificados y armado de cruces
- Mostrar tabla de todos los jugadores ordenados por rendimiento en grupos (para referencia)
- **El usuario arma los cruces manualmente:**
  - La app muestra todos los clasificados disponibles
  - El usuario elige cuántos clasifican (2, 4, 8, 16 — para que la fase de eliminación sea limpia)
  - El usuario arrastra o selecciona quién enfrenta a quién en cada cruce
  - La app valida que todos los clasificados estén emparejados antes de continuar
  - Razón: pueden ocurrir imprevistos (alguien se fue, empates raros, acuerdos entre jugadores)

### Pantalla 4 — Fase de eliminación directa
- Mostrar llave (bracket) visual según los cruces definidos
- Fases posibles: Final, Semifinales, Cuartos, Octavos (según cuántos clasificaron)
- Registrar resultado de cada partido de la llave
- Al completar una ronda, la app avanza automáticamente a la siguiente generando los cruces del lado del bracket (ganadores al siguiente partido correspondiente)
- Mostrar el campeón cuando se complete la final
- Si hay empate en eliminación directa: mostrar campo para penales (quién ganó los penales)

### Pantalla 5 — Dashboard / Vista general
- Vista accesible desde cualquier punto del torneo (tab o menú)
- Muestra todo en un solo lugar:
  - Estado del torneo (fase actual)
  - Tablas de grupos resumidas
  - Clasificados
  - Llave de eliminación con resultados
  - Campeón (si el torneo terminó) con animación/confetti
- Nombre y logo del torneo siempre visibles en el header

---

## Navegación
- Barra de navegación inferior fija (mobile-style) con tabs:
  - 🏠 Inicio (Dashboard)
  - 👥 Grupos
  - 🏆 Llave
  - ⚙️ Config
- La tab activa resaltada en dorado

---

## Extras
- **Reiniciar torneo:** botón en Config con confirmación (borra localStorage)
- **Exportar JSON:** descarga el estado completo del torneo como `.json`
- **Importar JSON:** sube un `.json` y restaura el estado (útil si alguien más quiere ver el torneo)
- **Compartir:** botón para copiar un resumen del torneo al clipboard (texto plano con los resultados)

---

## Persistencia (localStorage)
Guardar en una sola clave `torneo_data` como JSON con esta estructura:
```json
{
  "meta": { "nombre": "", "logo": "", "tema": "dark" },
  "jugadores": [],
  "grupos": [],
  "partidos_grupos": [],
  "clasificados": [],
  "cruces": [],
  "partidos_eliminacion": [],
  "campeon": null,
  "fase": "setup"
}
```
Toda acción del usuario guarda inmediatamente. Al cargar la app, restaurar desde localStorage si existe data.

---

## Código — estándares
- Todo el JS documentado con comentarios en español
- Funciones pequeñas y con nombres descriptivos en español (`calcularPosiciones`, `generarCalendario`, etc.)
- Sin dependencias externas más allá de Tailwind CDN y Font Awesome CDN
- No usar `eval()`, no usar `document.write()`
- Manejar errores con `try/catch` donde haya riesgo (parsing JSON, localStorage lleno, etc.)
- El código debe ser legible y mantenible — como si lo fuera a leer otro desarrollador

---

## Notas importantes
- **Cero emojis:** está prohibido usar emojis en cualquier parte de la app — navegación, tablas, botones, mensajes, pantalla de campeón. Usar exclusivamente Font Awesome o SVG para representar íconos
- La app NO fuerza estructuras de grupos ni de eliminación — el usuario siempre tiene la última palabra
- Si el localStorage está vacío, mostrar el setup inicial
- Si hay datos guardados, mostrar el dashboard con opción de continuar o reiniciar
- Funcionar perfectamente en Chrome para Android **y Safari para iPhone** (iOS 15+)
  - Evitar `vh` en iOS (usar `dvh` o JS para altura real)
  - No usar `hover` como única indicación de estado (iOS no tiene hover)
  - Touch events y scroll nativo sin bloqueos
  - Inputs con `font-size: 16px` mínimo para evitar el zoom automático de Safari al hacer foco
- Todos los modales/popups deben cerrarse con botón X y también tocando fuera del área

---

## Deploy — GitHub Pages
- La app debe funcionar deployada en GitHub Pages (subiendo los 3 archivos al repo)
- **No usar rutas absolutas** — todas las referencias a archivos con rutas relativas (`./styles.css`, `./app.js`)
- No depender de un servidor local — todo debe funcionar con el protocolo `file://` y también desde `https://usuario.github.io/repo/`
- El `index.html` debe ser el punto de entrada en la raíz del repo
- Los CDN links deben ser HTTPS

---

## Diseño — nivel premium
El diseño debe verse como una app deportiva profesional, no un proyecto universitario. Referencia visual: mezcla entre la app oficial de la FIFA y ESPN. Específicamente:

- **Header:** logo del torneo + nombre centrado, con fondo degradado oscuro y borde inferior dorado
- **Cards de grupos:** fondo semi-transparente con blur (glassmorphism sutil), borde con gradiente dorado, sombra profunda
- **Tabla de posiciones:** filas alternadas, el líder de cada grupo destacado con borde dorado a la izquierda
- **Bracket de eliminación:** visual tipo llave real — líneas conectando los partidos, fondo oscuro, equipos con escudos emoji o banderas
- **Animación de sorteo:** overlay con efecto de "bombo girando" — mostrar jugadores uno a uno asignándose a grupos con transición
- **Campeón:** pantalla especial con animación de confetti (canvas o CSS), trofeo emoji gigante, nombre del campeón con efecto glow dorado
- **Botones:** esquinas redondeadas, gradiente azul-dorado en CTAs principales, efecto ripple al tocar
- **Inputs y formularios:** estilo dark con borde que se ilumina en dorado al hacer foco, placeholder en gris claro
- **Tipografía:** "Bebas Neue" para nombres de equipos y marcadores; "Inter" para texto general — ambas desde Google Fonts
- **Iconos:** Font Awesome para toda la iconografía (balón, trofeo, grupo, calendario, etc.) — **no usar emojis en ninguna parte de la interfaz**, ni en botones, ni en tablas, ni en la pantalla de campeón; reemplazar cualquier emoji por íconos de Font Awesome o SVG inline
- **Micro-interacciones:** transiciones suaves (200-300ms) en cambios de pantalla, cards que suben levemente al tocar
- El diseño debe impresionar cuando alguien lo abra por primera vez