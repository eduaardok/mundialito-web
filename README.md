# Torneo Amigos FC 26

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Font Awesome](https://img.shields.io/badge/Font_Awesome-528DD7?style=for-the-badge&logo=font-awesome&logoColor=white)

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white)
![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-00a64e?style=for-the-badge&logo=android&logoColor=white)
![No Backend](https://img.shields.io/badge/Backend-None-e0182d?style=for-the-badge&logo=serverless&logoColor=white)
![localStorage](https://img.shields.io/badge/Storage-localStorage-c9a84c?style=for-the-badge&logo=databricks&logoColor=white)

**App web para gestionar un torneo de fútbol entre amigos, inspirada en el Mundial 2026.**
Sin servidor, sin base de datos, sin instalación. Abre `index.html` y listo.

[Ver demo en vivo](https://eduaardok.github.io/mundialito-web/) &nbsp;·&nbsp;
[Reportar un bug](https://github.com/eduaardok/mundialito-web/issues)

</div>

---

## Qué hace

Gestiona un torneo completo de fútbol entre amigos de principio a fin:

- **Setup** — nombre del torneo, logo personalizado, registro de jugadores con validación en tiempo real
- **Sorteo de equipos** — animación de bombo que revela el equipo FC 26 de cada jugador uno a uno
- **Fase de grupos** — calendario round-robin generado automáticamente, tabla de posiciones con desempate completo (pts → DG → GF → resultado directo)
- **Clasificados** — selección personalizada con checkboxes, botones de acceso rápido (Top 4, Top 8, Top 16)
- **Eliminación directa** — bracket visual por rondas, soporte de penales en caso de empate, avance automático de ganadores
- **Campeón** — pantalla especial con animación de confetti
- **Dashboard** — vista general del torneo desde cualquier punto
- **Exportar / Importar JSON** — comparte el estado del torneo con otros o haz un backup

---

## Stack

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura |
| CSS3 + Tailwind CDN | Estilos y layout |
| JavaScript ES6+ | Toda la lógica |
| Font Awesome CDN | Iconografía |
| Google Fonts (Bebas Neue + Inter) | Tipografía |
| localStorage | Persistencia de datos |

Sin Node.js, sin npm, sin bundlers. Tres archivos.

---

## Cómo usar

### Opción A — Abrir directo

Descarga o clona el repo y abre `index.html` en cualquier navegador moderno.

```bash
git clone https://github.com/eduaardok/mundialito-web.git
cd mundialito-web
# Abre index.html en tu navegador
```

### Opción B — GitHub Pages

La app está desplegada automáticamente en:

```
https://eduaardok.github.io/mundialito-web/
```

Funciona igual desde el celular. Compatible con Chrome para Android y Safari para iOS 15+.

---

## Flujo del torneo

```
Setup inicial
    ↓
Asignación de equipos FC 26 (aleatorio con animación o manual)
    ↓
Configuración de grupos (sorteo con cabezas de grupo o asignación manual)
    ↓
Fase de grupos — todos contra todos dentro del grupo
    ↓
Definir clasificados — selección libre de quién avanza
    ↓
Armar cruces — quién enfrenta a quién en la llave
    ↓
Eliminación directa — bracket hasta el campeón
    ↓
Campeón
```

---

## Compartir el torneo

Como no hay servidor, para que otros vean el torneo en tiempo real:

1. Ve a **Config → Exportar JSON**
2. Manda el archivo por WhatsApp
3. La otra persona abre la app, toca **Cargar torneo desde JSON** en la pantalla de inicio
4. Ve el torneo completo con todos los resultados

---

## Paleta de colores

Inspirada en el Mundial 2026 (USA · Canadá · México):

| Color | Hex | Uso |
|---|---|---|
| Negro | `#07090f` | Fondo principal |
| Rojo | `#e0182d` | Eliminación directa, acciones importantes |
| Azul | `#0052c8` | CTAs, setup, configuración |
| Verde | `#00a64e` | Fase de grupos, éxito |
| Dorado | `#c9a84c` | Campeón, trofeo, líder de grupo |

---

## Archivos

```
mundialito-web/
├── index.html   — estructura HTML y CDN links
├── styles.css   — estilos custom, animaciones, tema oscuro/claro
└── app.js       — toda la lógica (~2000 líneas, comentada en español)
```

---

<div align="center">
Hecho con JavaScript puro para que funcione en cualquier celular, sin depender de nada.
</div>
