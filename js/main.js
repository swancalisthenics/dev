// --- DARK MODE TOGGLE ---
// Reihenfolge: gespeicherte Wahl (localStorage) > Systemeinstellung > hell.
// Ein Inline-Skript im <head> jeder Seite setzt data-theme bereits vor dem
// ersten Render, damit kein falsches Theme kurz aufblitzt - dieser Block
// verdrahtet nur noch den Klick-Handler und hält mehrere Toggle-Buttons
// (z.B. bei spaeteren Layout-Aenderungen) synchron.
function isDarkActive() {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit) return explicit === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function updateThemeToggleState() {
    const dark = isDarkActive();
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(dark));
    });
}

// Haelt die theme-color-Meta-Tags (Browser-UI-Farbe, u.a. sichtbar im
// iOS-Overscroll-Bounce oben) mit dem aktiven Theme synchron. Die Tags selbst
// tragen `media`-Queries fuer den Fall "keine explizite Wahl" (folgt dann rein
// per CSS der Systemeinstellung); bei explizitem Toggle wird hier eine der
// beiden Queries hart auf "all"/"not all" gesetzt, damit sie das System
// ueberstimmt - kein Verlass auf Browser-Prioritaet zwischen zwei gleichzeitig
// zutreffenden theme-color-Tags noetig.
function syncThemeColorMeta(explicitTheme) {
    const lightMeta = document.querySelector('meta[data-scheme="light"]');
    const darkMeta = document.querySelector('meta[data-scheme="dark"]');
    if (!lightMeta || !darkMeta) return;
    if (explicitTheme === 'dark') {
        lightMeta.media = 'not all';
        darkMeta.media = 'all';
    } else {
        lightMeta.media = 'all';
        darkMeta.media = 'not all';
    }
}

function toggleTheme() {
    const next = isDarkActive() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    syncThemeColorMeta(next);
    updateThemeToggleState();
}

document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
});
updateThemeToggleState();

// Responsive <picture>-Auflösung für dynamisch per innerHTML eingefügte Bilder
// (native Browser-Auswahl ist dabei unzuverlässig) - Ansatz aus home/lib/main.js übernommen.
function resolvePictureSources(root) {
    const isMobile = window.innerWidth <= 767;
    (root || document).querySelectorAll('picture').forEach(picture => {
        const source = picture.querySelector('source');
        const img = picture.querySelector('img');
        if (!source || !img) return;
        img.src = isMobile ? source.getAttribute('srcset') : img.getAttribute('data-large');
    });
}
resolvePictureSources();
window.addEventListener('load', () => resolvePictureSources());
window.addEventListener('resize', () => resolvePictureSources());
setTimeout(() => resolvePictureSources(), 300);

function throttle(fn, limit) {
    let waiting = false;
    return (...args) => {
        if (waiting) return;
        fn(...args);
        waiting = true;
        setTimeout(() => { waiting = false; }, limit);
    };
}

// Aktiver Nav-Zustand (Top-Nav + Tab-Bar) anhand von body[data-page] statt
// pfadabhängigem Href-Parsing - funktioniert unabhängig von der Ordnertiefe.
function setActiveNav() {
    const page = document.body.getAttribute('data-page');
    if (!page) return;
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-page') === page);
    });
}
setActiveNav();

// FAQ-Accordion: nur ein offenes Item gleichzeitig innerhalb desselben Containers.
document.querySelectorAll('.faq-list').forEach(list => {
    list.querySelectorAll('.faq-item').forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');
        if (!trigger || !content) return;
        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            list.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-content').style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
});

// Back-to-Top Button
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
        backToTop.classList.toggle('show', window.scrollY > 400);
    }, 100));
}

// --- HINTERGRUND-SCROLL SPERREN, SOLANGE EIN MODAL/LIGHTBOX OFFEN IST ---
function updateBodyScrollLock() {
    document.body.classList.toggle('modal-open', !!document.querySelector('.modal-overlay.active'));
}

