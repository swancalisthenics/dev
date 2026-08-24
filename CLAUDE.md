# new-swan-design (Swan Calisthenics – Aurora Glassmorphism Redesign)

## Überblick

Zweite, komplett eigenständige Umsetzung der Swan-Calisthenics-Community-Website
aus `C:\Source\home` — gleiche Bilder, gleiche Texte, aber ein völlig anderes,
selbst entworfenes visuelles Design ("Aurora Glassmorphism": helle Basis,
bewegte Farbverlauf-Blobs im Hintergrund, durchgängige Frosted-Glass-Karten).
Reines statisches HTML5/CSS3/Vanilla-JS ohne Build-Schritt, kein npm/node,
direkt im Browser öffenbar — bewusste Entscheidung, analog zur technischen
Grundidee von `home`. Kein Ersatz für `home`, beide Projekte bestehen
unabhängig nebeneinander. Design- und Umsetzungsentscheidungen sind im
Detail dokumentiert in
[docs/superpowers/specs/2026-08-24-swan-calisthenics-redesign-design.md](docs/superpowers/specs/2026-08-24-swan-calisthenics-redesign-design.md).

## Struktur

```
new-swan-design/
├── index.html                  Startseite: Hero, Über uns, Community-Slider,
│                                Zeiten, Level-Guide, Standort, FAQ, Social-Banner
├── css/
│   ├── base.css                 Reset, Farb-/Typografie-Tokens (:root), Dark-Mode-
│   │                             Tokens, Aurora-Blob-Hintergrund, Layout-Grundlagen
│   ├── components.css           Glaskarten, Buttons, Icon-System (CSS-Mask), Top-/
│   │                             Tab-Bar-Navigation, Theme-Toggle, Badges, FAQ-
│   │                             Accordion, Modals, Formulare, Footer
│   └── pages/                   Eine Datei pro Seite, nur seitenspezifische Regeln
│       ├── home.css, team.css, kontakt.css, verein.css, rechtliches.css, blog.css
├── js/
│   ├── main.js                  Dark-Mode-Toggle, responsive <picture>-Auflösung,
│   │                             Nav-Active-State, Scroll-Spy, FAQ-Accordion,
│   │                             Kontakt-Modals (Telefon/E-Mail)
│   ├── blog-data.js             BLOG_POSTS-Array — Inhalt 1:1 aus
│   │                             home/lib/blog-posts-data.js übernommen
│   └── blog.js                  renderBlogGrid, renderBlogPost, Kategorie-Filter
├── assets/
│   ├── images/                  1:1-Kopie aus home/images (inkl. blogs/-Unterordner)
│   ├── icons/                   Kopie der FontAwesome-SVGs aus home/images/icons
│   │                             + 5 neue, selbst gebaute Icons (tab-*.svg) fürs
│   │                             Nav-System
│   ├── favicon/                 Kopie aus home/favicon (site.webmanifest-Pfade/
│   │                             Farben korrigiert, siehe unten)
│   └── documents/                leer, Platzhalter für künftige Vereins-PDFs
│                                 (siehe README.md darin)
└── pages/
    ├── team.html, kontakt.html, verein.html, rechtliches.html
    └── blog/
        ├── blog.html             Übersicht mit Kategorie-Filter
        └── post.html             Einziges Template für alle 14 Artikel, liest `?id=`
```

## Design-System: „Aurora Glassmorphism"

- **Farb-Tokens** (`css/base.css`, `:root`): `--bg-base`, `--text-primary`,
  `--text-muted`, `--glass-fill`, `--glass-fill-strong`, `--glass-border`,
  `--aurora-coral`, `--aurora-red`, `--aurora-amber`, `--aurora-rust`,
  `--badge-pending-bg`/`-text`. Neue Farben/Werte immer dort ergänzen, nie
  hartkodieren — sonst greift der Dark Mode nicht. Tokens, die in beiden
  Modi unterschiedlich aussehen müssen (z. B. `--badge-pending-text`), immer
  in allen drei Blöcken pflegen (`:root`, die `prefers-color-scheme: dark`-
  Regel und `:root[data-theme="dark"]`) — eine feste Farbe reicht oft nicht
  für genug Kontrast in beiden Modi (siehe `.badge-pending`, wurde deshalb
  von einer festen Farbe auf Tokens umgestellt).
- **Akzentfarbe ist Rot** (nicht Violett/Pink): Alle sichtbaren Akzente
  (Buttons, `.accent`-Textverlauf, aktive Nav-/Tab-Zustände, Fokus-Ringe,
  Links) nutzen den Verlauf `var(--aurora-coral)` → `var(--aurora-red)` bzw.
  die einfarbige Variante `var(--aurora-red)` (`#e63946`, angelehnt an
  `home`s Original-Rot/Logo-Farbe).
