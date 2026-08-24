# Swan Calisthenics – Aurora Glassmorphism Redesign

## Kontext & Ziel

`C:\Source\home` ist die bestehende, produktiv gehostete Community-Website von
Swan Calisthenics (statisches HTML/CSS/JS, dunkles Theme, Glass-Blur-Navbar,
Rot-Akzent). In `C:\Source\new-swan-design` (ursprünglich als `claudeTest`
angelegt, seither umbenannt) entsteht eine zweite, komplett
eigenständige Umsetzung derselben Inhalte (gleiche Bilder, gleiche Texte) mit
einem eigenen, deutlich anderen visuellen Design. Struktur, Dateiaufteilung
und Komponentenschnitt sind bewusst frei wählbar und müssen nicht mit `home`
übereinstimmen.

Es handelt sich um eine reine Design-/Frontend-Übung, keine Ablösung von
`home` — beide Projekte bleiben unabhängig nebeneinander bestehen.

## Non-Goals

- Kein Build-Schritt, kein npm/node, kein Framework — reines statisches
  HTML/CSS/JS, direkt im Browser öffenbar (User-Entscheidung).
- Keine echten Vereinsdokumente (siehe „Verein-Seite" unten) — nur Platzhalter.
- Kein Kontaktformular-Backend-Rewrite — Formular wird 1:1 mit demselben
  `formsubmit.co`-Endpoint wie bei `home` übernommen (bestehende, bereits
  genutzte Funktionalität, keine neue Sende-Aktion).
- Kein Dark-Mode-Umschalter — ein festes, helles Farbschema.
- Keine automatische Erkennung, ob ein PDF-Dokument existiert (kein Fetch/HEAD-
  Trick) — Platzhalter-Status ist hartkodiert und wird manuell umgestellt,
  sobald echte PDFs vorliegen.

## Content-Quelle & Wiederverwendung

Alle Bilder und Texte werden aus `home` übernommen, aber in ein eigenes
Template/Design gegossen:

- **Bilder:** 1:1-Kopie von `home/images/**` (inkl. `-small`-Varianten) und
  `home/favicon/**` nach `new-swan-design/assets/images/` bzw.
  `new-swan-design/assets/favicon/`. Gleiche Dateinamen, damit sich das Datenfile
  (siehe Blog) direkt aus `home/lib/blog-posts-data.js` übernehmen lässt und
  nur die Pfad-Präfixe angepasst werden müssen.
- **Icons:** FontAwesome-SVGs aus `home/images/icons/` werden mitkopiert und
  weiterverwendet. Zwei neue, im gleichen simplen Linien-Stil selbst gebaute
  Icons kommen dazu, weil `home` sie nicht hat: **Home** (Haus-Symbol) und
  **Verein** (Dokument-/Scroll-Symbol) für die neue Bottom-Tab-Bar.
- **Texte:** Wörtlich übernommen aus `home/index.html` (Hero, Über uns,
  Community-Teaser, Zeiten, Level-Guide, Standort, FAQ, Social-Banner),
  `home/html/team.html` (Team-Bios), `home/html/kontakt.html`
  (Formular-Labels/Optionen, Ansprechperson-Text) und
  `home/html/datenschutz_impressum.html` (Impressum/Datenschutz komplett).
  Für den Blog wird `home/lib/blog-posts-data.js` (alle 14 Posts, Titel,
  Exzerpte, vollständiger Artikelinhalt) als Ausgangsdatei kopiert und nur an
  die neuen Bild-Pfade angepasst — Inhalte bleiben unverändert.
- **Neu (nicht aus `home` übernommen):** die Verein-Seite ist komplett neuer
  Inhalt, siehe eigener Abschnitt unten.

## Tech-Stack

Reines HTML5/CSS3/Vanilla-JS ohne Build-Schritt, analog zur technischen
Grundidee von `home`, aber mit eigener Ordnerstruktur (siehe unten).

## Design-System: „Aurora Glassmorphism"

### Farben

| Token | Wert | Verwendung |
|---|---|---|
| `--bg-base` | `#F6F5FB` | Seitenhintergrund (helles Kühl-Weiss) |
| `--aurora-coral` | `#FF6B6B` | Blob 1, Akzent-Gradient-Ende |
| `--aurora-violet` | `#8B7CF6` | Blob 2, primärer Akzent, Buttons |
| `--aurora-teal` | `#2FD9C4` | Blob 3, sekundärer Akzent |
| `--glass-fill` | `rgba(255,255,255,0.55)` | Glaspanel-Hintergrund |
| `--glass-border` | `rgba(255,255,255,0.65)` | Glaspanel-Rand (1px) |
| `--glass-blur` | `blur(20px)` | `backdrop-filter` aller Glaspanels |
| `--text-primary` | `#1B1B23` | Fliesstext, Headlines |
| `--text-muted` | `#5B5B68` | Sekundärtext, Meta-Angaben |

Die drei Aurora-Farben werden als grosse, weich verlaufende, blurred Blobs
(`position: fixed`, `filter: blur(80px+)`, niedrige Opazität) hinter dem
Content platziert — nicht als Vollflächen-Hintergrund, sondern als 3–4 grosse
Farbflecken, die je nach Seite leicht unterschiedlich positioniert sind.
Reduzierte Bewegung (siehe unten) für Nutzer mit
`prefers-reduced-motion: reduce`.

### Typografie

Kein Webfont-Download — sauberer System-Font-Stack, um ohne externe Requests
oder zusätzliche Assets auszukommen:
`font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;`
Headlines: `font-weight: 800`, enger `letter-spacing`. Fliesstext:
`font-weight: 400`, `line-height: 1.6`.

### Karten & Formsprache

Jede inhaltliche Einheit (About-Card, Team-Karte, Level-Karte, Blog-Karte,
FAQ-Item, Dokument-Karte, Kontakt-Formular-Card) ist ein Glaspanel:
`background: var(--glass-fill)`, `backdrop-filter: var(--glass-blur)`,
`border: 1px solid var(--glass-border)`, `border-radius: 20px`,
weicher `box-shadow`. Hover (Desktop) hebt die Karte leicht an
(`translateY(-4px)`), Tap (Mobile) gibt kurzes Scale-Feedback
(`:active { transform: scale(0.98) }`).

Buttons: Pill-Form (`border-radius: 999px`), primärer Button mit
Verlauf `linear-gradient(135deg, var(--aurora-violet), var(--aurora-coral))`
und weisser Schrift; sekundärer Button als Glaspanel mit Text in
`--text-primary`.

### Bewegung

Aurora-Blobs bewegen sich sehr langsam und subtil per CSS-`@keyframes`
(Position/Skalierung, keine Farbänderung). Komplett deaktiviert unter
`@media (prefers-reduced-motion: reduce)`.

### Breakpoint

Einheitlicher Breakpoint bei `768px` (wie bei `home`) —
`@media (min-width: 768px)` für Desktop-Anpassungen.

## Navigation (mobile-first)

- **Mobile (< 768px):** schlanke, sticky Glass-Topbar nur mit Logo/Titel
  (kein Hamburger). Primäre Navigation läuft über eine schwebende
  Glass-Tab-Bar am unteren Bildschirmrand (`position: fixed; bottom`) mit 5
  Icon+Label-Zielen: **Home, Blog, Team, Verein, Kontakt**. Anker-Ziele
  innerhalb der Startseite (Über uns, Zeiten, Standort, FAQ) werden nicht in
  der Tab-Bar dupliziert, sondern ausschliesslich durch normales Scrollen auf
  der Startseite selbst erreicht — die Sektionsreihenfolge dort (Hero → Über
  uns → Community-Teaser → Zeiten → Level-Guide → Standort → FAQ →
  Social-Banner) entspricht bereits der natürlichen Lesereihenfolge, sodass
  kein zusätzliches Quick-Nav-Element nötig ist.
- **Desktop (≥ 768px):** die Tab-Bar-Ziele wandern in eine klassische
  horizontale Glass-Topbar (Logo links, Links rechts), ergänzt um die
  Anker-Links (Über uns, Zeiten, Standort), analog zur bestehenden
  `home`-Navigation.
- Rechtliches (Datenschutz/Impressum) ist bewusst nicht in der
  Haupt-Navigation, sondern nur im Footer verlinkt — wie bei `home`.

## Sitemap & Seiten

| Seite | Pfad | Inhalt (aus `home` übernommen, neues Design) |
|---|---|---|
| Startseite | `index.html` | Hero, Über uns, Community-Teaser, Trainingszeiten, Level-Guide, Standort, FAQ-Accordion, Social-Banner |
| Team | `pages/team.html` | Team-/Vorstand-Karten (Ale, Nicolas, Louie, Giada) inkl. Telefon-/Mail-Dialog-Modals |
| Kontakt | `pages/kontakt.html` | Kontaktformular (gleicher `formsubmit.co`-Endpoint) + Ansprechperson-Karte |
| **Verein** (neu) | `pages/verein.html` | Platzhalter-Dokumentkarten, siehe eigener Abschnitt |
| Rechtliches | `pages/rechtliches.html` | Impressum + Datenschutzerklärung, wortgleich |
| Blog-Übersicht | `pages/blog/blog.html` | Kategorie-Filter + Grid aller 14 Artikel-Karten |
| Blog-Post | `pages/blog/post.html?id=` | Einzelnes Template für alle 14 Artikel |

## Blog-System (datengetrieben)

Gleiches Grundprinzip wie bei `home`, eigene Umsetzung:

- `js/blog-data.js`: Array `BLOG_POSTS`, 1:1 aus
  `home/lib/blog-posts-data.js` übernommen (gleiche 14 Objekte, gleiche
  Texte), nur Bildpfade auf die neue `assets/images/`-Struktur angepasst.
- `js/blog.js`: `renderBlogGrid()` befüllt die Kartenübersicht auf
  `blog.html`, `renderBlogPost()` befüllt `post.html` anhand des
  `?id=`-Query-Parameters. Existiert die ID nicht, erscheint ein
  Hinweis „Diesen Beitrag gibt es nicht (mehr)." (gleiches Verhalten wie
  `home`).
