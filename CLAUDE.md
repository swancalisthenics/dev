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
│       ├── home.css, kontakt.css, verein.css, rechtliches.css, blog.css
│       (Team- und Mitglieder-Grid-Layout liegt in components.css, siehe unten)
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
    ├── mitglieder.html, mein-profil.html   Mitgliederbereich-Seiten, noch mit
    │                                       Platzhalter-Daten (siehe unten)
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
- **Navigation, bewusst identisch auf Mobile und Desktop:** dieselben 5 Ziele
  überall (Home/Blog/Team/Verein/Kontakt) — unter 768px als schwebende
  Glass-Tab-Bar unten (Topbar zeigt dort nur Logo + Theme-Toggle), ab 768px
  als klassische horizontale Topbar. Ursprünglich hatte die Desktop-Topbar
  zusätzlich eigene Anker-Links zu den Startseiten-Sektionen (Über uns/
  Zeiten/Standort) samt Scroll-Spy-Logik in `main.js` — auf ausdrücklichen
  Wunsch entfernt, damit Desktop- und Mobile-Nav gleich aussehen. Diese
  Sektionen bleiben über normales Scrollen der Startseite erreichbar, nur
  ohne eigenen Nav-Link. Aktiver Zustand läuft über `body[data-page]` +
  `.nav-link[data-page]` (nicht über Href-Parsing, siehe unten) — dafür gibt
  es kein Scroll-Spy mehr, seit die Anker-Links weg sind.

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
4. **Community-Slider zeigt echte Fotos** (`assets/images/community/`,
   benannt nach Aufnahmedatum als `Gruppenbild_D.M.YYYY_gross.jpg` /
   `_klein.jpg`, ursprünglich 1920px/900px breit wie beim bestehenden
   Blog-Bilder-Muster). Vorher
   zeigten alle 9 Slides zum Test dasselbe Platzhalterbild mit frei
   erfundenen Datums-Bildunterschriften — das ist jetzt durch 7 echte
   Gruppenfotos vom Street-Workout-Platz ersetzt. Die Original-Dateien
   hatten keine EXIF-Aufnahmedaten mehr (auf roher Tag-Ebene geprüft, nicht
   nur die vereinfachte Windows-Ansicht — nur noch 9 rein technische
   Metadaten-Einträge wie Ausrichtung/Auflösung, kein Datum/Kamera/GPS mehr
   vorhanden, vermutlich beim Teilen/Hochladen entfernt), die
   Bildunterschriften wurden deshalb nachträglich von Hand mit den echten
   Daten ergänzt statt automatisch ausgelesen. Die 8 Fotos sind chronologisch
   sortiert, aber bewusst **links neu, rechts alt** (nicht wie sonst auf der
   Seite links-nach-rechts-aufsteigend). Beim ersten Abgleich fiel auf, dass
   die Termine sonst durchgehend wöchentlich sonntags stattfanden, aber ein
   Foto für den 12. Juli 2026 fehlte — dafür stand kurz eine Platzhalter-Slide
   (`.slide-placeholder` in `home.css`, zeigt nur ein Icon statt eines
   Fotos), bis das echte Foto nachgeliefert wurde. `.slide-placeholder`
   bleibt als CSS für einen künftigen ähnlichen Fall im Code, wird aktuell
   aber nirgends mehr verwendet. `Gruppenbild_12.7.2026_gross/_klein.jpg`
   hat eine deutlich geringere Ausgangsauflösung (1206×798) als die anderen
   7 Fotos (2560×1706) — bewusst **nicht** auf 1920px hochskaliert (hätte
   nur unscharf vergrössert, keine echte Detailschärfe gebracht), die
   Resize-Funktion behält die Originalbreite, wenn sie unter dem Zielwert
   liegt. Jedes `<img
   class="slide-img">` trägt `src` (kleine Vorschau) und `data-large` (für
   die Lightbox) getrennt, damit die Vorschau immer klein bleibt und nur
   beim Aufklappen die grosse Version nachgeladen wird — anders als
   `resolvePictureSources()`, das nach Bildschirmbreite umschaltet, nicht
   nach Anzeigekontext. Die Übersichtsleiste selbst (`.slider-track`) läuft
   mobil nativ per Touch-Wisch; am PC (`isDesktopViewport()`) gibt es
   Klick-und-Ziehen (`cursor: grab`/`grabbing`, `.dragging`-Klasse). Ein
   Mausrad-Scroll-Handler wurde zwischenzeitlich stattdessen ausprobiert
   und wieder entfernt, dann Klick-und-Ziehen erneut eingebaut — der Grund,
   warum sich ein noch früherer Klick-und-Ziehen-Versuch mal falsch
   angefühlt hatte, war wahrscheinlich fehlendes Deaktivieren des
   CSS-Scroll-Snappings während des Ziehens (das gleiche Problem, das beim
   Mausrad-Zoom in der Lightbox auftrat, siehe unten). Statt Snap nur
   während des Ziehens zu deaktivieren und danach wieder zu aktivieren,
   ist Scroll-Snap am PC inzwischen **komplett aus** (`.slider-track` in
   `home.css`, `@media (min-width: 768px)`) — ein kurzes Wieder-Aktivieren
   nach dem Loslassen liess die Ansicht sonst zur naechsten Slide-Kante
   zurueckspringen ("links an der Wand anbinden"), was nicht gewollt war;
   jetzt bleibt die Scroll-Position exakt dort, wo man loslaesst. Mobil
   bleibt Snap aktiv (`x mandatory`, unveraendert) - dort gibt es dieses
   Problem nicht, weil der Browser Touch-Scrollen und Snap nativ und
   koordiniert selbst uebernimmt, ohne dass eigenes JS dazwischenfunkt (wie
   es die programmatischen `scrollLeft`-Schreibvorgaenge beim
   PC-Ziehen taten). Ein `sliderDidDrag`-Flag
   unterdrückt dabei den Klick am Ende eines Ziehens, damit das nicht
   versehentlich die Lightbox öffnet. Selbst damit fühlte sich das Ziehen
   noch ruckelig an — recherchiert und behoben: `scrollLeft` wurde direkt im
   `mousemove`-Handler gesetzt, der aber öfter feuern kann als das Bild
   neu gezeichnet wird (v. a. bei Maeusen mit hoher Abtastrate), zusammen
   mit den teuren `backdrop-filter`-Blur-Effekten der Glaskarten ergab das
   Ruckeln. Jetzt speichert `mousemove` nur noch die letzte Mausposition,
   ein per `requestAnimationFrame` laufender Tick (`sliderDragTick()`)
   wendet daraus höchstens einmal pro Bild den neuen Scroll-Wert an — das
   allgemein empfohlene Muster fürs ruckelfreie Drag-Scrolling. Ausserdem
   fehlte `e.preventDefault()` im `mousedown`-Handler: Ohne das startet der
   Browser bei einem Mousedown auf einem `<img>` (das Slide-Bild füllt
   praktisch die ganze Karte aus) seine eigene native Bild-Drag-Geste, die
   sich unabhängig vom eigenen JS verhält — fühlte sich an, als bliebe ein
   Geisterbild dauerhaft am Mauszeiger "kleben", auch nach dem Loslassen.
   Jedes Slide-Bild (`.slide-img`) öffnet per Klick/Tap/Enter eine
   grosse Lightbox-Ansicht (`#image-lightbox` in `index.html`,
   `openLightbox()`/`closeLightbox()` in `js/main.js`) — schliessbar per
   Klick ausserhalb, X-Button oder Escape-Taste. **Nur am PC** (`isDesktopViewport()`
   in `js/main.js`, Breakpoint 768px wie überall sonst): Mausrad zoomt
   das Bild (1×–4×), bei Zoom > 1 kann man per Klick-und-Ziehen verschieben
   (`.lightbox-img-wrap` mit `overflow: hidden` clippt dabei den
   sichtbaren Ausschnitt), zwei Pfeil-Buttons plus Pfeiltasten links/rechts
   springen zum vorigen/nächsten Bild aus der `.slide-img`-Liste (versteckt
   sich am jeweiligen Rand, wenn es kein weiteres Bild in die Richtung
   gibt). **Mobil dieselbe Funktionalität, per Touch statt Maus/Tastatur**
   (eigene `touchstart`/`touchmove`/`touchend`-Handler auf `#lightbox-img`,
   ebenfalls in `js/main.js`, per `isDesktopViewport()` von der
   PC-Variante getrennt): 2 Finger zoomen per Pinch (Abstand zwischen den
   Fingern von `touchstart` zu `touchmove` bestimmt den Zoomfaktor), 1
   Finger verschiebt den Ausschnitt, sobald gezoomt ist, sonst wechselt ein
   Wisch (>50px, per `touchend` gegen den `touchstart`-Punkt gemessen) zum
   vorigen/nächsten Bild — genau wie bei den meisten Foto-Apps: Wisch
   wechselt das Bild nur bei Zoomstufe 1, darüber verschiebt derselbe
   Finger stattdessen den Ausschnitt. `touch-action: none` auf dem
   Lightbox-Bild verhindert dabei, dass der Browser dieselbe Geste noch
   zusätzlich als eigenen Seiten-Zoom/-Scroll interpretiert. Zoom/
   Verschiebung setzen sich beim Wechsel auf ein anderes Bild automatisch
   zurück, auf beiden Eingabewegen. Solange ein
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
9. **Hero-Sektion: mobil kein `min-height` mehr, Höhe ergibt sich rein aus
   dem Inhalt.** Frühere Versuche erzwangen eine `min-height` von fast der
   ganzen Viewport-Höhe (erst `100vh`, dann `100dvh` als Fix für mobile
   Browser, die `100vh` anhand der maximal möglichen Höhe berechnen statt
   der gerade sichtbaren wegen der ein-/ausblendbaren Adressleiste). Nachdem
   der Hero-Inhalt zwischenzeitlich verkleinert wurde (kleinere Überschrift,
   CTAs testweise in einem 2-spaltigen Grid statt einer Spalte, weniger
   Padding), war die erzwungene `min-height` auf normal grossen Screens
   deutlich grösser als der Inhalt brauchte — durch `justify-content:
   center` verteilte sich der Rest als grosser, unmotivierter Leerraum
   ober- und unterhalb von Logo/Text/Buttons. Jetzt hat `.hero` mobil gar
   keine `min-height` mehr; die Sektion ist genau so hoch wie ihr Inhalt,
   die "Über uns"-Sektion folgt direkt danach. Auf Desktop (≥768px) bleibt
   weiterhin `min-height: 90vh`/`90dvh` für den klassischen
   Vollbild-Hero-Effekt (dort nicht beanstandet). Die vier CTA-Buttons
   stehen mobil wieder klassisch untereinander (eine Spalte) statt im
   2-spaltigen Grid — ohne erzwungene `min-height` besteht kein Platzdruck
   mehr dafür, eine gestapelte Spalte wurde als aufgeräumter empfunden. Auf
   sehr kurzen Viewports (\<~700px sichtbare Höhe) kann der letzte Button
   dadurch unterhalb des ersten Bildschirms liegen und erst nach kurzem
   Scrollen sichtbar werden — das ist normales Scroll-Verhalten (keine
   Überlappung mit der Tab-Bar), kein Bug wie beim vorherigen
   `min-height`-Ansatz.
10. **Person-Karten-Styles gehören in `components.css`, nicht in einer
    Page-CSS.** `.person-card`/`.person-img`/`.person-role`/`.person-links`
    werden sowohl auf `pages/team.html` als auch für die
    Ansprechperson-Karte auf `pages/kontakt.html` verwendet — lagen aber
    ursprünglich nur in `team.css`, das `kontakt.html` gar nicht einbindet.
    Ergebnis: Auf der Kontakt-Seite blieb das Foto komplett ungestyled (kein
    Kreis, volle Bildgrösse). Die Regeln liegen jetzt in `components.css`
    (echt geteilte Komponente). Als später auch `pages/mitglieder.html` das
    gleiche Karten-Raster brauchte, wurde aus demselben Grund auch noch der
    Rest von `team.css` (`.people-grid`, `.person-unit`, `.person-links-panel`)
    nach `components.css` verschoben und die inzwischen leere `team.css`
    gelöscht — bei neuen, seitenübergreifend genutzten Klassen immer zuerst
    prüfen, ob wirklich nur eine Page-CSS sie lädt.
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
16. **Blog-Kategorie-Badge lag ursprünglich über dem Foto** (Karten-Thumbnail
    in `blog.html`, Hero-Header in `post.html`) und war dort kaum lesbar —
    `home`s Original legt den Tag nie über ein Bild. Statt nur den Kontrast
    zu verbessern, wurde der Badge strukturell verschoben:
    - Blog-Übersicht: Badge ist jetzt erstes Kind von `.blog-card-body` (vor
      dem Titel), nicht mehr absolut positioniert über `.blog-card-media`.
      Braucht `align-self: flex-start`, sonst würde der Flex-Column-Container
      ihn auf volle Kartenbreite strecken statt auf Inhaltsbreite zu belassen.
    - Einzelner Post: Badge sitzt jetzt zusammen mit dem "Zurück"-Link in
      einem neuen `.post-section-top`-Wrapper (`flex-direction: column`,
      `align-items: flex-start`) am Anfang von `.post-section`, unterhalb des
      Hero-Fotos — nicht mehr in `.post-header-overlay`, die über dem Foto
      liegt.
    - Dabei aufgefallen: `.badge-category` nutzte (anders als `.badge-pending`)
      noch fest codierte Farben statt Tokens. Fiel nicht auf, solange der Tag
      immer über einem Foto lag, ergab aber nur rund 2.8:1 Kontrast im Dark
      Mode auf normalem Seitenhintergrund — unter dem Minimum. Nach demselben
      Muster wie `.badge-pending` auf `--badge-category-bg`/`-text` umgestellt
      (Dark-Mode-Wert deutlich heller: `#ffb3b3` statt `#c23e3e`), Light Mode
      unverändert.

17. **`<meta name="theme-color">` ergänzt, hell und dunkel.** Beim Overscroll-
    Bounce am oberen Bildschirmrand (mobile Safari/Chrome) zeigt der Browser
    kurz eine Fläche in genau dieser Farbe — ohne das Tag war das ein
    Standard-Schwarz, das gegen den hellen Aurora-Hintergrund wie ein
    Grafikfehler wirkte. Zwei `<meta name="theme-color">`-Tags pro Seite
    (`data-scheme="light"`/`"dark"`, Werte identisch zu `--bg-base`:
    `#f6f5fb`/`#15141f`), je mit eigener `prefers-color-scheme`-Media-Query —
    deckt den Fall "keine explizite Wahl" komplett ohne JS ab, folgt live der
    Systemeinstellung. Bei explizitem Theme (Toggle-Klick oder gespeicherte
    Wahl in `localStorage`) reicht eine Media-Query allein nicht, da sie nur
    auf die Systemeinstellung reagiert, nicht auf die eigene Overrde-Logik der
    Seite — deshalb setzt sowohl das Inline-Head-Skript (beim Laden) als auch
    `syncThemeColorMeta()` in `main.js` (beim Toggle-Klick) die `media`
    des jeweils passenden Tags hart auf `all` und die des anderen auf
    `not all`, statt sich auf Browser-Priorität zwischen zwei gleichzeitig
    zutreffenden `theme-color`-Tags zu verlassen (uneinheitlich zwischen
    Browsern). Gleiche Duplizierung des Inline-Skripts wie beim bestehenden
    `data-theme`-FOUC-Fix — bei neuen Seiten immer beide Stellen (Meta-Tags +
    erweitertes Inline-Skript) mit übernehmen.