// --- CUSTOM SELECT (Kontakt-Formular: Kategorie/Betreff) ---
document.querySelectorAll('.custom-select').forEach(select => {
    const trigger = select.querySelector('.custom-select-trigger');
    const valueLabel = select.querySelector('.custom-select-value');
    const options = Array.from(select.querySelectorAll('[role="option"]'));
    const hiddenInput = select.querySelector('input[type="hidden"]');

    function closeSelect() {
        select.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    }

    function openSelect() {
        select.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
    }

    function chooseOption(option) {
        options.forEach(o => {
            o.classList.remove('selected');
            o.setAttribute('aria-selected', 'false');
        });
        option.classList.add('selected');
        option.setAttribute('aria-selected', 'true');
        valueLabel.textContent = option.textContent;
        hiddenInput.value = option.dataset.value;
    }

    trigger.addEventListener('click', () => {
        if (select.classList.contains('open')) {
            closeSelect();
        } else {
            openSelect();
        }
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            chooseOption(option);
            closeSelect();
            trigger.focus();
        });
    });

    trigger.addEventListener('keydown', (e) => {
        const currentIndex = options.findIndex(o => o.classList.contains('selected'));
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openSelect();
            const nextIndex = e.key === 'ArrowDown'
                ? Math.min(currentIndex + 1, options.length - 1)
                : Math.max(currentIndex - 1, 0);
            chooseOption(options[nextIndex]);
        } else if (e.key === 'Escape') {
            closeSelect();
        }
    });

    document.addEventListener('click', (e) => {
        if (!select.contains(e.target)) closeSelect();
    });
});

// --- COMMUNITY-SLIDER: Mausrad scrollt horizontal (Desktop) ---
// Touch-Wisch funktioniert bereits nativ (overflow-x: auto). Klick-und-Ziehen
// mit der Maus wurde bewusst wieder entfernt (fühlte sich falsch/unerwartet
// an) - stattdessen lenkt ein wheel-Handler das normale (vertikale)
// Mausrad-Scrollen in horizontales Scrollen um, solange die Maus über dem
// Slider steht. `preventDefault()` verhindert dabei, dass zusätzlich noch
// die ganze Seite mitscrollt.
const sliderTrack = document.querySelector('.slider-track');
if (sliderTrack) {
    let sliderWheelSnapTimeout = null;
    sliderTrack.addEventListener('wheel', (e) => {
        e.preventDefault();
        // CSS scroll-snap schnappt sonst bei jedem kleinen Wheel-Schritt
        // sofort zur nächsten Slide-Position zurück (fühlt sich an, als würde
        // nichts passieren) - deshalb Snap kurz deaktivieren, während
        // gescrollt wird, und erst nach einer kurzen Scroll-Pause wieder
        // aktivieren, damit die Slide danach sauber einrastet.
        sliderTrack.style.scrollSnapType = 'none';
        sliderTrack.scrollLeft += e.deltaY;
        clearTimeout(sliderWheelSnapTimeout);
        sliderWheelSnapTimeout = setTimeout(() => {
            sliderTrack.style.scrollSnapType = '';
        }, 150);
    }, { passive: false });
}

// --- BILD-LIGHTBOX (grosse Ansicht, z.B. Community-Slider) ---
function openLightbox(src, caption) {
    const overlay = document.getElementById('image-lightbox');
    if (!overlay) return;
    document.getElementById('lightbox-img').setAttribute('src', src);
    document.getElementById('lightbox-caption').textContent = caption || '';
    overlay.classList.add('active');
    updateBodyScrollLock();
}

function closeLightbox() {
    const overlay = document.getElementById('image-lightbox');
    if (overlay) overlay.classList.remove('active');
    updateBodyScrollLock();
}

