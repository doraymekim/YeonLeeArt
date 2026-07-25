(function () {
  let modalContainer = null;
  let activeCollection = null;
  let currentIndex = 0;
  let currentLang = 'ko'; // Default language state ('ko' or 'en')

  function createModal() {
    // If an existing modal is in DOM, remove it to ensure fresh structure
    const existing = document.getElementById('global-gallery-modal');
    if (existing) {
      existing.remove();
    }

    modalContainer = document.createElement('div');
    modalContainer.id = 'global-gallery-modal';

    modalContainer.className =
      'fixed inset-0 z-50 flex items-center justify-center p-0 xl:p-6 bg-slate-950/90 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300';

    modalContainer.innerHTML = `
      <div id="modal-backdrop" class="absolute inset-0"></div>
      
      <!-- Dedicated High-Res Fullscreen Image Lightbox Overlay -->
      <div 
        id="fullscreen-overlay" 
        style="display: none; position: fixed; inset: 0; z-index: 9999; flex-direction: column; align-items: center; justify-content: center; background-color: rgba(3, 7, 18, 0.95); backdrop-filter: blur(16px); padding: 1rem;"
      >
        <button 
          id="close-fullscreen" 
          type="button" 
          aria-label="Exit fullscreen view"
          style="position: absolute; top: 20px; right: 20px; z-index: 10000; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 9999px; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; border: none; cursor: pointer; transition: all 0.2s ease;"
          onmouseover="this.style.backgroundColor='#ffffff'; this.style.color='#0f172a';"
          onmouseout="this.style.backgroundColor='rgba(255, 255, 255, 0.2)'; this.style.color='#ffffff';"
        >
          <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <img 
          id="fullscreen-img" 
          src="" 
          alt="" 
          style="max-height: 92vh; max-width: 95vw; width: auto; height: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); user-select: none;"
        />
      </div>

      <!-- Modal Content Container -->
      <div class="relative z-10 flex flex-col w-full h-full xl:h-auto xl:max-w-5xl xl:max-h-[92dvh] overflow-hidden rounded-none xl:rounded-3xl bg-[#fdfbf7] border-0 xl:border xl:border-[#d8c4ab]/60 p-4 sm:p-6 shadow-2xl transition-all duration-300">
        
        <!-- Close Modal Button -->
        <button 
          id="close-gallery-modal" 
          type="button" 
          aria-label="Close modal"
          class="fixed top-4 right-4 xl:absolute xl:top-4 xl:right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-xl backdrop-blur-md active:scale-95 hover:bg-slate-900 hover:text-white transition cursor-pointer"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Main Content Area -->
        <div class="flex flex-col xl:flex-row gap-5 xl:gap-6 overflow-y-auto h-full xl:max-h-[84dvh] pr-1 pt-12 xl:pt-0 pb-10 xl:pb-0 -webkit-overflow-scrolling-touch">
          
          <!-- Main Image Viewport -->
          <div 
            class="w-full xl:w-7/12 shrink-0 flex items-center justify-center p-3 sm:p-5 rounded-2xl bg-[#efe8de]/70 border border-[#d8c4ab]/50"
            style="position: relative;"
          >
            <!-- Fullscreen Expand Button -->
            <button 
              id="open-fullscreen-btn" 
              type="button" 
              aria-label="View Fullscreen"
              title="Expand Painting to Fullscreen"
              style="position: absolute; top: 14px; right: 14px; z-index: 30; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 9999px; background-color: rgba(255, 255, 255, 0.92); color: #0f172a; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15); border: 1px solid rgba(216, 196, 171, 0.8); cursor: pointer; transition: all 0.2s ease;"
              onmouseover="this.style.backgroundColor='#0f172a'; this.style.color='#ffffff'; this.style.transform='scale(1.08)';"
              onmouseout="this.style.backgroundColor='rgba(255, 255, 255, 0.92)'; this.style.color='#0f172a'; this.style.transform='scale(1)';"
            >
              <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4"/>
              </svg>
            </button>

            <img 
              id="gallery-main-img" 
              src="" 
              alt="" 
              class="max-h-[42vh] sm:max-h-[48vh] xl:max-h-[68vh] max-w-full w-auto h-auto object-contain select-none rounded-lg shadow-md transition-all duration-300 cursor-zoom-in"
              title="Click to view full screen"
            />
          </div>

          <!-- Artwork Details Panel -->
          <div class="w-full xl:w-5/12 flex flex-col justify-between overflow-y-auto pr-1 sm:pr-2">
            
            <div class="flex flex-col gap-4">
              
              <!-- Badges & Collection Tag -->
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8c4ab]/50 pb-2.5 pr-12">
                <span id="gallery-modal-category" class="font-sans-tiffany text-xs font-bold uppercase tracking-[0.25em] text-[#0f766e]">
                  COLLECTION
                </span>

                <div class="flex items-center gap-2">
                  <span id="gallery-modal-year" class="hidden font-sans-tiffany text-xs font-semibold text-[#334155] bg-[#e8decb] px-2.5 py-0.5 rounded-full border border-[#d8c4ab]"></span>
                  <span id="gallery-modal-price" class="hidden font-sans-tiffany text-xs font-bold px-3 py-0.5 rounded-full shadow-sm"></span>
                </div>
              </div>

              <!-- Artwork Title -->
              <h3 id="gallery-modal-title" class="font-serif-tiffany text-3xl sm:text-4xl text-[#0f172a] font-normal leading-tight">
                Artwork Title
              </h3>

              <!-- Artwork Specifications -->
              <div id="gallery-modal-specs" class="flex flex-col gap-2 font-sans-tiffany text-sm text-[#1e293b] bg-white/60 rounded-xl p-3.5 border border-[#d8c4ab]/40">
                <p id="gallery-modal-dimensions" class="hidden flex justify-between items-center">
                  <strong class="font-semibold text-[#0f172a]">Dimensions:</strong> 
                  <span class="text-[#334155] font-medium"></span>
                </p>
                <p id="gallery-modal-medium" class="hidden flex justify-between items-center">
                  <strong class="font-semibold text-[#0f172a]">Medium:</strong> 
                  <span class="text-[#334155] font-medium"></span>
                </p>
                <p id="gallery-modal-exhibition" class="hidden flex flex-col gap-0.5 mt-1 pt-2 border-t border-[#d8c4ab]/40">
                  <strong class="font-semibold text-[#0f172a]">Exhibition History:</strong> 
                  <span class="text-[#334155] font-medium leading-normal"></span>
                </p>
              </div>

              <!-- Artist Statement Box with Clickable Flags -->
              <div id="gallery-modal-statement-box" class="hidden flex-col gap-2 rounded-2xl bg-[#f4efe6] border border-[#d8c4ab] p-4 sm:p-5 shadow-sm">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-[#0f766e]"></span>
                    <span class="font-sans-tiffany text-[11px] font-bold uppercase tracking-[0.2em] text-[#0f766e]">Artist Statement</span>
                  </div>

                  <!-- Clickable Flag Buttons -->
                  <div id="gallery-modal-lang-badge" class="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full border border-[#d8c4ab] shadow-xs">
                    <button 
                      type="button" 
                      id="flag-ko" 
                      class="cursor-pointer text-base sm:text-lg transition-all duration-200 select-none hover:scale-125 focus:outline-none" 
                      title="한국어 작가노트 보기"
                    >🇰🇷</button>
                    <span class="text-[10px] font-semibold text-slate-300">|</span>
                    <button 
                      type="button" 
                      id="flag-us" 
                      class="cursor-pointer text-base sm:text-lg transition-all duration-200 select-none hover:scale-125 focus:outline-none" 
                      title="View Statement in English"
                    >🇺🇸</button>
                  </div>
                </div>

                <p id="gallery-modal-statement" class="text-base sm:text-lg text-[#0f172a] leading-relaxed italic"></p>
              </div>

            </div>

            <!-- Bottom Thumbnail Selector -->
            <div id="gallery-thumbnails-container" class="mt-4 pt-3 border-t border-[#d8c4ab]/50 flex items-center gap-3.5 overflow-x-auto p-2.5 shrink-0"></div>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(modalContainer);

    // Close Modal event listeners
    document.getElementById('close-gallery-modal').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);

    // Fullscreen view handlers
    const mainImg = document.getElementById('gallery-main-img');
    const fullscreenBtn = document.getElementById('open-fullscreen-btn');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const closeFullscreenBtn = document.getElementById('close-fullscreen');
    const fullscreenImg = document.getElementById('fullscreen-img');

    function openFullscreen() {
      if (!mainImg || !mainImg.src) return;
      fullscreenImg.src = mainImg.src;
      fullscreenImg.alt = mainImg.alt || 'Full screen painting view';
      fullscreenOverlay.style.display = 'flex';
    }

    function closeFullscreen() {
      fullscreenOverlay.style.display = 'none';
    }

    fullscreenBtn.addEventListener('click', openFullscreen);
    mainImg.addEventListener('click', openFullscreen);
    closeFullscreenBtn.addEventListener('click', closeFullscreen);
    fullscreenOverlay.addEventListener('click', (e) => {
      if (e.target === fullscreenOverlay) closeFullscreen();
    });

    // Language switcher buttons
    document.getElementById('flag-ko').addEventListener('click', () => setLanguage('ko'));
    document.getElementById('flag-us').addEventListener('click', () => setLanguage('en'));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!modalContainer || modalContainer.classList.contains('pointer-events-none')) return;
      if (e.key === 'Escape') {
        if (fullscreenOverlay.style.display === 'flex') {
          closeFullscreen();
        } else {
          closeModal();
        }
      }
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  }

  function setLanguage(lang) {
    currentLang = lang;
    updateStatementDisplay();
  }

  function updateStatementDisplay() {
    if (!activeCollection || !activeCollection.items || !activeCollection.items[currentIndex]) return;

    const item = activeCollection.items[currentIndex];
    const statementBox = document.getElementById('gallery-modal-statement-box');
    const statementEl = document.getElementById('gallery-modal-statement');
    const flagKo = document.getElementById('flag-ko');
    const flagUs = document.getElementById('flag-us');

    let targetText = null;
    if (currentLang === 'ko') {
      targetText = item.statementKo || (item.statement && /[\u3131-\u318E\uAC00-\uD7A3]/.test(item.statement) ? item.statement : item.statementEn || item.statement);
    } else {
      targetText = item.statementEn || (item.statement && !/[\u3131-\u318E\uAC00-\uD7A3]/.test(item.statement) ? item.statement : item.statementKo || item.statement);
    }

    if (statementBox && statementEl && targetText) {
      statementEl.textContent = `“${targetText.replace(/^["“]|["”]$/g, '')}”`;

      // AFTER (Korean text scaled down by 10% to text-[0.9em] / text-sm sm:text-base):
const isCurrentlyKoreanText = /[\u3131-\u318E\uAC00-\uD7A3]/.test(targetText);
if (isCurrentlyKoreanText) {
  statementEl.className = 'font-paperlogy text-sm sm:text-base text-[#0f172a] leading-relaxed font-normal';
} else {
  statementEl.className = 'font-serif-tiffany text-base sm:text-lg text-[#0f172a] leading-relaxed italic';
}

      statementBox.classList.remove('hidden');
      statementBox.classList.add('flex');

      // Visual state of flag buttons
      if (flagKo && flagUs) {
        if (currentLang === 'ko') {
          flagKo.className = 'cursor-pointer text-lg scale-125 opacity-100 transition-all duration-200 select-none drop-shadow-sm';
          flagUs.className = 'cursor-pointer text-base opacity-40 grayscale-[60%] hover:opacity-80 transition-all duration-200 select-none';
        } else {
          flagUs.className = 'cursor-pointer text-lg scale-125 opacity-100 transition-all duration-200 select-none drop-shadow-sm';
          flagKo.className = 'cursor-pointer text-base opacity-40 grayscale-[60%] hover:opacity-80 transition-all duration-200 select-none';
        }
      }
    } else if (statementBox) {
      statementBox.classList.add('hidden');
      statementBox.classList.remove('flex');
    }
  }

  function renderModalContent() {
    if (!activeCollection || !activeCollection.items || !activeCollection.items.length) return;

    const item = activeCollection.items[currentIndex];
    const mainImg = document.getElementById('gallery-main-img');
    const categoryEl = document.getElementById('gallery-modal-category');
    const titleEl = document.getElementById('gallery-modal-title');
    const yearEl = document.getElementById('gallery-modal-year');
    const priceEl = document.getElementById('gallery-modal-price');

    const dimensionsEl = document.getElementById('gallery-modal-dimensions');
    const mediumEl = document.getElementById('gallery-modal-medium');
    const exhibitionEl = document.getElementById('gallery-modal-exhibition');
    const thumbContainer = document.getElementById('gallery-thumbnails-container');

    if (mainImg) {
      mainImg.src = item.src;
      mainImg.alt = item.title;
    }

    if (categoryEl) {
      categoryEl.textContent = activeCollection.items.length > 1 
        ? `${activeCollection.collectionTitle.toUpperCase()} COLLECTION`
        : 'ORIGINAL ARTWORK';
    }

    if (titleEl) {
      titleEl.textContent = item.title;
    }

    // Year
    if (yearEl) {
      if (item.year) {
        yearEl.textContent = item.year;
        yearEl.classList.remove('hidden');
      } else {
        yearEl.classList.add('hidden');
      }
    }

    // Price / Status
    if (priceEl) {
      const priceVal = item.price || item.status;
      if (priceVal) {
        priceEl.textContent = priceVal.toUpperCase();
        priceEl.classList.remove('hidden');
        if (priceVal.toLowerCase() === 'sold') {
          priceEl.className = 'font-sans-tiffany text-xs font-bold px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 shadow-sm';
        } else {
          priceEl.className = 'font-sans-tiffany text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-sm';
        }
      } else {
        priceEl.classList.add('hidden');
      }
    }

    // Dimensions
    if (dimensionsEl) {
      if (item.dimensions) {
        dimensionsEl.querySelector('span').textContent = item.dimensions;
        dimensionsEl.classList.remove('hidden');
      } else {
        dimensionsEl.classList.add('hidden');
      }
    }

    // Medium
    if (mediumEl) {
      if (item.medium) {
        mediumEl.querySelector('span').textContent = item.medium;
        mediumEl.classList.remove('hidden');
      } else {
        mediumEl.classList.add('hidden');
      }
    }

    // Exhibition History
    if (exhibitionEl) {
      if (item.exhibition) {
        exhibitionEl.querySelector('span').textContent = item.exhibition;
        exhibitionEl.classList.remove('hidden');
      } else {
        exhibitionEl.classList.add('hidden');
      }
    }

    // Default language for selected painting
    if (item.statementKo && !item.statementEn) {
      currentLang = 'ko';
    } else if (item.statementEn && !item.statementKo) {
      currentLang = 'en';
    }

    updateStatementDisplay();

    // Thumbnails
    if (thumbContainer) {
      thumbContainer.innerHTML = '';

      if (activeCollection.items.length > 1) {
        thumbContainer.style.display = 'flex';

        activeCollection.items.forEach((thumbItem, idx) => {
          const isSelected = idx === currentIndex;
          const thumbBtn = document.createElement('button');
          thumbBtn.type = 'button';
          thumbBtn.className = `relative shrink-0 w-20 sm:w-24 aspect-[4/5] rounded-xl overflow-hidden bg-[#efe8de] border-2 transition-all duration-200 p-1 flex items-center justify-center cursor-pointer ${
            isSelected
              ? 'border-[#0f766e] ring-2 ring-[#0f766e]/40 shadow-md scale-100'
              : 'border-transparent opacity-70 hover:opacity-100'
          }`;

          thumbBtn.innerHTML = `
            <img src="${thumbItem.src}" alt="${thumbItem.title}" class="h-full w-full object-contain rounded-lg" />
          `;

          thumbBtn.addEventListener('click', () => {
            currentIndex = idx;
            renderModalContent();
          });

          thumbContainer.appendChild(thumbBtn);
        });
      } else {
        thumbContainer.style.display = 'none';
      }
    }
  }

  function openModal(collectionTitle, items, startIndex = 0) {
    createModal();
    activeCollection = { collectionTitle, items };
    currentIndex = startIndex;
    renderModalContent();

    modalContainer.classList.remove('opacity-0', 'pointer-events-none');
    modalContainer.classList.add('opacity-100');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalContainer) return;
    modalContainer.classList.remove('opacity-100');
    modalContainer.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
  }

  function showPrev() {
    if (!activeCollection || activeCollection.items.length <= 1) return;
    currentIndex = (currentIndex - 1 + activeCollection.items.length) % activeCollection.items.length;
    renderModalContent();
  }

  function showNext() {
    if (!activeCollection || activeCollection.items.length <= 1) return;
    currentIndex = (currentIndex + 1) % activeCollection.items.length;
    renderModalContent();
  }

  // Global Event Delegation
  document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-gallery-trigger="true"]');
    if (!trigger) return;

    e.preventDefault();

    const title = trigger.getAttribute('data-gallery-title') || 'Gallery';
    const src = trigger.getAttribute('data-gallery-src');
    const rawItems = trigger.getAttribute('data-gallery-items');

    // FIX: Read JSON payload for ALL items (single or subgallery) if available!
    if (rawItems) {
      try {
        const items = JSON.parse(rawItems);
        if (Array.isArray(items) && items.length > 0) {
          openModal(title, items, 0);
          return;
        }
      } catch (err) {
        console.error('Gallery JSON parse error:', err);
      }
    }

    if (src) {
      openModal(title, [{ src, title }], 0);
    }
  });
})();