- Kategorie-Filter nutzt dieselben `filterCategory`-Werte (`uebungen`,
  `ernaehrung`) wie `home` — keine neue Taxonomie nötig.
- **Übernommene Lehre aus `home`:** Für dynamisch per `innerHTML` gerenderte
  Bilder (Blog-Karten, Post-Inhalt) ist natives `<picture>`-Verhalten
  unzuverlässig. Genau wie in `home/lib/main.js` (`resolvePictureSources()`)
  wird die Bildauswahl (gross/klein) für dynamisch eingefügte Bilder explizit
  per JS anhand von `window.innerWidth` gesetzt, mit `data-large` als
  Attribut für die grosse Variante. Statisch im HTML vorhandene
  `<picture>`-Elemente (z. B. Team-Foto auf der Startseite) nutzen dagegen
  natives `<picture><source>`.

## Verein-Seite (Platzhalter-Dokumente)

Neuer, nicht aus `home` übernommener Inhalt. Hintergrund: Swan Calisthenics
plant den Übergang von einer losen Community zu einem eingetragenen Verein;
die zugehörigen Dokumente existieren noch nicht.

- Kurzer einleitender Text (neu formuliert, da kein Vereinstext von `home`
  existiert): sinngemäss „Aus der Community wird bald ein Verein. Sobald die
  folgenden Dokumente vorliegen, findest du sie hier zum Download."