document.querySelectorAll('.slide-img').forEach(img => {
    // Lightbox laedt die grosse Version (data-large), falls vorhanden - die
    // Slide selbst zeigt nur die kleine Vorschau, unabhaengig vom Viewport
    // (anders als resolvePictureSources(), das nach Bildschirmbreite waehlt).
    const openThisLightbox = () => openLightbox(img.dataset.large || img.getAttribute('src'), img.dataset.caption);
    img.addEventListener('click', openThisLightbox);
    img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openThisLightbox();
        }
    });
});

window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeLightbox();
    closePhoneDialog();
    closeEmailDialog();
    closeLoginDialog();
    if (typeof closeMitgliedModal === 'function') closeMitgliedModal();
});

// --- LOGIN-MODAL (Mitgliederbereich) --- Zeigt aktuell nur das Formular;
// echtes Einloggen folgt erst, sobald die Supabase-Anbindung steht.
function openLoginDialog(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closeLoginDialog() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

// DEMO-VERSION (aktiv) - es gibt noch keinen echten Login, zeigt nur einen
// ehrlichen Hinweis statt so zu tun als würde sich jemand anmelden. Sobald
// Supabase eingerichtet ist (siehe CLAUDE.md, Abschnitt "Geplant:
// Mitgliederbereich mit Supabase"): diese Funktion löschen und die ECHTE
// VERSION direkt darunter aktivieren (auskommentieren).
function handleLoginSubmit(event) {
    event.preventDefault();
    const notice = document.getElementById('loginNotice');
    if (notice) notice.hidden = false;
    return false;
}

// ECHTE VERSION (auskommentiert) - braucht js/supabase-client.js (Plan-
// Schritt 2, noch nicht angelegt) mit einem global verfügbaren
// `supabaseClient`.
// async function handleLoginSubmit(event) {
//     event.preventDefault();
//     const email = document.getElementById('loginEmail').value;
//     const password = document.getElementById('loginPassword').value;
//     const notice = document.getElementById('loginNotice');
//     const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
//     if (error) {
//         notice.textContent = 'Login fehlgeschlagen: ' + error.message;
//         notice.hidden = false;
//         return false;
//     }
//     closeLoginDialog();
//     return false;
// }

// --- MEIN-PROFIL-FORMULAR --- Gleicher Platzhalter-Ansatz wie beim Login.

// DEMO-VERSION (aktiv) - siehe Hinweis oben bei handleLoginSubmit.
function handleProfileSubmit(event) {
    event.preventDefault();
    const notice = document.getElementById('profileNotice');
    if (notice) notice.hidden = false;
    return false;
}

// ECHTE VERSION (auskommentiert) - braucht ebenfalls js/supabase-client.js
// sowie die eingeloggte User-ID (`supabaseClient.auth.getUser()`).
// async function handleProfileSubmit(event) {
//     event.preventDefault();
//     const notice = document.getElementById('profileNotice');
//     const { data: { user } } = await supabaseClient.auth.getUser();
//     const { error } = await supabaseClient.from('profiles').update({
//         name: document.getElementById('profileName').value,
//         email: document.getElementById('profileEmail').value,
//         email_oeffentlich: document.getElementById('profileEmailShare').checked,
//         instagram: document.getElementById('profileInstagram').value,
//         tiktok: document.getElementById('profileTiktok').value
//     }).eq('id', user.id);
//     notice.textContent = error ? ('Speichern fehlgeschlagen: ' + error.message) : 'Gespeichert!';
//     notice.hidden = false;
//     return false;
// }

// --- PASSWORT ÄNDERN --- Prüft schon jetzt clientseitig, ob "neu" und
// "bestätigen" übereinstimmen (reine Textvergleich, braucht kein Backend) -
// das eigentliche Ändern des Passworts braucht dagegen zwingend Supabase.

// DEMO-VERSION (aktiv).
function handlePasswordSubmit(event) {
    event.preventDefault();
    const notice = document.getElementById('passwordNotice');
    const neu = document.getElementById('newPassword').value;
    const bestaetigung = document.getElementById('newPasswordConfirm').value;
    if (neu !== bestaetigung) {
        notice.textContent = 'Die neuen Passwörter stimmen nicht überein.';
        notice.hidden = false;
        return false;
    }
    notice.textContent = 'Passwort ändern ist noch nicht aktiv – folgt in einem der nächsten Schritte.';
    notice.hidden = false;
    return false;
}

// ECHTE VERSION (auskommentiert) - braucht js/supabase-client.js (Plan-
// Schritt 2). Supabase's `updateUser()` verlangt von sich aus keine erneute
// Eingabe des alten Passworts (eine gültige Session reicht) - das aktuelle
// Passwort wird hier deshalb zusätzlich per `signInWithPassword()` geprüft,
// bevor das neue gesetzt wird, damit "aktuelles Passwort" wie gewünscht
// wirklich verifiziert wird und nicht nur eine Formalität ist.
// async function handlePasswordSubmit(event) {
//     event.preventDefault();
//     const notice = document.getElementById('passwordNotice');
//     const alt = document.getElementById('oldPassword').value;
//     const neu = document.getElementById('newPassword').value;
//     const bestaetigung = document.getElementById('newPasswordConfirm').value;
//     if (neu !== bestaetigung) {
//         notice.textContent = 'Die neuen Passwörter stimmen nicht überein.';
//         notice.hidden = false;
//         return false;
//     }
//     const { data: { user } } = await supabaseClient.auth.getUser();
//     const { error: verifyError } = await supabaseClient.auth.signInWithPassword({ email: user.email, password: alt });
//     if (verifyError) {
//         notice.textContent = 'Aktuelles Passwort ist falsch.';
//         notice.hidden = false;
//         return false;
//     }
//     const { error } = await supabaseClient.auth.updateUser({ password: neu });
//     notice.textContent = error ? ('Fehler: ' + error.message) : 'Passwort geändert!';
//     notice.hidden = false;
//     return false;
// }

// --- KONTAKT-MODALS (Telefon / E-Mail) ---
let currentPhoneNumber = '';
let currentEmailAddress = '';

function formatPhoneNumber(phone) {
    if (phone.startsWith('+41')) {
        return `+41 ${phone.substring(3, 5)} ${phone.substring(5, 8)} ${phone.substring(8, 10)} ${phone.substring(10)}`;
    }
    return phone;
}

function openPhoneDialog(event, phone) {
    event.preventDefault();
    currentPhoneNumber = phone;
    const modal = document.getElementById('phone-modal');
    if (!modal) return;
    document.getElementById('modal-phone-display').textContent = formatPhoneNumber(phone);
    document.getElementById('modal-call-btn').setAttribute('href', `tel:${phone}`);
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closePhoneDialog() {
    const modal = document.getElementById('phone-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

function openEmailDialog(event, email) {
    event.preventDefault();
    currentEmailAddress = email;
    const modal = document.getElementById('email-modal');
    if (!modal) return;
    document.getElementById('modal-email-display').textContent = email;
    document.getElementById('modal-mail-btn').setAttribute('href', `mailto:${email}`);
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closeEmailDialog() {
    const modal = document.getElementById('email-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

window.addEventListener('click', (e) => {
    if (e.target.id === 'phone-modal') closePhoneDialog();
    if (e.target.id === 'email-modal') closeEmailDialog();
    if (e.target.id === 'image-lightbox') closeLightbox();
    if (e.target.id === 'login-modal') closeLoginDialog();
    if (e.target.id === 'mitglied-modal') closeMitgliedModal();
});

function copyToClipboard(text, button) {
    if (!text || !button) return;
    navigator.clipboard.writeText(text).then(() => {
        const original = button.textContent;
        button.textContent = 'Kopiert!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = original;
            button.classList.remove('copied');
        }, 2000);
    });
}

function copyPhoneNumber() {
    copyToClipboard(currentPhoneNumber, document.querySelector('#phone-modal .btn-secondary'));
}

function copyEmailAddress() {
    copyToClipboard(currentEmailAddress, document.querySelector('#email-modal .btn-secondary'));
}