- **Aurora-Blobs, bewusst warme Palette passend zu Logo/Akzent:** drei
  `position: fixed`, stark geblurrte, langsam animierte Farbflächen hinter
  dem Content (`.aurora-blob.coral` / `.amber` / `.rust`) — alle drei aus der
  Rot/Orange-Familie (kein Violett/Türkis mehr, damit der Hintergrund zum
  roten Logo/Akzent passt statt eigenständig "bunt" zu wirken). Auf Desktop
  (≥768px) deutlich größer (eigener `@media`-Block in `base.css`) für mehr
  Präsenz auf breiten Screens. Scheinen durch die halbtransparenten
  Glaskarten hindurch. Animation deaktiviert unter
  `prefers-reduced-motion: reduce`.
- **Glaskarten** (`.glass-card`): `background: var(--glass-fill)` +
  `backdrop-filter: blur(20px)` + 1px Rand + weicher Schatten, `border-radius:
  20px`. Praktisch jede inhaltliche Einheit auf der Seite ist eine Glaskarte.
- **Icon-System — bewusst CSS-Mask statt `<img>`:** Die aus `home` kopierten
  FontAwesome-SVGs haben teils weiss, teils rot fest einprogrammierte
  Fill-Farben (gedacht für `home`s dunkles Theme mit rotem Akzent). Direkt als
  `<img>` eingebunden waren sie auf dem hellen Hintergrund hier teils
  unsichtbar (weiss auf hell). Lösung: `.icon` + `.icon-{name}` in
  `components.css` nutzen `mask-image` statt `src` — die Maske übernimmt nur
  die Form, die sichtbare Farbe kommt von `currentColor` und passt sich damit
  automatisch an Kontext *und* Dark Mode an. Neue Icons immer nach diesem
  Muster einbinden, nicht als `<img>`.
- **Dark Mode:** Umschaltbar über den Kreis-Button (`.theme-toggle`, Sonne/Mond)
  oben rechts in der Navbar auf jeder Seite. Reihenfolge: gespeicherte Wahl
  (`localStorage['theme']`) > `prefers-color-scheme` > hell. Ein kleines
  Inline-Skript im `<head>` jeder Seite setzt `data-theme` auf `<html>` schon
  vor dem ersten Render (verhindert Flackern), `js/main.js` verdrahtet nur noch
  den Klick-Handler. Neue Farben/Komponenten müssen über CSS-Variablen laufen,
  sonst brechen sie im Dark Mode (siehe Farb-Tokens oben).
- **Navigation, mobile-first:** Unter 768px eine schwebende Glass-Tab-Bar unten
  (Home/Blog/Team/Verein/Kontakt), darüber nur eine schlanke Glass-Topbar mit
  Logo + Theme-Toggle. Ab 768px wandern die Ziele in eine klassische
  horizontale Topbar, ergänzt um die Anker-Links der Startseite (Über uns/
  Zeiten/Standort). Aktiver Zustand läuft über `body[data-page]` +
  `.nav-link[data-page]` (nicht über Href-Parsing, siehe unten) plus
  Scroll-Spy für die Anker-Links auf der Startseite selbst.

## Wichtige Implementierungs-Entscheidungen

1. **Aktiver Nav-Zustand über `data-page`, nicht über Href-Vergleich.** Da
   Seiten auf unterschiedlicher Ordnertiefe liegen (`index.html`,
   `pages/*.html`, `pages/blog/*.html`), wären relative Hrefs pro Tiefe
   unterschiedlich und fehleranfällig zum Parsen. Jede Seite trägt stattdessen
   `<body data-page="...">`, jeder Nav-Link `data-page="..."` — `setActiveNav()`
   in `main.js` vergleicht nur diese beiden Werte, unabhängig vom tatsächlichen
   Pfad.
2. **Relative Pfade überall, keine root-relativen (`/...`) Pfade** in HTML/CSS
   (Ausnahme: `site.webmanifest`, das per Spec root-relativ sein muss) — damit
   die Seite sowohl über einen Webserver als auch direkt per `file://`
   funktioniert, analog zu `home`.
3. **`resolvePictureSources()`** (aus `home/lib/main.js` übernommenes Muster):
   für dynamisch per `innerHTML` gerenderte Bilder (Blog-Karten, Post-Inhalt)
   ist natives `<picture>`-Verhalten unzuverlässig; die Bildauswahl
   (gross/klein) läuft stattdessen explizit per JS über `data-large` und
   `window.innerWidth`.
