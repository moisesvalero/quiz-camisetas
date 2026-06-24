# ⚽ Retro Shirt Quiz — El desafío definitivo de camisetas del Mundial

**¿Reconoces la camiseta? ¿Sabes de qué año es?** Pon a prueba tu memoria futbolera con **50 camisetas históricas** de Copas del Mundo, desde Uruguay 1930 hasta los diseños más icónicos del siglo XXI.

Juego web gratuito, rápido y adictivo. Sin registro. Funciona en móvil, tablet y escritorio — e incluso **se instala como app** en tu pantalla de inicio.

---

## 🎮 Juega ahora

[![Jugar en Vercel](https://img.shields.io/badge/Jugar-quiz--camisetas.vercel.app-000?style=for-the-badge&logo=vercel&logoColor=white)](https://quiz-camisetas.vercel.app)

**👉 [https://quiz-camisetas.vercel.app](https://quiz-camisetas.vercel.app)**

Abre el enlace, elige tu modo y empieza a sumar puntos. Cada acierto cuenta. Cada fallo resta una vida.

---

## ✨ Por qué te va a enganchar

| Característica | Qué significa para ti |
|----------------|------------------------|
| **50 camisetas reales** | Fotos históricas de selecciones campeonas y legendarias, con contexto de cada diseño |
| **3 modos de juego** | Adivina la **selección**, el **año** o enfréntate al **modo mixto** |
| **Sistema de vidas y rachas** | Tres corazones, multiplicadores de racha y récord guardado en tu dispositivo |
| **PWA instalable** | Añádela al móvil como una app nativa; carga offline tras la primera visita |
| **Diseño premium** | Interfaz oscura tipo “retro sports”, animaciones suaves y experiencia táctil |
| **100 % en el navegador** | Sin descargas, sin cuentas, sin fricción |

---

## 🏆 Modos de juego

### ⚽ Adivinar selección
Te mostramos una camiseta. ¿De qué país es? Cuatro opciones, una sola correcta. Ideal para quien vive el fútbol por los colores y los escudos.

### 📅 Adivinar año
Misma camiseta, otra pregunta: ¿en qué Mundial la lució? Perfecto para nostálgicos de cada generación.

### ⚡ Modo mixto
Alterna entre equipo y año sin aviso. El modo para verdaderos expertos que quieren el reto máximo.

---

## 📸 Galería histórica

El catálogo cubre **cada era del fútbol mundial**:

- Campeonas fundadoras (Uruguay 1930, Italia 1934…)
- Diseños míticos (Brasil amarillo, Alemania blanco, Argentina celeste y blanco)
- Camisetas polémicas y memorables (Italia negro 1938, cambios de color por reglamento…)
- Kits modernos de selecciones que han marcado época

Cada entrada incluye **equipo, año, color dominante y una curiosidad** para que aprendas mientras juegas.

---

## 🛠 Stack técnico

Construido con herramientas modernas y enfoque en rendimiento:

- **[Astro 7](https://astro.build)** — sitio estático ultrarrápido
- **TypeScript** — datos tipados y mantenibles
- **PWA** — `manifest.json` + Service Worker con caché inteligente
- **Imágenes locales** — 50 assets en `/public/shirts/` para carga fiable sin depender de APIs externas
- **Despliegue en [Vercel](https://vercel.com)** — CDN global y HTTPS automático

---

## 🚀 Desarrollo local

Requisitos: **Node.js ≥ 22.12** y **pnpm**.

```bash
git clone https://github.com/moisesvalero/quiz-camisetas.git
cd quiz-camisetas
pnpm install
pnpm dev
```

Abre [http://localhost:4321](http://localhost:4321).

### Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción en `./dist/` |
| `pnpm preview` | Previsualiza el build local |
| `pnpm download:local` | Regenera imágenes locales desde Wikimedia |

---

## 📁 Estructura del proyecto

```text
quiz-camisetas/
├── public/
│   ├── shirts/          # 50 imágenes de camisetas (PNG/JPG)
│   ├── manifest.json    # Configuración PWA
│   └── sw.js            # Service Worker (caché same-origin)
├── src/
│   ├── components/
│   │   └── QuizGame.astro   # Lógica e interfaz del quiz
│   ├── data/
│   │   ├── shirts.json      # Catálogo de 50 camisetas
│   │   └── shirts.ts        # Tipos y helpers de imágenes
│   ├── layouts/
│   │   └── Layout.astro     # SEO, PWA y meta tags
│   └── pages/
│       └── index.astro
└── scripts/                 # Utilidades de descarga de imágenes
```

---

## 🌐 Despliegue

El proyecto está optimizado para **Vercel**:

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Astro**
3. Build command: `pnpm build`
4. Output directory: `dist`

Cada push a `main` puede desplegar automáticamente una nueva versión.

---

## 📜 Créditos de imágenes

Las fotografías de camisetas proceden de **[Wikimedia Commons](https://commons.wikimedia.org)** y se distribuyen bajo sus respectivas licencias libres. Este proyecto es **educativo y recreativo**; no está afiliado a la FIFA ni a ninguna federación.

---

## 🤝 Contribuir

¿Quieres añadir camisetas, mejorar traducciones o pulir la UI?

1. Haz fork del repositorio
2. Crea una rama (`git checkout -b feat/nueva-camiseta`)
3. Commit con [Conventional Commits](https://www.conventionalcommits.org/)
4. Abre un Pull Request

---

## 📄 Licencia

Código del proyecto: uso libre para aprendizaje y portfolio. Respeta las licencias de las imágenes en Wikimedia Commons.

---

**Hecho con pasión por el fútbol y las camisetas que lo cuentan todo.** ⚽🏆

*¿Cuál es tu récord? Compártelo y reta a tus amigos.*
