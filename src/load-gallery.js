const galleryLinks = Array.from(document.querySelectorAll('[data-gallery-trigger="true"]'));

if (!galleryLinks.length) {
  document.removeEventListener("keydown", window.__galleryKeydownHandler || (() => {}));
  if (document.head.querySelector("#gallery-modal-styles")) {
    document.head.querySelector("#gallery-modal-styles").remove();
  }
}

const subgalleryItems = [
  { src: "/Balloon Trail.jpg", title: "Balloon Trail" },
  { src: "/Balloon Trail Blue.jpg", title: "Balloon Trail Blue" },
  { src: "/Balloon Trail Purple.jpg", title: "Balloon Trail Purple" },
  { src: "/Balloon Trail Red.jpg", title: "Balloon Trail Red" },
];

let currentItems = [];
let currentIndex = 0;
let modal = null;

function createModal() {
  const overlay = document.createElement("div");
  overlay.className = "gallery-modal";
  overlay.innerHTML = `
    <div class="gallery-modal__backdrop"></div>
    <div class="gallery-modal__panel">
      <button class="gallery-modal__close" type="button" aria-label="Close gallery">×</button>
      <div class="gallery-modal__hero">
        <div class="gallery-modal__frame">
          <img class="gallery-modal__image" alt="" />
        </div>
        <div class="gallery-modal__meta">
          <p class="gallery-modal__eyebrow">Balloon Trail Collection</p>
          <h3 class="gallery-modal__title"></h3>
          <p class="gallery-modal__subtitle">Immersive viewing experience</p>
        </div>
      </div>
      <div class="gallery-modal__rail">
        <button class="gallery-modal__nav gallery-modal__nav--prev" type="button" aria-label="Previous image">←</button>
        <div class="gallery-modal__thumbs"></div>
        <button class="gallery-modal__nav gallery-modal__nav--next" type="button" aria-label="Next image">→</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const image = overlay.querySelector(".gallery-modal__image");
  const title = overlay.querySelector(".gallery-modal__title");
  const subtitle = overlay.querySelector(".gallery-modal__subtitle");
  const eyebrow = overlay.querySelector(".gallery-modal__eyebrow");
  const thumbs = overlay.querySelector(".gallery-modal__thumbs");
  const prevButton = overlay.querySelector(".gallery-modal__nav--prev");
  const nextButton = overlay.querySelector(".gallery-modal__nav--next");
  const closeButton = overlay.querySelector(".gallery-modal__close");
  const backdrop = overlay.querySelector(".gallery-modal__backdrop");

  const handleKeydown = (event) => {
    if (event.key === "Escape") close();
    if (event.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % currentItems.length;
      updateView();
    }
    if (event.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
      updateView();
    }
  };

  function updateView() {
    const item = currentItems[currentIndex];
    if (!item) return;

    image.src = item.src;
    image.alt = item.title;
    title.textContent = item.title;
    eyebrow.textContent = currentItems.length > 1 ? "Balloon Trail Collection" : "Featured work";
    subtitle.textContent = currentItems.length > 1 ? `Viewing ${currentIndex + 1} of ${currentItems.length}` : "Single artwork view";

    Array.from(thumbs.children).forEach((thumb, index) => {
      thumb.classList.toggle("is-active", index === currentIndex);
    });

    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === currentItems.length - 1;
  }

  function renderThumbs() {
    thumbs.innerHTML = "";
    currentItems.forEach((item, index) => {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "gallery-modal__thumb";
      thumb.innerHTML = `<img src="${item.src}" alt="${item.title}" />`;
      thumb.addEventListener("click", () => {
        currentIndex = index;
        updateView();
      });
      thumbs.appendChild(thumb);
    });
  }

  function open() {
    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      image.classList.add("is-ready");
    });
  }

  function close() {
    overlay.classList.remove("is-open");
    image.classList.remove("is-ready");
    document.removeEventListener("keydown", handleKeydown);
    window.setTimeout(() => {
      overlay.remove();
      modal = null;
      document.body.style.overflow = "";
    }, 260);
  }

  prevButton.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
    updateView();
  });

  nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % currentItems.length;
    updateView();
  });

  closeButton.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  document.addEventListener("keydown", handleKeydown);

  return { overlay, open, close, renderThumbs, updateView };
}

function openGallery(link) {
  const type = link.getAttribute("data-gallery-type") || "image";
  const title = link.getAttribute("data-gallery-title") || "Artwork";
  const src = link.getAttribute("data-gallery-src") || link.getAttribute("href") || "";

  currentItems = type === "subgallery" ? subgalleryItems : [{ src, title }];
  currentIndex = 0;
  document.body.style.overflow = "hidden";

  if (modal) {
    modal.overlay.remove();
  }

  modal = createModal();
  modal.renderThumbs();
  modal.updateView();
  modal.open();
}

galleryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openGallery(link);
  });
});

const style = document.createElement("style");
style.id = "gallery-modal-styles";
style.textContent = `
  .gallery-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 260ms ease;
  }

  .gallery-modal.is-open {
    opacity: 1;
    pointer-events: auto;
  }

  .gallery-modal__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(2, 6, 23, 0.84);
    backdrop-filter: blur(18px);
  }

  .gallery-modal__panel {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: min(100%, 1180px);
    gap: 18px;
    padding: 24px;
    border-radius: 32px;
    background: linear-gradient(135deg, rgba(255,248,240,0.96), rgba(243,232,215,0.95));
    box-shadow: 0 40px 120px rgba(15, 23, 42, 0.35);
    transform: translateY(24px) scale(0.96);
    transition: transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .gallery-modal.is-open .gallery-modal__panel {
    transform: translateY(0) scale(1);
  }

  .gallery-modal__hero {
    display: grid;
    gap: 16px;
    align-items: end;
  }

  .gallery-modal__frame {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 24px;
    background: linear-gradient(135deg, #fdf7ee, #efe6db);
    min-height: 420px;
    padding: 18px;
  }

  .gallery-modal__image {
    width: min(100%, 720px);
    max-height: 70vh;
    object-fit: contain;
    border-radius: 16px;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
    opacity: 0;
    transform: translateY(16px) scale(0.96);
    transition: all 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .gallery-modal__image.is-ready {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .gallery-modal__nav,
  .gallery-modal__close {
    border: 0;
    border-radius: 999px;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    font-size: 1.2rem;
    cursor: pointer;
    background: rgba(15, 23, 42, 0.08);
    color: #0f172a;
    transition: transform 180ms ease, background 180ms ease;
  }

  .gallery-modal__nav:hover,
  .gallery-modal__close:hover,
  .gallery-modal__thumb:hover {
    transform: translateY(-1px);
    background: rgba(15, 23, 42, 0.12);
  }

  .gallery-modal__nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .gallery-modal__close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 2;
  }

  .gallery-modal__meta {
    padding: 4px 2px 0;
  }

  .gallery-modal__eyebrow {
    margin: 0 0 4px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #64748b;
  }

  .gallery-modal__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #0f172a;
  }

  .gallery-modal__subtitle {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 0.95rem;
  }

  .gallery-modal__rail {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .gallery-modal__thumbs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    flex: 1;
  }

  .gallery-modal__thumb {
    border: 0;
    padding: 0;
    aspect-ratio: 3 / 4;
    border-radius: 18px;
    overflow: hidden;
    cursor: pointer;
    background: #e8d8c1;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .gallery-modal__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .gallery-modal__thumb.is-active {
    box-shadow: 0 0 0 2px #0f172a;
  }

  @media (max-width: 820px) {
    .gallery-modal {
      padding: 12px;
    }

    .gallery-modal__panel {
      padding: 18px;
    }

    .gallery-modal__rail {
      flex-direction: column;
    }

    .gallery-modal__thumbs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .gallery-modal__nav {
      display: none;
    }
  }
`;
document.head.appendChild(style);