4. **Community-Slider ist Demo-Zustand:** Die 9 Slides in der
   "Unsere Community"-Sektion auf `index.html` nutzen absichtlich neunmal
   dasselbe Bild (`5.7.2026-klein.JPG`) mit neun verschiedenen, frei erfundenen
   Datums-Bildunterschriften (rückwärts ab 5.7.2026, wöchentlicher
   Sonntags-Rhythmus). Sobald echte Fotos vergangener Workouts vorliegen,
   einfach die neun `<figure class="slide">`-Blöcke in `index.html` durch
   echte Bilder/Daten ersetzen — Struktur und CSS (horizontales Scroll-Snap)
   bleiben gleich. Funktioniert per Touch-Wisch und Trackpad nativ; für die
   Desktop-Maus (kein natives Klick-und-Ziehen auf `<div>`s) übernimmt ein
   eigener Mousedown/-move/-up-Handler auf `.slider-track` in `js/main.js`
   das Scrollen per Ziehen (setzt währenddessen `scroll-snap-type: none`,
   damit das Snapping nicht dagegenarbeitet, und unterdrückt den
   Klick-Event am Ende eines Ziehens, damit das nicht versehentlich die
   Lightbox öffnet). Jedes Slide-Bild (`.slide-img`) öffnet per Klick/Tap/Enter eine
   grosse Lightbox-Ansicht (`#image-lightbox` in `index.html`,
   `openLightbox()`/`closeLightbox()` in `js/main.js`) — schliessbar per
   Klick ausserhalb, X-Button oder Escape-Taste. Bewusst **kein** Zoom in der
   Lightbox (war kurz eingebaut, auf Wunsch wieder entfernt). Solange ein
   Modal/die Lightbox offen ist, bekommt `<body>` die Klasse `modal-open`
   (`overflow: hidden` in `base.css`) und sperrt damit den
   Hintergrund-Scroll — `updateBodyScrollLock()` in `js/main.js` wird von
   jeder Open-/Close-Funktion aufgerufen.
5. **Verein-Seite (`pages/verein.html`) ist komplett neuer Inhalt**, nicht aus
   `home` übernommen — Platzhalter-Karten für 5 künftige Vereinsdokumente
   (Vereinsstatuten, Beitrittserklärung, Beitragsordnung, Spesenreglement,
   Haus-/Platzordnung), alle mit Badge „In Vorbereitung", bewusst nicht
   klickbar. Sobald ein echtes PDF vorliegt: in `assets/documents/` ablegen,
   Karte auf echten Link umstellen, Badge entfernen (siehe
   `assets/documents/README.md`).
6. **Rechtliche Seite leicht angepasst, nicht wortgleich:** Der
   GitHub-Pages-spezifische Hosting-Absatz aus `home`s Datenschutzerklärung
   wurde generisch formuliert (`pages/rechtliches.html`), da noch nicht
   feststeht, wo dieses Projekt gehostet wird — eine Falschaussage über den
   Hosting-Anbieter wäre sonst die Folge gewesen.
7. **`site.webmanifest` hatte Bugs, die aus `home` mitkopiert und hier
   korrigiert wurden:** falsche root-relative Icon-Pfade (`/favicon/...` statt
   `/assets/favicon/...`) und Theme-/Hintergrundfarben aus `home`s altem
   dunklem Rot-Theme, die nicht mehr zum hier verwendeten Farbschema passten.
8. **Kein natives `<select>` mehr — eigene `.custom-select`-Komponente**
   (`pages/kontakt.html`, Kategorie/Betreff-Feld; CSS in `components.css`,
   JS-Logik in `main.js`): Ein natives `<select>` liess sich nur im
   geschlossenen Zustand gestalten — die geöffnete Options-Liste wird vom
   Betriebssystem/Browser gerendert, ignoriert die eigene Farbwelt komplett
   und kann breiter werden als das Feld selbst (auf schmalen Karten sichtbar
   über den Kartenrand hinausgeragt). Die eigene Lösung: Button
   (`.custom-select-trigger`) + absolut positionierte `<ul role="listbox">`
   im Glass-Card-Stil, deren Breite immer exakt der des Buttons entspricht,
   plus ein verstecktes `<input type="hidden">`, das den eigentlichen Wert
   fürs Formular hält. Bei weiteren Dropdown-Feldern dieses Muster
   wiederverwenden, kein natives `<select>` mehr einsetzen.

## Code-Stil

- 4-Leerzeichen-Einrückung durchgängig in HTML/CSS/JS.
- Kebab-Case für CSS-Klassen, camelCase für JS-Bezeichner, deutsche Texte/
  Kommentare wie im Rest des Projekts (`home`).
- Neue Icons: als `.icon-{name}`-Mask-Regel in `components.css` ergänzen (siehe
  „Icon-System" oben), nicht als `<img>` mit hartkodierter Farbe einbinden.
- Neue Farben: als CSS-Variable in `css/base.css` (`:root`) ergänzen, dort auch
  gleich den Dark-Mode-Wert mitpflegen.
