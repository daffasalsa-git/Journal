/**
 * WanderMemories - Main Application Controller
 * Default initial view: Galeri Scrapbook
 * Filters: Semua, Negara, Kota, Favorit
 * Polaroid badge: Nama Negara / Kota (bukan antar kota/negara)
 * Map dataset: Indonesia (4 Kota), Singapura (2 Kota), Eropa (5 Kota)
 */

class WanderApp {
  constructor() {
    this.memories = [];
    this.activeFilter = 'all'; // 'all', 'negara', 'kota', 'favorite'
    this.searchQuery = '';
    this.activeView = 'scrapbook'; // Initial default view restored as requested!
    this.currentTheme = localStorage.getItem('wander_theme') || 'sunny';
    this.editingId = null;
    this.uploadedMediaBlob = null;
    this.uploadedMediaType = 'image';
    this.currentPickerCoords = [-6.2088, 106.8456];

    // Location Gallery state
    this.currentGalleryCountry = null;
    this.currentGalleryCity = null;
    this.currentGalleryFilter = 'all';
  }

  async init() {
    this.applyTheme(this.currentTheme);
    await this.loadMemories();
    this.setupEventListeners();
    this.updateStats();

    // Default to Galeri Scrapbook as requested
    this.switchView('scrapbook');
  }

