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
  `--aurora-coral`, `--aurora-red`, `--aurora-violet`, `--aurora-blue`,
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
  `home`s Original-Rot/Logo-Farbe). Das gilt nur für interaktive/hervorgehobene
  Elemente — die Hintergrund-Blobs (siehe unten) dürfen andere Farben tragen.
- **Aurora-Blobs:** drei `position: fixed`, stark geblurrte, langsam
  animierte Farbflächen hinter dem Content — `.aurora-blob.coral` (Koralle,
  oben links), `.aurora-blob.blue` (kräftiges Blau, `#2563eb`, rechts, die
  grösste/präsenteste), `.aurora-blob.violet` (Violett, `#8b7cf6`, unten
  links, kleiner). Ein zwischenzeitlicher Amber-Ton in genau dieser Position
  wurde auf ausdrücklichen Wunsch wieder entfernt ("hässliches Sandfarben")
  — kein `--aurora-amber` mehr im Projekt. Auf Desktop (≥768px) deutlich
  größer (eigener `@media`-Block in `base.css`) für mehr Präsenz auf breiten
  Screens. Scheinen durch die halbtransparenten Glaskarten hindurch.
  Animation deaktiviert unter `prefers-reduced-motion: reduce`.
- **Typografie: gleiche Fonts wie `home`** (`assets/fonts/`, per `@font-face`
  in `base.css`) — Libre Baskerville als universelle Basis-Schrift
  (`body { font-family: 'Libre Baskerville', serif; }`, erbt auf alles),
  Inter zusätzlich per `@font-face` verfügbar (aktuell nirgends explizit
  zugewiesen, kann bei Bedarf für einzelne UI-Elemente genutzt werden). Auf
  ausdrücklichen Wunsch von `home` übernommen statt eines System-Font-Stacks.
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
9. **Hero-Sektion: `100vh` überschätzt die sichtbare Höhe im mobilen
   Browser.** Mobile Safari/Chrome berechnen `100vh` anhand der maximal
   möglichen Höhe (als wäre die Adressleiste ausgeblendet), nicht der gerade
   sichtbaren — auf echten Handys dadurch spürbar mehr erzwungene Höhe als
   tatsächlich sichtbar ist. Behoben mit einem `100dvh`-Wert (dynamische
   Viewport-Höhe), der die echte sichtbare Höhe trifft — als zweite
   Deklaration nach der `vh`-Variante notiert (Fallback für ältere Browser,
   `dvh` gewinnt wo unterstützt). Zusätzlich zieht `.hero`s `min-height` jetzt
   auch `var(--tabbar-height)` ab (nicht nur `--nav-height`) — sonst
   überlappt der letzte Hero-CTA-Button auf kurzen Viewports mit der
   `position: fixed`-Tab-Bar am unteren Rand, da die Sektion sich sonst bis
   ganz an den Viewport-Rand ausdehnt, genau dorthin, wo die Tab-Bar sitzt.
   Die vier Hero-CTA-Buttons stehen mobil ausserdem in einem 2-spaltigen
   Grid statt einer einzelnen Spalte (`--hero-ctas`, halbiert die Höhe dieses
   Blocks) — auf Desktop (≥768px) wieder eine normale, umbrechende
   Flex-Reihe. Bei sehr kurzen Viewports (\<~680px sichtbare Höhe, z. B.
   ältere/kleinere Phones mit viel Browser-Chrome) kann der letzte Button
   dennoch knapp unter der Tab-Bar liegen — dort hilft nur noch, ihn per
   Scrollen freizulegen; das gilt als akzeptabler Rand-Fall, kein Bug.
10. **Person-Karten-Styles gehören in `components.css`, nicht in
    `team.css`.** `.person-card`/`.person-img`/`.person-role`/`.person-links`
    werden sowohl auf `pages/team.html` als auch für die
    Ansprechperson-Karte auf `pages/kontakt.html` verwendet — lagen aber
    ursprünglich nur in `team.css`, das `kontakt.html` gar nicht einbindet.
    Ergebnis: Auf der Kontakt-Seite blieb das Foto komplett ungestyled (kein
    Kreis, volle Bildgrösse). Die Regeln liegen jetzt in `components.css`
    (echt geteilte Komponente), `team.css` enthält nur noch das
    Grid-Layout (`.people-grid`). Bei neuen, seitenübergreifend genutzten
    Klassen immer zuerst prüfen, ob wirklich nur eine Page-CSS sie lädt.