- Fünf Glaskarten, je mit Dokument-Icon, Titel und Status-Badge
  „In Vorbereitung": **Vereinsstatuten**, **Beitrittserklärung**,
  **Beitragsordnung**, **Spesenreglement**, **Haus- und Platzordnung**.
- Karten sind im Platzhalter-Zustand nicht klickbar (kein `href`, gedimmte
  Optik). Sobald ein echtes PDF existiert, wird die Karte manuell auf einen
  echten Link (`assets/documents/<name>.pdf`, `target="_blank"`) umgestellt
  und das Badge entfernt — dafür wird kein dynamischer Erkennungsmechanismus
  gebaut (siehe Non-Goals).
- `assets/documents/` wird als leerer Ordner mit einer kurzen `README.md`
  angelegt („Hier werden die künftigen PDF-Dokumente abgelegt: ..."), damit
  der spätere Ablageort schon feststeht (kein `.gitkeep` nötig, da das
  Projekt zum Zeitpunkt dieser Spec noch kein Git-Repository war).

## Ordnerstruktur

```
new-swan-design/
├── index.html
├── css/
│   ├── base.css            Reset, Farb-/Typografie-Tokens, Aurora-Blobs
│   ├── components.css      Glaskarten, Buttons, Nav/Tab-Bar, Badges, Accordion, Modals
│   └── pages/
│       ├── home.css
│       ├── team.css
│       ├── kontakt.css
│       ├── verein.css
│       ├── rechtliches.css
│       └── blog.css
├── js/
│   ├── main.js              Nav-Active-State, Scroll-Spy, FAQ-Accordion, Kontakt-Modals, Tab-Bar
│   ├── blog-data.js         BLOG_POSTS (Inhalt aus home übernommen)
│   └── blog.js              renderBlogGrid, renderBlogPost, Kategorie-Filter
├── assets/
│   ├── images/              Kopie aus home/images (inkl. blogs/-Unterordner)
│   ├── icons/                Kopie aus home/images/icons + 2 neue (home.svg, document.svg)
│   ├── favicon/               Kopie aus home/favicon
│   └── documents/             leer, Platzhalter für künftige PDFs
├── pages/
│   ├── team.html
│   ├── kontakt.html
│   ├── verein.html
│   ├── rechtliches.html
│   └── blog/
│       ├── blog.html
│       └── post.html
└── docs/superpowers/specs/   (dieses Dokument)
```

## Testing / Verifikation

Da kein Backend und kein Build existiert, erfolgt die Verifikation manuell
über die Browser-Vorschau:

- Mobile-Breite (375px): Bottom-Tab-Bar, gestapeltes Layout, Glaskarten,
  FAQ-Accordion, Blog-Filter, Kontaktformular, Verein-Platzhalterkarten.
- Desktop-Breite (≥1280px): Top-Glass-Navbar, mehrspaltige Grids.
- Navigation zwischen allen 7 Seitentypen inkl. mindestens 2 verschiedenen
  Blog-Posts über `?id=`.
- Ungültige Blog-ID (`?id=999`) zeigt die Nicht-gefunden-Meldung statt eines
  Fehlers.
- Keine 404s auf Bild-/Icon-Pfaden nach dem Kopieren der Assets.
