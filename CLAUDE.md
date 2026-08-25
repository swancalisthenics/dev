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

## Geplant: Mitgliederbereich mit Supabase (Konzept, noch nicht begonnen)

Reine Konzeptphase aus einem Brainstorming-Gespräch — nichts davon ist
umgesetzt, nichts davon eigenmächtig starten ohne Rücksprache.

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
   — **offen, muss der Vereins-/Projektinhaber selbst machen** (Konto-
   Erstellung bei einem Drittanbieter).
2. Supabase-JS-SDK per CDN einbinden, Client mit URL + Key initialisieren —
   **offen**, bewusst zurückgestellt bis ein echtes Projekt (Schritt 1)
   existiert, gegen das sich der Code testen lässt.
3. Tabelle `profiles` anlegen (Name, E-Mail, Rolle, Social-Links,
   Profilbild-URL, verknüpft mit der Supabase-Auth-User-ID) — **vorbereitet**,
   fertiges SQL-Skript in [supabase/schema.sql](supabase/schema.sql), muss
   nach Schritt 1 einmalig im Supabase SQL-Editor ausgeführt werden.
4. Row-Level-Security-Policies + `public_profiles`-View einrichten: eigenes
   Profil voll lesen/schreiben, andere Mitglieder nur über die View (blendet
   private E-Mail automatisch aus) — **vorbereitet**, im selben Skript wie
   Punkt 3 enthalten, inkl. offenem Punkt zur `rolle`-Absicherung (siehe
   Kommentar im Skript).
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
   eigener Nav-Punkt), inkl. Namenssuche und Rollen-Filter — **umgesetzt mit
   Platzhalter-Daten** ([pages/mitglieder.html](pages/mitglieder.html),
   [css/pages/mitglieder.css](css/pages/mitglieder.css),
   [js/mitglieder-data.js](js/mitglieder-data.js),
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
   Social-Links; Rolle bewusst nicht editierbar) — **umgesetzt mit
   Platzhalter-Daten** ([pages/mein-profil.html](pages/mein-profil.html)).
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
   Canvas-API vor dem Upload, Anzeige als Profilbild.
10. Logout-Funktion.
11. **Datenschutzerklärung/Impressum aktualisieren** (`pages/rechtliches.html`):
    Sobald der Mitgliederbereich live geht, verarbeitet die Seite erstmals
    echte personenbezogene Daten (Name, E-Mail, Profilbild, Social-Links,
    Supabase-Session-Cookies/`localStorage`) statt nur statischer Inhalte —
    die aktuellen Datenschutz-/Cookie-Angaben decken das noch nicht ab und
    müssen entsprechend ergänzt werden, bevor das Feature produktiv genutzt
    wird.
12. **⚠️ Vor Livegang entfernen:** Auf `index.html` verlinkt das Wort
    "Community" im Hero-Fliesstext testweise direkt auf
    `pages/mitglieder.html` (mit `TEMP`-Kommentar im Code markiert) — reiner
    Test-Zugang, solange die Seite sonst nirgends erreichbar ist. Muss weg,
    sobald der echte Zugang über das Profil-Dropdown steht.
13. **Nicht-angemeldet-Zustand für `mitglieder.html` und `mein-profil.html`
    fehlt noch.** Wichtige Unterscheidung: Die HTML-Seiten selbst sind bei
    statischem Hosting (GitHub Pages) immer öffentlich abrufbar, das lässt
    sich nicht verhindern. Was Supabase tatsächlich schützt, sind die
    Daten — die RLS-Policy liefert ohne gültige eingeloggte Session nichts
    zurück. Damit ein nicht angemeldeter Besucher, der den Link trotzdem
    öffnet, keine leere/kaputte Ansicht sieht, braucht beide Seiten vor dem
    eigentlichen Laden der Daten einen Check per `supabase.auth.getSession()`
    (bzw. `onAuthStateChange`): ohne gültige Session einen
    "Bitte melde dich an"-Hinweis mit Login-Anstoss zeigen, erst bei
    vorhandener Session die Mitgliederliste/das Profilformular überhaupt
    abfragen. Noch nicht gebaut — die Demo-Version zeigt aktuell
    unbedingt die Platzhalter-Daten, ohne diesen Check.

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

## Code-Stil

- 4-Leerzeichen-Einrückung durchgängig in HTML/CSS/JS.
- Kebab-Case für CSS-Klassen, camelCase für JS-Bezeichner, deutsche Texte/
  Kommentare wie im Rest des Projekts (`home`).
- Neue Icons: als `.icon-{name}`-Mask-Regel in `components.css` ergänzen (siehe
  „Icon-System" oben), nicht als `<img>` mit hartkodierter Farbe einbinden.
- Neue Farben: als CSS-Variable in `css/base.css` (`:root`) ergänzen, dort auch
  gleich den Dark-Mode-Wert mitpflegen.
