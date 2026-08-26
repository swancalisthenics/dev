# Shared Site-Chrome via Custom Elements (Topbar, Login-Modal, Logout-Modal)

## Problem

`new-swan-design` ist eine statische Vanilla-HTML/CSS/JS-Seite ohne
Build-Schritt und muss weiterhin direkt per `file://` funktionieren (bewusste
Projektentscheidung, siehe CLAUDE.md "Überblick"). Drei Markup-Blöcke liegen
dabei identisch dupliziert in allen 9 HTML-Seiten (`index.html`,
`pages/*.html`, `pages/blog/*.html`):

- die Topbar-Navigation (`<header class="topbar">...</header>`, ~33 Zeilen)
- das Login-Modal (`#login-modal`)
- das Logout-Bestätigungs-Modal (`#logout-confirm-modal`)

Jede Änderung an einem dieser Blöcke bedeutet 9x identische Handbearbeitung
(siehe CLAUDE.md Punkt 41 als konkretes, bereits eingetretenes Beispiel).
Ziel: die Duplikation auflösen, ohne `file://` zu brechen und ohne einen
Build-Schritt einzuführen.

**Ausdrücklich ausgeschlossen:** ein simples `fetch()` einer lokalen
HTML-Partial-Datei - das wird von Chrome/Edge/Firefox unter `file://` per
CORS blockiert ("Cross origin requests are only supported for HTTP"), da
`fetch()`/`XMLHttpRequest` auf lokale Dateien aus Sicherheitsgründen gesperrt
sind. Aus demselben Grund scheidet `<script type="module">` aus - Module-
Loading unterliegt in Chrome denselben Cross-Origin-Beschränkungen wie
`fetch()`, auch für rein lokale Dateien ohne echten Cross-Origin-Bezug.

## Entscheidung

Zwei neue Custom Elements (`window.customElements.define(...)`), definiert in
einer neuen Datei `js/site-chrome.js`, füllen ihr `innerHTML` aus einem
Template-String - keine externe `.html`-Datei, kein `fetch()`, also kein
CORS-Problem. Kein Shadow DOM, damit das bestehende globale CSS
(`.topbar`, `.profile-dropdown`, `.modal-overlay` usw.) unverändert weiter
greift.

- **`<site-topbar>`** ersetzt den kompletten `<header class="topbar">`-Block.
- **`<site-account-modals>`** ersetzt `#login-modal` + `#logout-confirm-modal`
  zusammen (stehen im Quelltext aller 9 Seiten immer direkt hintereinander,
  daher ein gemeinsames Element statt zwei getrennter).

### Warum nicht die vom Nutzer vorgeschlagenen Alternativen

- **Synchrones `document.write()` per `<script src>`:** funktioniert
  timing-technisch genauso wie Custom Elements (beides läuft synchron beim
  Parsen), bietet aber keinen Vorteil und ein zusätzliches Risiko: ruft man
  `document.write()` auf, nachdem die Seite fertig geladen ist, löscht das
  die komplette Seite. Ein stiller Fallstrick, falls später aus Gewohnheit
  `defer` an den Script-Tag ergänzt wird.
- **Optionales, manuelles Sync-Skript** (Quelle-der-Wahrheit-Partials +
  Skript, das die 9 Dateien überschreibt): geprüft und für tragfähig
  befunden, aber verworfen zugunsten von Custom Elements, weil es
  Entwickler-Disziplin voraussetzt (Skript nach jeder Partial-Änderung
  wirklich ausführen, sonst genau die Drift, die vermieden werden soll) und
  ein neues Tooling-Konzept in ein bewusst werkzeugfreies Projekt einführt.
  Vorteil wäre ein zur Laufzeit unverändertes, 100% inertes HTML gewesen -
  dieser Vorteil wiegt den Nachteil aber nicht auf, da Custom Elements
  praktisch kein Laufzeitrisiko haben (siehe Timing unten).
- **Duplikation akzeptieren:** löst das eigentliche, bereits mehrfach
  aufgetretene Problem nicht.

## Architektur

### Timing-Garantie

Alle bestehenden `<script>`-Tags im Projekt sind synchrone Classic-Scripts
(kein `defer`/`async`). `main.js` hat Top-Level-Code, der sofort beim
Ausführen Topbar-Elemente abfragt (`document.getElementById('backToTop')`
u.a., main.js:111). Custom Elements werden beim Parsen synchron "upgraded"
und ihr `connectedCallback()` feuert sofort, sobald `customElements.define()`
aufgerufen wurde - unabhängig davon, ob das Tag vor oder nach diesem Aufruf
geparst wurde (der Browser rüstet bereits geparste, aber noch unbekannte
Custom-Element-Tags automatisch nach). Damit ist garantiert, dass Topbar und
Modals vollständig im DOM stehen, bevor `main.js` seinen Code ausführt -
unabhängig von der genauen Platzierung des `site-chrome.js`-Script-Tags.

