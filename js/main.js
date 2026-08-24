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

function toggleTheme() {
    const next = isDarkActive() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
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
        if (link.hasAttribute('data-anchor')) return; // Anker-Links werden per Scroll-Spy gesteuert
        link.classList.toggle('active', link.getAttribute('data-page') === page);
    });
}
setActiveNav();

// Scroll-Spy: markiert auf der Startseite den passenden Anker-Link, sobald
// die zugehörige Section im Viewport ist (überschreibt den "Home"-Default,
// solange keine Section mit Anker aktiv ist, bleibt "Home" markiert).
function initScrollSpy() {
    const sections = document.querySelectorAll('main [data-section]');
    const anchorLinks = document.querySelectorAll('.nav-link[data-anchor]');
    const homeLink = document.querySelector('.nav-link[data-page="home"]:not([data-anchor])');
    if (!sections.length) return;

    const onScroll = () => {
        const scrollY = window.pageYOffset;
        let currentAnchor = null;
        sections.forEach(section => {
            const top = section.offsetTop - 130;
            if (scrollY >= top) {
                currentAnchor = section.getAttribute('data-section');
            }
        });
        const activeAnchorLink = currentAnchor
            ? document.querySelector(`.nav-link[data-anchor="${currentAnchor}"]`)
            : null;

        anchorLinks.forEach(link => link.classList.toggle('active', link === activeAnchorLink));
        if (homeLink) homeLink.classList.toggle('active', !activeAnchorLink);
    };
    window.addEventListener('scroll', throttle(onScroll, 100));
    onScroll();
}
initScrollSpy();

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

// --- COMMUNITY-SLIDER: Klick-und-Ziehen zum Scrollen (Desktop-Maus) ---
// Touch-Wisch funktioniert bereits nativ (overflow-x: auto); das hier
// ergänzt nur die Maus-Bedienung, die für <div>s nicht eingebaut ist.
const sliderTrack = document.querySelector('.slider-track');
if (sliderTrack) {
    let isDraggingSlider = false;
    let sliderDidDrag = false;
    let sliderDragStartX = 0;
    let sliderScrollStart = 0;

    sliderTrack.addEventListener('mousedown', (e) => {
        isDraggingSlider = true;
        sliderDidDrag = false;
        sliderDragStartX = e.pageX;
        sliderScrollStart = sliderTrack.scrollLeft;
        sliderTrack.classList.add('dragging');
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDraggingSlider) return;
        const delta = e.pageX - sliderDragStartX;
        if (Math.abs(delta) > 3) sliderDidDrag = true;
        sliderTrack.scrollLeft = sliderScrollStart - delta;
    });
    window.addEventListener('mouseup', () => {
        isDraggingSlider = false;
        sliderTrack.classList.remove('dragging');
    });
    // Verhindert, dass das Ende eines Ziehens versehentlich als Klick auf ein
    // Bild zählt (würde sonst ungewollt die Lightbox öffnen).
    sliderTrack.addEventListener('click', (e) => {
        if (sliderDidDrag) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
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
    img.addEventListener('click', () => openLightbox(img.getAttribute('src'), img.dataset.caption));
    img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(img.getAttribute('src'), img.dataset.caption);
        }
    });
});

window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeLightbox();
    closePhoneDialog();
    closeEmailDialog();
});

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
});

function copyToClipboard(text, button) {
    if (!text || !button) return;
    navigator.clipboard.writeText(text).then(() => {
        const original = button.textContent;
        button.textContent = 'Kopiert!';
        setTimeout(() => { button.textContent = original; }, 2000);
    });
}

function copyPhoneNumber() {
    copyToClipboard(currentPhoneNumber, document.querySelector('#phone-modal .btn-secondary'));
}

function copyEmailAddress() {
    copyToClipboard(currentEmailAddress, document.querySelector('#email-modal .btn-secondary'));
}