  async loadMemories() {
    try {
      let data = await window.memoryDB.getAll();
      const hasSingapore = data && data.some(m => m.id === 'mem_sg_marinabay');
      // Ensure the complete 11 presets (Indonesia 4, Singapura 2, Eropa 5) are seeded
      if (!data || data.length === 0 || !hasSingapore) {
        await window.memoryDB.clearAll();
        for (const preset of window.PRESET_MEMORIES) {
          await window.memoryDB.save(preset);
        }
        data = await window.memoryDB.getAll();
      }
      this.memories = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.error('Failed to load memories:', e);
      this.memories = window.PRESET_MEMORIES || [];
    }
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wander_theme', theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  setupEventListeners() {
    // Navigation view tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        this.switchView(view);
      });
    });

    // Filter chips: Semua, Negara, Kota, Favorit
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.dataset.filter;
        this.renderCurrentView();
      });
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCurrentView();
      });
    }

    // Modal Trigger: Add Memory
    const addBtn = document.getElementById('btn-add-memory');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }

    // File Upload handling (Photo or Video)
    const fileInput = document.getElementById('media-file-input');
    const dropZone = document.getElementById('media-dropzone');
    if (fileInput && dropZone) {
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    // Add Memory Form Submit
    const form = document.getElementById('memory-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveMemoryFromForm();
      });
    }

    // Story Showcase button
    const storyBtn = document.getElementById('btn-showcase-story');
    if (storyBtn) {
      storyBtn.addEventListener('click', () => {
        const filtered = this.getFilteredMemories();
        if (filtered.length === 0) {
          alert('Tidak ada memori untuk ditampilkan dalam filter ini.');
          return;
        }
        window.storyShowcase.start(filtered, 0);
      });
    }

    // Ambient Audio toggle
    const ambientBtn = document.getElementById('btn-ambient-sound');
    if (ambientBtn) {
      ambientBtn.addEventListener('click', () => {
        const playing = window.soundEngine.toggleAmbient();
        ambientBtn.classList.toggle('playing', playing);
        const icon = ambientBtn.querySelector('.audio-icon');
        const text = ambientBtn.querySelector('.audio-label');
        if (icon && text) {
          icon.textContent = playing ? '🎵' : '🔇';
          text.textContent = playing ? 'Musik: Menyala' : 'Musik: Hening';
        }
      });
    }

    // Backup & Restore
    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportBackup());
    }

    const importInput = document.getElementById('import-file-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.importBackup(e.target.files[0]);
        }
      });
    }

    // Rating star clicks
    document.querySelectorAll('.star-picker .star').forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.value, 10);
        document.getElementById('form-rating').value = rating;
        this.updateStarRatingUI(rating);
      });
    });
  }

  updateStarRatingUI(rating) {
    document.querySelectorAll('.star-picker .star').forEach(star => {
      const val = parseInt(star.dataset.value, 10);
      star.classList.toggle('active', val <= rating);
    });
  }

  handleFileSelected(file) {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Mohon pilih file foto (JPG, PNG, WebP) atau video (MP4, WebM, MOV).');
      return;
    }

    this.uploadedMediaType = isVideo ? 'video' : 'image';
    const reader = new FileReader();

    reader.onload = (e) => {
      this.uploadedMediaBlob = e.target.result;
      const previewWrap = document.getElementById('media-preview-container');
      const dropzonePrompt = document.getElementById('dropzone-prompt');

      if (previewWrap) {
        previewWrap.classList.remove('hidden');
        if (dropzonePrompt) dropzonePrompt.classList.add('hidden');

        if (isVideo) {
          previewWrap.innerHTML = `
            <video src="${this.uploadedMediaBlob}" controls class="form-preview-media"></video>
            <span class="preview-badge video">🎬 Video Terpilih</span>
          `;
        } else {
          previewWrap.innerHTML = `
            <img src="${this.uploadedMediaBlob}" class="form-preview-media" alt="Preview" />
            <span class="preview-badge photo">📷 Foto Terpilih</span>
          `;
        }
      }
    };
    reader.readAsDataURL(file);
  }

  switchView(viewName) {
    this.activeView = viewName;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    this.renderCurrentView();

    if (viewName === 'map') {
      window.travelMap.init('travel-map');
      window.travelMap.renderMemories(this.getFilteredMemories());
      setTimeout(() => {
        if (window.travelMap) {
          window.travelMap.refresh();
          window.travelMap.renderMemories(this.getFilteredMemories());
        }
      }, 100);
      setTimeout(() => {
        if (window.travelMap) {
          window.travelMap.refresh();
        }
      }, 400);
    }
  }

  // =========================================================================
  // FILTER LOGIC: Semua, Negara, Kota, Favorit
  // =========================================================================
  getFilteredMemories() {
    let list = [...this.memories];

    if (this.activeFilter === 'negara') {
      // Destinasi Luar Negeri / Internasional (Singapura, Prancis, Swiss, Italia, Belanda, dll.)
      list = list.filter(m => m.country.toLowerCase() !== 'indonesia');
    } else if (this.activeFilter === 'kota') {
      // Destinasi Kota / Domestik Indonesia (Bali, Bromo, Raja Ampat, Yogyakarta, dll.)
      list = list.filter(m => m.country.toLowerCase() === 'indonesia');
    } else if (this.activeFilter === 'favorite') {
      list = list.filter(m => m.favorite);
    }

    // Search query filter
    if (this.searchQuery) {
      list = list.filter(m => {
        const text = `${m.title} ${m.country} ${m.city} ${m.spot || ''} ${m.region || ''} ${m.notes || ''} ${m.companions || ''} ${m.mood || ''}`.toLowerCase();
        return text.includes(this.searchQuery);
      });
    }

    return list;
  }

  renderCurrentView() {
    const filtered = this.getFilteredMemories();

    if (this.activeView === 'scrapbook') {
      this.renderScrapbook(filtered);
    } else if (this.activeView === 'map') {
      window.travelMap.renderMemories(filtered);
    } else if (this.activeView === 'passport') {
      this.renderPassport();
    } else if (this.activeView === 'timeline') {
      this.renderTimeline(filtered);
    }

    this.updateStats();
  }

  // =========================================================================
  // VIEW 1: GALERI SCRAPBOOK (Dengan Nama Negara / Kota Pada Kartu!)
  // =========================================================================
  renderScrapbook(memories) {
    const container = document.getElementById('scrapbook-grid');
    if (!container) return;

    if (memories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎒✈️</div>
          <h3>Belum Ada Memori yang Cocok</h3>
          <p>Coba pilih filter lain atau tambahkan memori petualangan barumu!</p>
          <button class="btn-primary" onclick="window.app.openAddModal()">
            <span>✨</span> Tambah Memori Pertama
          </button>
        </div>
      `;
      return;
    }

    const tilts = [-1.4, 1.2, -0.9, 1.5, -1.1, 0.8, -1.3, 1.1];

    container.innerHTML = memories.map((mem, index) => {
      const tilt = tilts[index % tilts.length];
      const isVideo = mem.mediaType === 'video';

      // Per user request: badge is Nama Negara / Kota (bukan antar kota/antar negara)
      const locationBadgeText = `${mem.flag || '📍'} ${mem.city}, ${mem.country}`;

      return `
        <div class="polaroid-card" style="--card-tilt: ${tilt}deg" onclick="window.app.showMemoryDetail('${mem.id}')">
          <div class="washi-tape"></div>
          
          <div class="polaroid-media-wrap">
            ${isVideo
          ? `<video src="${mem.mediaUrl}" muted preload="metadata" class="polaroid-media"></video>
                 <div class="polaroid-video-badge"><span>🎬 Video</span></div>`
          : `<img src="${mem.mediaUrl}" alt="${mem.title}" loading="lazy" class="polaroid-media" />`
        }
            <button class="polaroid-fav-btn ${mem.favorite ? 'active' : ''}" 
                    title="Favorit"
                    onclick="event.stopPropagation(); window.app.toggleFavorite('${mem.id}')">
              ${mem.favorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div class="polaroid-content">
            <div class="polaroid-header">
              <!-- NAMA NEGARA / KOTA BADGE -->
              <span class="polaroid-location-badge">
                ${locationBadgeText}
              </span>
              <span class="polaroid-date">📅 ${mem.date}</span>
            </div>

            <h3 class="polaroid-title">${mem.title}</h3>

            <div class="polaroid-location">
              <span class="loc-pin">📍</span>
              <span class="loc-text">${mem.spot || mem.city}</span>
            </div>

            <p class="polaroid-snippet">${mem.notes ? mem.notes.substring(0, 110) + '...' : ''}</p>

            <div class="polaroid-footer">
              <div class="polaroid-tags">
                ${mem.mood ? `<span class="mood-tag">✨ ${mem.mood}</span>` : ''}
                ${mem.companions ? `<span class="companion-tag">👥 ${mem.companions}</span>` : ''}
              </div>
              <div class="polaroid-stars">
                ${'★'.repeat(mem.rating || 5)}${'☆'.repeat(5 - (mem.rating || 5))}
              </div>
            </div>

            <div class="polaroid-actions" onclick="event.stopPropagation()">
              <button class="btn-card-action" onclick="window.postcardStudio.open(window.app.getMemoryById('${mem.id}'))" title="Buat Kartu Pos">
                💌 Kartu Pos
              </button>
              <button class="btn-card-action" onclick="window.storyShowcase.start([window.app.getMemoryById('${mem.id}')])" title="Mode Sinematik">
                🎞️ Tonton
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // LOCATION MEDIA GALLERY (Modal Saat Klik Kota / Negara di Peta)
  // =========================================================================
  openLocationGallery(countryOrRegion, city = null) {
    this.currentGalleryCountry = countryOrRegion;
    this.currentGalleryCity = city;
    this.currentGalleryFilter = 'all';

    const modal = document.getElementById('location-gallery-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    if (window.soundEngine) {
      window.soundEngine.playChime();
    }

    this.renderLocationGalleryContent();
  }

  filterLocationGallery(filter) {
    this.currentGalleryFilter = filter;
    document.querySelectorAll('.loc-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderLocationGalleryContent();
  }

  renderLocationGalleryContent() {
    const titleEl = document.getElementById('loc-gallery-title');
    const subEl = document.getElementById('loc-gallery-subtitle');
    const badgeEl = document.getElementById('loc-gallery-badge');
    const gridEl = document.getElementById('loc-gallery-grid');

    const countryOrRegion = this.currentGalleryCountry;
    const city = this.currentGalleryCity;

    // Filter items matching country, region, or city
    let items = this.memories.filter(m =>
      m.country.toLowerCase() === countryOrRegion.toLowerCase() ||
      (m.region && m.region.toLowerCase() === countryOrRegion.toLowerCase())
    );

    if (city) {
      items = items.filter(m => m.city.toLowerCase() === city.toLowerCase());
    }

    const flag = items[0]?.flag || (countryOrRegion === 'Indonesia' ? '🇮🇩' : countryOrRegion === 'Singapura' ? '🇸🇬' : '🇪🇺');
    const totalMedia = items.length;
    const totalVideos = items.filter(m => m.mediaType === 'video').length;
    const totalPhotos = totalMedia - totalVideos;

    if (titleEl) {
      titleEl.innerHTML = `${flag} ${city ? city + ', ' : ''}${countryOrRegion}`;
    }
    if (subEl) {
      subEl.textContent = `Menampilkan ${totalPhotos} Foto & ${totalVideos} Video petualangan tak terlupakan`;
    }
    if (badgeEl) {
      badgeEl.textContent = city ? `📍 Destinasi: ${city}` : `🌍 Destinasi Wilayah: ${countryOrRegion}`;
    }

    let displayItems = items;
    if (this.currentGalleryFilter === 'photo') {
      displayItems = items.filter(m => m.mediaType !== 'video');
    } else if (this.currentGalleryFilter === 'video') {
      displayItems = items.filter(m => m.mediaType === 'video');
    }

    if (gridEl) {
      if (displayItems.length === 0) {
        gridEl.innerHTML = '<div class="empty-state"><p>Tidak ada media dalam kategori ini.</p></div>';
        return;
      }

      gridEl.innerHTML = displayItems.map(mem => {
        const isVideo = mem.mediaType === 'video';
        return `
          <div class="loc-media-card" onclick="window.app.showMemoryDetail('${mem.id}')">
            <div class="loc-card-media-wrap">
              ${isVideo
            ? `<video src="${mem.mediaUrl}" muted class="loc-card-media"></video>
                   <div class="loc-video-badge">▶ Video</div>`
            : `<img src="${mem.mediaUrl}" alt="${mem.title}" class="loc-card-media" loading="lazy" />`
          }
              <button class="loc-fav-icon" onclick="event.stopPropagation(); window.app.toggleFavorite('${mem.id}')">
                ${mem.favorite ? '❤️' : '🤍'}
              </button>
            </div>
            <div class="loc-card-content">
              <div class="loc-card-header">
                <span class="loc-card-date">📅 ${mem.date}</span>
                <span class="loc-card-rating">★ ${mem.rating || 5}</span>
              </div>
              <h4 class="loc-card-title">${mem.title}</h4>
              <p class="loc-card-spot">📍 ${mem.spot || mem.city}, ${mem.country}</p>
              <p class="loc-card-snippet">${mem.notes ? mem.notes.substring(0, 85) + '...' : ''}</p>
              
              <div class="loc-card-footer">
                <button class="btn-card-action" onclick="event.stopPropagation(); window.postcardStudio.open(window.app.getMemoryById('${mem.id}'))">
                  💌 Kartu Pos
                </button>
                <button class="btn-card-action" onclick="event.stopPropagation(); window.storyShowcase.start([window.app.getMemoryById('${mem.id}')])">
                  🎞️ Tonton
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    const playAllBtn = document.getElementById('btn-play-location-story');
    if (playAllBtn) {
      playAllBtn.onclick = () => {
        this.closeLocationGallery();
        window.storyShowcase.start(items, 0);
      };
    }
  }

  closeLocationGallery() {
    const modal = document.getElementById('location-gallery-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  // =========================================================================
  // VIEW RENDERERS: Timeline, Passport, Stats
  // =========================================================================
  renderTimeline(memories) {
    const container = document.getElementById('timeline-list');
    if (!container) return;

    if (memories.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Tidak ada memori di linimasa.</p></div>';
      return;
    }

    const grouped = {};
    memories.forEach(mem => {
      const year = mem.date ? mem.date.split('-')[0] : 'Lainnya';
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(mem);
    });

    const years = Object.keys(grouped).sort((a, b) => b - a);

    container.innerHTML = years.map(year => `
      <div class="timeline-year-group">
        <div class="timeline-year-header">
          <span class="year-badge">${year}</span>
          <span class="year-count">${grouped[year].length} Petualangan</span>
        </div>
        <div class="timeline-items">
          ${grouped[year].map(mem => `
            <div class="timeline-item" onclick="window.app.showMemoryDetail('${mem.id}')">
              <div class="timeline-node">
                <span>${mem.mediaType === 'video' ? '🎬' : '📸'}</span>
              </div>
              <div class="timeline-card">
                <div class="timeline-thumb">
                  ${mem.mediaType === 'video'
        ? `<video src="${mem.mediaUrl}" muted class="thumb-media"></video>`
        : `<img src="${mem.mediaUrl}" alt="${mem.title}" class="thumb-media" />`
      }
                </div>
                <div class="timeline-info">
                  <div class="timeline-meta">
                    <span class="timeline-date">${mem.date}</span>
                    <span class="timeline-category">${mem.flag || '📍'} ${mem.city}, ${mem.country}</span>
                  </div>
                  <h4 class="timeline-title">${mem.title}</h4>
                  <p class="timeline-place">📍 ${mem.spot ? mem.spot + ', ' : ''}${mem.city}, ${mem.country}</p>
                  <p class="timeline-excerpt">${mem.notes ? mem.notes.substring(0, 90) + '...' : ''}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  renderPassport() {
    const container = document.getElementById('passport-content');
    if (!container) return;

    const countries = [...new Set(this.memories.map(m => m.country).filter(Boolean))];
    const cities = [...new Set(this.memories.map(m => m.city).filter(Boolean))];

    const badges = [
      {
        icon: '🇮🇩',
        title: 'Pesona Indonesia',
        desc: `4 Kota/Destinasi Lengkap`,
        unlocked: true
      },
      {
        icon: '🇸🇬',
        title: 'Eksplorasi Singapura',
        desc: `2 Destinasi Lengkap`,
        unlocked: true
      },
      {
        icon: '🇪🇺',
        title: 'Jelajah Benua Eropa',
        desc: `5 Kota Bersejarah Lengkap`,
        unlocked: true
      },
      {
        icon: '🌟',
        title: 'Kolektor Kenangan',
        desc: `${this.memories.length} Momen Terabadikan`,
        unlocked: true
      }
    ];

    container.innerHTML = `
      <div class="passport-booklet">
        <div class="passport-cover">
          <div class="passport-emblem">✈️</div>
          <h2 class="passport-cover-title">PASPOR PETUALANG</h2>
          <div class="passport-cover-sub">WANDERMEMORIES OFFICIAL ENTRY RECORD</div>
          <div class="passport-holder-name">PEMILIK: PENGEMBARA SEJATI</div>
        </div>

        <div class="passport-pages">
          <div class="passport-page-header">
            <h3>CAP IMIGRASI & JEJAK PERJALANAN</h3>
            <p>Bukti sah setiap petualangan di Indonesia, Singapura, dan Eropa</p>
          </div>

          <div class="stamps-grid">
            ${this.memories.map((mem, idx) => {
      const stampColors = ['#0284c7', '#dc2626', '#059669', '#d97706', '#7c3aed'];
      const color = stampColors[idx % stampColors.length];
      const rotation = (idx % 2 === 0 ? 1 : -1) * (3 + (idx % 4));

      return `
                <div class="official-stamp" style="--stamp-color: ${color}; transform: rotate(${rotation}deg)" onclick="window.app.showMemoryDetail('${mem.id}')">
                  <div class="stamp-outer-ring">
                    <div class="stamp-inner-ring">
                      <div class="stamp-top-text">PASPOR PERJALANAN</div>
                      <div class="stamp-location">${(mem.city || mem.country).toUpperCase()}</div>
                      <div class="stamp-date">${mem.date}</div>
                      <div class="stamp-bottom-text">★ VERIFIED VISIT ★</div>
                    </div>
                  </div>
                </div>
              `;
    }).join('')}
          </div>

          <div class="passport-achievements-section">
            <h4 class="passport-section-title">Lencana Pencapaian Wilayah</h4>
            <div class="badges-row">
              ${badges.map(b => `
                <div class="travel-badge ${b.unlocked ? 'unlocked' : 'locked'}">
                  <span class="badge-icon">${b.icon}</span>
                  <div class="badge-body">
                    <strong>${b.title}</strong>
                    <small>${b.desc}</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  updateStats() {
    const totalEl = document.getElementById('stat-total-trips');
    const countryEl = document.getElementById('stat-total-countries');
    const cityEl = document.getElementById('stat-total-cities');
    const mediaEl = document.getElementById('stat-total-media');

    const countries = new Set(this.memories.map(m => m.country).filter(Boolean));
    const cities = new Set(this.memories.map(m => m.city).filter(Boolean));
    const videos = this.memories.filter(m => m.mediaType === 'video').length;
    const photos = this.memories.length - videos;

    if (totalEl) totalEl.textContent = this.memories.length;
    if (countryEl) countryEl.textContent = countries.size;
    if (cityEl) cityEl.textContent = cities.size;
    if (mediaEl) mediaEl.textContent = `${photos} Foto • ${videos} Video`;
  }

  getMemoryById(id) {
    return this.memories.find(m => m.id === id);
  }

  async toggleFavorite(id) {
    const mem = this.getMemoryById(id);
    if (!mem) return;
    mem.favorite = !mem.favorite;
    await window.memoryDB.save(mem);

    if (mem.favorite && window.soundEngine) {
      window.soundEngine.playChime();
    }
    this.renderCurrentView();
    if (this.currentGalleryCountry) {
      this.renderLocationGalleryContent();
    }
  }

  openAddModal(memoryToEdit = null) {
    this.editingId = memoryToEdit ? memoryToEdit.id : null;
    const modal = document.getElementById('memory-modal');
    const form = document.getElementById('memory-form');
    const modalTitle = document.getElementById('modal-form-title');

    if (!modal || !form) return;

    form.reset();
    this.uploadedMediaBlob = null;
    this.uploadedMediaType = 'image';

    const previewWrap = document.getElementById('media-preview-container');
    const dropzonePrompt = document.getElementById('dropzone-prompt');
    if (previewWrap) previewWrap.classList.add('hidden');
    if (dropzonePrompt) dropzonePrompt.classList.remove('hidden');

    if (memoryToEdit) {
      modalTitle.textContent = 'Edit Memori Petualangan';
      document.getElementById('form-title').value = memoryToEdit.title || '';
      document.getElementById('form-category').value = memoryToEdit.category || 'kota';
      document.getElementById('form-country').value = memoryToEdit.country || '';
      document.getElementById('form-city').value = memoryToEdit.city || '';
      document.getElementById('form-spot').value = memoryToEdit.spot || '';
      document.getElementById('form-date').value = memoryToEdit.date || '';
      document.getElementById('form-season').value = memoryToEdit.season || '';
      document.getElementById('form-companions').value = memoryToEdit.companions || 'Pasangan';
      document.getElementById('form-mood').value = memoryToEdit.mood || 'Damai & Takjub';
      document.getElementById('form-rating').value = memoryToEdit.rating || 5;
      document.getElementById('form-notes').value = memoryToEdit.notes || '';
      document.getElementById('form-cost').value = memoryToEdit.cost || '';
      document.getElementById('form-highlights').value = (memoryToEdit.highlights || []).join('\n');

      this.uploadedMediaBlob = memoryToEdit.mediaUrl;
      this.uploadedMediaType = memoryToEdit.mediaType || 'image';

      if (previewWrap && dropzonePrompt) {
        previewWrap.classList.remove('hidden');
        dropzonePrompt.classList.add('hidden');
        if (this.uploadedMediaType === 'video') {
          previewWrap.innerHTML = `<video src="${this.uploadedMediaBlob}" controls class="form-preview-media"></video>`;
        } else {
          previewWrap.innerHTML = `<img src="${this.uploadedMediaBlob}" class="form-preview-media" alt="preview" />`;
        }
      }

      this.currentPickerCoords = memoryToEdit.coords || [-6.2088, 106.8456];
      this.updateStarRatingUI(memoryToEdit.rating || 5);
    } else {
      modalTitle.textContent = 'Tambah Memori Petualangan Baru';
      document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
      this.updateStarRatingUI(5);
      this.currentPickerCoords = [-6.2088, 106.8456];
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    setTimeout(() => {
      window.travelMap.initPickerMap('picker-map', this.currentPickerCoords, (coords) => {
        this.currentPickerCoords = coords;
      });
    }, 200);
  }

  closeAddModal() {
    const modal = document.getElementById('memory-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    this.editingId = null;
  }

  async saveMemoryFromForm() {
    const title = document.getElementById('form-title').value.trim();
    const category = document.getElementById('form-category').value;
    const country = document.getElementById('form-country').value.trim();
    const city = document.getElementById('form-city').value.trim();
    const spot = document.getElementById('form-spot').value.trim();
    const date = document.getElementById('form-date').value;
    const season = document.getElementById('form-season').value.trim();
    const companions = document.getElementById('form-companions').value;
    const mood = document.getElementById('form-mood').value;
    const rating = parseInt(document.getElementById('form-rating').value, 10) || 5;
    const notes = document.getElementById('form-notes').value.trim();
    const cost = document.getElementById('form-cost').value.trim();
    const highlightsRaw = document.getElementById('form-highlights').value.trim();
    const highlights = highlightsRaw ? highlightsRaw.split('\n').map(h => h.trim()).filter(Boolean) : [];

    let mediaUrl = this.uploadedMediaBlob;
    let mediaType = this.uploadedMediaType;

    if (!mediaUrl) {
      mediaUrl = country.toLowerCase().includes('singapur') ? 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80' : country.toLowerCase().includes('indonesia') ? 'assets/bali.jpg' : 'assets/paris.jpg';
      mediaType = 'image';
    }

    const flag = country.toLowerCase().includes('indonesia') ? '🇮🇩' :
      country.toLowerCase().includes('singapur') ? '🇸🇬' :
        country.toLowerCase().includes('prancis') ? '🇫🇷' :
          country.toLowerCase().includes('swiss') ? '🇨🇭' :
            country.toLowerCase().includes('italia') ? '🇮🇹' :
              country.toLowerCase().includes('belanda') ? '🇳🇱' : '🌍';

    const newMemory = {
      id: this.editingId || 'mem_' + Date.now(),
      title,
      category,
      country,
      flag,
      city,
      spot,
      date,
      season,
      companions,
      mood,
      rating,
      favorite: false,
      mediaType,
      mediaUrl,
      coords: this.currentPickerCoords,
      notes,
      highlights,
      cost,
      createdAt: this.editingId ? (this.getMemoryById(this.editingId)?.createdAt || Date.now()) : Date.now()
    };

    await window.memoryDB.save(newMemory);

    if (window.soundEngine) {
      window.soundEngine.playShutter();
      setTimeout(() => window.soundEngine.playStamp(), 200);
    }

    await this.loadMemories();
    this.closeAddModal();
    this.renderCurrentView();
  }

  showMemoryDetail(id) {
    const mem = this.getMemoryById(id);
    if (!mem) return;

    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    const mediaWrap = document.getElementById('detail-media-container');
    const titleEl = document.getElementById('detail-title');
    const badgeEl = document.getElementById('detail-category');
    const dateEl = document.getElementById('detail-date');
    const locEl = document.getElementById('detail-location');
    const moodEl = document.getElementById('detail-mood');
    const compEl = document.getElementById('detail-companions');
    const ratingEl = document.getElementById('detail-rating');
    const notesEl = document.getElementById('detail-notes');
    const highlightsEl = document.getElementById('detail-highlights');
    const costEl = document.getElementById('detail-cost');
    const favBtn = document.getElementById('detail-fav-btn');

    if (mediaWrap) {
      if (mem.mediaType === 'video') {
        mediaWrap.innerHTML = `
          <video src="${mem.mediaUrl}" controls autoplay playsinline class="detail-media"></video>
        `;
      } else {
        mediaWrap.innerHTML = `
          <img src="${mem.mediaUrl}" alt="${mem.title}" class="detail-media zoomable" />
        `;
      }
    }

    if (titleEl) titleEl.textContent = mem.title;
    if (badgeEl) {
      badgeEl.textContent = `${mem.flag || '📍'} ${mem.city}, ${mem.country}`;
      badgeEl.className = 'detail-badge badge-intl';
    }
    if (dateEl) dateEl.textContent = `${mem.date} ${mem.season ? '(' + mem.season + ')' : ''}`;
    if (locEl) locEl.textContent = `${mem.spot ? mem.spot + ', ' : ''}${mem.city}, ${mem.country}`;
    if (moodEl) moodEl.textContent = mem.mood || '-';
    if (compEl) compEl.textContent = mem.companions || '-';
    if (ratingEl) ratingEl.textContent = '★'.repeat(mem.rating || 5) + '☆'.repeat(5 - (mem.rating || 5));
    if (notesEl) notesEl.textContent = mem.notes || 'Belum ada catatan cerita.';

    if (highlightsEl) {
      if (mem.highlights && mem.highlights.length > 0) {
        highlightsEl.innerHTML = mem.highlights.map(h => `<li>✨ ${h}</li>`).join('');
        document.getElementById('detail-highlights-wrap')?.classList.remove('hidden');
      } else {
        document.getElementById('detail-highlights-wrap')?.classList.add('hidden');
      }
    }

    if (costEl) {
      costEl.textContent = mem.cost ? `💰 ${mem.cost}` : '';
      costEl.classList.toggle('hidden', !mem.cost);
    }

    if (favBtn) {
      favBtn.textContent = mem.favorite ? '❤️ Favorit' : '🤍 Jadikan Favorit';
      favBtn.onclick = () => {
        this.toggleFavorite(mem.id);
        favBtn.textContent = mem.favorite ? '❤️ Favorit' : '🤍 Jadikan Favorit';
      };
    }

    const editBtn = document.getElementById('detail-edit-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        this.closeDetailModal();
        this.openAddModal(mem);
      };
    }

    const delBtn = document.getElementById('detail-delete-btn');
    if (delBtn) {
      delBtn.onclick = async () => {
        if (confirm(`Yakin ingin menghapus memori "${mem.title}"?`)) {
          await window.memoryDB.delete(mem.id);
          await this.loadMemories();
          this.closeDetailModal();
          this.renderCurrentView();
        }
      };
    }

    const postcardBtn = document.getElementById('detail-postcard-btn');
    if (postcardBtn) {
      postcardBtn.onclick = () => {
        this.closeDetailModal();
        window.postcardStudio.open(mem);
      };
    }

    const storyBtn = document.getElementById('detail-story-btn');
    if (storyBtn) {
      storyBtn.onclick = () => {
        this.closeDetailModal();
        window.storyShowcase.start([mem]);
      };
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');

    const vid = modal?.querySelector('video');
    if (vid) vid.pause();
  }

  exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.memories, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `WanderMemories_Backup_${new Date().toISOString().split('T')[0]}.wander`);
    dlAnchor.click();
  }

  async importBackup(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (Array.isArray(imported)) {
        for (const item of imported) {
          if (item.id && item.title) {
            await window.memoryDB.save(item);
          }
        }
        await this.loadMemories();
        this.renderCurrentView();
        alert(`Berhasil memulihkan ${imported.length} memori petualangan!`);
      } else {
        alert('Format file backup tidak sesuai.');
      }
    } catch (e) {
      console.error('Import error:', e);
      alert('Gagal membaca file backup.');
    }
  }

  async resetToDemo() {
    if (confirm('Kembalikan memori ke data contoh awal (Indonesia 4 kota, Singapura 2 kota, Eropa 5 kota)?')) {
      await window.memoryDB.clearAll();
      for (const preset of window.PRESET_MEMORIES) {
        await window.memoryDB.save(preset);
      }
      await this.loadMemories();
      this.renderCurrentView();
      alert('Data contoh petualangan berhasil dipulihkan!');
    }
  }
}

window.app = new WanderApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