18. **Profil-Icon + Login-Modal ergänzt (erster Teil des Mitgliederbereichs,
    siehe Plan unten).** `.profile-toggle` (Person-Icon, 40px Glaskreis,
    optisch identisch zu `.theme-toggle`) steht in jeder Topbar ganz rechts,
    direkt nach dem Dark/Light-Toggle im DOM — dadurch automatisch rechts
    davon in der Flex-Row, kein zusätzliches CSS für die Reihenfolge nötig.
    Klick öffnet `#login-modal` (E-Mail/Passwort, gleiches `.modal-overlay`/
    `.field`-Muster wie die bestehenden Telefon-/E-Mail-Modals auf
    `kontakt.html`/`team.html`). Bewusst **kein** Dropdown-Menü an dieser
    Stelle: Ein Dropdown mit "Mitglieder"/"Mein Profil"/"Abmelden" ergibt
    erst Sinn, sobald es einen eingeloggten Zustand gibt — ohne echten
    Supabase-Login (noch nicht eingerichtet, siehe Plan unten) gäbe es
    nichts Echtes anzuzeigen. Das Formular sendet nirgendwohin; `handleLoginSubmit()`
    in `main.js` zeigt stattdessen einen Hinweistext ("Anmeldung ist noch
    nicht aktiv..."), damit der Button nicht wie kaputt wirkt oder still
    nichts tut. Sobald die Supabase-Anbindung steht, wird aus dem
    Login-Symbol/-Modal bei eingeloggten Nutzern das eigene Profilbild samt
    Dropdown (Plan-Schritt 5).
    Eigener `--modal-fill`-Token statt `--glass-fill-strong` fürs Login-Modal
    (und alle anderen `.modal-content`-Dialoge): Im Dark Mode war
    `--glass-fill-strong` (nur 0.14 Deckkraft) für ein Modal zu durchsichtig —
    der Hintergrund blieb trotz Blur deutlich sichtbar. Für Topbar/Tabbar/
    Custom-Select ist genau diese Durchsichtigkeit aber gewollt (man soll
    Content dahinter durchscheinen sehen), deshalb kein globaler Wert-Wechsel,
    sondern ein neuer, nur für Modals genutzter Token — im Dark Mode ein
    fast deckendes dunkles Grau (`rgba(30, 29, 43, 0.95)`) statt des
    weiss-getönten Glases, im Light Mode unverändert (`rgba(255, 255, 255, 0.78)`,
    sah schon vorher gut aus).
19. **Community-Slider-Scrollbar zeigte unter Windows/Chrome nur kleine
    Pfeil-Buttons, keinen sichtbaren Balken.** `.slider-track` stylt den
    Scrollbar-Thumb per `::-webkit-scrollbar-thumb` rot ein, hatte aber nie
    `::-webkit-scrollbar-track` (Hintergrund/Rille) oder
    `::-webkit-scrollbar-button` (die kleinen Pfeile an den Enden) gesetzt.
    Chrome/Edge unter Windows rendert unstyled Scrollbar-Buttons trotzdem als
    eigene kleine Pfeil-Elemente, wodurch nur die Pfeile auffielen und der
    rote Thumb dagegen unterging. Fix: sichtbarer Track-Hintergrund
    (`var(--glass-border)`) ergänzt und die Buttons explizit
    `display: none` gesetzt.
20. **Zwei CSS-Fallstricke im Mitglied-Modal gefunden:**
    - `.icon` (components.css) setzt bewusst keine eigene `width`/`height`
      (jeder Kontext bestimmt seine Grösse selbst, siehe `.person-links .icon`
      als Vorbild) — in `#mitgliedModalLinks` fehlte diese Kontext-Regel,
      wodurch die Icons unsichtbar blieben (0×0 ohne Grösse, obwohl
      Maske/Farbe korrekt gesetzt waren). Fix: `.mitglieder-links .icon`
      in `css/pages/mitglieder.css` ergänzt.
    - `element.hidden = true` wirkte bei `#mitgliedModalSelfLink` nicht,
      weil `.self-profile-link { display: inline-block }` die native
      `[hidden] { display: none }`-Regel des Browsers überschreibt (eine
      Autor-Regel mit `display` gewinnt gegen die Attribut-Regel der
      User-Agent-Stylesheet). Der Link blieb dadurch für alle Mitglieder
      sichtbar, nicht nur für die eigene Karte. Fix: `.self-profile-link[hidden]
      { display: none; }` ergänzt. Gleiches Muster bei künftigen
      `hidden`-Elementen im Kopf behalten, sobald die Klasse selbst schon
      einen `display`-Wert setzt.
21. **Community-Fotos nach Aufnahmedatum umbenannt:** `community-1.jpg` …
    `community-8.jpg` (+ `-small.jpg`) hiessen nur nach Upload-Reihenfolge,
    nicht nach Datum. Jetzt `Gruppenbild_D.M.YYYY_gross.jpg` /
    `_klein.jpg` (Tag.Monat.Jahr ohne führende Null, z. B.
    `Gruppenbild_5.7.2026_gross.jpg`), per `git mv` umbenannt (Git sieht es
    als Rename, nicht Löschen+Neu) und alle 8 `src`/`data-large`-Referenzen
    in `index.html` angepasst.
22. **Blog-Daten-Unstimmigkeiten bereinigt** (in `js/blog-data.js`, beim
    Review aller Posts aufgefallen): Bei Post 3 wichen sowohl `cardDate`
    (8. Juli) als auch `date` (12. Juni) vom Datum ab, das im eingebundenen
    Foto selbst steht (`5.7.2026-klein.JPG`) — beide jetzt auf 5. Juli
    vereinheitlicht. Bei Post 5/6/7/8 zeigte die Karte `12. Juni 2026`,
    die Post-Seite selbst aber `08. Juli 2026` (vermutlich ein
    Copy-Paste-Rest von Post 1 beim Anlegen) — `cardDate` jeweils auf den
    Post-Seiten-Wert angeglichen. Post 8 (Handstand-Guide) hatte als
    `heroImage`/`heroImageSmall` fälschlich `park.jpg` statt des
    handstand-passenden Bildes, das die Karte (`cardImage`) bereits
    korrekt zeigte — beide Felder auf `handstand3.jpeg`/`-small.jpeg`
    korrigiert. Ausserdem zeigte `cardCategory` bei fast jedem Post nur
    eine von zwei groben Sammelkategorien ("Übungen & Kraftaufbau" /
    "Ernährung & Gesundheit"), während die Post-Seite selbst
    (`category`) eine deutlich spezifischere, andere Bezeichnung zeigte
    (z. B. "Skills & Technik", "Mindset & Motivation") — das Filtern der
    Übersicht läuft über das separate Feld `filterCategory`
    ('uebungen'/'ernaehrung', siehe `js/blog.js`), `cardCategory` ist rein
    Anzeigetext, daher unbedenklich bei 11 Posts (id 5–15) auf den
    spezifischeren Text der Post-Seite angeglichen. Bewusst nicht
    angefasst: `level.1.jpg`, `park.jpg` und `motivation.jpeg` nutzen für
    Karte und Post-Seite dieselbe Datei ohne echte `-small`-Variante
    (anders als beim Rest der Bilder) — bei 400×243 / 640×853 / 600×390px
    Ausgangsgrösse ist der Nutzen einer eigenen kleinen Variante aber so
    gering, dass sich der Zusatzaufwand aktuell nicht lohnt.

23. **Live-Countdown "Nächstes Training" in der Zeiten-Sektion ergänzt**
    (`#training-countdown` in `index.html`, Styles in `home.css`, Logik am
    Ende von `main.js`). Rein clientseitig berechnet, kein Fetch/Backend
    nötig: `getNextTrainingWindow()` findet die kommende Sonntag-18-Uhr-
    Zielzeit anhand der lokalen Browser-Uhrzeit (bewusst nicht hart auf
    Europa/Zürich fixiert — für praktisch alle echten Besucher ohnehin
    identisch, spart manuelles DST-Handling). Drei Zustände pro Sekunde
    per `setInterval` neu berechnet: normalerweise ein Tage/Std/Min/Sek-
    Countdown; während des laufenden Trainings (Sonntag 18:00–20:00) blendet
    sich stattdessen "Training läuft gerade 🔥" ein (auf ausdrücklichen
    Wunsch — ohne diesen Zustand hätte der Countdown während der laufenden
    Session unmotiviert auf die nächste Woche weitergezählt); ist das
    heutige Fenster vorbei, springt die Zielzeit automatisch eine Woche
    weiter. Bewusst **kein** `aria-live` auf den tickenden Zahlen, um
    Screenreadern nicht jede Sekunde eine Ansage aufzuzwingen — die
    statische "18:00 – 20:00"-Zeile bleibt ohnehin als verlässliche
    Kern-Info stehen.
24. **Countdown-Layout mehrfach nachjustiert, dabei ein echter Overflow-Bug
    gefunden und behoben.** Stand ursprünglich (Punkt 23) noch innerhalb der
    `.time-card`-Glaskarte; auf Wunsch jetzt ein eigenständiges Element
    direkt in der Sektion, nicht mehr verschachtelt. Breite: mobil so breit
    wie `.time-card` darunter, am PC so breit wie der Community-Foto-Slider
    darüber (`.training-countdown` übernimmt dafür `.section`s
    `max-width: var(--max-width)` statt einer eigenen Grenze). Schrift auf
    **Inter** umgestellt (statt der Fliesstext-Serife Libre Baskerville) plus
    `font-variant-numeric: tabular-nums` — verhindert, dass die Ziffern beim
    Hochzählen jede Sekunde minimal in der Breite springen (dafür reicht
    `tabular-nums` allein nicht immer, siehe Recherche-Quellen unten; Inter
    unterstützt das Feature zuverlässig, im Gegensatz zu Libre Baskerville
    ungeprüft). Zwischen den vier Einheiten steht jetzt ein
    `.countdown-separator`-Doppelpunkt (`:`), mit `align-self: flex-start`
    auf Zahlenhöhe ausgerichtet statt auf Höhe der kleinen Tage/Std/Min/Sek-
    Labels, und `aria-hidden="true"` (rein dekorativ, für Screenreader
    bedeutungslos ohne Kontext). Die Tage-Zahl ist jetzt ebenfalls
    zweistellig (`padStart(2, '0')`), damit sie nicht schmaler ist als die
    anderen drei und beim Sprung unter 10 Tage nicht die Breite wechselt.
    **Bug dabei:** Nach dem Ergänzen der 3 Trennzeichen passte die Zeile auf
    Mobile nicht mehr in ihren Rahmen (`.countdown-grid` brauchte ca. 488px,
    der Rahmen hatte nur ca. 335px) — `justify-content: space-between` kann
    das nicht ausgleichen (zieht nur auseinander, schiebt nie zusammen),
    wodurch die ganze Seite horizontal scrollbar und verschoben wurde. Fix:
    mobil kleinere Schrift (2.4rem statt 3.75rem) und deutlich kleinere
    Abstände (`gap: 4px` statt 20px), dazu zurück auf `justify-content:
    center` (die Doppelpunkte sorgen jetzt selbst für die visuelle
    Trennung) — bis 320px Bildschirmbreite ohne Überlauf geprüft. Am PC
    bewusst ebenfalls **zentriert statt auseinandergezogen**: Bei nur 4
    kurzen Zahlengruppen über die volle Breite des Sliders (bis zu 1200px)
    hätte `space-between` riesige, leer wirkende Lücken erzeugt statt
    gleichmässiger Grosszügigkeit.
25. **"Passwort festlegen"-Modal ergänzt** (`#set-password-modal` in
    `index.html`, `openSetPasswordModal()`/`closeSetPasswordModal()`/
    `handleSetPasswordSubmit()` in `main.js`) — nötig, weil Supabase nach
    einem Einladungs- oder Passwort-Recovery-Link niemanden automatisch zu
    einer "Passwort setzen"-Ansicht schickt, das muss die App selbst
    anbieten. `supabase-js` erkennt das Auth-Token in der Recovery-URL
    automatisch (`detectSessionInUrl`, Standardverhalten) und feuert danach
    ein `PASSWORD_RECOVERY`-Event über `onAuthStateChange` — genau darauf
    hört `main.js` global und öffnet dann das Modal. Bewusst **keine**
    Demo-Version diesmal (anders als Login/Profil weiter oben): Das echte
    Supabase-Projekt existiert inzwischen (siehe unten), das Formular ruft
    `supabaseClient.auth.updateUser({ password })` direkt echt auf. Client-
    seitiger Abgleich "stimmen neues Passwort und Bestätigung überein"
    getestet und funktioniert.
26. **Fehlermeldung für abgelaufene/ungültige Auth-Links ergänzt**
    (`#auth-error-modal` in `index.html`, `checkAuthUrlError()` in
    `main.js`) — beim Testen echt aufgetreten: Ein zu alter Recovery-Link
    hängt `#error=access_denied&error_code=otp_expired&...` an die URL,
    ohne dass dafür ein `onAuthStateChange`-Event feuert (es kommt ja keine
    Session zustande) — ohne diese Ergänzung landet man dabei stumm auf der
    normalen Startseite, ohne zu wissen, dass der Link ungültig war. Sucht
    beim Laden nach `error=` im URL-Hash, zeigt dann eine Meldung
    ("Vorstand kontaktieren" statt technischem Supabase-Fehlertext, da noch
    kein Self-Service-Reset existiert), räumt den Hash danach per
    `history.replaceState` auf. Fallstrick beim eigenen Testen: Zwei
    `navigate()`-Aufrufe auf dieselbe Seite, die sich nur im Hash
    unterscheiden, lösen im Testbrowser keinen echten Seiten-Reload aus
    (Same-Document-Navigation, Skripte laufen nicht neu) - für einen echten
    Test zuerst auf eine andere Seite und dann erst auf die Fehler-URL
    navigiert.
27. **Login-Formular auf die echte Supabase-Version umgestellt**
    (`handleLoginSubmit()` in `main.js`) — Demo-Version gelöscht, die
    vorbereitete echte Version (`signInWithPassword`) aktiviert. Getestet
    mit absichtlich falschem Passwort gegen das echte Projekt: kam korrekt
    "Login fehlgeschlagen: Invalid login credentials" von Supabase zurück
    (echter Server-Roundtrip, kein Mock). Test mit dem echten Passwort noch
    offen (E-Mail-Rate-Limit verhinderte gerade das Setzen eines Passworts
    für einen zweiten Testnutzer, siehe unten). Bewusst noch **nicht**
    angefasst: Das Profil-Icon zeigt nach erfolgreichem Login noch nicht das
    eigene Foto/Dropdown (Plan-Schritt 5, zweite Hälfte) — nur das Modal
    schliesst sich, kein sichtbares "eingeloggt"-Zeichen in der Topbar bis
    dahin.
28. **Mitgliederliste auf echte Daten umgestellt** (`js/mitglieder.js`) —
    Demo-Version + `js/mitglieder-data.js` gelöscht (Datei komplett entfernt,
    nirgends mehr referenziert), echte Version aktiviert: liest aus
    `public_profiles`, `isSelf` per Vergleich mit `supabaseClient.auth.getUser()`.
    Dabei aufgefallen und korrigiert: Der vorbereitete Code stammte noch von
    vor der `rolle` → `rollen`-Umstellung (Punkt in "Geplant"-Abschnitt oben)
    und ging von einer einzelnen Rolle pro Person aus. Rendering (Karten +
    Modal) und Filterleiste zeigen/filtern jetzt korrekt über alle Rollen
    einer Person (`m.rollen.map(...)`/`flatMap`/`.includes()` statt
    Gleichheitsvergleich mit einem einzelnen String). "Platzhalter-Daten"-
    Badge auf der Seite entfernt, da nicht mehr zutreffend.
29. **Profil-Icon zeigt bei Login den eigenen Anfangsbuchstaben + Dropdown**
    (Mitglieder/Mein Profil/Abmelden) statt nur des Login-Symbols — der
    bisher fehlende zweite Teil von Plan-Schritt 5, plus die neue
    **Logout-Funktion** (Schritt 10). Betrifft alle 9 Seiten (gleiche
    Topbar überall): `.profile-menu-wrapper` umschliesst Button + absolut
    positioniertes `.profile-dropdown` (gleiches Muster wie
    `.custom-select-options`, siehe Punkt 8). `updateProfileToggleUI()` in
    `main.js` läuft bei jedem Seitenaufruf (`getSession()`) und bei jedem
    Login/Logout (`onAuthStateChange`) neu; holt den Anfangsbuchstaben aus
    `profiles.name`, fällt auf den ersten Buchstaben der E-Mail zurück,
    falls die Profil-Zeile noch fehlt (z. B. direkt nach einer Einladung).
    Reihenfolge im Dropdown: "Mein Profil" vor "Mitglieder". Hintergrund
    nutzt `var(--modal-fill)`, nicht `--glass-fill-strong` — gleicher Grund
    wie beim Login-Modal (Punkt 18): Im Dark Mode zu durchsichtig, Inhalt
    dahinter (z. B. die rote "Profil"-Überschrift) schien sichtbar durch.
    Dropdown schliesst bei Klick ausserhalb (`document`-Klick-Listener,
    prüft `wrapper.contains(event.target)`). Ausgeloggt bleibt das
    Verhalten unverändert (Klick öffnet Login-Modal). Beim Testen selbst
    eine ungültige (nicht-UUID) Test-ID verwendet, die einen echten
    400-Fehler von Postgres provozierte ("invalid input syntax for type
    uuid") — kein Bug im Produktivcode, nur ein Artefakt der eigenen
    Testmethode; mit einer frischen, unbenutzten Browser-Tab bestätigt,
    dass echte Seitenaufrufe fehlerfrei bleiben.
30. **Profil-Button eingeloggt breiter statt rund + echter SVG-`hidden`-Bug
    gefunden.** Ein einzelner Buchstabe wirkte mittig im 40px-Kreis
    gequetscht — eingeloggt jetzt ein Pill (`.profile-toggle.is-logged-in`,
    `border-radius: var(--radius-pill)`, `width: auto`) mit kleinem
    Avatar-Kreis + Chevron-Icon nebeneinander, ausgeloggt bleibt der
    40px-Kreis. Beim Bauen echten Bug gefunden: `svgElement.hidden = true`
    liest sich korrekt zurück, spiegelt sich aber **nie** ins tatsächliche
    HTML-Attribut, weil `SVGElement` nicht von `HTMLElement` erbt (dort ist
    die hidden-Property/Attribut-Verknüpfung definiert) — `[hidden]` in CSS
    matchte dadurch nie, das Icon blieb sichtbar. Fix: für die beiden SVGs
    im Button (`profileToggleIcon`, `profileToggleChevron`) explizit
    `setAttribute('hidden', '')`/`removeAttribute('hidden')` statt
    `.hidden` verwendet. Gleiches Muster wie Punkt 20 (`.self-profile-link`)
    im Kopf behalten, aber diesmal spezifisch: Betrifft nur `<svg>`, nicht
    normale Elemente wie `<span>`/`<div>` (dort funktioniert `.hidden`
    einwandfrei).
31. **"Mein Profil" liest und speichert jetzt echte Daten** — Formular
    zeigte bisher fest "Max Mustermann" (HTML-`value`-Attribute), jetzt
    holt `loadOwnProfileIntoForm()` (`main.js`) beim Laden die eigene Zeile
    aus `profiles` und füllt das Formular; fehlt sie noch (frisch
    eingeladen, nie gespeichert), bleiben Name/Social-Links leer und die
    E-Mail fällt auf die Auth-Konto-Adresse zurück statt zu crashen. Beim
    Speichern (`handleProfileSubmit`) `upsert` statt `update` verwendet -
    ein `update` auf eine noch nicht existierende Zeile ändert lautlos 0
    Zeilen (kein Fehler, aber auch nichts gespeichert), was genau diesen
    Erstspeichern-Fall kaputt gemacht hätte. Passwort-Formular
    (`handlePasswordSubmit`) ebenfalls aktiviert (verifiziert das aktuelle
    Passwort per `signInWithPassword`, siehe Kommentar im Code). Dafür
    nutzt `initAuthGate()` jetzt einen optionalen Callback-Parameter
    (`onSession`), der bei vorhandener Session einmalig aufgerufen wird -
    hält die Gate-Logik selbst weiterhin generisch für beide Seiten
    (`mitglieder.html` braucht keinen Callback). "Platzhalter-Daten"-Badge
    entfernt.
32. **Dritter Fall desselben `[hidden]`-Fallstricks gefunden** (nach Punkt
    20 `.self-profile-link` und Punkt 30 SVG-Icons): `#profileLayout` blieb
    nach dem Abmelden bzw. bei einem frischen, nicht angemeldeten Aufruf
    von `mein-profil.html` weiterhin sichtbar (mit leeren Feldern statt
    ausgeblendet), obwohl `content.hidden = true` (bzw. das native
    `hidden`-Attribut) korrekt gesetzt wurde - `.profile-layout { display:
    flex; ... }` gewann dagegen, weil eine Autor-Regel mit `display` auf
    derselben Klasse immer gegen die `[hidden]`-Regel des
    User-Agent-Stylesheets gewinnt. Fix: `.profile-layout[hidden] {
    display: none; }` ergänzt (gleiches Muster, höhere Spezifität durch den
    zusätzlichen Attribut-Selektor). **Wichtige Lektion fürs eigene Testen:**
    Bisher wurde beim Prüfen von Sichtbarkeit nur `element.hidden`
    (die Property) abgefragt, nie `getComputedStyle(element).display` -
    die Property liest sich immer korrekt zurück, auch wenn die Anzeige
    durch genau diesen CSS-Fallstrick trotzdem sichtbar bleibt. Ab jetzt bei
    Sichtbarkeits-Tests immer den tatsächlichen `display`-Wert (oder die
    `getBoundingClientRect()`-Höhe) prüfen, nicht nur die Property/das
    Attribut. `#mitgliederContent` zum Vergleich geprüft: hat keine eigene
    Klasse, daher dort keine konkurrierende `display`-Regel, kein Risiko.
33. **Formular wird beim Abmelden zusätzlich wirklich geleert**, nicht nur
    ausgeblendet — sonst stünden die Daten der vorherigen Person weiterhin
    im DOM, nur optisch versteckt (z. B. über die Entwicklertools trotzdem
    einsehbar). `initAuthGate()` hat dafür jetzt einen zweiten optionalen
    Callback-Parameter (`onSignedOut`, symmetrisch zu `onSession`), für
    `mein-profil.html` verdrahtet mit der neuen `clearProfileForm()` -
    leert Name/E-Mail/Toggle/Instagram/TikTok/Avatar-Anfangsbuchstabe sowie
    zur Sicherheit auch die drei Passwort-Felder (falls dort beim Abmelden
    gerade etwas Eingetipptes, aber nicht Abgeschicktes stand).
    `mitgliederContent`/die Mitgliederliste bewusst nicht mit angefasst -
    war nicht Teil der Anfrage, kann bei Bedarf später mit demselben Muster
    ergänzt werden.
34. **Admins können im Mitglied-Modal Rollen für andere (und sich selbst)
    vergeben** — in `#mitglied-modal`, nur sichtbar für Admins
    (`js/mitglieder.js`, `saveMitgliedRollen()`). UI: drei `.toggle`-Zeilen
    (Vorstand/Mitglied/Ehrenmitglied, `BEKANNTE_ROLLEN`) + ein Textfeld für
    frei Erfundenes (ursprünglich ein einzelnes Komma-getrenntes Textfeld
    für alle Rollen, auf Wunsch durch die geführteren Toggles ersetzt).
    Rollen sind weiterhin Freitext (siehe `rollen text[]`), also z. B. auch
    "Präsident" über das Zusatzfeld möglich — bewusst **mit echtem "ä"**
    geschrieben (nicht "ae"), wo es als tatsächlicher Rollen-Name im Code
    vorkommt (Kommentare in `.sql`-Dateien nutzen sonst weiterhin ae/oe/ue
    aus Gewohnheit, das ist reiner Beschreibungstext, keine Dateninhalte).

    **Bewusste, klare Grenze: Die Rolle "Admin" selbst lässt sich über
    dieses UI nicht vergeben oder entziehen** — weder bei sich selbst noch
    bei anderen, auch nicht durch einen anderen Admin. Wer neu Admin werden
    oder Admin-Rechte verlieren soll, läuft ausschliesslich direkt über
    Supabase (SQL-Editor), nie über die Website. Durchgesetzt an zwei
    Stellen:
    - **Clientseitig** (`saveMitgliedRollen()`): "Admin" taucht in den
      Toggles gar nicht erst als Option auf (statt es anzubieten und dann
      zu verwerfen) - der bisherige Admin-Status wird beim Speichern
      einfach unverändert aus den vorher geladenen Daten übernommen.
    - **Serverseitig, massgeblich** (`supabase/002-admin-rollen.sql`, neue
      Migration nach `schema.sql`): Der bisherige einfache
      Selbst-Befoerderungs-Schutz (aus schema.sql, Punkt zur alten
      Update-Policy) wurde ausgebaut. Neue Policy "Admins duerfen alle
      Profile bearbeiten" erlaubt Admins erstmals, fremde Zeilen zu
      bearbeiten (vorher konnte *niemand* fremde Zeilen ändern). Der
      Trigger `protect_rollen_column_trigger` vergleicht bei jeder
      `rollen`-Änderung `old.rollen` mit `new.rollen`: Nicht-Admins wird
      die Änderung komplett verworfen; bei Admins wird ausschliesslich der
      "Admin"-Bestandteil wieder auf den alten Stand zurückgesetzt (per
      `array_append`/`array_remove`), alle anderen Rollen-Änderungen in
      derselben Anfrage bleiben normal bestehen. `schema.sql` (die
      "von Grund auf neu"-Referenz) wurde direkt mit der finalen Version
      aktualisiert; `002-admin-rollen.sql` ist die tatsächlich auszuführende
      Migration für das schon laufende "homepage"-Projekt (`drop
      policy`/`create policy`-Diff gegenüber dem, was schema.sql ganz am
      Anfang einmal angelegt hat). **Noch nicht ausgeführt** — muss im
      Supabase SQL-Editor nachgeholt werden, sonst funktioniert die
      Rollen-Vergabe im UI nicht (Policy fehlt noch).
    - Bewusst **nicht** gebaut: ein systemweiter Schutz vor "letzter Admin
      wird versehentlich degradiert" (nur die eigene Admin-Rolle ist
      geschützt, nicht die eines anderen Admins) — war nicht Teil der
      Anfrage, ginge über reinen Selbstschutz hinaus.

    **"Ansicht: Admin (als normales Mitglied testen)"-Umschalter** auf
    `pages/mitglieder.html`, nur für Admins sichtbar (`viewAsNormalMember`
    in `js/mitglieder.js`). Rein lokale UI-Simulation für die Dauer des
    Seitenaufrufs, ändert nichts an der Datenbank oder der echten Rolle -
    blendet währenddessen nur den Rollen-Editor im Modal aus, damit ein
    Admin sich die normale Mitglieder-Ansicht anschauen kann, ohne die
    eigenen Admin-Rechte tatsächlich (auch nur kurzzeitig) zu verlieren.
    Setzt sich bei jedem Neuladen der Seite zurück (kein „versehentlich in
    Nicht-Admin-Ansicht steckenbleiben“). Ergänzt um `#viewAsNotice`: reine
    Button-Text-Änderung beim Klick war zu unauffällig (Effekt selbst zeigt
    sich erst beim nächsten Öffnen einer Karte) - jetzt zusätzlich ein
    deutlicher Hinweistext direkt unter dem Button bei jedem Umschalten.
35. **Bug: Der Admin-Umschalter blieb nach dem Abmelden sichtbar**, inkl.
    der veralteten Meldung aus der letzten Interaktion vor dem Abmelden.
    Ursache: `mitgliederContent`s Gate wurde bisher direkt in `main.js`
    initialisiert (`initAuthGate('mitgliederContent')`, ohne Callback),
    während die eigentliche Mitgliederliste in `js/mitglieder.js` über eine
    komplett **eigenständige** IIFE geladen wurde, die nichts vom Login-
    Zustand wusste. Beim Abmelden gab es dadurch **keine** Stelle, die
    `currentUserIsAdmin`/`viewAsNormalMember` zurücksetzt. Fix:
    `initAuthGate()`-Aufruf für `mitgliederContent` von `main.js` nach
    `js/mitglieder.js` verschoben (Reihenfolge-Grund: der `onSignedOut`-
    Callback `resetAdminUI()` existiert erst dort, `main.js` lädt vorher);
    die alte IIFE wurde zur benannten Funktion `loadMitgliederListe(session)`
    und läuft jetzt als `onSession`-Callback von `initAuthGate()` - dadurch
    automatisch bei jedem Login/Logout neu statt nur einmal beim Laden
    (Nebeneffekt: keine unnötigen 401-Anfragen mehr für nicht angemeldete
    Besucher, vorher wurde der Fetch immer versucht).
36. **Wichtige, wiederkehrende Lektion (4. Fall im selben Projekt, siehe
    auch Punkte 20 und 30-32): Jede Klasse mit eigenem `display` schlägt
    das `[hidden]`-Attribut.** Nach `.self-profile-link`, den beiden
    Lightbox-SVGs und `.profile-layout` traf es diesmal `.btn`
    (`display: inline-flex`) - der Admin-Umschalter-Button blieb trotz
    `btn.hidden = true` sichtbar, weil `.btn` (jede Komponente, die diese
    Klasse nutzt!) dagegen gewinnt. Statt weiter einzelne
    `#id[hidden] { display: none; }`-Sonderregeln nachzutragen, sobald es
    wieder auffällt, jetzt **eine globale Regel in `css/base.css`**:
    `[hidden] { display: none !important; }`, direkt beim Reset ganz oben.
    `!important` ist hier bewusst die einzige Ausnahme von "kein
    !important" im Projekt, weil es das einzige Mittel ist, das
    zuverlässig JEDE aktuelle und künftige Autor-Regel schlägt. Getestet:
    bricht nichts Bestehendes (Login-Modal, Countdown-Zustände,
    Passwort-Modal weiterhin korrekt sichtbar/unsichtbar). **Für die
    Zukunft:** Bei jedem neuen `element.hidden = ...`/`hidden`-Attribut
    nicht mehr nur `element.hidden` prüfen (das liest sich immer korrekt
    zurück), sondern beim Testen `getComputedStyle(element).display`
    kontrollieren - dank der globalen Regel sollte das jetzt aber
    durchgehend von selbst funktionieren, ohne weitere Handarbeit pro
    Element.
37. **Passwort-Formular auf "Mein Profil" verbessert:** Nach erfolgreichem
    Ändern werden alle drei Felder jetzt wirklich geleert
    (`document.getElementById('passwordForm').reset()`), vorher blieben die
    zuletzt getippten Werte (inkl. des jetzt ungültigen alten Passworts)
    einfach stehen. Ausserdem ein Augen-Icon zum Anzeigen/Verstecken bei
    allen drei Feldern (`togglePasswordVisibility()` in `main.js`,
    `.password-input-wrap`/`.password-toggle-visibility` in
    `components.css`) - `assets/icons/eye.svg`/`eye-slash.svg` sind neu
    angelegt (kein fertiges Icon dieser Art im Projekt oder in `home`
    vorhanden, deshalb selbst gezeichnet statt kopiert wie sonst üblich:
    Linsenform + Pupille per `fill-rule="evenodd"`, beim Slash-Icon
    zusätzlich ein diagonaler Balken als zweiter `<path>`). Geprüft: beide
    SVGs sind gültiges XML, Maske löst korrekt auf (18×18px, `mask-image`
    zeigt auf die Datei) - das exakte optische Ergebnis (Kurvenform) konnte
    ich selbst nicht sehen (kein Screenshot in dieser Umgebung möglich),
    falls es nicht gut aussieht bitte kurz Bescheid geben.

    **Dabei geprüft (Nutzerfrage): Die Dark/Light-Mode-Icons
    (`.theme-icon-moon`/`.theme-icon-sun`) sind bereits vollständig lokal**
    - nicht mal eine eigene Datei, sondern direkt als Inline-SVG im
    `<head>`/Topbar-Markup jeder Seite eingebettet, komplett unabhängig von
    jeder externen Bibliothek oder CDN.

38. **Mitglied-Modal überarbeitet: alle Rollen ausser Admin jetzt als
    Toggles, Profil/Rollen-Editor nebeneinander, plus Abmelden-Bestätigung.**
    Vier Änderungen aus einer einzigen Nutzeranfrage (Screenshots vom Handy
    mit handschriftlichen Markierungen):
    - Das Freitextfeld "Weitere Rolle" im Rollen-Editor ist komplett weg.
      "Präsident" (bisher nur über dieses Textfeld möglich) ist jetzt eine
      vierte feste Toggle-Zeile neben Vorstand/Mitglied/Ehrenmitglied -
      `BEKANNTE_ROLLEN` in `js/mitglieder.js` um `'Präsident'` ergänzt, alle
      `mitgliedRollenExtra`-Referenzen in `openMitgliedModal()` und
      `saveMitgliedRollen()` entfernt. Rollen bleiben technisch weiterhin
      Freitext in der Datenbank (`rollen text[]`) - es gibt nur keinen Weg
      mehr, das über dieses UI zu nutzen. Falls künftig doch mal eine ganz
      neue Rolle gebraucht wird, die (noch) nicht in `BEKANNTE_ROLLEN`
      steht, geht das vorerst nur direkt per Supabase SQL, nicht mehr übers
      Mitglied-Modal.
    - **Ab 768px stehen Profil (links) und Rollen-Editor (rechts)
      nebeneinander** statt untereinander (`pages/mitglieder.html`:
      `.mitglied-modal-layout` umschliesst `.mitglied-modal-profile` und
      `.mitglied-rollen-editor` als Geschwister; CSS in
      `css/pages/mitglieder.css`). Bewusst **nicht** bedingungslos wie bei
      `.profile-layout` (mein-profil.html) umgesetzt: Der Rollen-Editor ist
      nur für Admins sichtbar (und nicht während "als normales Mitglied
      testen") - eine unbedingte Verbreiterung des Modals hätte für JEDES
      normale Mitglied bei JEDEM Öffnen einer Karte ein unnötig breites
      Modal mit viel Leerraum neben dem zentrierten Profil bedeutet. Daher
      läuft die Verbreiterung (360px → 640px) und Zeilen-Umschaltung über
      `.mitglied-modal-content:has(.mitglied-rollen-editor:not([hidden]))`
      - reagiert automatisch korrekt, egal ob der Editor gerade sichtbar
      ist oder nicht, ohne eigene JS-Logik dafür. Per
      `getBoundingClientRect()` verifiziert: Bei sichtbarem Editor liegen
      Profil (200px) und Editor (358px) auf gleicher Höhe nebeneinander,
      Modal 640px breit; ohne Editor bleibt das Modal bei den normalen
      360px. Mobil weiterhin gestapelt (unverändert, bis 320px ohne
      horizontalen Scroll geprüft).
    - **Bug behoben: Der "Ansicht: Admin (als normales Mitglied
      testen)"-Button lief auf schmalen Handys über seinen eigenen Rand
      hinaus.** `.btn` (components.css) setzt `white-space: nowrap` -
      passend für kurze Standard-Buttons, aber dieses lange, dynamische
      Label passte auf schmalen Screens nicht auf eine Zeile und lief
      dadurch sichtbar über die Button-Pille hinaus statt umzubrechen. Fix:
      `.view-as-toggle-wrap .btn { white-space: normal; text-align: center;
      }` - bricht jetzt sauber auf 2 Zeilen um. Bei 320px Breite geprüft:
      Button wächst in der Höhe (64px statt einzeilig), kein Text-Overflow,
      keine horizontale Seiten-Scrollbar.
    - **Neuer Bestätigungsdialog vor dem Abmelden**, auf allen 9 Seiten
      (jede hat ihre eigene Topbar-Kopie). Bisher rief der
      "Abmelden"-Button im Profil-Dropdown direkt `handleLogout()` auf, das
      sofort `supabaseClient.auth.signOut()` ausführte - ein versehentlicher
      Klick (z. B. Fehltipp auf dem Handy direkt neben "Mein Profil") hatte
      keine Rückfrage. `handleLogout()` in `js/main.js` durch drei Funktionen
      ersetzt: `openLogoutConfirm(event)` (schliesst das Profil-Dropdown,
      zeigt `#logout-confirm-modal`), `closeLogoutConfirm()` (Abbrechen/X),
      `confirmLogout()` (einzige Stelle, die tatsächlich `signOut()`
      aufruft). Jede der 9 Seiten hat ihr eigenes `#logout-confirm-modal`
      bekommen (gleiches Muster wie das bestehende Login-Modal - jede Seite
      trägt ihre Modals dupliziert statt zentral, wie im ganzen Projekt
      üblich), der "Abmelden"-Button ruft jetzt `openLogoutConfirm(event)`
      statt `handleLogout()`. Getestet: Dialog öffnet/schliesst korrekt
      (`.active`-Klasse + `display`), Abbrechen ruft keinen `signOut()` auf.
39. **Admins sehen jetzt auch offene Einladungen** (Accounts, die schon
    in Supabase Auth existieren, aber noch nie ihr Profil gespeichert
    haben - siehe Punkt 6 in "Wie geht die Mitgliederabfrage" oben, dort
    war so ein Account bisher komplett unsichtbar). Über
    `superpowers:brainstorming` durchgesprochen, bewusst gegen einen
    Trigger auf `auth.users` entschieden: ein fehlerhafter Trigger dort
    würde sonst jede künftige Einladung fehlschlagen lassen, nicht nur die
    aktuelle - ein zu grosses Risiko für ein Feature, das nur eine
    Sichtbarkeits-Ergänzung ist. Stattdessen eine neue, rein lesende View
    `public.eingeladene_ohne_profil`
    ([supabase/003-eingeladene-ohne-profil.sql](supabase/003-eingeladene-ohne-profil.sql),
    **noch nicht im Supabase-Dashboard ausgeführt** - muss dort im
    SQL-Editor nachgeholt werden, sonst bleibt die neue Sektion für alle
    leer): liest `id`/`email`/`created_at` aus `auth.users`, filtert per
    `not exists` auf `profiles` bereits eingeladene-aber-nie-gespeicherte
    Accounts heraus, und liefert für Nicht-Admins durch einen zweiten
    `exists`-Check immer 0 Zeilen zurück - die Admin-Beschränkung sitzt
    damit direkt in der Datenbank, nicht nur im Frontend versteckt.
    `js/mitglieder.js` fragt diese View zusätzlich ab (nur wenn
    `currentUserIsAdmin`, spart Nicht-Admins die unnötige Anfrage) und
    rendert pro Zeile eine eigene, nicht anklickbare Karte (Badge
    "Einladung ausstehend" + E-Mail statt Name/Rollen - es gibt ja noch
    keine echte `profiles`-Zeile, also nichts zu bearbeiten) unterhalb des
    normalen Grids, in einer neuen Sektion `#eingeladeneListe`. Bewusst
    **nicht** ins Rollen-Vergabe-UI eingebunden: Auf Nachfrage entschieden,
    dass Rollen weiterhin erst vergeben werden können, sobald die Person
    sich einmal eingeloggt und ihr Profil gespeichert hat (normaler
    Ablauf, unverändert) - keine vorab-Zuweisung für noch nicht
    eingeloggte Accounts, das hätte eine echte `profiles`-Zeile schon vor
    dem ersten Login gebraucht (mehr bewegliche Teile für wenig Nutzen).
    Verschwindet zusammen mit dem Rollen-Editor beim "als normales
    Mitglied testen" (rein clientseitig, wie der Rest dieses Toggles) und
    beim Abmelden (`resetAdminUI()`). Getestet per manuell gesetzten
    Testdaten (kein echter ausstehender Invite im Projekt verfügbar):
    Karte erscheint/verschwindet korrekt mit `currentUserIsAdmin`/
    `viewAsNormalMember`, wird bei `resetAdminUI()` sauber geleert, keine
    Konsolenfehler.
40. **Instagram/TikTok-Felder auf "Mein Profil": Sichtbarkeits-Hinweis
    hinter Info-Icon, Platzhalter statt Label, echte Link-Validierung beim
    Speichern.** Kein passendes Fragezeichen/Info-Icon im Projekt oder in
    `home` vorhanden - neu angelegt (`assets/icons/circle-question.svg`,
    gleiches Vorgehen wie bei `eye.svg`/`eye-slash.svg`: von Hand
    gezeichnet, da kein FontAwesome-Original zum Kopieren da war).
    - Die bisher immer sichtbare Zeile "Instagram und TikTok sind für
      andere Mitglieder sichtbar." ist weg. Stattdessen hat jedes der
      beiden Felder eine eigene kleine `.field-info-toggle`-Schaltfläche
      (Fragezeichen-Icon) oben rechts über dem Input - Klick blendet den
      Hinweistext direkt darunter ein/aus (`toggleFieldInfo()` in
      `main.js`, simples Anzeigen/Verstecken, kein Popup mit eigener
      Positionierung). Bewusst eine eigene Zeile über dem Input statt ein
      Icon innerhalb (wie beim Passwort-Auge) - ein langer eingetippter
      Link würde sonst unter das Icon laufen.
    - `<label>` bei beiden Feldern entfernt, dafür `placeholder="Instagram"`
      bzw. `"TikTok"`. Da Placeholder allein ein bekanntes
      Screenreader-Problem sind (verschwinden beim Tippen, gelten nicht als
      vollwertiges Label), zusätzlich ein `aria-label` mit dem vollen
      Feldnamen ergänzt - rein für Barrierefreiheit, ändert nichts optisch.
    - **Validierung beim Speichern** (`handleProfileSubmit` in `main.js`):
      Leeres Feld bleibt gültig (beide Felder optional). Ist ein Wert
      eingetragen, prüft `hostMatchesAny()` per `new URL(...).hostname` (nicht
      per String-`includes()` - wichtig, sonst wäre z. B.
      `evilinstagram.com.attacker.io` faelschlich als gueltig durchgerutscht),
      ob der Host wirklich zu `instagram.com` bzw. `tiktok.com`/
      `vm.tiktok.com` (Kurzlink beim Teilen aus der TikTok-App) gehört -
      "www."-Präfix wird dabei ignoriert. Passt der Host nicht (oder ist der
      Wert gar keine gültige URL), wird nichts gespeichert, sondern direkt
      unter dem betroffenen Feld ein freundlicher Fehlertext angezeigt
      (`.form-error`, gleiche Klasse wie bei den Passwort-Fehlermeldungen),
      z. B. "Das sieht nicht nach einem Instagram-Link aus." `clearProfileForm()`
      (Abmelden) setzt die neuen Hinweis-/Fehlertexte ebenfalls zurück, nach
      demselben Muster wie die restlichen Formularfelder.
41. **Login-Modal schliesst sich nicht mehr bei versehentlichem Klick
    daneben.** Ein einzelner geteilter `window`-Klick-Handler in `main.js`
    schloss bisher mehrere Modals (Telefon/E-Mail-Kontakt, Lightbox, Login,
    Mitglied-Detail), sobald der Klick den Hintergrund/Overlay statt den
    Dialog selbst traf (`e.target.id === '...'`). Beim Login-Formular störte
    das: ein knapper Fehlklick daneben verwarf E-Mail/Passwort komplett
    ohne Rückfrage. `logout-confirm-modal`, `set-password-modal` und
    `auth-error-modal` waren aus genau diesem Grund schon vorher bewusst
    **nicht** in diesem Handler enthalten (nur über ihre eigenen
    Buttons schliessbar) - `login-modal` jetzt ebenfalls entfernt, gleiches
    Prinzip. Bewusst **nicht** angefasst (auf Nachfrage bestätigt, nur das
    Login-Modal soll sich ändern): `mitglied-modal`, `phone-modal`,
    `email-modal` bleiben weiterhin bei Klick daneben schliessbar. Getestet
    per simuliertem Klick auf das Overlay-Element: Modal bleibt aktiv
    (`classList.contains('active')` weiterhin `true`), der X-Button schliesst
    es unverändert korrekt.
42. **Bug durch Punkt 40 verursacht: Profil-Karte auf "Mein Profil" wurde
    am PC sichtbar schmaler.** `.profile-form-card` hatte schon immer nur
    `max-width: 480px`, nie ein echtes `width` - eine Obergrenze allein
    erzwingt keine Breite, ohne explizites `width`/`flex-basis` bestimmt
    bei einer Flex-Row der tatsächliche Inhalt die Breite (Schrumpf-auf-
    Inhalt). Die jetzt entfernte, recht lange Hinweiszeile ("Instagram und
    TikTok sind für andere Mitglieder sichtbar.") plus die beiden Labels
    waren offenbar der breiteste Text in der Karte - ohne sie schrumpfte
    die Karte spürbar. Per Breiten-Messung im Browser bestätigt: live
    (gepusht) 447.5px, lokal (Bug) nur noch 304.7px - die "Passwort
    ändern"-Karte daneben (teilt dieselbe Klasse, aber inhaltlich
    unverändert) blieb bei beiden exakt gleich (250.8px), war also nie
    betroffen. Fix: `.profile-layout .profile-form-card:not(.password-details)
    { width: 480px; }` im bestehenden 768px-Breakpoint-Block (nur Desktop,
    nur die Profil-Karte selbst) - nutzt den ohnehin schon deklarierten
    `max-width`-Wert als echte Breite, macht die Karte damit unabhängig vom
    zufälligen Textumfang. Mobil unverändert (Karte bleibt dort
    Schrumpf-auf-Inhalt), bei 768px (Breakpoint-Grenze) kein horizontaler
    Overflow. **Lektion:** Eine reine `max-width`-Regel ohne `width` ist
    bei textlastigen Karten in einer Flex-Row ein verstecktes Risiko - jede
    künftige Text-/Label-Kürzung an so einer Karte kann sie unbeabsichtigt
    schmaler werden lassen, auch wenn die CSS-Regel selbst gar nicht
    angefasst wurde.
43. **Augen-Icon zum Passwort-Anzeigen jetzt auch im Login-Modal.** Bisher
    nur bei den 3 Feldern in "Passwort ändern" auf Mein Profil (Punkt 37) -
    auf Wunsch jetzt zusätzlich beim `loginPassword`-Feld, auf allen 9
    Seiten (jede hat ihre eigene Kopie des Login-Modals). Reine
    Wiederverwendung des bestehenden Musters (`.password-input-wrap`,
    `.password-toggle-visibility`, `togglePasswordVisibility()`) - keine
    neue CSS- oder JS-Arbeit nötig, die Funktion war bereits generisch
    genug für ein weiteres Feld. `supabase/003-eingeladene-ohne-profil.sql`
    (Punkt 39) ist inzwischen im Supabase-Dashboard ausgeführt - die
    "Ausstehende Einladungen"-Sektion ist damit produktiv nutzbar.
44. **Audit auf toten Code/ungenutzte Dateien - nur dokumentiert, noch
    NICHTS davon gelöscht/geändert.** Per zwei parallelen Explore-Agents
    geprüft (einer für CSS-Klassen, einer für JS-Funktionen und
    referenzierte Dateien), jeweils gegen sowohl statische `class="..."`-
    Attribute als auch dynamisch per Template-Literal/`classList` erzeugte
    Klassen bzw. `onclick=`/`onsubmit=`-Referenzen:
    - **JS ist sauber:** alle 60 geprüften Top-Level-Funktionen
      (`js/main.js`, `js/mitglieder.js`, `js/blog.js`) werden tatsächlich
      irgendwo aufgerufen - keine einzige ungenutzte Funktion gefunden.
    - **3 ungenutzte CSS-Klassen:** `.slide-placeholder`
      (`css/pages/home.css:152`, bewusst als Platzhalter für einen
      künftigen ähnlichen Fall belassen, siehe Punkt 21 - kein
      Aufräum-Kandidat), `.sr-only` (`css/base.css:277`), `.icon-images`
      (`css/components.css:59`, zeigt auf `images-regular.svg`) - die
      letzten beiden sind echte Kandidaten zum Entfernen.
    - **11 nie referenzierte Icon-SVGs** in `assets/icons/`: `arrow-up`,
      `bars-solid-full`, `bitcoin`, `github`, `images-solid`, `linkedin`,
      `openai`, `snapchat`, `spotify`, `x-twitter`, `youtube` - vermutlich
      Reste des kompletten FontAwesome-Ordners, der beim Projektstart aus
      `home` mitkopiert wurde (siehe Design-System-Abschnitt oben), aber
      nie alle einzeln gebraucht wurden.
    - **8 nie referenzierte Bilder** in `assets/images/`: `comingSoon.png`,
      `nicolas.alt.png`, `team.jpg`, `test3.png`,
      `blogs/handstand1.jpeg`, `blogs/jedes-alter.jpeg`, `blogs/xs.jpeg`,
      sowie die unverkleinerte Originalversion `blogs/5.7.2026.JPG` (nur
      die `-klein`-Variante wird tatsächlich verwendet).
    - Auf ausdrücklichen Wunsch bewusst **nichts davon gelöscht oder
      angefasst** - dient nur als Fundstellen-Liste für einen möglichen
      künftigen Aufräum-Durchgang.
45. **Info-Icon bei Instagram/TikTok (Punkt 40) auf Nutzer-Feedback hin
    überarbeitet:** Icon+Kreis leicht vergrössert (18px → 22px). Der
    Hinweistext ist jetzt eine schwebende Sprechblase direkt unter dem
    Icon (`position: absolute`, "im Vordergrund") statt eines Absatzes im
    normalen Textfluss unter dem Feld - `.field-info-text` liegt dafür neu
    *innerhalb* von `.field-info-row` (die selbst zum
    `position: relative`-Anker wird), nicht mehr als Geschwister des
    Inputs. Am PC (echte Maus) reicht jetzt reines Hover
    (`@media (hover: hover) and (pointer: fine)`), kein Klick mehr nötig -
    auf Touch-Geräten (kein Hover) bleibt Antippen der einzige Weg.
    Sichtbarkeit läuft dafür nicht mehr über das `hidden`-Attribut,
    sondern über eine CSS-Klasse `.is-visible`: Attribut und reine
    CSS-Hover-Regel hätten sich sonst in die Quere kommen können (z. B.
    Blase bliebe nach Wegbewegen der Maus haengen, wenn vorher zusätzlich
    per Klick geöffnet wurde). `toggleFieldInfo()` in `main.js` prüft
    deshalb selbst per `matchMedia('(hover: hover) and (pointer: fine)')`
    und tut auf Geräten mit echter Maus bewusst nichts (kein Klick-Verhalten
    mehr dort) - verifiziert: Klick auf einem Hover-fähigen Gerät ändert die
    Klasse nicht, auf einem simulierten Nicht-Hover-Gerät funktioniert das
    Klick-Toggle unverändert. `clearProfileForm()` entfernt beim Abmelden
    entsprechend die Klasse statt das Attribut zu setzen.
46. **Bug gefunden und live bestätigt behoben (nach zwei fehlgeschlagenen
    RLS-Policy-Fixversuchen, gelöst per Workaround statt Policy-Reparatur):
    Rollen-Speichern für ein fremdes Profil schlug fehl.**
    Auslöser: Admin öffnet Alessandros Mitglied-Modal, aktiviert "Präsident",
    klickt "Rollen speichern" - `rollen` in der DB bleibt unverändert bei
    `["Mitglied"]`.
    - **Erster Fix, bereits gepusht (Commit `30f48fa`):** `saveMitgliedRollen()`
      in `js/mitglieder.js` prüfte bisher nur `error`, nicht ob überhaupt eine
      Zeile betroffen war - eine per RLS blockierte Änderung liefert von
      Supabase *keinen* Fehler, sondern nur stillschweigend 0 geänderte
      Zeilen. Jetzt zusätzlich `{ count: 'exact' }` an `.update()` übergeben
      und `count` prüfen; bei 0 erscheint ein klarer Fehlertext statt eines
      falschen "Gespeichert!". Behebt nicht die eigentliche Ursache, macht
      das Symptom aber ehrlich sichtbar statt irreführend.
    - **Mehrere naheliegende Ursachen geprüft und alle widerlegt** (jeweils
      direkt in der DB/im Dashboard verifiziert, nicht nur vermutet):
      - *"Migration 002 wurde nie ausgeführt"* (so stand es in Punkt 34 oben)
        - **war falsch/veraltet**. Per `pg_policies`/`pg_trigger` direkt
        geprüft: Policy "Admins duerfen alle Profile bearbeiten" UND Trigger
        `protect_rollen_column_trigger` existieren beide schon in der
        Live-DB, mit exakt der erwarteten Bedingung (`EXISTS (SELECT 1 FROM
        profiles p WHERE p.id = auth.uid() AND 'Admin' = ANY (p.rollen))`
        als `qual`).
      - *"Falsche/veraltete Browser-Session"* (es gibt zwei Nicolas-Accounts:
        "Nicolas Brand" / `nicolas.alexander.brand@gmail.com`, Rollen
        `Admin`+`Präsident`; und "Test User (Nicolas)" /
        `nicolas.brand@f24.com`, nur `Mitglied`) - per "Mein Profil" auf der
        Seite bestätigt: die aktive Session war tatsächlich "Nicolas Brand",
        also der echte Admin-Account, nicht der Test-Account.
      - *"Fehlalarm durch die neue `count`-Prüfung selbst"* - widerlegt per
        Blick in den Table Editor: Alessandros `rollen`-Spalte stand danach
        nachweislich immer noch auf `["Mitglied"]`, die Zeile wurde also
        wirklich nicht geändert, kein reines Anzeigeproblem im Frontend.
    - **Entscheidender Test:** Direkt im SQL-Editor die Admin-Identität
      simuliert (`set local role authenticated; set local
      request.jwt.claims = '{"sub": "<admin-uuid>", "role":
      "authenticated"}'`) und dieselbe `update ... where id =
      '<alessandro-uuid>'` versucht, in einer Transaktion mit `rollback`
      (keine echte Änderung, nur zum Testen). Ergebnis: **"Success, no rows
      affected"** - selbst mit korrekt simulierter Admin-Identität, komplett
      unabhängig von Browser/Netzwerk/Client-Code. Das grenzt die Ursache
      endgültig auf die RLS-Logik selbst ein, nicht auf Session/Cache/JS.
    - **Die beiden zuletzt offenen Verdachte (`with_check`-Inhalt, versteckte
      `RESTRICTIVE`-Policy) wurden geprüft und beide widerlegt:** Abfrage
      `select policyname, cmd, permissive, roles, qual, with_check from
      pg_policies where schemaname = 'public' and tablename = 'profiles';`
      zeigte alle 4 Policies (SELECT/INSERT/2x UPDATE) als `PERMISSIVE`
      (keine versteckte `RESTRICTIVE`-Policy), und `with_check` der
      Admin-Policy war exakt identisch zu `qual`, wie erwartet. Auch das
      Rollen-Array des Admins selbst war absolut sauber (`'Admin' = any
      (rollen)` lieferte direkt geprüft `true`, keine Tippfehler/Leerzeichen).
      Alle Einzelteile für sich betrachtet also korrekt - der Fehler musste
      im Zusammenspiel liegen.
    - **Tatsächliche Ursache gefunden per `EXPLAIN (ANALYZE, VERBOSE)` auf
      dem echten UPDATE** (mit simulierter Admin-Identität in einer
      `begin`/`rollback`-Transaktion, folgenlos testbar): Der von Postgres
      tatsächlich angewendete Filter war NICHT das erwartete `(auth.uid() =
      id) OR admin_check`, sondern zusätzlich noch ein drittes, separates
      UND: `(name = 'Alessandro') AND ((auth.uid() = id) OR admin_check) AND
      (auth.uid() = id)`. Dieses dritte, nicht mit ODER an die Admin-Prüfung
      gekoppelte `auth.uid() = id` machte die gesamte Admin-Berechtigung
      wirkungslos - ganz gleich, was `admin_check` ergab, musste
      `auth.uid() = id` trotzdem unabhängig davon zusätzlich stimmen, was
      nur beim Bearbeiten der eigenen Zeile zutrifft. Das erklärt exakt das
      beobachtete Muster (eigenes Profil geht, fremdes nie) und ist
      unabhängig von Trigger, Rollen-Inhalt oder Session - reine
      RLS-Auswertung. Per Web-Recherche bestätigt: mehrere permissive
      UPDATE-Policies auf derselben Tabelle sind ein bekannt tückischer
      Bereich in Postgres (u. a. ein eigener "[HACKERS] Row Level Security
      UPDATE Confusion"-Thread auf der offiziellen Mailingliste dreht sich
      genau um dieses Thema) - die Doku verspricht sauberes ODER, das
      Zusammenspiel mehrerer Policies für denselben Befehl kann in der
      Praxis aber unerwartete zusätzliche Bedingungen erzeugen.
    - **Fixversuch 1, fehlgeschlagen:** Beide UPDATE-Policies zu einer
      einzigen zusammengelegt, mit dem `OR` direkt innerhalb einer Policy
      statt über Postgres' eigene Mehrfach-Policy-Kombination
      ([`supabase/005-fix-admin-update-policy.sql`](supabase/005-fix-admin-update-policy.sql)).
      Nach Ausführung per `pg_policies` bestätigt: nur noch eine einzige
      UPDATE-Policy vorhanden, korrekt zusammengesetzt. Trotzdem lieferte
      derselbe `EXPLAIN (ANALYZE, VERBOSE)`-Test exakt denselben,
      nicht mit `OR` verknüpften dritten Filterbestandteil `auth.uid() =
      id` wie vorher - widerlegt also die Annahme, dass es *speziell* an
      mehreren Policies lag.
    - **Fixversuch 2, ebenfalls fehlgeschlagen:** Per Recherche bestätigt,
      dass ein RLS-Policy-Ausdruck, der per Subquery dieselbe Tabelle
      liest, die er selbst schützt, ein bekanntes, oft dokumentiertes
      Muster für unerwartetes Verhalten ist - üblicher Fix: die Prüfung in
      eine `SECURITY DEFINER`-Funktion `is_admin()` auslagern, bewusst als
      `language plpgsql` (nicht `sql`) geschrieben, weil Postgres einfache
      `sql`-Funktionen beim Planen "inlinen" kann, wodurch der
      `SECURITY DEFINER`-Schutz wieder verloren ginge
      ([`supabase/006-admin-check-security-definer.sql`](supabase/006-admin-check-security-definer.sql)).
      Trotz dieser spezifisch vermiedenen Falle: identisches Ergebnis,
      "Success. No rows returned" weiterhin.
    - **Fix 3, funktioniert - Workaround statt Policy-Reparatur:** Auf
      Vorschlag, das Problem zu umgehen statt es weiter an der Wurzel zu
      suchen: Die Rollen-Änderung läuft nicht mehr über einen direkten
      `.update()`-Aufruf (unterliegt der ungeklärten RLS-Eigenheit),
      sondern über eine neue `SECURITY DEFINER`-Funktion
      `admin_set_rollen(target_id, neue_rollen)`, die die Berechtigung
      selbst per einfachem `if not exists(...) then raise exception`
      prüft und das UPDATE danach direkt ausführt - keine
      RLS-Policy-Auswertung mehr für diesen Schreibzugriff nötig
      ([`supabase/007-admin-set-rollen-rpc.sql`](supabase/007-admin-set-rollen-rpc.sql)).
      `js/mitglieder.js`s `saveMitgliedRollen()` ruft jetzt
      `supabaseClient.rpc('admin_set_rollen', {...})` statt
      `supabaseClient.from('profiles').update(...)` auf. Trigger
      `protect_rollen_column_trigger` (schützt den Admin-Status selbst)
      blieb während aller drei Versuche unverändert und feuert weiterhin
      ganz normal, unabhängig davon, auf welchem Weg das UPDATE ausgelöst
      wird - war laut gesamter Untersuchung nie das Problem. **Live im
      Mitglied-Modal getestet und bestätigt funktionierend.** Die genaue
      Postgres-interne Ursache für den hartnäckigen dritten Filterbestandteil
      bleibt letztlich ungeklärt (auch mit offiziellem PostgreSQL-Wissen
      und gezielter Recherche zu genau diesem Bug-Bild nicht gefunden) -
      der Workaround funktioniert nachweislich, ohne dass die exakte
      Postgres-Query-Planer-Mechanik dahinter vollständig verstanden ist.
    - **Nebenbei erledigt:** `supabase/004-namen-backfill.sql` (händisch
      gepflegte Namen für Maddie/Nicci/Giada/Louie, die vier bis dahin
      profillosen Einladungen) wurde im Zuge dieser Untersuchung im
      Dashboard ausgeführt - alle vier erscheinen jetzt mit echtem Namen in
      der Mitgliederliste statt nur unter "Ausstehende Einladungen". Die
      Datei liegt nur lokal im Repo, bewusst nicht committed/gepusht -
      Supabase-seitige Änderungen werden auf ausdrücklichen Wunsch
      ausschliesslich manuell über das Dashboard ausgeführt, nicht über
      gepushte Migrationsdateien.
47. **Topbar sowie Login- und Logout-Bestätigungs-Modal waren bis hierhin auf
    allen 9 HTML-Seiten identisch dupliziert - jetzt zwei gemeinsame Custom
    Elements (`<site-topbar>`, `<site-account-modals>`) in einer neuen Datei
    `js/site-chrome.js`.** Fünf zusammenhängende Aspekte dieser Migration
    (in drei Tasks über alle 9 Seiten ausgerollt, jede Seite einzeln
    reviewt):
    - **Problem:** Die komplette Topbar-Navigation (`<header class="topbar">`,
      ~33 Zeilen) sowie Login- und Logout-Bestätigungs-Modal lagen identisch
      kopiert in jeder der 9 Seiten (`index.html`, `pages/*.html`,
      `pages/blog/*.html`). Jede Änderung an einem dieser Blöcke bedeutete
      9x identische Handbearbeitung - genau das war bereits eingetreten
      (siehe Punkt 41: Der Fix am Login-Modal für den
      Klick-daneben-schliesst-Handler musste auf allen 9 identischen Kopien
      korrekt sitzen, nicht nur an einer einzigen Stelle geändert werden).
      Damit ist der dort beschriebene Wartungsaufwand für diese beiden
      Blöcke erledigt.
    - **Lösung:** Ein einfaches `fetch()` einer ausgelagerten
      HTML-Partial-Datei schied aus, weil `fetch()` unter `file://` per CORS
      blockiert wird ("Cross origin requests are only supported for HTTP")
      und die Seite laut Überblick weiterhin ohne Build-Schritt direkt per
      Doppelklick funktionieren muss - aus demselben Grund schied auch
      `<script type="module">` aus (dieselbe Cross-Origin-Sperre wie
      `fetch()`, auch rein lokal). Stattdessen füllen zwei neue Custom
      Elements ihr `innerHTML` aus einem Template-String (kein `fetch()`,
      kein CORS-Problem): `<site-topbar>` ersetzt den kompletten
      `<header class="topbar">`-Block, `<site-account-modals>` bündelt
      Login- und Logout-Modal in einem Element, weil beide im Quelltext
      aller 9 Seiten ohnehin immer direkt hintereinander standen. Bewusst
      **kein** Shadow DOM, damit das bestehende globale CSS (`.topbar`,
      `.profile-dropdown`, `.modal-overlay` usw. in `components.css`)
      unverändert weiter greift, statt gegen ein isoliertes
      Shadow-Root-Stylesheet neu geschrieben werden zu müssen.
    - **`data-base`-Mechanismus:** Die relativen Pfade im Template laufen
      über ein neues `data-base`-Attribut auf `<body>`: `""` auf
      `index.html`, `"../"` unter `pages/*.html`, `"../../"` unter
      `pages/blog/*.html`. Alle Links im Template sind root-relativ
      geschrieben (z. B. `${base}pages/team.html`), damit exakt eine Formel
      für alle drei Ordnertiefen reicht, statt pro Tiefe unterschiedliche
      relative Pfade pflegen zu müssen. Sonderfall Home-Link: Auf
      `index.html` selbst ist Home ein reiner Anker (`#home`, kein Reload,
      wenn `page === 'home'`), auf jeder anderen Seite ein echter
      Seitenwechsel (`${base}index.html#home`) - entspricht exakt dem
      Verhalten von vor der Migration, extra geprüft, um hier keine
      Regression einzubauen.
    - **Lektion aus dem ersten Fix-Durchgang (Task 1):** Der ursprüngliche
      Entwurf liess `class="topbar"` und die implizite `banner`-Landmark am
      Call-Site verloren gehen - `<site-topbar></site-topbar>` ohne Klasse
      rendert unstyled (kein `position: fixed`, kein Hintergrund, siehe
      `.topbar` in `components.css`), und ein autonomes Custom Element hat,
      anders als ein `<header>` direkt unter `<body>`, keine implizite
      ARIA-Rolle mehr - das Screenreader-"Sprung zum Header" war damit
      sang- und klanglos verschwunden. Ein erster Fix-Versuch reparierte das
      noch am Call-Site (`<site-topbar class="topbar">` einzeln in
      `index.html`) - im Review korrekt bemängelt, weil das exakt die
      9x-Handarbeit reproduziert hätte, die diese Migration eigentlich
      auflösen sollte. Endgültig behoben, indem `SiteTopbar.connectedCallback()`
      in `js/site-chrome.js` sich selbst `class="topbar"` und
      `role="banner"` gibt, bevor es sein `innerHTML` füllt - jede der 9
      Seiten trägt seither nur noch das nackte `<site-topbar></site-topbar>`.
    - **Bewusst nicht angefasst:** Footer und mobile Tab-Bar (`.tabbar`)
      bleiben weiterhin literal auf allen 9 Seiten dupliziert - beide
      ausserhalb des Umfangs dieser Migration. `index.html`s
      `#set-password-modal`/`#auth-error-modal` existieren ohnehin nur auf
      `index.html`, waren also nie Teil des 9x-Duplikationsproblems.
48. **Zwei kleine Korrekturen an `saveMitgliedRollen()` (Rollen-Editor im
    Mitglied-Modal), beide auf Nutzer-Feedback hin:**
    - Die "Mindestens eine Rolle auswählen"-Meldung erschien fälschlich auch
      dann, wenn ein Admin bearbeitet wird und alle sichtbaren Toggles
      abgewählt werden - der behält ja ohnehin die Rolle "Admin" und landet
      nie wirklich bei 0 Rollen. Ursache: Die Admin-Rückergänzung
      (`neueRollen.push('Admin')`) lief bisher NACH der Leer-Prüfung, nicht
      davor. Fix: Reihenfolge getauscht, die Prüfung sieht jetzt die
      tatsächlich resultierende Rollen-Liste.
    - Die "Gespeichert!"-Meldung stand als eigene Zeile unter dem Button.
      Jetzt wie beim bestehenden "Kopiert!"-Button (`copyToClipboard()` in
      `main.js`, siehe Punkt 14): Der Button-Text wechselt selbst kurz zu
      "Gespeichert!" (inkl. `.btn.copied`-Klasse fürs Grün), springt nach
      2 Sekunden zurück. Fehlermeldungen bleiben weiterhin als Text unter
      dem Button, nur der Erfolgsfall wurde verschoben.
49. **Rolle "Vorstand" aus dem Rollen-Editor entfernt.** `rollen` ist eine
    Freitext-`text[]`-Spalte ohne Enum/CHECK-Constraint (siehe Kommentar in
    `supabase/schema.sql`), das Entfernen war deshalb ein reiner
    UI-Eingriff ohne Migration: Toggle-Zeile in `pages/mitglieder.html`
    entfernt, `'Vorstand'` aus `BEKANNTE_ROLLEN` in `js/mitglieder.js`
    gestrichen (jetzt `Mitglied`/`Ehrenmitglied`/`Präsident`), Kommentare in
    `css/pages/mitglieder.css` und `supabase/schema.sql` an die neue
    Drei-Rollen-Liste angepasst. Bewusst unangetastet: der Kontakthinweis
    "wende dich an den Vorstand" in `index.html`s Link-abgelaufen-Dialog und
    die "Team-/Vorstand-Karten" im Design-Spec meinen das reale Gremium,
    nicht die jetzt entfernte Rollen-Option, und wurden deshalb nicht
    geändert.
50. **Profil-Karte auf "Mein Profil" füllt die Breite jetzt auch unterhalb
    768px richtig aus.** Zwei getrennte Ursachen, beide behoben:
    - `.section` reserviert siteweit 20px Seiten-Abstand zum
      Bildschirmrand (`base.css`) - statt das global zu ändern und
      ungefragt jede andere Seite zu beeinflussen, gilt eine Reduktion auf
      12px gezielt nur unterhalb 768px und nur für
      `body[data-page="mein-profil"] .section` (neue Regel in
      `components.css`).
    - Eigentlicher Hauptfehler, per Chrome-DevTools-Box-Modell vom Nutzer
      selbst gefunden: `.profile-form-card` hatte `margin: 0 auto` **und**
      `max-width: 480px` unbedingt gesetzt. `.profile-layout` ist seit der
      Flexbox-Umstellung ein Flex-Container - ein Flex-Item mit
      Auto-Rand auf der Querachse schaltet `align-items: stretch` ab und
      faellt stattdessen auf Shrink-to-fit zurueck: die Karte war dadurch
      unterhalb 768px immer nur so breit wie ihr breitester Inhalt
      (gemessen 304.7px), unabhaengig vom tatsaechlich verfuegbaren Platz -
      die 20px/12px-Section-Reduktion allein aenderte deshalb kaum etwas
      sichtbar. Fix: `margin: 0 auto` aus der Basisregel entfernt (dadurch
      greift stretch normal, siehe Kommentar in `components.css`) und
      `max-width: 480px` in den bestehenden 768px-Breakpoint verschoben,
      wo es weiterhin gebraucht wird (fuer `.password-details`, die anders
      als die Profil-Karte kein eigenes festes `width` bekommt). Verhalten
      ab 768px unveraendert (Profil-Karte weiterhin fix 480px, siehe
      Punkt 42; Passwort-Karte weiterhin ca. 250px).
51. **E-Mail-Feld in "Mein Profil" ist jetzt nur noch lesbar**, nicht mehr
    änderbar (`readonly` auf `#profileEmail` in `pages/mein-profil.html`) -
    analog zu den Rollen ist die E-Mail-Adresse in `profiles` administrativ
    gepflegte Kontaktinformation, keine vom Mitglied selbst editierbare
    Angabe. `readonly` statt `disabled`, damit der Wert weiterhin
    fokussierbar und kopierbar bleibt. Neue generische Regel
    `.field input:read-only` (`components.css`, gedimmt per
    `opacity: 0.6`) macht den gesperrten Zustand optisch erkennbar.

52. **"Zugang anfragen" ergänzt: Wer noch kein Konto hat, kann über das
    Login-Modal Name + E-Mail hinterlassen.** Auslöser: "Allow new users to
    sign up" stand im Supabase-Dashboard auf aktiv - jeder mit einer echten
    E-Mail-Adresse hätte sich damit direkt per API ein Konto anlegen können,
    komplett am eigenen Einladungs-Workflow vorbei (siehe "Zugriff nur für
    echte Mitglieder" oben), und wäre damit automatisch in die Rolle
    `authenticated` gerutscht - genug, um z. B. `public_profiles` zu lesen.
    Auf eigene Nachfrage geprüft und bestätigt: Inzwischen ausgeschaltet.
    Als nutzerfreundlicher Ersatz für einen eigenen Zugang jetzt ein
    Anfrage-Formular statt eines offenen Sign-ups:
    - Login-Modal (`js/site-chrome.js`) hat einen Link "Noch kein Konto?
      Zugang anfragen" unter dem Anmelden-Button - schliesst das Login-Modal
      und öffnet ein neues, eigenes `#account-request-modal` (Name +
      E-Mail), nach demselben `openXDialog()`/`closeXDialog()`/
      `handleXSubmit()`-Muster wie die übrigen Modals in `main.js`.
    - Neue Tabelle `public.konto_anfragen`
      ([supabase/008-konto-anfragen.sql](supabase/008-konto-anfragen.sql),
      **noch nicht ausgeführt**) mit RLS: bewusst nur eine INSERT-Policy für
      `anon` und `authenticated` (`with check (true)`) - jeder darf eine
      Anfrage anlegen, aber niemand kann sie über den öffentlichen Key
      wieder lesen, ändern oder löschen (RLS ohne passende Policy für einen
      Befehlstyp verweigert diesen Befehlstyp komplett). Lesen/Löschen für
      Admins ist ein bewusst noch offener, separater Task - auf
      ausdrücklichen Wunsch vorerst nicht mitgebaut.
    - Dabei aufgefallen und mitgefixt: `a { color: inherit }` (globaler
      Reset in `base.css`) liess einen Link innerhalb von `.form-hint`
      (gedämpfter Fliesstext) optisch komplett mit dem umgebenden Text
      verschmelzen - der neue "Zugang anfragen"-Link war dadurch kaum als
      klickbar erkennbar. Neue Regel `.form-hint a` (Akzentrot +
      Unterstreichung, gleiches Rot-Muster wie alle anderen Links im
      Projekt) behebt das generisch für jeden künftigen Link in einem
      `.form-hint`, nicht nur diesen einen.

53. **Doppelte Konto-Anfragen abgefangen.** `konto_anfragen` hat bewusst
    keine SELECT-Policy für `anon`/`authenticated` (Punkt 52) - ein
    client-seitiger "gibt es diese Mail schon?"-Check per `.select()` wäre
    also immer leer gelaufen (RLS blockiert, nicht "kein Treffer") und
    hätte Duplikate nie wirklich verhindert. Stattdessen ein Unique-Index
    auf `lower(email)`
    ([supabase/009-konto-anfragen-email-unique.sql](supabase/009-konto-anfragen-email-unique.sql),
    **noch nicht ausgeführt** - Groß-/Kleinschreibung soll dieselbe Anfrage
    trotzdem als Duplikat erkennen) direkt in der Tabelle: Der `insert()`-
    Versuch selbst schlägt bei einer bereits vorhandenen Mail mit dem
    Postgres-Fehlercode `23505` (unique_violation) fehl.
    `handleAccountRequestSubmit()` in `js/main.js` fängt genau diesen Code
    ab und zeigt "Für diese E-Mail liegt bereits eine Anfrage vor." statt
    der generischen Fehlermeldung. Getestet per simuliertem `23505`- sowie
    einem anderen Fehlercode (jeweils `supabaseClient.from()` im Browser
    gemockt, ohne die echte DB anzufassen) - beide Meldungen erscheinen
    korrekt.

54. **Admin-Ansicht "Ausstehende Anfragen" für `konto_anfragen`** (Punkt 52),
    auf `pages/mitglieder.html` direkt unter "Ausstehende Einladungen" -
    zeigt Name + E-Mail jeder offenen Konto-Anfrage. Bewusst nur die reine
    Sichtbarkeit, keine Annehmen-/Ablehnen-Aktion und kein Löschen - das
    bleibt ein eigener, späterer Task.
    - **Neue Policy** ([supabase/010-konto-anfragen-admin-select.sql](supabase/010-konto-anfragen-admin-select.sql),
      **noch nicht ausgeführt**): `konto_anfragen` hatte bisher gar keine
      SELECT-Policy (Punkt 52); jetzt eine, exakt nach demselben
      Admin-Check-Muster wie die bestehende Update-Policy auf `profiles`.
    - `renderKontoAnfragen()` in `js/mitglieder.js` kopiert bewusst das
      Muster von `renderEingeladeneOhneProfil()` (Punkt 39): gleiche
      `.eingeladene-*`-CSS-Klassen wiederverwendet statt eigener (optisch
      identisch gewünscht), gleiche Kopplung an `currentUserIsAdmin`/
      `viewAsNormalMember`/`resetAdminUI()`.
    - **Sicherheitsfund dabei:** `name`/`email` kommen aus einem komplett
      unauthentifizierten Formular (jeder im Internet kann `konto_anfragen`
      befüllen, siehe Punkt 52) - roh per Template-String in `innerHTML`
      gesetzt (wie es z. B. `renderMitgliederGrid` mit `profiles.name`
      bereits tut) wäre das gespeichertes XSS gegen jeden Admin gewesen, der
      die Seite öffnet. `profiles.name` ist dabei ein deutlich kleineres
      Risiko (nur von der eingeloggten Person selbst über ihr eigenes,
      bereits eingeladenes Profil setzbar), wurde deshalb hier bewusst nicht
      mit angefasst. Neue kleine `escapeHtml()`-Hilfsfunktion (setzt Text
      als `textContent` in ein Hilfs-Element, liest `innerHTML` davon
      zurück) für beide Felder ergänzt. Getestet: ein Name mit
      `<img src=x onerror="...">` erscheint als reiner, harmloser Text in
      der Karte, kein Skript feuert.

55. **Admins können Konto-Anfragen jetzt löschen**, mit Bestätigungsdialog
    (Punkt 54 liess bewusst nur Ansehen zu, Löschen war als eigener,
    späterer Task angekündigt). Jede Karte in "Ausstehende Anfragen" hat
    einen "Löschen"-Button (`.anfrage-loeschen-btn`, kleiner/rechtsbündig
    dank `flex: 1` auf `.eingeladene-email` davor - betrifft auch die
    "Ausstehende Einladungen"-Karten mit, dort optisch unauffällig, da sie
    ohnehin schon die volle Restbreite einnehmen). Klick öffnet
    `#delete-anfrage-confirm-modal` (gleiches `openXConfirm()`/
    `closeXConfirm()`/`confirmX()`-Muster wie `openLogoutConfirm()`,
    Punkt 38) statt sofort zu löschen - `anfrageZumLoeschenId` merkt sich
    dabei, welche Anfrage gerade zur Debatte steht (analog zu
    `editingMitgliedId`). Erst der "Löschen"-Button *im Modal* ruft
    tatsächlich `supabaseClient.from('konto_anfragen').delete()` auf.
    - Neue Policy ([supabase/011-konto-anfragen-admin-delete.sql](supabase/011-konto-anfragen-admin-delete.sql),
      **noch nicht ausgeführt**), gleiches Admin-Check-Muster wie die
      SELECT-Policy aus Punkt 54.
    - Bei einem Fehler (z. B. Policy noch nicht ausgeführt) bleibt das
      Modal offen und zeigt die Fehlermeldung in `#deleteAnfrageError`,
      statt die Anfrage lokal aus der Liste zu entfernen, obwohl der
      Löschversuch serverseitig gar nicht durchging - nur bei echtem
      Erfolg wird `alleKontoAnfragen` gefiltert, neu gerendert und das
      Modal geschlossen.
    - Getestet ohne die echte Datenbank anzufassen: `supabaseClient.from()`
      im Browser gezielt für `konto_anfragen` gemockt (einmal Erfolg, einmal
      Fehler) - Erfolg entfernt die Karte korrekt aus Liste und DOM und
      schliesst das Modal, Fehler zeigt die Meldung und lässt die Anfrage
      unangetastet in der Liste stehen.

56. **Rollen-Taxonomie umgebaut: "Mitglied" ersetzt durch "Aktivmitglied"/
    "Passivmitglied", neu dazu "Gönner"; "keine Rolle" ist jetzt gültig und
    der Standard für neue Konten.** `BEKANNTE_ROLLEN` in `js/mitglieder.js`
    und die fünf Toggle-Zeilen in `pages/mitglieder.html` jetzt:
    Aktivmitglied/Passivmitglied/Ehrenmitglied/Präsident/Gönner. Die
    "Mindestens eine Rolle auswählen"-Prüfung in `saveMitgliedRollen()` ist
    komplett entfernt (nicht nur die Meldung angepasst) - ein Mitglied mit
    `rollen: []` ist ein normaler, absichtlicher Zustand (z. B. direkt nach
    dem Beitritt, bevor der Vorstand eine Mitgliedsart zuweist), keine
    Fehlermeldung mehr dafür. Passend dazu `profiles.rollen`s Spalten-
    Default von `array['Mitglied']` auf `'{}'` geändert - in `schema.sql`
    direkt sowie als eigene Migration
    ([supabase/012-rollen-taxonomie.sql](supabase/012-rollen-taxonomie.sql),
    **noch nicht ausgeführt**) für die schon laufende Datenbank.
    - Bewusst **keine** Daten-Migration für bereits vorhandene
      "Mitglied"-Zeilen (gleiches Vorgehen wie beim Entfernen von
      "Vorstand", Punkt 49): Ob eine bestehende Person eher Aktiv- oder
      Passivmitglied ist, kann nur der Vorstand inhaltlich entscheiden,
      keine automatische Regel. Das alte "Mitglied" bleibt in der
      Datenbank stehen, bis es im Rollen-Editor manuell durch eine der
      neuen Rollen ersetzt wird.
    - Getestet ohne die echte Datenbank anzufassen: alle 5 Toggle-Werte
      korrekt vorhanden (inkl. Umlaute "Präsident"/"Gönner"), Speichern mit
      allen Toggles aus ruft `admin_set_rollen` erfolgreich mit
      `neue_rollen: []` auf statt einer Fehlermeldung.

57. **"Keine Mitglieder gefunden." stand bei einer leeren Suche links statt
    zentriert.** `.mitglieder-grid` ist ein 2-/3-spaltiges CSS-Grid - die
    Meldung (ein einzelnes `<p class="section-lead">`) war darin einfach
    ein normales Grid-Item und landete dadurch nur in der ersten Spalte;
    ihr eigenes `text-align: center` zentrierte folglich nur innerhalb
    dieser schmalen Spalte, nicht über die ganze Zeile. Fix:
    `.mitglieder-grid p { grid-column: 1 / -1; }` lässt sie alle Spalten
    überspannen.

58. **Mitglieder-Grid nutzt die Bildschirmbreite jetzt sinnvoll aus, statt
    fest bei 3 Spalten und 720px Breite zu deckeln.** Auf breiten PC-
    Screens blieb bisher viel Leerraum links/rechts der Karten ungenutzt
    (720px-Deckel), gleichzeitig passten auf dem Handy nur 2 Karten pro
    Zeile. `grid-template-columns: repeat(auto-fill, minmax(100px, 1fr))`
    (ab 640px: `minmax(140px, 1fr)`) ersetzt die feste Spaltenzahl - wie
    viele Spalten reinpassen, ergibt sich automatisch aus der verfügbaren
    Breite, kein manuelles Pflegen mehrerer Breakpoints mehr nötig. Neuer
    `max-width` ist jetzt `var(--max-width)` (1200px, gleicher Wert wie der
    Rest der Seite) statt der alten 720px. `.mitglieder-avatar` dabei von
    64px auf 52px verkleinert - bei mindestens 3 Karten pro Zeile schon auf
    dem Handy liess die alte Größe dem Namen darunter kaum noch Platz.
    Getestet: 375px breit → 3 Spalten, 1400px breit → 7 Spalten, jeweils
    ohne Überlauf oder abgeschnittenen Text.

59. **Zwei Nachbesserungen zur dichteren Mitglieder-Ansicht (Punkt 58),
    beide auf Nutzer-Feedback hin:**
    - Name und Rollen-Badges in `.mitglieder-card` sind unterhalb 640px
      nochmal verkleinert (Name 0.95rem → 0.8rem, Badge 0.62rem → 0.52rem,
      Padding ebenfalls etwas knapper) - bei mindestens 3 Karten pro Zeile
      schon auf dem Handy brach z. B. "Das bist du" bisher mitten im Wort
      in zwei Zeilen um und zog dadurch die ganze Grid-Reihe unnötig in die
      Höhe (CSS Grid richtet Zeilenhöhen an der höchsten Karte aus).
    - `.eingeladene-card` (Ausstehende Einladungen/Anfragen) ist unterhalb
      768px jetzt gestapelt statt nebeneinander (Badge oben, Text/E-Mail
      darunter, beides zentriert) - die bisherige Zeilen-Anordnung liess
      der E-Mail-Adresse in der schmalen Restbreite neben dem Badge kaum
      Platz, eine lange Adresse brach dadurch mitten im Wort um (z. B.
      "nicolas.bra" / "nd.horgen" / "@icloud.co" / "m" auf vier Zeilen).

60. **Mitglieder-Karten sind unterhalb 640px jetzt annähernd quadratisch**
    statt spürbar höher als breit. `.mitglieder-card` bekommt dort
    `aspect-ratio: 1`, dazu kleinerer Avatar (52px → 40px) und knapperes
    Padding/Abstände - bei nur einem Badge (der Normalfall) kommt das
    einer echten quadratischen Karte sehr nah (gemessen 102×113px, Ratio
    1.11). `aspect-ratio` ist dabei nur ein Richtwert, kein hartes Limit:
    eine Karte mit mehreren Badges (z. B. "Das bist du" zusätzlich) wird
    weiterhin automatisch etwas höher, statt Inhalt abzuschneiden.

61. **Lokaler Autosave-Entwurf für unfertige Formulareingaben ergänzt**
    (`wireDraftInputs(storageKey, fieldIds)` / `clearDraft(storageKey)` in
    `js/site-chrome.js`, ganz oben, vor den beiden Custom-Element-Klassen
    definiert, da dieses Skript auf jeder Seite als erstes lädt) - behebt,
    dass z. B. ein auf dem Handy eingetippter, aber nie gespeicherter Name
    beim Schliessen des Tabs verloren ging (Vorbild TikTok/Instagram).
    Schreibt bei jeder Eingabe (`input`, bei Checkboxen `change`) die
    aktuellen Werte der übergebenen Feld-IDs als JSON in `localStorage`,
    stellt einen vorhandenen Entwurf beim Aufruf sofort in die Felder
    zurück. Aktuell verdrahtet: `profil-entwurf:<user-id>` (Mein Profil:
    Name/Instagram/TikTok/E-Mail-teilen, nutzerspezifischer Schlüssel wegen
    gemeinsam genutzter Geräte, gelöscht bei erfolgreichem Speichern und
    beim Abmelden), `login-entwurf` (nur `loginEmail`, gelöscht nach
    erfolgreichem Login), `konto-anfrage-entwurf` (Name/E-Mail, gelöscht
    nach erfolgreichem Absenden) und `mitglieder-suche` (reine gemerkte
    Sucheinstellung, wird nie gelöscht).
    **Bewusste, harte Grenze: nie für Passwort-Felder verwenden**
    (`loginPassword` sowie die drei Felder unter "Passwort ändern" auf
    Mein Profil bleiben unangetastet) - `localStorage` ist Klartext, für
    jedes Skript auf der Seite lesbar (z. B. bei einem künftigen XSS-Bug)
    und bleibt auf einem gemeinsam genutzten Gerät liegen, bis es manuell
    gelöscht wird. **Für jedes künftige Formularfeld, bei dem eine
    versehentlich verlorene Eingabe ärgerlich wäre** (neue Modals, neue
    Profil-Felder usw.), dieses bestehende Muster wiederverwenden -
    einfach `wireDraftInputs('<eindeutiger-key>', ['<feld-id>', ...])`
    nach dem Rendern der Felder aufrufen und `clearDraft('<key>')` beim
    erfolgreichen Absenden - statt eine eigene neue Speicher-Logik zu
    bauen. Passwort-Felder davon immer ausnehmen.

62. **Profilbild-Upload umgesetzt** (Task 9 oben) — per
    `superpowers:brainstorming`/`writing-plans` geplant, Spec und Plan liegen
    in `docs/superpowers/specs/2026-09-01-profilbild-upload-design.md` bzw.
    `docs/superpowers/plans/2026-09-01-profilbild-upload.md`. Wichtiger Fund
    beim Planen: `profiles.profilbild_url` existierte bereits seit dem
    allerersten `schema.sql`-Lauf (schon live in der Datenbank!) und wurde
    schon immer von der `public_profiles`-View mit ausgegeben - nur nie von
    der UI genutzt. Es brauchte also **keine neue Spalte**, nur den fehlenden
    zweiten Teil: einen neuen, öffentlich lesbaren Storage-Bucket `avatars`
    (`supabase/013-avatar-storage-bucket.sql`, **noch nicht ausgeführt**),
    unter dem festen Pfad `<user-id>.jpg` pro Mitglied (überschreibt sich bei
    einem neuen Upload selbst, keine verwaisten Altdateien). Schreiben
    (Hochladen/Ersetzen/Löschen) ist per RLS auf die eigene User-ID
    beschränkt, Lesen ist bewusst öffentlich (einfache `<img>`-URLs statt
    signierter URLs - wer den direkten Link kennt, kann das Bild auch ohne
    Login sehen, bewusst in Kauf genommener Kompromiss, siehe Spec).
    Verkleinerung läuft komplett automatisch per Canvas-API
    (`resizeImageToJpeg()` in `main.js`): zentrierter Quadrat-Zuschnitt auf
    200×200px JPEG (~80% Qualität) - kein eigener Zuschneide-Dialog. Neuer
    genereller Helfer `setAvatarDisplay(element, url, fallbackText)` in
    `js/site-chrome.js` schaltet an allen vier Anzeige-Orten (Mein Profil,
    Mitgliederliste, Mitglied-Modal, Topbar-Profil-Button) zwischen Foto
    (CSS-Hintergrundbild auf dem bestehenden Kreis-Element) und dem
    bisherigen Buchstaben-Kreis um - bewusst kein zusätzliches `<img>`-Tag an
    diesen Stellen, das Hintergrundbild deckt exakt denselben Platz ab.
    "Foto entfernen"-Link auf "Mein Profil" (`removeProfileAvatar()`) löscht
    Datei + setzt `profilbild_url` zurück auf `null`. Client-seitige Grenzen
    vor dem Hochladen: nur `image/*`-Dateien, max. 10 MB Originalgrösse -
    beides mit eigener Fehlermeldung statt stillem Fehlschlag, per Browser-
    Konsole verifiziert (Canvas-Verkleinerung liefert nachweislich ein
    200×200-JPEG, Nicht-Bilddatei zeigt die erwartete Fehlermeldung,
    `setAvatarDisplay()` schaltet in beide Richtungen korrekt um). Ein
    zweiter, bereits bestehender Code-Pfad in `loadOwnProfileIntoForm()`
    (setzt nach dem Wiederherstellen eines lokalen Namens-Entwurfs, siehe
    Punkt 61, den Anfangsbuchstaben erneut) musste dabei zusätzlich
    angepasst werden, sonst hätte er den Buchstaben über ein bereits
    gesetztes Hintergrundbild geschrieben (beide gleichzeitig sichtbar) -
    läuft jetzt nur noch, wenn kein `profilbild_url` gesetzt ist.
    **Bitte `supabase/013-avatar-storage-bucket.sql` im Supabase-Dashboard
    ausführen**, sonst schlägt jeder Upload-Versuch fehl (Bucket existiert
    noch nicht).

## Mitgliederbereich mit Supabase — in Arbeit

Ursprünglich eine reine Konzeptphase aus einem Brainstorming-Gespräch,
inzwischen mit einem echten Supabase-Projekt begonnen (Status der
einzelnen Schritte siehe Task-Liste unten). Nichts eigenmächtig starten
ohne Rücksprache.

**Grundidee:** Die Seite ist bisher komplett statisch, ohne eigenen Server.
[Supabase](https://supabase.com) (Postgres-Datenbank + Auth + Storage,
alles im kostenlosen Free-Tier nutzbar) soll als Backend drangehängt werden,
um einen Mitgliederbereich zu ermöglichen: eingeladene Vereinsmitglieder
können sich einloggen, sehen dort alle anderen Mitglieder (ähnlich der
Team-Seite, aber für den ganzen Verein statt nur das Kernteam) und können
ihr eigenes Profil (Social-Links, Profilbild) selbst pflegen. Die Anbindung
läuft komplett client-seitig übers Supabase-JS-SDK (per CDN, kein
Build-Schritt nötig) — passt zum bisherigen Ansatz ohne npm/Framework.
Warum Supabase statt Firebase: echtes Postgres/SQL statt NoSQL-Dokumenten,
und Zugriffsmuster wie "eigenes Profil lesen/bearbeiten, andere nur
eingeschränkt" lassen sich mit Row-Level-Security direkt in der Datenbank
abbilden statt in eigenem Code.

**Hosting-Domain wechselt noch:** Aktuell läuft die Seite auf
`n-brand.github.io/new-swan-design` (GitHub Pages, provisorisch), final soll
sie unter `swancalisthenics.github.io/home` laufen (Projektname dann
vermutlich "home", vermutlich als Nachfolger des jetzigen `home`-Projekts).
Geplantes Vorgehen: Supabase-Projekt zuerst gegen die aktuelle,
provisorische URL konfigurieren und darauf entwickeln/testen, dann später
auf die finale Domain umziehen. Das ist unproblematisch, da die
"Site URL"/"Redirect URLs" in den Supabase-Auth-Einstellungen reine
Konfigurationswerte sind, jederzeit änderbar (Supabase erlaubt auch mehrere
gleichzeitig erlaubte Redirect-URLs für eine Übergangsphase) — das
Supabase-Projekt selbst (Datenbank, API-Key) hängt nicht an einer
bestimmten Domain.

**Zugriff nur für echte Mitglieder:** Kein offenes Registrierungsformular.
Stattdessen lädt ein Vorstandsmitglied jede Person einzeln über Supabase
ein (`inviteUserByEmail`, direkt im Supabase-Dashboard möglich, kein
eigener Code nötig) — es gibt gar keinen öffentlichen Einstiegspunkt, über
den sich jemand Unbefugtes ein Konto erstellen könnte.

**Passwörter:** Werden ausschliesslich von Supabase Auth verwaltet, nie
selbst gespeichert oder geloggt. Supabase hasht Passwörter serverseitig
(bcrypt o.ä.) — weder der Vereins-Betreiber noch Supabase selbst können je
das Klartext-Passwort einsehen.

**Idee (noch nicht eingeplant): Sicherheits-Benachrichtigungsmails**
("Passwort wurde geändert", "neue Anmeldung von Gerät/Ort X"). Technisch
machbar, aber kein Supabase-Bordmittel — Supabase verschickt automatisch nur
bestimmte Auth-Mails (Bestätigung, Passwort-Reset-Link, Magic Link), keine
freien Sicherheits-Hinweise. Bräuchte zusätzlich: eine Edge Function plus
einen externen Mail-Versand-Dienst (z. B. Resend, kostenloses Kontingent
reicht locker), ausgelöst über einen Datenbank-Trigger. Die Orts-/Geräte-
Erkennung beim Login wäre nochmal ein eigenes, deutlich aufwändigeres
Stück (IP-Geolocation, eigene Login-Events-Tabelle) — falls gewünscht,
eher als separates, späteres Feature planen statt zusammen mit dem
Passwort-Ändern-Formular.

**Profilbild-Upload:** Eigenes Foto hochladen, direkt im Browser per
Canvas-API vor dem Upload verkleinert/komprimiert (kein kostenpflichtiges
Supabase-Feature nötig — die eingebaute Bild-Transformation ist Teil des
bezahlten Pro-Plans), landet in Supabase Storage.

**Rechte:** Postgres Row-Level-Security sorgt dafür, dass jedes Mitglied nur
sein eigenes vollständiges Profil lesen und bearbeiten darf. Die
Mitgliederliste für alle läuft über eine eigene `public_profiles`-View
(siehe E-Mail-Privatsphäre unten) — kein pauschales "jeder darf alles
lesen" mehr auf der Tabelle selbst.

**E-Mail: pflicht im Profil, aber privat per Default.** Jedes Mitglied hat
eine E-Mail (kommt vom eigenen Supabase-Auth-Konto, deshalb Pflichtfeld),
die aber standardmässig nicht für andere Mitglieder sichtbar ist. Ein
Toggle im eigenen Profil ("E-Mail mit anderen teilen") kann das gezielt
freigeben. Technisch über die `public_profiles`-View gelöst: sie gibt die
E-Mail nur aus, wenn `email_oeffentlich = true` ist, sonst `NULL` — dieselbe
"nicht anzeigen, wenn nicht gesetzt"-Logik wie bei Instagram/TikTok, kein
Sonderfall in der Render-Logik nötig. Eine reine Anwendungslogik (Spalte
in der UI einfach weglassen) hätte nicht gereicht, da der Supabase-Anon-Key
öffentlich im Frontend liegt — ohne die View könnte jeder mit Entwickler-
Tools trotzdem direkt `select email from profiles` abfragen.

**Rollen:** Freitext-Spalte `rolle` (kein festes Enum, damit neue Rollen
ohne Schema-Änderung dazukommen), aktuell verwendet: Admin, Vorstand,
Mitglied, Ehrenmitglied. Wird vom Vorstand vergeben, nicht vom Mitglied
selbst — taucht deshalb nicht im "Mein Profil"-Formular auf. **Noch offen:**
Die aktuelle Update-Policy erlaubt einem Mitglied technisch, auch die
eigene `rolle` zu ändern (z. B. sich selbst zu Admin zu machen) — vor dem
produktiven Einsatz muss das per Trigger oder einer separaten, nur vom
Vorstand beschreibbaren Tabelle abgesichert werden (siehe Kommentar in
`supabase/schema.sql`).

**Eigenes Profil erscheint in der Mitgliederliste mit.** Die
`public_profiles`-View filtert die eigene Zeile nicht raus — wer eingeloggt
ist, sieht sich selbst also mit in der Liste, zusätzlich mit einem
"Das bist du"-Badge markiert (Vergleich der Zeilen-ID mit der eigenen
User-ID aus der Session, nicht in den Daten selbst gespeichert).

**Demo- vs. echte Version:** Jede Stelle, die eigentlich Supabase braucht
(Login absenden, Profil speichern, Mitgliederliste laden), hat zwei
Versionen im Code: eine aktive Demo-Version (Platzhalter-Daten bzw. ein
ehrlicher "noch nicht aktiv"-Hinweis) und eine daneben auskommentierte
echte Version mit dem fertigen Supabase-Aufruf. Sobald Schritt 1+2 stehen:
in `js/main.js` (`handleLoginSubmit`, `handleProfileSubmit`) und
`js/mitglieder.js` jeweils die Demo-Version löschen und die echte Version
darunter aktivieren (auskommentieren) — die echten Versionen sind bereits
fertig geschrieben, nicht nur Stubs.

**Navigation für eingeloggte User:** Um die Haupt-Navigation (Home/Blog/
Team/Verein/Kontakt) unverändert und schlank zu halten, bekommt weder
"Mitglieder" noch "Mein Profil" einen eigenen Tab — stattdessen bündelt ein
einzelnes Profil-Icon in der Topbar alle Account-Funktionen. Ausgeloggt
zeigt es ein generisches Login-Symbol und öffnet das Login-Formular;
eingeloggt wird daraus das eigene Profilbild, ein Klick öffnet ein
Dropdown mit "Mitglieder", "Mein Profil" und "Abmelden". So bleibt die
Haupt-Nav immer gleich gross, egal wie viele Account-Funktionen später
noch dazukommen. Position in der Topbar: das Profil-Icon steht ganz
rechts (äusserste Position), der Dark/Light-Mode-Toggle sitzt direkt
daneben links davon — umgesetzt, siehe Punkt 18 unten.

### Einzelne Tasks (Reihenfolge als Vorschlag)

1. Supabase-Projekt anlegen (Free-Tier), Projekt-URL + Public-API-Key notieren
   — **umgesetzt**, Projekt "homepage" (Frankfurt/eu-central-1).
2. Supabase-JS-SDK per CDN einbinden, Client mit URL + Key initialisieren —
   **umgesetzt** ([js/supabase-client.js](js/supabase-client.js), auf allen
   9 Seiten vor `main.js` eingebunden). Projekt heisst "homepage"
   (Frankfurt/eu-central-1), Verbindung getestet: Abfrage gegen
   `public_profiles` kam echt vom Server zurück ("Tabelle existiert nicht"
   — erwartet, da Schritt 3+4 noch nicht ausgeführt sind).
3. Tabelle `profiles` anlegen (Name, E-Mail, Rollen, Instagram/TikTok,
   Profilbild-URL, verknüpft mit der Supabase-Auth-User-ID) — **umgesetzt**,
   SQL-Skript in [supabase/schema.sql](supabase/schema.sql) im Supabase
   SQL-Editor ausgeführt ("Success"). `rolle` wurde dabei noch zu `rollen`
   (Text-Array statt einzelnem Text) geändert, damit ein Mitglied mehrere
   Rollen gleichzeitig haben kann; `erstellt_am` zu `beigetreten_am`
   umbenannt.
4. Row-Level-Security-Policies + `public_profiles`-View einrichten: eigenes
   Profil voll lesen/schreiben, andere Mitglieder nur über die View (blendet
   private E-Mail automatisch aus) — **umgesetzt**, im selben Skript wie
   Punkt 3, inkl. offenem Punkt zur `rollen`-Absicherung (siehe Kommentar im
   Skript). Verifiziert: Eine Abfrage ohne Login liefert jetzt korrekt
   "permission denied" statt Daten (RLS/Grants greifen wie geplant) - das
   ist das erwartete, richtige Verhalten fuer nicht eingeloggte Besucher,
   kein Bug.
5. Profil-Icon ganz rechts in der Topbar ergänzen (Dark/Light-Toggle rückt
   dafür ein Stück nach links), zeigt ausgeloggt ein Login-Symbol → öffnet
   Login-Formular (E-Mail + Passwort); eingeloggt das eigene Profilbild →
   öffnet Dropdown mit "Mitglieder"/"Mein Profil"/"Abmelden" — **umgesetzt**
   für den ausgeloggten Zustand (siehe Punkt 18 unten), der eingeloggte
   Zustand (Avatar + Dropdown) folgt zusammen mit Schritt 6, sobald es
   echte Sessions gibt.
6. Einladungs-Workflow statt Sign-up-Formular: Mitglieder werden einzeln
   über das Supabase-Dashboard eingeladen.
7. Neue Seite "Mitglieder" (erreichbar über das Profil-Dropdown, kein
   eigener Nav-Punkt), inkl. Namenssuche und Rollen-Filter — **umgesetzt,
   liest echte Daten** ([pages/mitglieder.html](pages/mitglieder.html),
   [css/pages/mitglieder.css](css/pages/mitglieder.css),
   [js/mitglieder.js](js/mitglieder.js)). Bewusst **kein** Team-Karten-Layout
   (`.people-grid`/`.person-card`) — dort wären die Karten für potenziell
   viele Mitglieder zu gross. Stattdessen ein eigenes, kompaktes
   `.mitglieder-grid` (2 Spalten schon mobil, kleinere Badges) mit nur
   Foto/Name/Rolle pro Karte; ein Klick/Tap öffnet `#mitglied-modal` mit den
   vollständigen Details der einen angeklickten Person (Social-Links,
   E-Mail-Icon falls geteilt, "Profil ansehen ↗"-Link falls `isSelf`).
   Datenquelle liest aktuell `DEMO_MITGLIEDER` statt Supabase (siehe
   "Demo- vs. echte Version" oben).
8. Formular "Eigenes Profil bearbeiten" (Name, E-Mail + Teilen-Toggle,
   Social-Links; Rolle bewusst nicht editierbar) — **umgesetzt, liest und
   speichert echte Daten** ([pages/mein-profil.html](pages/mein-profil.html)).
   Inkl. separatem Formular "Passwort ändern" (aktuelles Passwort, neues
   Passwort, Bestätigung) — der Passwort-Abgleich (stimmen "neu" und
   "bestätigen" überein?) läuft schon jetzt echt clientseitig, da das kein
   Backend braucht; das eigentliche Ändern zeigt wie beim Rest den
   "noch nicht aktiv"-Hinweis. Die echte Version verifiziert das aktuelle
   Passwort zusätzlich per `signInWithPassword()`, bevor sie es per
   `updateUser()` ändert — Supabase würde sonst auch ohne erneute Eingabe
   des alten Passworts erlauben, ein neues zu setzen (reicht eine gültige
   Session). Liegt in einem nativen `<details>`/`<summary>` (Passwort ändern
   ist eine seltene Aktion, standardmässig eingeklappt, kein JS nötig zum
   Auf-/Zuklappen) — das Ein-/Ausblenden ist zusätzlich per `.password-details:not([open])
   form { display: none; }` explizit erzwungen, weil sich das reine
   native Verhalten beim Testen nicht auf jeder Engine verlässlich genug
   verhielt. Ab 768px stehen "Eigene Angaben" und "Passwort ändern" dank
   `.profile-layout` (Flex-Row) nebeneinander statt übereinander, mobil
   bleibt es gestapelt.
9. Profilbild-Upload: Storage-Bucket einrichten, Verkleinerung per
   Canvas-API vor dem Upload, Anzeige als Profilbild — **umgesetzt**, siehe
   Punkt 62 unten.
10. Logout-Funktion — **umgesetzt** (`openLogoutConfirm()`/`closeLogoutConfirm()`/
    `confirmLogout()` in `main.js`, Teil des Profil-Dropdowns mit
    Bestätigungsdialog, siehe Punkt 29 und 38).
11. **Datenschutzerklärung/Impressum aktualisieren** (`pages/rechtliches.html`):
    Sobald der Mitgliederbereich live geht, verarbeitet die Seite erstmals
    echte personenbezogene Daten (Name, E-Mail, Profilbild, Social-Links,
    Supabase-Session-Cookies/`localStorage`) statt nur statischer Inhalte —
    die aktuellen Datenschutz-/Cookie-Angaben decken das noch nicht ab und
    müssen entsprechend ergänzt werden, bevor das Feature produktiv genutzt
    wird.
12. **Erledigt:** Der testweise Link auf "Community" im Hero-Fliesstext
    (zeigte direkt auf `pages/mitglieder.html`, mit `TEMP`-Kommentar
    markiert) wurde entfernt, jetzt wo der echte Zugang über das
    Profil-Dropdown steht (Punkt 29) — wieder reiner Fliesstext ohne Link
    oder Akzentfarbe.
13. **Nicht-angemeldet-Zustand für `mitglieder.html` und `mein-profil.html`**
    — **umgesetzt** (`#notLoggedIn`-Block + `initAuthGate()` in `main.js`).
    Wichtige Unterscheidung: Die HTML-Seiten selbst sind bei statischem
    Hosting (GitHub Pages) immer öffentlich abrufbar, das lässt sich nicht
    verhindern. Was Supabase tatsächlich schützt, sind die Daten — die
    RLS-Policy liefert ohne gültige eingeloggte Session nichts zurück. Damit
    ein nicht angemeldeter Besucher, der den Link trotzdem öffnet, keine
    leere/kaputte Ansicht sieht, prüfen beide Seiten vor dem eigentlichen
    Laden der Daten per `supabase.auth.getSession()` (und
    `onAuthStateChange` für spätere Login-/Logout-Wechsel ohne Reload): ohne
    gültige Session einen "Du bist nicht angemeldet"-Hinweis mit
    Login-Button zeigen (`#notLoggedIn`), erst bei vorhandener Session den
    eigentlichen Inhalt (`#mitgliederContent` bzw. `#profileLayout`)
    einblenden. Getestet: Ohne Session bleibt der Inhalt korrekt
    ausgeblendet auf beiden Seiten.

## ⚠️ Geplant (Entwurf, noch nicht umgesetzt): Trainings-Anmeldung

**Diese ganze Sektion ist eine reine Notiz aus einem Brainstorming und soll
später wieder gelöscht werden** — entweder sobald die Idee wirklich umgesetzt
wird (dann gehört die Doku zur echten Implementierung, nicht hierher) oder
falls sie verworfen wird. Nichts davon eigenmächtig starten ohne Rücksprache.

**Grundidee:** Mitglieder sollen sich für ein bevorstehendes Training
freiwillig anmelden können ("Ich komme") und sehen, welche anderen
Mitglieder sich schon angemeldet haben — knüpft an die bestehende
"Zeiten"-Sektion auf `index.html` an, die die Trainingszeiten bereits
öffentlich zeigt. Baut auf dem geplanten Supabase-Mitgliederbereich weiter
oben auf (braucht Login, `profiles`-Tabelle).

**Grobe Bausteine:**
- Neue Tabelle `trainings` (Datum/Uhrzeit, optional Ort) — vom Vorstand
  gepflegt, ähnlich wie `rolle` bei `profiles` kein Feld fürs Mitglied selbst.
- Neue Tabelle `training_anmeldungen` (verweist auf `trainings` und
  `profiles`, je eine Zeile pro Anmeldung) — ein Mitglied darf nur die
  eigene Zeile anlegen/löschen ("Ich komme" an/aus), aber alle Zeilen zu
  einem Training lesen (wer kommt sonst noch).
- UI: "Nächstes Training: [Datum]" mit "Ich komme"-Button, darunter eine
  Liste/Reihe der angemeldeten Mitglieder (gleiche kleine Avatar-Bausteine
  wie auf `pages/mitglieder.html`).
- Wer angemeldet ist, ist nur für eingeloggte Mitglieder sichtbar — die
  Trainingszeit selbst bleibt öffentlich wie bisher, nur die Anmeldeliste
  ist neu und mitgliederbeschränkt.

**Weitere Ideen für den Login, noch unausgearbeitet** (nur gesammelt, keine
davon geplant):
- Vereinsdokumente (`pages/verein.html`) erst nach Login freischalten statt
  öffentlich als Platzhalter.
- Internes Ankündigungsbrett für Mitglieder (z. B. Vorstand postet
  Terminänderungen).
- Mitglieder laden selbst Fotos für den Community-Slider hoch, statt dass
  das nur manuell gepflegt wird.

## Offene Punkte für die Zukunft

Reine Themen-Merkzettel, noch nicht bearbeitet - nichts davon eigenmächtig
starten ohne Rücksprache (gleiche Regel wie beim Supabase-Mitgliederbereich
oben).

1. **Google Analytics einbinden.** Kollidiert aktuell direkt mit der
   Datenschutzerklärung (`pages/rechtliches.html`), die ausdrücklich
   behauptet: "Wir betreiben kein Backend, nutzen keine Cookies und
   verwenden keine Webanalyse- oder Tracking-Tools (wie Google Analytics)."
   Diese Aussage stimmt inzwischen ohnehin nicht mehr ganz (das
   Supabase-Backend existiert bereits) - die Datenschutzerklärung muss vor
   oder spätestens zusammen mit Google Analytics überarbeitet werden (siehe
   auch Punkt 11 in der Supabase-Task-Liste oben, dort aus einem anderen,
   ebenfalls noch offenen Grund). Ausserdem je nach Umsetzung
   Cookie-Consent-Pflicht (Schweiz/EU) zu prüfen, sobald es konkret wird.
2. **Supabase-Projekt pausiert nach Inaktivität, braucht dann ca. 1 Minute
   zum Aufwachen.** Der kostenlose Supabase-Tier pausiert ein Projekt nach
   ca. 7 Tagen ganz ohne Anfragen; die erste Anfrage danach weckt es wieder
   auf, kann dabei aber bis zu etwa einer Minute brauchen, bevor Login/
   Mitgliederliste/Profil wie gewohnt reagieren. Ohne Erklärung im Frontend
   wirkt das für ein Mitglied, das die Seite selten besucht, wie ein
   Absturz oder eine kaputte Seite. Noch zu klären: an welcher Stelle genau
   ein Hinweis/Ladezustand dafür sinnvoll ist (z. B. beim Login-Versuch,
   falls die erste Supabase-Anfrage ungewöhnlich lange braucht oder
   fehlschlägt) und wie der Hinweistext dafür aussehen soll.
3. **Backup der Supabase-Tabellen und -User.** Aktuell existiert keine
   eigene Sicherung von `profiles` (bzw. der übrigen Tabellen) oder der
   `auth.users`-Konten ausserhalb dessen, was Supabase selbst intern
   vorhält - noch zu klären, wie (z. B. regelmässiger Datenbank-Dump,
   Supabase-eigene Backup-Funktion je nach Tarif) und wie oft.
4. **Beim ersten Anmelden müssen Nutzungsbedingungen akzeptiert werden.**
   Aktuell gibt es dafür keinen Mechanismus - ein neu eingeladenes
   Mitglied setzt per `#set-password-modal` sein Passwort und ist danach
   direkt drin, ohne je etwas zugestimmt zu haben. Noch zu klären: wo der
   eigentliche Text der Nutzungsbedingungen herkommt/liegt (eigene neue
   Seite? Teil von `pages/rechtliches.html`?), wie die Zustimmung
   gespeichert wird (z. B. ein Zeitstempel-Feld auf `profiles`), und ob das
   Modal direkt an den bestehenden Passwort-setzen-Schritt drangehängt wird
   oder als eigener, separater erster Schritt danach läuft.
5. **Tutorial für neue Nutzer.** Eine Art geführte Einführung, die neuen
   Mitgliedern die Seite (Mitgliederbereich, eigenes Profil, Rollen usw.)
   erklärt - naheliegend zusammen mit Punkt 4 als Teil des "erstes Login"-
   Ablaufs, aber noch nicht festgelegt, ob wirklich in einem Schritt oder
   getrennt. Form (z. B. Schritt-für-Schritt-Overlay, einmaliges
   Willkommens-Modal, eigene Hilfe-Seite) ist noch offen.
6. **Ein Postfach.** Noch unausgearbeitet, was genau das umfassen soll (z. B.
   Nachrichten zwischen Mitgliedern, oder eher ein Ankündigungsbrett vom
   Vorstand an alle - siehe die verwandte, ebenfalls noch unausgearbeitete
   Idee weiter oben unter "Weitere Ideen für den Login").

## Code-Stil

- 4-Leerzeichen-Einrückung durchgängig in HTML/CSS/JS.
- Kebab-Case für CSS-Klassen, camelCase für JS-Bezeichner, deutsche Texte/
  Kommentare wie im Rest des Projekts (`home`).
- Neue Icons: als `.icon-{name}`-Mask-Regel in `components.css` ergänzen (siehe
  „Icon-System" oben), nicht als `<img>` mit hartkodierter Farbe einbinden.
- Neue Farben: als CSS-Variable in `css/base.css` (`:root`) ergänzen, dort auch
  gleich den Dark-Mode-Wert mitpflegen.
- Neue Formularfelder, bei denen eine versehentlich verlorene Eingabe ärgerlich
  wäre: `wireDraftInputs('<key>', ['<feld-id>', ...])` (in `js/site-chrome.js`,
  siehe Punkt 61) wiederverwenden statt eigener Speicher-Logik, `clearDraft('<key>')`
  beim erfolgreichen Absenden aufrufen. Passwort-Felder dabei immer ausnehmen.
