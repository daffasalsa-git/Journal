/**
 * WanderMemories - Interactive Travel Map Engine
 * Features:
 * - Whole World Map showcasing Indonesia (4 Kota), Singapura (2 Kota), and Eropa (5 Kota)
 * - Regional Highlight Circles & Flight Route Arcs across Continents
 * - Layer Switcher (Peta Wisata Cerah vs Satelit Nyata)
 * - Auto invalidateSize on tab switch to guarantee 100% visible tiles
 * - Direct-click on markers to view photos & stories
 */

class TravelMap {
  constructor() {
    this.map = null;
    this.markersLayer = null;
    this.linesLayer = null;
    this.regionsLayer = null;
    this.currentTileLayer = null;
    this.currentTileType = 'voyager'; // 'voyager' | 'satellite'
    this.initialized = false;
    this.currentRegionFilter = 'all';

    // Tile URLs
    this.tileUrls = {
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };
  }

  init(containerId = 'travel-map') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.initialized && this.map) {
      this.refresh();
      return;
    }

    // Centered around Eurasia & Southeast Asia
    this.map = L.map(containerId, {
      center: [20, 60],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Default tile: Voyager (Bright, crisp, sunny cartography)
    this.currentTileLayer = L.tileLayer(this.tileUrls.voyager, {
      attribution: '&copy; CartoDB &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.regionsLayer = L.layerGroup().addTo(this.map);
    this.linesLayer = L.layerGroup().addTo(this.map);
    this.markersLayer = L.layerGroup().addTo(this.map);

    this.initialized = true;

    // Multiple invalidateSize calls to guarantee tile loading after DOM renders
    this.refresh();
    setTimeout(() => this.refresh(), 150);
    setTimeout(() => this.refresh(), 450);
  }

  refresh() {
    if (!this.map) return;
    this.map.invalidateSize();
  }

  setTileType(type) {
    if (!this.map || this.currentTileType === type) return;
    this.currentTileType = type;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    if (type === 'satellite') {
      this.currentTileLayer = L.tileLayer(this.tileUrls.satellite, {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 18
      }).addTo(this.map);
    } else {
      this.currentTileLayer = L.tileLayer(this.tileUrls.voyager, {
        attribution: '&copy; CartoDB &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);
    }

    // Ensure markers remain on top
    this.markersLayer.bringToFront();

    // Update UI toggle buttons
    document.querySelectorAll('.map-layer-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layer === type);
    });
  }

  renderMemories(memories) {
    if (!this.map) return;
    this.markersLayer.clearLayers();
    this.linesLayer.clearLayers();
    this.regionsLayer.clearLayers();

    // Defined user regions: Indonesia (4), Singapura (2), Eropa (5)
    const regions = {
      indonesia: {
        id: 'indonesia',
        label: 'Indonesia',
        flag: '🇮🇩',
        center: [-4.0, 118.0],
        zoom: 5,
        color: '#10b981',
        cities: ['Bali', 'Bromo', 'Raja Ampat', 'Yogyakarta'],
        items: []
      },
      singapura: {
        id: 'singapura',
        label: 'Singapura',
        flag: '🇸🇬',
        center: [1.32, 103.82],
        zoom: 11,
        color: '#8b5cf6',
        cities: ['Marina Bay', 'Sentosa'],
        items: []
      },
      eropa: {
        id: 'eropa',
        label: 'Eropa',
        flag: '🇪🇺',
        center: [47.5, 7.5],
        zoom: 5,
        color: '#0284c7',
        cities: ['Paris', 'Nice', 'Zurich', 'Roma', 'Amsterdam'],
        items: []
      }
    };

    memories.forEach(mem => {
      const c = mem.country.toLowerCase();
      if (c.includes('indonesia')) regions.indonesia.items.push(mem);
      else if (c.includes('singapur')) regions.singapura.items.push(mem);
      else regions.eropa.items.push(mem);
    });

    // Update Pills and Cards in DOM
    this.renderRegionalNavigation(regions);

    // 1. Draw Glowing Regional Circles & Landmark Area Badges
    this.drawRegionalAuras(regions);

    // 2. Filter memories based on active region pill
    let displayedMemories = memories;
    if (this.currentRegionFilter === 'indonesia') {
      displayedMemories = regions.indonesia.items;
    } else if (this.currentRegionFilter === 'singapura') {
      displayedMemories = regions.singapura.items;
    } else if (this.currentRegionFilter === 'eropa') {
      displayedMemories = regions.eropa.items;
    }

    const validPoints = [];

    // 3. Render High-Visibility Markers for each city
    displayedMemories.forEach(mem => {
      if (!mem.coords || !Array.isArray(mem.coords) || mem.coords.length !== 2) return;
      const [lat, lng] = mem.coords;
      validPoints.push([lat, lng]);

      let pinColor = '#0284c7'; // Eropa blue
      if (mem.country.toLowerCase().includes('indonesia')) pinColor = '#10b981'; // Indo green
      else if (mem.country.toLowerCase().includes('singapur')) pinColor = '#8b5cf6'; // SG violet

      const iconHtml = `
        <div class="sunny-map-marker" style="--pin-color: ${pinColor}">
          <div class="marker-pulse-ring"></div>
          <div class="marker-avatar-bubble">
            <img src="${mem.mediaUrl}" alt="${mem.city}" class="marker-avatar-media" onerror="this.src='assets/paris.jpg'" />
          </div>
          <div class="marker-city-tag">
            <span class="marker-flag">${mem.flag || '📍'}</span>
            <span class="marker-name">${mem.city}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'leaflet-sunny-marker',
        html: iconHtml,
        iconSize: [60, 72],
        iconAnchor: [30, 68],
        popupAnchor: [0, -64]
      });

      const popupHtml = `
        <div class="map-sunny-popup">
          <div class="sunny-popup-img">
            <img src="${mem.mediaUrl}" alt="${mem.city}" onerror="this.src='assets/paris.jpg'" />
            <span class="sunny-popup-chip" style="background:${pinColor}">
              ${mem.flag || '📍'} ${mem.city}, ${mem.country}
            </span>
          </div>
          <div class="sunny-popup-body">
            <h4 class="sunny-popup-title">${mem.title}</h4>
            <p class="sunny-popup-count">📍 ${mem.spot || mem.city} • 📅 ${mem.date}</p>
            <p style="font-size: 0.8rem; color: #475569; margin-bottom: 10px; line-height: 1.4;">
              ${mem.notes ? mem.notes.substring(0, 95) + '...' : ''}
            </p>
            <button class="sunny-popup-btn" onclick="window.app.showMemoryDetail('${mem.id}')">
              Buka Foto & Cerita Lengkap ✨
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(popupHtml, {
        maxWidth: 290,
        className: 'sunny-leaflet-popup'
      });

      this.markersLayer.addLayer(marker);
    });

    // 4. Draw Connecting Intercontinental Flight Lines (Indonesia <-> Singapura <-> Eropa)
    this.drawFlightRoutes(regions);

    // 5. Adjust Camera Bounds
    if (this.currentRegionFilter !== 'all' && regions[this.currentRegionFilter]) {
      const reg = regions[this.currentRegionFilter];
      this.map.flyTo(reg.center, reg.zoom, { duration: 1.2 });
    } else if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
    }
  }

  drawRegionalAuras(regions) {
    // 🇮🇩 Indonesia Aura
    L.circle([-3.0, 118.0], {
      radius: 1400000,
      color: '#10b981',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#10b981',
      fillOpacity: 0.08,
      dashArray: '6, 8'
    }).addTo(this.regionsLayer);

    // 🇸🇬 Singapura Aura
    L.circle([1.32, 103.82], {
      radius: 80000,
      color: '#8b5cf6',
      weight: 2,
      opacity: 0.8,
      fillColor: '#8b5cf6',
      fillOpacity: 0.15
    }).addTo(this.regionsLayer);

    // 🇪🇺 Eropa Aura
    L.circle([47.5, 7.5], {
      radius: 950000,
      color: '#0284c7',
      weight: 1.5,
      opacity: 0.7,
      fillColor: '#0284c7',
      fillOpacity: 0.08,
      dashArray: '6, 8'
    }).addTo(this.regionsLayer);
  }

  drawFlightRoutes(regions) {
    // Intercontinental flight route: Bali -> Yogyakarta -> Singapore -> Rome -> Paris -> Amsterdam
    const flightStops = [
      [-8.4333, 115.2800], // Bali
      [-7.7520, 110.4915], // Yogyakarta
      [1.2868, 103.8545],  // Singapore Marina Bay
      [41.8902, 12.4922],  // Rome
      [46.0207, 7.7491],   // Zurich
      [48.8584, 2.2945],   // Paris
      [52.3676, 4.9041]    // Amsterdam
    ];

    for (let i = 0; i < flightStops.length - 1; i++) {
      const start = flightStops[i];
      const end = flightStops[i + 1];
      const arcPoints = this.createArcPoints(start, end, 30);

      const flightPath = L.polyline(arcPoints, {
        color: '#f59e0b',
        weight: 2.5,
        opacity: 0.85,
        dashArray: '6, 10',
        lineCap: 'round'
      });
      this.linesLayer.addLayer(flightPath);
    }
  }

  renderRegionalNavigation(regions) {
    const barContainer = document.getElementById('country-quick-filter-bar');
    const cardsContainer = document.getElementById('country-completeness-cards');

    // 1. Quick Filter Pills above Map
    if (barContainer) {
      barContainer.innerHTML = `
        <div class="map-pills-row">
          <button class="country-pill ${this.currentRegionFilter === 'all' ? 'active' : ''}" onclick="window.travelMap.filterByRegion('all')">
            🌍 Seluruh Dunia (11 Kota)
          </button>
          <button class="country-pill ${this.currentRegionFilter === 'indonesia' ? 'active' : ''} pill-full" onclick="window.travelMap.filterByRegion('indonesia')">
            🇮🇩 Indonesia <span class="pill-count">4 Kota ✓</span>
          </button>
          <button class="country-pill ${this.currentRegionFilter === 'singapura' ? 'active' : ''} pill-full" onclick="window.travelMap.filterByRegion('singapura')">
            🇸🇬 Singapura <span class="pill-count">2 Destinasi ✓</span>
          </button>
          <button class="country-pill ${this.currentRegionFilter === 'eropa' ? 'active' : ''} pill-full" onclick="window.travelMap.filterByRegion('eropa')">
            🇪🇺 Eropa <span class="pill-count">5 Kota ✓</span>
          </button>
        </div>

        <!-- Layer Mode Toggle (Wisata vs Satelit) -->
        <div class="map-layer-switcher">
          <span class="switcher-label">Mode Peta:</span>
          <button class="map-layer-btn ${this.currentTileType === 'voyager' ? 'active' : ''}" data-layer="voyager" onclick="window.travelMap.setTileType('voyager')">
            🗺️ Peta Wisata
          </button>
          <button class="map-layer-btn ${this.currentTileType === 'satellite' ? 'active' : ''}" data-layer="satellite" onclick="window.travelMap.setTileType('satellite')">
            🛰️ Satelit Nyata
          </button>
        </div>
      `;
    }

    // 2. Completeness Summary Cards below map
    if (cardsContainer) {
      const cardList = [
        {
          region: 'Indonesia',
          flag: '🇮🇩',
          title: 'Indonesia',
          statusText: '4 Kota Dijelajahi (100% Penuh)',
          cities: ['Bali', 'Bromo', 'Raja Ampat', 'Yogyakarta'],
          filterKey: 'indonesia',
          accentColor: '#10b981'
        },
        {
          region: 'Singapura',
          flag: '🇸🇬',
          title: 'Singapura',
          statusText: '2 Destinasi Dijelajahi (100% Penuh)',
          cities: ['Marina Bay', 'Sentosa'],
          filterKey: 'singapura',
          accentColor: '#8b5cf6'
        },
        {
          region: 'Eropa',
          flag: '🇪🇺',
          title: 'Eropa',
          statusText: '5 Kota Bersejarah Dijelajahi (100% Penuh)',
          cities: ['Paris (Prancis)', 'Nice (Prancis)', 'Zurich (Swiss)', 'Roma (Italia)', 'Amsterdam (Belanda)'],
          filterKey: 'eropa',
          accentColor: '#0284c7'
        }
      ];

      cardsContainer.innerHTML = cardList.map(c => `
        <div class="country-card country-card-full" onclick="window.travelMap.filterByRegion('${c.filterKey}')">
          <div class="country-card-header">
            <div class="country-title-row">
              <span class="country-flag-big">${c.flag}</span>
              <div>
                <h4 class="country-name">${c.title}</h4>
                <span class="country-status-badge badge-completed">
                  🌟 ${c.statusText}
                </span>
              </div>
            </div>
            <button class="btn-country-view" onclick="event.stopPropagation(); window.app.openLocationGallery('${c.region}', null)" title="Buka Galeri Foto & Video ${c.region}">
              Buka Media 📸
            </button>
          </div>

          <div class="completeness-bar-wrap">
            <div class="completeness-bar-fill" style="width: 100%; background: ${c.accentColor};"></div>
          </div>

          <div class="country-cities-chips">
            ${c.cities.map(cityName => `
              <span class="city-chip" onclick="event.stopPropagation(); window.app.openLocationGallery('${c.region}', '${cityName.split(' ')[0]}')">
                📍 ${cityName}
              </span>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  filterByRegion(regionKey) {
    this.currentRegionFilter = regionKey;
    const memories = window.app.getFilteredMemories();
    this.renderMemories(memories);
  }

  createArcPoints(start, end, numPoints = 25) {
    const points = [];
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;

    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const dist = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    const arcHeight = Math.min(dist * 0.22, 16);

    const controlLat = midLat + arcHeight;
    const controlLng = midLng;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
      const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
      points.push([lat, lng]);
    }
    return points;
  }

  initPickerMap(containerId = 'picker-map', initialCoords = [-6.2088, 106.8456], onPick = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.pickerMap) {
      this.pickerMap.remove();
      this.pickerMap = null;
    }

    this.pickerMap = L.map(containerId, {
      center: initialCoords,
      zoom: 5,
      zoomControl: true
    });

    L.tileLayer(this.tileUrls.voyager, {
      subdomains: 'abcd',
      maxZoom: 18
    }).addTo(this.pickerMap);

    this.pickerMarker = L.marker(initialCoords, { draggable: true }).addTo(this.pickerMap);

    this.pickerMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      if (onPick) onPick([pos.lat, pos.lng]);
    });

    this.pickerMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this.pickerMarker.setLatLng([lat, lng]);
      if (onPick) onPick([lat, lng]);
    });

    setTimeout(() => {
      this.pickerMap.invalidateSize();
    }, 250);
  }

  setPickerCoords(coords) {
    if (this.pickerMarker && this.pickerMap && coords && coords.length === 2) {
      this.pickerMarker.setLatLng(coords);
      this.pickerMap.setView(coords, 8);
    }
  }
}

window.travelMap = new TravelMap();