11. **`.person-img` ist 140px als Basisgrösse** (nicht 104px) — auf einer
    einspaltigen, vollbreiten Karte (Kontakt-Ansprechperson, Team mobil)
    wirkte ein kleineres Foto neben viel Leerraum unproportioniert. Sobald
    `.people-grid` mehrspaltig wird (`min-width: 640px`, Team-Seite bleibt
    ab da durchgehend 2-spaltig statt weiter auf 4 zu wachsen — 4 enge
    Spalten liessen die Bio-Texte unleserlich schmal umbrechen), verkleinert
    `team.css` das Foto gezielt auf 110px (`.people-grid .person-img`).
12. **`.legal-card a { text-decoration: underline }` traf versehentlich auch
    den "Zur Startseite"-Button**, weil der Button-Link als `<a>` ebenfalls
    Nachfahre von `.legal-card` ist und die Descendant-Selektor-Regel
    spezifischer ist als `.btn`s `text-decoration: none`. Behoben mit
    `.legal-card a:not(.btn)` — bei neuen `.legal-card`-weiten
    Link-Stilen künftig gleich mitbedenken.
13. **Team-Seite: Icon-Buttons stehen in einem eigenen, schmalen
    Glass-Panel neben der Personen-Karte**, nicht mehr in der Karte selbst.
    Markup pro Person: `.person-unit` (flex row, `align-items: stretch`)
    umschliesst `.glass-card.person-card` (flex: 1, Foto/Name/Bio) und
    `.person-links.person-links-panel` (74px breit, Icons vertikal
    zentriert, eigene Glasscheibe) als Geschwister. `.people-grid` enthält
    jetzt `.person-unit`-Elemente statt `.person-card` direkt. Die
    Icon-Buttons selbst (`.person-links a`) sind dabei auch von 38px auf
    46px vergrössert worden — das betrifft daher auch die einzelne
    E-Mail-Icon auf der Kontakt-Seite (nutzt weiterhin die alte
    In-Card-Anordnung `.person-links` ohne `-panel`, nur die Button-Grösse
    hat sich für beide gemeinsam geändert). Im Panel stehen die Icons
    bewusst oben (`justify-content: flex-start`, nicht zentriert) mit
    Freiraum am unteren Rand für künftige weitere Icons; wichtig war dabei
    zusätzlich ein explizites `align-items: center`, weil Flex-Items mit
    fester `width` bei `align-items: normal/stretch` sonst am Anfang der
    Kreuzachse kleben bleiben statt zu zentrieren (sichtbar als ungleicher
    Abstand links/rechts).
14. **`.btn.copied`** liefert einen deutlichen Erfolgs-Zustand für den
    "Kopieren"-Button in den Telefon-/E-Mail-Modals — `copyToClipboard()` in
    `js/main.js` setzt/entfernt die Klasse zusammen mit dem
    "Kopiert!"-Text. `.btn` hat dafür eine `transition` auf
    `background-color`/`border-color`/`color` bekommen. Erster Versuch war
    ein weisser Hintergrund — fiel im Light Mode nicht auf, weil
    `--glass-fill` dort schon fast weiss ist (heller, durchsichtiger
    Standard-Hintergrund der Secondary-Buttons). Jetzt ein festes,
    themenunabhängiges Grün (`#16a34a`, klassische Erfolgsfarbe), das sich
    in beiden Modi klar vom Standard-Button abhebt.
15. **Der lokale PowerShell-Testserver cachte Assets im Browser**, weil er
    keine `Cache-Control`-Header sendete — nach einer CSS-Änderung zeigte
    der Browser gelegentlich noch die alte Version, obwohl der Server
    bereits die neue auslieferte (per `curl` gegen den Server verifizierbar,
    per Browser-Check nicht). Der Server sendet jetzt
    `Cache-Control: no-store, no-cache, must-revalidate` auf jede Antwort.
    Bei unerklärlichem CSS-Verhalten beim Testen: harten Reload erzwingen
    oder direkt den Server-Response statt den Browser-Cache prüfen.

## Code-Stil

- 4-Leerzeichen-Einrückung durchgängig in HTML/CSS/JS.
- Kebab-Case für CSS-Klassen, camelCase für JS-Bezeichner, deutsche Texte/
  Kommentare wie im Rest des Projekts (`home`).
- Neue Icons: als `.icon-{name}`-Mask-Regel in `components.css` ergänzen (siehe
  „Icon-System" oben), nicht als `<img>` mit hartkodierter Farbe einbinden.
- Neue Farben: als CSS-Variable in `css/base.css` (`:root`) ergänzen, dort auch
  gleich den Dark-Mode-Wert mitpflegen.
