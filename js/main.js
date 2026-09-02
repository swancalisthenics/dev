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

// --- COMMUNITY-SLIDER: Klick-und-Ziehen am PC (Übersichtsleiste) ---
// Touch-Wisch funktioniert bereits nativ. Scroll-Snap ist am PC komplett
// deaktiviert (`.slider-track` in home.css, @media min-width:768px) - nach
// dem Ziehen sprang die Ansicht sonst immer zur naechsten Slide-Kante
// zurueck, was nicht gewollt war. Dadurch auch kein Snap-Timing mehr in
// diesem Handler noetig (kein Fighting mehr zwischen Ziehen und Snap).
//
// scrollLeft wird bewusst nicht direkt im mousemove-Handler gesetzt, sondern
// nur der zuletzt bekannte Mauswert gespeichert - ein per
// requestAnimationFrame laufender Tick wendet daraus hoechstens einmal pro
// Frame den neuen Scroll-Wert an. mousemove kann haeufiger als die
// Bildwiederholrate feuern (v.a. bei Gaming-Maeusen mit hoher Abtastrate);
// ohne dieses Batching kann es pro Frame zu mehreren, teils verworfenen
// scrollLeft-Schreibvorgaengen kommen, was zusammen mit den ohnehin teuren
// backdrop-filter-Blur-Effekten der Glaskarten ruckelig wirkte (recherchiert:
// das ist das ueblich empfohlene Muster fuer butterweiches Drag-Scrolling).
const sliderTrack = document.querySelector('.slider-track');
if (sliderTrack) {
    let isDraggingSlider = false;
    let sliderDidDrag = false;
    let sliderDragStartX = 0;
    let sliderScrollStart = 0;
    let sliderDragRafId = null;
    let latestDragClientX = null;

    function sliderDragTick() {
        if (latestDragClientX !== null) {
            const delta = latestDragClientX - sliderDragStartX;
            if (Math.abs(delta) > 3) sliderDidDrag = true;
            sliderTrack.scrollLeft = sliderScrollStart - delta;
        }
        if (isDraggingSlider) {
            sliderDragRafId = requestAnimationFrame(sliderDragTick);
        }
    }

    sliderTrack.addEventListener('mousedown', (e) => {
        if (!isDesktopViewport()) return;
        // Ohne das startet der Browser bei einem mousedown auf einem <img>
        // (das Slide-Bild fuellt praktisch die ganze Karte aus) seine eigene
        // native Bild-Drag-Geste - fuehlt sich an, als "kleibe" ein
        // Geister-Bild dauerhaft am Mauszeiger, auch nach dem Loslassen,
        // weil das ein vom eigenen JS unabhaengiger Browser-Mechanismus ist.
        e.preventDefault();
        isDraggingSlider = true;
        sliderDidDrag = false;
        sliderDragStartX = e.clientX;
        sliderScrollStart = sliderTrack.scrollLeft;
        latestDragClientX = null;
        sliderTrack.classList.add('dragging');
        sliderDragRafId = requestAnimationFrame(sliderDragTick);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingSlider) return;
        latestDragClientX = e.clientX;
    });

    window.addEventListener('mouseup', () => {
        if (!isDraggingSlider) return;
        isDraggingSlider = false;
        cancelAnimationFrame(sliderDragRafId);
        sliderTrack.classList.remove('dragging');
    });

    // Verhindert, dass das Ende eines Ziehens versehentlich als Klick auf
    // ein Bild zaehlt (wuerde sonst ungewollt die Lightbox oeffnen).
    sliderTrack.addEventListener('click', (e) => {
        if (sliderDidDrag) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
}

// --- BILD-LIGHTBOX (grosse Ansicht, z.B. Community-Slider) ---
// Zoom (Mausrad), Ziehen zum Verschieben im gezoomten Zustand, und Vor-/
// Zurueck-Navigation (Pfeil-Buttons + Pfeiltasten) - bewusst nur am PC
// (min-width: 768px, gleicher Breakpoint wie im Rest der Seite): mobil gibt
// es dafuer schon native Pinch-Zoom- und Wisch-Gesten, das wuerde sich mit
// eigenem JS nur in die Quere kommen.
let lightboxImages = [];
let lightboxIndex = -1;
let lightboxZoom = 1;
let lightboxPanX = 0;
let lightboxPanY = 0;
let isPanningLightbox = false;
let panStartX = 0, panStartY = 0, panStartOffsetX = 0, panStartOffsetY = 0;

function isDesktopViewport() {
    return window.matchMedia('(min-width: 768px)').matches;
}

function applyLightboxTransform() {
    const img = document.getElementById('lightbox-img');
    if (!img) return;
    img.style.transform = `translate(${lightboxPanX}px, ${lightboxPanY}px) scale(${lightboxZoom})`;
    img.style.cursor = lightboxZoom > 1 ? 'grab' : '';
}

function resetLightboxZoom() {
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
    applyLightboxTransform();
}

function updateLightboxNavButtons() {
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    if (!prevBtn || !nextBtn) return;
    prevBtn.style.visibility = lightboxIndex > 0 ? 'visible' : 'hidden';
    nextBtn.style.visibility = lightboxIndex < lightboxImages.length - 1 ? 'visible' : 'hidden';
}

function showLightboxAt(index) {
    if (index < 0 || index >= lightboxImages.length) return;
    lightboxIndex = index;
    const data = lightboxImages[index];
    document.getElementById('lightbox-img').setAttribute('src', data.src);
    document.getElementById('lightbox-caption').textContent = data.caption;
    resetLightboxZoom();
    updateLightboxNavButtons();
}

function lightboxPrev() {
    if (lightboxIndex > 0) showLightboxAt(lightboxIndex - 1);
}

function lightboxNext() {
    if (lightboxIndex < lightboxImages.length - 1) showLightboxAt(lightboxIndex + 1);
}

function openLightbox(index) {
    const overlay = document.getElementById('image-lightbox');
    if (!overlay) return;
    showLightboxAt(index);
    overlay.classList.add('active');
    updateBodyScrollLock();
}

function closeLightbox() {
    const overlay = document.getElementById('image-lightbox');
    if (overlay) overlay.classList.remove('active');
    updateBodyScrollLock();
}

document.querySelectorAll('.slide-img').forEach((img, index) => {
    // Lightbox laedt die grosse Version (data-large), falls vorhanden - die
    // Slide selbst zeigt nur die kleine Vorschau, unabhaengig vom Viewport
    // (anders als resolvePictureSources(), das nach Bildschirmbreite waehlt).
    lightboxImages.push({ src: img.dataset.large || img.getAttribute('src'), caption: img.dataset.caption || '' });
    const openThisLightbox = () => openLightbox(index);
    img.addEventListener('click', openThisLightbox);
    img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openThisLightbox();
        }
    });
});