Trotzdem: `<script src="{tiefe}js/site-chrome.js">` kommt in den `<head>`,
direkt nach dem bestehenden Inline-Theme-Skript (das dort aus demselben
Grund liegt: Flackern beim Laden vermeiden). Das ist die robusteste
Platzierung und folgt einem bereits im Projekt etablierten Muster, auch wenn
es technisch auch an der Position der übrigen Scripts (ganz unten, vor
`main.js`) funktionieren würde.

### Pfad-Auflösung über `data-base`

Neues Attribut `data-base` auf `<body>`, analog zum bestehenden `data-page`
(CLAUDE.md, Implementierungs-Entscheidung 1: Seiten-Metadaten stehen auf
`<body>`, JS liest sie von dort - nicht über Href-Parsing).

| Seiten-Tiefe | Beispieldatei | `data-base` |
|---|---|---|
| 0 (Root) | `index.html` | `""` |
| 1 | `pages/*.html` | `"../"` |
| 2 | `pages/blog/*.html` | `"../../"` |

Alle Links/Assets im Template werden **root-relativ** geschrieben und mit
`data-base` prefixiert (`${base}pages/team.html`, `${base}pages/blog/blog.html`,
`${base}assets/images/logo.png`, `${base}index.html#home` usw.) - nicht
"aktueller Ordner"-relativ wie es die bestehenden Einzeldateien heute
teilweise sind (z. B. verlinkt `pages/blog/post.html` die Blog-Übersicht
aktuell als kurzes `blog.html`, da beide im selben Ordner liegen). Mit
root-relativen Pfaden + `data-base`-Prefix funktioniert exakt eine Formel für
alle 9 Seiten unabhängig von ihrer Tiefe - der einzige Nachteil ist ein
etwas längerer Pfad in Fällen, wo der aktuelle kurze Pfad ausgereicht hätte
(rein kosmetisch, keine funktionale Einbusse).

### Migration pro Datei (alle 9 betroffenen Seiten)

1. `data-base="..."` zum `<body>`-Tag ergänzen (Wert je nach Tiefe, siehe Tabelle).
2. Topbar-Block (`<header class="topbar">...</header>`) → `<site-topbar></site-topbar>`.
3. Login+Logout-Modal-Block (`#login-modal` + `#logout-confirm-modal`) → `<site-account-modals></site-account-modals>`.
4. `<script src="{tiefe}js/site-chrome.js"></script>` in den `<head>` ergänzen.

Alles andere (Seiteninhalt in `<main>`, Footer, Tab-Bar, restliche Scripts)
bleibt unverändert.

## Was sich NICHT ändert

- **CSS:** keine Änderung nötig. Das von den Custom Elements erzeugte DOM ist
  identisch zum heutigen statischen Markup (gleiche Klassen/IDs), alle
  bestehenden Regeln inkl. `@media`-Breakpoints greifen unverändert.
- **`main.js`, `mitglieder.js` und alle anderen Skripte:** keine Änderung
  nötig. Sie fragen Elemente per ID/Klasse ab, unabhängig davon, ob diese
  Elemente aus statischem HTML oder aus einem Custom Element stammen -
  `setActiveNav()`, `updateProfileToggleUI()`, `handleLoginSubmit()` usw.
  funktionieren unverändert weiter.
- **Footer und mobile Tab-Bar:** sind ebenfalls dupliziert, aber nicht Teil
  dieser Anfrage - könnten später mit demselben Muster nachgezogen werden.

## Fehlerbehandlung / Randfälle

Kein Netzwerk, keine Nutzereingabe in diesem Feature - die einzige denkbare
Fehlerquelle wäre ein Browser ohne Custom-Elements-Unterstützung. Das
Projekt setzt bereits deutlich modernere CSS-Features voraus (`:has()`,
`backdrop-filter`), Custom Elements sind seit ~2018 in allen evergreen
Browsern nativ unterstützt (Safari 10.1+, Chrome 54+, Firefox 63+) - kein
Polyfill, keine Fallback-Behandlung nötig.

## Testing-Plan

- Alle 9 Seiten im Browser: Topbar erscheint korrekt, aktiver Nav-Zustand
  korrekt (`data-page`), Login-Dialog öffnet/schliesst, Logout-Bestätigung
  öffnet/schliesst, Profil-Dropdown nach simuliertem Login-Zustand
  funktioniert, responsives Verhalten (mobil/Desktop-Breakpoint) unverändert,
  keine Konsolenfehler.
- **Explizit auch echtes `file://`-Öffnen** (nicht nur über den lokalen
  Testserver) - das ist der eigentliche Zweck der Übung und muss direkt
  verifiziert werden, nicht nur angenommen werden.
- Stichprobenartige Prüfung der `data-base`-Pfadauflösung auf allen 3
  Tiefen-Stufen (Root, `pages/`, `pages/blog/`).

## Nicht Teil dieser Spec

- Footer- und Tab-Bar-Deduplizierung (siehe oben).
- Der separate, kleine CSS-Vorschlag (`.field-info-toggle` /
  `.password-toggle-visibility` zu einer gemeinsamen Basisklasse
  zusammenlegen) - eigenständige, unabhängige Bounded-Änderung, nicht Teil
  dieser Architekturentscheidung.
