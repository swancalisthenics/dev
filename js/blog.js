// Rendert Blog-Übersicht und Einzel-Post aus BLOG_POSTS (js/blog-data.js).
// Gleiches Grundprinzip wie home/lib/blog.js, eigenes Markup/eigene Klassen.

function findPostById(id) {
    const numericId = Number(id);
    return BLOG_POSTS.find(post => post.id === numericId) || null;
}

function renderBlogGrid() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    grid.innerHTML = BLOG_POSTS.map(post => `
        <article class="blog-card glass-card" data-category="${post.filterCategory}">
            <a href="post.html?id=${post.id}" class="blog-card-media">
                <picture>
                    <source media="(max-width: 767px)" srcset="${post.cardImageSmall}">
                    <img src="${post.cardImage}" data-large="${post.cardImage}" alt="${post.cardTitle}" loading="lazy">
                </picture>
                <span class="badge badge-category">${post.cardCategory}</span>
            </a>
            <div class="blog-card-body">
                <h2 class="blog-card-title">${post.cardTitle}</h2>
                <div class="blog-card-meta">
                    <span>${post.cardDate}</span>
                    <span>${post.author}</span>
                </div>
                <p class="blog-card-excerpt">${post.excerpt}</p>
                <a href="post.html?id=${post.id}" class="blog-card-link">Mehr lesen <span aria-hidden="true">&rarr;</span></a>
            </div>
        </article>
    `).join('');

    resolvePictureSources(grid);
    initBlogFilters();
}

function initBlogFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const blogCards = document.querySelectorAll('.blog-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filterValue = button.getAttribute('data-filter');

            blogCards.forEach(card => {
                const matches = filterValue === 'all' || card.getAttribute('data-category') === filterValue;
                card.style.display = matches ? '' : 'none';
            });
        });
    });
}

function renderBlogPost() {
    const contentEl = document.getElementById('postContent');
    if (!contentEl) return;

    const id = new URLSearchParams(window.location.search).get('id');
    const post = findPostById(id);

    if (!post) {
        document.getElementById('postHeader').style.display = 'none';
        document.getElementById('postCtaBlock').style.display = 'none';
        contentEl.innerHTML = '<p>Diesen Beitrag gibt es nicht (mehr).</p><a class="btn btn-primary" href="blog.html">Zur Blog-Übersicht</a>';
        document.title = 'Beitrag nicht gefunden | Blog | Swan Calisthenics';
        return;
    }

    document.title = post.metaTitle;
    const metaDescription = document.getElementById('postMetaDescription');
    if (metaDescription) metaDescription.setAttribute('content', post.excerpt);

    const header = document.getElementById('postHeader');
    header.style.setProperty('--post-hero-img', `url('${post.heroImage}')`);
    header.style.setProperty('--post-hero-img-small', `url('${post.heroImageSmall}')`);
    document.getElementById('postCategory').textContent = post.category;
    document.getElementById('postTitle').innerHTML = post.title;
    document.getElementById('postDate').textContent = post.date;
    document.getElementById('postAuthor').textContent = post.author;
    contentEl.innerHTML = post.content;
    document.getElementById('postCtaHeading').textContent = post.ctaHeading;
    document.getElementById('postCtaText').textContent = post.ctaText;
    document.getElementById('postCtaButton').textContent = post.ctaButton;
    resolvePictureSources(contentEl);
}

if (document.getElementById('blogGrid')) renderBlogGrid();
if (document.getElementById('postContent')) renderBlogPost();