const lightboxImg = document.getElementById('lightbox-img');
if (lightboxImg) {
    lightboxImg.addEventListener('wheel', (e) => {
        if (!isDesktopViewport()) return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        lightboxZoom = Math.min(4, Math.max(1, lightboxZoom + delta));
        if (lightboxZoom === 1) { lightboxPanX = 0; lightboxPanY = 0; }
        applyLightboxTransform();
    }, { passive: false });

    lightboxImg.addEventListener('mousedown', (e) => {
        if (!isDesktopViewport() || lightboxZoom <= 1) return;
        e.preventDefault();
        isPanningLightbox = true;
        panStartX = e.clientX;
        panStartY = e.clientY;
        panStartOffsetX = lightboxPanX;
        panStartOffsetY = lightboxPanY;
        lightboxImg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanningLightbox) return;
        lightboxPanX = panStartOffsetX + (e.clientX - panStartX);
        lightboxPanY = panStartOffsetY + (e.clientY - panStartY);
        applyLightboxTransform();
    });

    window.addEventListener('mouseup', () => {
        if (!isPanningLightbox) return;
        isPanningLightbox = false;
        lightboxImg.style.cursor = lightboxZoom > 1 ? 'grab' : '';
    });

    // Mobil-Pendant zu Mausrad-Zoom/Ziehen/Pfeiltasten: 2 Finger zoomen
    // (Pinch), 1 Finger verschiebt den gezoomten Ausschnitt oder wechselt
    // per Wisch das Bild, je nachdem ob gerade gezoomt ist - genau wie in
    // den meisten Foto-Apps. `isDesktopViewport()` schliesst hier aus,
    // damit sich das nicht mit einem angeschlossenen Trackpad/Maus auf
    // einem Touch-Laptop in die Quere kommt.
    let touchStartDistance = 0;
    let touchStartZoom = 1;
    let touchStartX = 0, touchStartY = 0;
    let touchStartPanX = 0, touchStartPanY = 0;
    let isPinchingLightbox = false;
    let isSwipingLightbox = false;

    const getTouchDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    lightboxImg.addEventListener('touchstart', (e) => {
        if (isDesktopViewport()) return;
        if (e.touches.length === 2) {
            isPinchingLightbox = true;
            isSwipingLightbox = false;
            touchStartDistance = getTouchDistance(e.touches);
            touchStartZoom = lightboxZoom;
        } else if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            if (lightboxZoom > 1) {
                touchStartPanX = lightboxPanX;
                touchStartPanY = lightboxPanY;
            } else {
                isSwipingLightbox = true;
            }
        }
    }, { passive: true });

    lightboxImg.addEventListener('touchmove', (e) => {
        if (isDesktopViewport()) return;
        if (isPinchingLightbox && e.touches.length === 2) {
            e.preventDefault();
            const scaleFactor = getTouchDistance(e.touches) / touchStartDistance;
            lightboxZoom = Math.min(4, Math.max(1, touchStartZoom * scaleFactor));
            if (lightboxZoom === 1) { lightboxPanX = 0; lightboxPanY = 0; }
            applyLightboxTransform();
        } else if (e.touches.length === 1 && lightboxZoom > 1) {
            e.preventDefault();
            lightboxPanX = touchStartPanX + (e.touches[0].clientX - touchStartX);
            lightboxPanY = touchStartPanY + (e.touches[0].clientY - touchStartY);
            applyLightboxTransform();
        } else if (isSwipingLightbox) {
            e.preventDefault();
        }
    }, { passive: false });

    lightboxImg.addEventListener('touchend', (e) => {
        if (isDesktopViewport()) return;
        if (isSwipingLightbox && lightboxZoom === 1) {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50) {
                if (dx < 0) lightboxNext(); else lightboxPrev();
            }
        }
        isPinchingLightbox = false;
        isSwipingLightbox = false;
    });
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
        closePhoneDialog();
        closeEmailDialog();
        closeLoginDialog();
        if (typeof closeMitgliedModal === 'function') closeMitgliedModal();
        return;
    }
    const lightboxOpen = document.getElementById('image-lightbox')?.classList.contains('active');
    if (!lightboxOpen || !isDesktopViewport()) return;
    if (e.key === 'ArrowLeft') lightboxPrev();
    if (e.key === 'ArrowRight') lightboxNext();
});

// --- PROFIL-ICON: eingeloggt vs. ausgeloggt --- Ausgeloggt oeffnet ein
// Klick das Login-Modal (siehe unten); eingeloggt zeigt das Icon stattdessen
// den Anfangsbuchstaben und oeffnet ein Dropdown (Mitglieder/Mein Profil/
// Abmelden). Echtes Profilbild folgt erst mit Schritt 9 (Foto-Upload).
let currentSession = null;

async function updateProfileToggleUI(session) {
    currentSession = session;
    const btn = document.getElementById('profileToggle');
    const icon = document.getElementById('profileToggleIcon');
    const initialEl = document.getElementById('profileToggleInitial');
    const chevron = document.getElementById('profileToggleChevron');
    if (!btn || !icon || !initialEl) return;

    // Fuer die beiden <svg>-Elemente bewusst setAttribute/removeAttribute
    // statt .hidden: SVGElement erbt nicht von HTMLElement, die hidden-
    // Property spiegelt sich dafuer nie ins echte Attribut (liest sich
    // korrekt zurueck, [hidden] in CSS matcht aber trotzdem nie).
    if (!session) {
        icon.removeAttribute('hidden');
        initialEl.hidden = true;
        if (chevron) chevron.setAttribute('hidden', '');
        btn.classList.remove('is-logged-in');
        btn.setAttribute('aria-label', 'Mitglieder-Login');
        return;
    }

    // Zeigt den Anfangsbuchstaben aus profiles.name; fehlt die Zeile noch
    // (z.B. direkt nach der Einladung, bevor "Mein Profil" je gespeichert
    // wurde), faellt es auf den ersten Buchstaben der E-Mail zurueck.
    let displayChar = session.user.email.charAt(0).toUpperCase();
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('name, profilbild_url')
        .eq('id', session.user.id)
        .single();
    if (profile && profile.name) {
        displayChar = profile.name.charAt(0).toUpperCase();
    }

    icon.setAttribute('hidden', '');
    initialEl.hidden = false;
    setAvatarDisplay(initialEl, profile?.profilbild_url, displayChar);
    if (chevron) chevron.removeAttribute('hidden');
    btn.classList.add('is-logged-in');
    btn.setAttribute('aria-label', 'Konto-Menü');
}

function handleProfileToggleClick(event) {
    if (currentSession) {
        event.preventDefault();
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.toggle('open');
    } else {
        openLoginDialog(event);
    }
}

function closeProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.remove('open');
}

document.addEventListener('click', (event) => {
    const wrapper = document.querySelector('.profile-menu-wrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        closeProfileDropdown();
    }
});

// Fragt vor dem echten Abmelden nochmal nach (eigenes Modal statt
// window.confirm(), damit es optisch zum Rest der Seite passt) - ein
// versehentlicher Klick auf "Abmelden" im Dropdown sollte nicht sofort
// die Sitzung beenden.
function openLogoutConfirm(event) {
    if (event) event.preventDefault();
    closeProfileDropdown();
    const modal = document.getElementById('logout-confirm-modal');
    if (!modal) return;
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closeLogoutConfirm() {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

async function confirmLogout() {
    closeLogoutConfirm();
    await supabaseClient.auth.signOut();
}

if (typeof supabaseClient !== 'undefined') {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        updateProfileToggleUI(session);
    });
    supabaseClient.auth.onAuthStateChange((event, session) => {
        updateProfileToggleUI(session);
        if (event === 'SIGNED_OUT') closeProfileDropdown();
    });
}

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

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const notice = document.getElementById('loginNotice');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        notice.textContent = 'Login fehlgeschlagen: ' + error.message;
        notice.hidden = false;
        return false;
    }
    notice.hidden = true;
    clearDraft('login-entwurf');
    closeLoginDialog();
    return false;
}

function openAccountRequestDialog(event) {
    if (event) event.preventDefault();
    closeLoginDialog();
    const modal = document.getElementById('account-request-modal');
    if (!modal) return;
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closeAccountRequestDialog() {
    const modal = document.getElementById('account-request-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

const KONTO_ANFRAGE_COOLDOWN_MS = 180 * 1000;
const KONTO_ANFRAGE_COOLDOWN_KEY = 'konto-anfrage-letzte';

async function handleAccountRequestSubmit(event) {
    event.preventDefault();
    const notice = document.getElementById('accountRequestNotice');

    // Honeypot: fuer Menschen unsichtbares Feld, das Bots aber typischerweise
    // trotzdem ausfuellen. Ist es befuellt, wird nichts gespeichert, aber so
    // getan als waere die Anfrage gesendet worden - gleiches Muster wie beim
    // Kontaktformular (js/kontakt.js).
    if (document.getElementById('requestHoneypot').value) {
        document.getElementById('accountRequestForm').reset();
        clearDraft('konto-anfrage-entwurf');
        notice.textContent = 'Danke! Deine Anfrage wurde gesendet.';
        notice.hidden = false;
        return false;
    }

    const letzteAnfrage = Number(localStorage.getItem(KONTO_ANFRAGE_COOLDOWN_KEY) || 0);
    const wartezeitMs = KONTO_ANFRAGE_COOLDOWN_MS - (Date.now() - letzteAnfrage);
    if (wartezeitMs > 0) {
        const wartezeitSekunden = Math.ceil(wartezeitMs / 1000);
        notice.textContent = `Bitte warte noch ${wartezeitSekunden} Sekunden, bevor du eine weitere Anfrage sendest.`;
        notice.hidden = false;
        return false;
    }

    const name = document.getElementById('requestName').value;
    const email = document.getElementById('requestEmail').value;
    const { error } = await supabaseClient.from('konto_anfragen').insert({ name, email });
    if (error) {
        // 23505 = Postgres unique_violation - greift auf lower(email), siehe
        // supabase/009-konto-anfragen-email-unique.sql. Kein eigener
        // SELECT-Vorabcheck moeglich, da konto_anfragen bewusst keine
        // SELECT-Policy fuer anon/authenticated hat (siehe Punkt 52).
        notice.textContent = error.code === '23505'
            ? 'Für diese E-Mail liegt bereits eine Anfrage vor.'
            : 'Anfrage fehlgeschlagen: ' + error.message;
        notice.hidden = false;
        return false;
    }
    localStorage.setItem(KONTO_ANFRAGE_COOLDOWN_KEY, String(Date.now()));
    document.getElementById('accountRequestForm').reset();
    clearDraft('konto-anfrage-entwurf');
    notice.textContent = 'Danke! Deine Anfrage wurde gesendet.';
    notice.hidden = false;
    return false;
}

function openSetPasswordModal() {
    const modal = document.getElementById('set-password-modal');
    if (!modal) return;
    modal.classList.add('active');
    updateBodyScrollLock();
}

function closeSetPasswordModal() {
    const modal = document.getElementById('set-password-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

async function handleSetPasswordSubmit(event) {
    event.preventDefault();
    const newPassword = document.getElementById('setPasswordNew').value;
    const confirmPassword = document.getElementById('setPasswordConfirm').value;
    const errorEl = document.getElementById('setPasswordError');
    errorEl.hidden = true;

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Die Passwörter stimmen nicht überein.';
        errorEl.hidden = false;
        return false;
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) {
        errorEl.textContent = 'Fehler beim Speichern: ' + error.message;
        errorEl.hidden = false;
        return false;
    }

    closeSetPasswordModal();
    return false;
}

// Erscheint automatisch, sobald jemand ueber einen Supabase-Recovery-/
// Einladungs-Link auf die Seite kommt: supabase-js erkennt das Auth-Token
// in der URL selbststaendig (detectSessionInUrl, per Default aktiv) und
// feuert danach dieses Event, ohne dass die App den Link-Inhalt selbst
// parsen muss.
if (typeof supabaseClient !== 'undefined') {
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
            openSetPasswordModal();
        }
    });
}

// Blendet auf mitgliederbeschraenkten Seiten (mitglieder.html, mein-profil.html)
// den eigentlichen Inhalt aus und zeigt stattdessen einen Login-Hinweis, solange
// keine gueltige Supabase-Session besteht. Noetig, weil die Seiten selbst bei
// statischem Hosting immer oeffentlich abrufbar sind (siehe CLAUDE.md) - ohne
// diesen Check wuerde ein nicht angemeldeter Besucher stumm eine leere/
// fehlerhafte Ansicht sehen, weil die eigentlichen Datenabfragen per RLS
// ohnehin nichts liefern wuerden.
async function initAuthGate(contentId, onSession, onSignedOut, noticeId = 'notLoggedIn') {
    const notice = document.getElementById(noticeId);
    const content = document.getElementById(contentId);
    if (!notice || !content) return;

    function applyAuthState(session) {
        notice.hidden = !!session;
        content.hidden = !session;
        if (session && onSession) onSession(session);
        if (!session && onSignedOut) onSignedOut();
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    applyAuthState(session);

    supabaseClient.auth.onAuthStateChange((event, newSession) => {
        applyAuthState(newSession);
    });
}

// Fuellt das "Mein Profil"-Formular beim Laden mit den echten, eigenen
// Daten statt der frueheren "Max Mustermann"-Platzhalterwerte. Fehlt die
// profiles-Zeile noch (z.B. direkt nach der Einladung, vor dem ersten
// Speichern), bleiben Name/Social-Links leer und die E-Mail faellt auf die
// Auth-Konto-Adresse zurueck - kein Fehlerfall, einfach ein neues Profil.
async function loadOwnProfileIntoForm(session) {
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('name, email, email_oeffentlich, instagram, tiktok, profilbild_url')
        .eq('id', session.user.id)
        .single();
    document.getElementById('profileName').value = profile?.name || '';
    document.getElementById('profileEmail').value = profile?.email || session.user.email;
    document.getElementById('profileEmailShare').checked = !!profile?.email_oeffentlich;
    document.getElementById('profileInstagram').value = profile?.instagram || '';
    document.getElementById('profileTiktok').value = profile?.tiktok || '';
    const avatarPlaceholder = document.getElementById('profileAvatarPlaceholder');
    if (avatarPlaceholder) {
        setAvatarDisplay(avatarPlaceholder, profile?.profilbild_url, (profile?.name || session.user.email).charAt(0).toUpperCase());
    }
    document.getElementById('profileAvatarRemove').hidden = !profile?.profilbild_url;
    // Ueberschreibt die gerade geladenen Server-Werte mit einem lokalen
    // Entwurf, falls vorhanden - ein Entwurf existiert nur, wenn zuvor etwas
    // eingetippt, aber nie gespeichert wurde (z.B. Tab auf dem Handy
    // geschlossen), ist also immer neuer als der Serverstand.
    currentProfileDraftKey = `profil-entwurf:${session.user.id}`;
    wireDraftInputs(currentProfileDraftKey, ['profileName', 'profileInstagram', 'profileTiktok', 'profileEmailShare']);
    if (avatarPlaceholder && !profile?.profilbild_url) {
        const name = document.getElementById('profileName').value;
        avatarPlaceholder.textContent = (name || session.user.email).charAt(0).toUpperCase();
    }
}

let currentProfileDraftKey = null;

// Leert das Formular beim Abmelden wirklich (nicht nur ausblenden) - sonst
// stuenden die Daten der vorherigen Person weiterhin im DOM, nur optisch
// versteckt (z. B. ueber die Entwicklertools trotzdem einsehbar). Betrifft
// auch die (nie serverseitig gespeicherten) Passwort-Felder, falls beim
// Abmelden gerade etwas eingetippt, aber nicht abgeschickt war.
function clearProfileForm() {
    if (currentProfileDraftKey) clearDraft(currentProfileDraftKey);
    currentProfileDraftKey = null;
    document.getElementById('profileName').value = '';
    document.getElementById('profileEmail').value = '';
    document.getElementById('profileEmailShare').checked = false;
    document.getElementById('profileInstagram').value = '';
    document.getElementById('profileTiktok').value = '';
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newPasswordConfirm').value = '';
    document.getElementById('instagramInfo').classList.remove('is-visible');
    document.getElementById('tiktokInfo').classList.remove('is-visible');
    document.getElementById('instagramError').hidden = true;
    document.getElementById('tiktokError').hidden = true;
    const avatarPlaceholder = document.getElementById('profileAvatarPlaceholder');
    if (avatarPlaceholder) setAvatarDisplay(avatarPlaceholder, null, '');
    document.getElementById('profileAvatarRemove').hidden = true;
}

// mitgliederContent-Gate wird bewusst in js/mitglieder.js selbst
// initialisiert, nicht hier - braucht resetAdminUI() als onSignedOut-
// Callback, das erst dort (nach main.js geladen) definiert ist.
if (document.getElementById('profileLayout')) {
    initAuthGate('profileLayout', (session) => {
        loadOwnProfileIntoForm(session);
        ladePostfach();
    }, () => {
        clearProfileForm();
        leerePostfach();
    });
}

// Nur der "Mitglieder"-Balken im Verein-Hub ist gated, nicht die ganze
// Seite - Vereinsdokumente-Balken und der "In Vorbereitung"-Platzhalter für
// Trainings-Anmeldung bleiben davon unberuehrt. Kein Callback noetig, der
// Balken ist statischer Inhalt (nur ein Link).
if (document.getElementById('hubMitgliederRow')) {
    initAuthGate('hubMitgliederRow');
}

// Gleiches Muster fuer den Trainings-Anmeldung-Balken - eigener
// noticeId, da verein.html jetzt zwei unabhaengige Gates auf derselben
// Seite hat und sich kein #notLoggedIn teilen koennen.
if (document.getElementById('hubTrainingsRow')) {
    initAuthGate('hubTrainingsRow', null, null, 'notLoggedInTrainings');
}

function closeAuthErrorModal() {
    const modal = document.getElementById('auth-error-modal');
    if (modal) modal.classList.remove('active');
    updateBodyScrollLock();
}

// Supabase haengt bei einem ungueltigen/abgelaufenen Recovery- oder
// Einladungs-Link "#error=...&error_code=otp_expired&..." an die URL,
// ohne dass dafuer ein onAuthStateChange-Event feuert (es kommt ja keine
// Session zustande). Ohne diese Pruefung wuerde man stumm auf der
// normalen Startseite landen, ohne zu wissen, dass etwas schiefging.
(function checkAuthUrlError() {
    if (!window.location.hash.includes('error=')) return;
    const modal = document.getElementById('auth-error-modal');
    if (modal) {
        modal.classList.add('active');
        updateBodyScrollLock();
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
})();

// --- MEIN-PROFIL-FORMULAR ---

// `upsert` statt `update`: Direkt nach einer Einladung existiert noch keine
// profiles-Zeile fuer diese Person (siehe CLAUDE.md) - ein `update` auf eine
// nicht existierende Zeile aendert lautlos 0 Zeilen (kein Fehler, aber auch
// nichts gespeichert). `upsert` legt die Zeile beim ersten Speichern an.
// Blendet die schwebende Sichtbarkeits-Sprechblase bei einem Feld (z.B.
// Instagram/TikTok auf "Mein Profil") per Klick auf das Fragezeichen-Icon
// ein/aus - nur relevant auf Touch-Geraeten. Auf Geraeten mit echter Maus
// zeigt bereits reines Hover die Blase (siehe @media in components.css);
// dort soll ein Klick bewusst nichts tun, sonst koennte die Blase nach dem
// Wegbewegen der Maus haengen bleiben (Hover zeigt sie dann nicht mehr,
// die per Klick gesetzte Klasse aber schon).
function toggleFieldInfo(id) {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = document.getElementById(id);
    if (el) el.classList.toggle('is-visible');
}

// Prueft, ob eine eingegebene URL wirklich zu einer der erlaubten Domains
// gehoert, nicht nur irgendeine gueltige URL ist - z.B. damit im Instagram-
// Feld nicht versehentlich ein TikTok- oder ein voellig anderer Link landet.
// "www."-Praefix wird ignoriert, `URL()` wirft bei nicht parsbaren Werten
// (z.B. Freitext ohne echtes URL-Format).
function hostMatchesAny(value, erlaubteHosts) {
    try {
        const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
        return erlaubteHosts.includes(host);
    } catch {
        return false;
    }
}

// Schneidet das ausgewaehlte Bild zentriert auf ein Quadrat zu und
// verkleinert es auf 200x200px JPEG (~80% Qualitaet) - siehe Spec, deckt
// auch den groessten aktuellen Avatar-Anzeigeort (140px, Retina) komfortabel
// ab, ohne einen eigenen Zuschneide-Dialog zu brauchen.
async function resizeImageToJpeg(file) {
    const bitmap = await createImageBitmap(file);
    const seite = Math.min(bitmap.width, bitmap.height);
    const startX = (bitmap.width - seite) / 2;
    const startY = (bitmap.height - seite) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, startX, startY, seite, seite, 0, 0, 200, 200);

    return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
}

let toastTimeout;
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

// Archiviert das aktuelle Profilbild (falls vorhanden) unter der naechsten
// laufenden Nummer im selben avatars-Bucket, bevor es ueberschrieben oder
// geloescht wird (siehe supabase/014-profilbild-verlauf.sql) - reines
// Admin-Log, Mitglieder sehen profilbild_verlauf nicht. Gibt bei Erfolg
// bzw. wenn noch gar kein Bild existiert null zurueck, sonst das Error-Objekt
// des fehlgeschlagenen Schritts.
async function archiviereAltesProfilbild(userId) {
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('profilbild_url')
        .eq('id', userId)
        .single();
    if (!profile?.profilbild_url) return null;

    const { data: verlauf } = await supabaseClient
        .from('profilbild_verlauf')
        .select('nummer')
        .eq('profile_id', userId)
        .order('nummer', { ascending: false })
        .limit(1);
    const naechsteNummer = (verlauf?.[0]?.nummer || 0) + 1;
    const archivName = `${userId}-${naechsteNummer}.jpg`;

    const { error: copyError } = await supabaseClient.storage
        .from('avatars')
        .copy(`${userId}.jpg`, archivName);
    if (copyError) return copyError;

    const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(archivName);
    const { error: insertError } = await supabaseClient
        .from('profilbild_verlauf')
        .insert({ profile_id: userId, nummer: naechsteNummer, bild_url: publicUrl });
    return insertError || null;
}

async function handleAvatarFileSelected(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;

    const errorEl = document.getElementById('avatarError');
    errorEl.hidden = true;

    if (!file.type.startsWith('image/')) {
        errorEl.textContent = 'Bitte eine Bilddatei auswählen.';
        errorEl.hidden = false;
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        errorEl.textContent = 'Die Datei ist zu gross (max. 10 MB).';
        errorEl.hidden = false;
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    const archivFehler = await archiviereAltesProfilbild(user.id);
    if (archivFehler) {
        errorEl.textContent = 'Archivieren des alten Bilds fehlgeschlagen: ' + archivFehler.message;
        errorEl.hidden = false;
        return;
    }

    const blob = await resizeImageToJpeg(file);
    const dateiname = `${user.id}.jpg`;

    const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(dateiname, blob, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) {
        errorEl.textContent = 'Hochladen fehlgeschlagen: ' + uploadError.message;
        errorEl.hidden = false;
        return;
    }

    // Cache-Buster als Query-Parameter, damit ein neu hochgeladenes Foto
    // sofort angezeigt wird, statt dass der Browser die alte Version unter
    // derselben URL aus dem Cache zeigt.
    const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(dateiname);
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabaseClient
        .from('profiles')
        .update({ profilbild_url: url })
        .eq('id', user.id);
    if (dbError) {
        errorEl.textContent = 'Speichern fehlgeschlagen: ' + dbError.message;
        errorEl.hidden = false;
        return;
    }

    setAvatarDisplay(document.getElementById('profileAvatarPlaceholder'), url, '');
    document.getElementById('profileAvatarRemove').hidden = false;
    showToast('Gespeichert – für alle sichtbar.');
}

async function removeProfileAvatar() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    const errorEl = document.getElementById('avatarError');
    errorEl.hidden = true;
    const archivFehler = await archiviereAltesProfilbild(user.id);
    if (archivFehler) {
        errorEl.textContent = 'Archivieren des alten Bilds fehlgeschlagen: ' + archivFehler.message;
        errorEl.hidden = false;
        return;
    }

    await supabaseClient.storage.from('avatars').remove([`${user.id}.jpg`]);
    await supabaseClient.from('profiles').update({ profilbild_url: null }).eq('id', user.id);

    const name = document.getElementById('profileName').value;
    setAvatarDisplay(document.getElementById('profileAvatarPlaceholder'), null, (name || document.getElementById('profileEmail').value).charAt(0).toUpperCase());
    document.getElementById('profileAvatarRemove').hidden = true;
    showToast('Foto entfernt.');
}

async function handleProfileSubmit(event) {
    event.preventDefault();
    const notice = document.getElementById('profileNotice');
    notice.hidden = true;

    const instagramInput = document.getElementById('profileInstagram');
    const tiktokInput = document.getElementById('profileTiktok');
    const instagramError = document.getElementById('instagramError');
    const tiktokError = document.getElementById('tiktokError');
    instagramError.hidden = true;
    tiktokError.hidden = true;

    let gueltig = true;
    if (instagramInput.value && !hostMatchesAny(instagramInput.value, ['instagram.com'])) {
        instagramError.textContent = 'Das sieht nicht nach einem Instagram-Link aus.';
        instagramError.hidden = false;
        gueltig = false;
    }
    if (tiktokInput.value && !hostMatchesAny(tiktokInput.value, ['tiktok.com', 'vm.tiktok.com'])) {
        tiktokError.textContent = 'Das sieht nicht nach einem TikTok-Link aus.';
        tiktokError.hidden = false;
        gueltig = false;
    }
    if (!gueltig) return false;

    const { data: { user } } = await supabaseClient.auth.getUser();
    const { error } = await supabaseClient.from('profiles').upsert({
        id: user.id,
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        email_oeffentlich: document.getElementById('profileEmailShare').checked,
        instagram: instagramInput.value,
        tiktok: tiktokInput.value
    });
    if (error) {
        notice.textContent = 'Speichern fehlgeschlagen: ' + error.message;
        notice.hidden = false;
    } else {
        notice.hidden = true;
        showToast('Gespeichert!');
        if (currentProfileDraftKey) clearDraft(currentProfileDraftKey);
    }
    return false;
}

// --- PASSWORT ÄNDERN --- Supabase's `updateUser()` verlangt von sich aus
// keine erneute Eingabe des alten Passworts (eine gültige Session reicht) -
// das aktuelle Passwort wird hier deshalb zusätzlich per
// `signInWithPassword()` geprüft, bevor das neue gesetzt wird, damit
// "aktuelles Passwort" wie im Formular suggeriert wirklich verifiziert wird
// und nicht nur eine Formalität ist.
async function handlePasswordSubmit(event) {
    event.preventDefault();
    const notice = document.getElementById('passwordNotice');
    const alt = document.getElementById('oldPassword').value;
    const neu = document.getElementById('newPassword').value;
    const bestaetigung = document.getElementById('newPasswordConfirm').value;
    if (neu !== bestaetigung) {
        notice.textContent = 'Die neuen Passwörter stimmen nicht überein.';
        notice.hidden = false;
        return false;
    }
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { error: verifyError } = await supabaseClient.auth.signInWithPassword({ email: user.email, password: alt });
    if (verifyError) {
        notice.textContent = 'Aktuelles Passwort ist falsch.';
        notice.hidden = false;
        return false;
    }
    const { error } = await supabaseClient.auth.updateUser({ password: neu });
    if (error) {
        notice.textContent = 'Fehler: ' + error.message;
        notice.hidden = false;
    } else {
        notice.hidden = true;
        showToast('Passwort geändert!');
        // Nach erfolgreichem Aendern die Felder wirklich leeren, nicht nur
        // die Erfolgsmeldung zeigen - sonst stehen die zuletzt getippten
        // Passwoerter (inkl. des jetzt alten) weiter unnoetig im Formular.
        document.getElementById('passwordForm').reset();
    }
    return false;
}

// Wechselt ein einzelnes Passwort-Feld zwischen verstecktem und
// Klartext-Zustand, tauscht dabei auch das Augen-Icon passend.
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('.icon');
    const wechsleZuKlartext = input.type === 'password';
    input.type = wechsleZuKlartext ? 'text' : 'password';
    icon.classList.toggle('icon-eye', !wechsleZuKlartext);
    icon.classList.toggle('icon-eye-slash', wechsleZuKlartext);
    btn.setAttribute('aria-label', wechsleZuKlartext ? 'Passwort verstecken' : 'Passwort anzeigen');
}

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
    if (e.target.id === 'mitglied-modal') closeMitgliedModal();
    if (e.target.id === 'account-request-modal') closeAccountRequestDialog();
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

// Naechstes Training = kommender Sonntag 18:00-20:00 (lokale Zeit des
// Browsers). Ist das heutige Fenster schon vorbei, springt es eine Woche
// weiter - damit bleibt "start"/"end" immer das naechste bevorstehende
// oder gerade laufende Training, nie ein vergangenes. Global (nicht nur
// im Countdown-Block unten), weil auch pages/trainings-anmeldung.html
// das gleiche Datum braucht.
function getNextTrainingWindow(now) {
    const start = new Date(now);
    start.setHours(18, 0, 0, 0);
    start.setDate(start.getDate() + ((7 - start.getDay()) % 7));
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    if (now >= end) {
        start.setDate(start.getDate() + 7);
        end.setDate(end.getDate() + 7);
    }
    return { start, end };
}

/* --- Trainings-Countdown (Startseite, Zeiten-Sektion) --- */
const trainingCountdownEl = document.getElementById('training-countdown');
if (trainingCountdownEl) {
    const countdownIntro = document.getElementById('countdown-intro');
    const countdownGrid = document.getElementById('countdown-grid');
    const countdownLive = document.getElementById('countdown-live');
    const countdownDays = document.getElementById('countdown-days');
    const countdownHours = document.getElementById('countdown-hours');
    const countdownMinutes = document.getElementById('countdown-minutes');
    const countdownSeconds = document.getElementById('countdown-seconds');

    function tickTrainingCountdown() {
        const now = new Date();
        const { start, end } = getNextTrainingWindow(now);
        const isLive = now >= start && now < end;

        countdownLive.hidden = !isLive;
        countdownIntro.hidden = isLive;
        countdownGrid.hidden = isLive;
        if (isLive) return;

        const totalSeconds = Math.max(0, Math.floor((start - now) / 1000));
        countdownDays.textContent = String(Math.floor(totalSeconds / 86400)).padStart(2, '0');
        countdownHours.textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0');
        countdownMinutes.textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        countdownSeconds.textContent = String(totalSeconds % 60).padStart(2, '0');
    }

    tickTrainingCountdown();
    setInterval(tickTrainingCountdown, 1000);
}
