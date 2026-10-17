/**
 * WanderMemories - IndexedDB Storage Engine
 * Dataset: Indonesia (4 Kota), Singapura (2 Kota), Eropa (5 Kota)
 */

const DB_NAME = 'WanderMemoriesDB';
const DB_VERSION = 3;
const STORE_NAME = 'memories';

class MemoryDB {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('country', 'country', { unique: false });
          store.createIndex('city', 'city', { unique: false });
          store.createIndex('region', 'region', { unique: false });
          store.createIndex('favorite', 'favorite', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async getAll() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async get(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(memory) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(memory);

      request.onsuccess = () => resolve(memory);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

// =========================================================================
// DATASET: Indonesia (4 Kota), Singapura (2 Kota), Eropa (5 Kota)
// =========================================================================
const PRESET_MEMORIES = [
  // --- INDONESIA (4 KOTA) ---
  {
    id: 'mem_indo_bali',
    title: 'Kedamaian Terasering Sawah Hijau di Ubud',
    category: 'kota',
    region: 'Indonesia',
    country: 'Indonesia',
    flag: '🇮🇩',
    city: 'Bali',
    spot: 'Tegallalang & Tirta Empul, Ubud',
    date: '2026-02-10',
    season: 'Awal Tahun',
    companions: 'Pasangan',
    mood: 'Budaya & Santai',
    rating: 5,
    favorite: true,
    mediaType: 'image',
    mediaUrl: 'assets/bali.jpg',
    coords: [-8.4333, 115.2800],
    notes: 'Menyusuri pematang sawah bertingkat Tegallalang yang hijau royo-royo di pagi hari sebelum turis berdatangan. Suara gemericik air irigasi subak dan dupa wangi sesaji canang sari membawa kedamaian hati yang hakiki.',
    highlights: ['Sarapan kopi Bali dengan pemandangan lembah', 'Belajar ukiran kayu khas seniman lokal', 'Menonton tari kecak saat malam hari'],
    cost: 'Rp 1.200.000 / hari',
    createdAt: 1770681600000
  },
  {
    id: 'mem_indo_bromo',
    title: 'Lautan Kabut Emas Menembus Fajar Bromo',
    category: 'kota',
    region: 'Indonesia',
    country: 'Indonesia',
    flag: '🇮🇩',
    city: 'Bromo',
    spot: 'Penanjakan 1 & Kawah Bromo, Jawa Timur',
    date: '2025-07-06',
    season: 'Musim Kemarau Dingin',
    companions: 'Solo Trip',
    mood: 'Healing & Menenangkan',
    rating: 5,
    favorite: true,
    mediaType: 'image',
    mediaUrl: 'assets/bromo.jpg',
    coords: [-7.9425, 112.9530],
    notes: 'Berangkat naik Jeep jam 3 pagi menembus hawa dingin menusuk tulang (8°C). Menanti detik-detik saat semburat fajar jingga keemasan perlahan menyingkap lautan awan yang menyelimuti Gunung Batok dan kawah Bromo. Sangat magis!',
    highlights: ['Sunrise spektakuler Penanjakan 1', 'Menunggang kuda melintasi pasir berbisik', 'Menikmati teh manis panas di warung lereng kawah'],
    cost: 'Rp 750.000 (Sewa Jeep & Tiket)',
    createdAt: 1720224000000
  },
  {
    id: 'mem_indo_raja_ampat',
    title: 'Surga Karst & Laut Toska Kepulauan Wayag',
    category: 'kota',
    region: 'Indonesia',
    country: 'Indonesia',
    flag: '🇮🇩',
    city: 'Raja Ampat',
    spot: 'Kepulauan Wayag & Piaynemo, Papua Barat',
    date: '2025-08-22',
    season: 'Musim Kemarau',
    companions: 'Geng Sahabat',
    mood: 'Petualangan & Adrenalin',
    rating: 5,
    favorite: true,
    mediaType: 'image',
    mediaUrl: 'assets/raja_ampat.jpg',
    coords: [-0.2333, 130.5167],
    notes: 'Mendaki tebing karang terjal dengan nafas terengah-engah, namun ketika tiba di puncak Piaynemo... rasanya dunia berhenti berputar. Air laut gradasi toska berkilau dengan pulau karang mini seperti zamrud khatulistiwa.',
    highlights: ['Snorkeling bersama pari manta raksasa', 'Pemandangan 360 derajat Wayag', 'Makan ikan bakar segar di pantai pasir putih'],
    cost: 'Rp 6.500.000 (Paket Liveaboard)',
    createdAt: 1724284800000
  },
  {
    id: 'mem_indo_jogja',
    title: 'Hangatnya Senja di Candi Prambanan & Malioboro',
    category: 'kota',
    region: 'Indonesia',
    country: 'Indonesia',
    flag: '🇮🇩',
    city: 'Yogyakarta',
    spot: 'Candi Prambanan & Jalan Malioboro',
    date: '2025-09-12',
    season: 'Liburan Akhir Pekan',
    companions: 'Keluarga',
    mood: 'Budaya & Santai',
    rating: 5,
    favorite: false,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1200&q=80',
    coords: [-7.7520, 110.4915],
    notes: 'Menikmati siluet candi Hindu termegah di Indonesia saat langit berubah menjadi ungu keemasan. Malam harinya nongkrong lesehan makan gudeg Yu Djum sambil mendengarkan pengamen jalanan menyanyikan lagu nostalgia.',
    highlights: ['Sendratari Ramayana di panggung terbuka', 'Bersepeda santai mengitari desa wisata candi', 'Kopi Jos arang membara khas stasiun Tugu'],
    cost: 'Rp 450.000 / hari',
    createdAt: 1726099200000
  },

  // --- SINGAPURA (2 KOTA / AREA) ---
  {
    id: 'mem_sg_marinabay',
    title: 'Kemegahan Marina Bay Sands & Pertunjukan Cahaya',
    category: 'negara',
    region: 'Singapura',
    country: 'Singapura',
    flag: '🇸🇬',
    city: 'Marina Bay',
    spot: 'Merlion Park & Supertree Grove Gardens by the Bay',
    date: '2025-10-14',
    season: 'Liburan Akhir Tahun',
    companions: 'Pasangan',
    mood: 'Modern & Megah',
    rating: 5,
    favorite: true,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
    coords: [1.2868, 103.8545],
    notes: 'Berdiri di tepi teluk menyaksikan pertunjukan laser Spectra dan gemerlap pohon raksasa Supertree Grove yang menyala serentak dengan musik orkestra megah. Udara malam yang bersih dan tata kota futuristik yang mengagumkan.',
    highlights: ['Garden Rhapsody Light & Sound Show', 'Foto ikonik dengan Patung Merlion', 'Menikmati es krim potong Orchard Road'],
    cost: 'SGD 140 / hari',
    createdAt: 1728864000000
  },
  {
    id: 'mem_sg_sentosa',
    title: 'Serunya Petualangan Tropis di Pulau Sentosa',
    category: 'negara',
    region: 'Singapura',
    country: 'Singapura',
    flag: '🇸🇬',
    city: 'Sentosa',
    spot: 'Universal Studios Singapore & Siloso Beach',
    date: '2025-10-16',
    season: 'Liburan Akhir Tahun',
    companions: 'Geng Sahabat',
    mood: 'Petualangan & Adrenalin',
    rating: 5,
    favorite: false,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80',
    coords: [1.2494, 103.8303],
    notes: 'Menyeberang naik cable car menikmati pemandangan pelabuhan dari atas awan. Seharian penuh memacu adrenalin naik wahana Battlestar Galactica dan bersantai minum kelapa muda di Siloso Beach saat senja.',
    highlights: ['Wahana rollercoaster Transformers & Mummy', 'Sunset santai di tepi pantai Siloso', 'Skyline Luge meluncur menuruni bukit'],
    cost: 'SGD 160 / hari',
    createdAt: 1729036800000
  },

  // --- EROPA (5 KOTA) ---
  {
    id: 'mem_eropa_paris',
    title: 'Kilau Senja Romantis di Tepi Sungai Seine',
    category: 'negara',
    region: 'Eropa',
    country: 'Prancis',
    flag: '🇫🇷',
    city: 'Paris',
    spot: 'Jembatan Bir-Hakeim & Menara Eiffel',
    date: '2025-05-18',
    season: 'Musim Semi (Spring)',
    companions: 'Keluarga',
    mood: 'Romantis & Hangat',
    rating: 5,
    favorite: true,
    mediaType: 'image',
    mediaUrl: 'assets/paris.jpg',
    coords: [48.8584, 2.2945],
    notes: 'Melihat Menara Eiffel mulai berkelap-kelip keemasan tepat pukul 8 malam dari atas jembatan Pont de Bir-Hakeim. Angin sore yang sejuk, aroma croissant mentega hangat dari bakery lokal, dan alunan akordeon jalanan membuat sore itu begitu syahdu.',
    highlights: ['Eiffel Tower Sparkle di jam 20:00', 'Croissant mentega legendaris di Le Marais', 'Piknik santai di Champ de Mars'],
    cost: '€ 120 / hari',
    createdAt: 1715990400000
  },
  {
    id: 'mem_eropa_nice',
    title: 'Birunya Laut Mediterania di French Riviera',
    category: 'negara',
    region: 'Eropa',
    country: 'Prancis',
    flag: '🇫🇷',
    city: 'Nice',
    spot: 'Promenade des Anglais & Colline du Château',
    date: '2025-05-22',
    season: 'Musim Semi',
    companions: 'Keluarga',
    mood: 'Damai & Takjub',
    rating: 5,
    favorite: false,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    coords: [43.6960, 7.2656],
    notes: 'Jalan santai di trotoar Promenade yang ikonik dengan kursi-kursi biru menghadap teluk Baie des Anges. Air lautnya berwarna biru kobalt yang berkilauan di bawah hangatnya sinar matahari Mediterania.',
    highlights: ['Panorama dari Puncak Colline du Château', 'Pasar Bunga & Kuliner Cours Saleya', 'Gelato lavender di kota tua Vieille Ville'],
    cost: '€ 110 / hari',
    createdAt: 1716336000000
  },
  {
    id: 'mem_eropa_zurich',
    title: 'Keagungan Puncak Bersalju Alpen di Swiss',
    category: 'negara',
    region: 'Eropa',
    country: 'Swiss',
    flag: '🇨🇭',
    city: 'Zurich / Zermatt',
    spot: 'Puncak Matterhorn & Danau Zurich',
    date: '2025-05-26',
    season: 'Musim Semi Dingin',
    companions: 'Pasangan',
    mood: 'Healing & Menenangkan',
    rating: 5,
    favorite: true,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    coords: [46.0207, 7.7491],
    notes: 'Naik kereta panorama melintasi lembah hijau yang dipenuhi bunga liar dengan latar belakang puncak Matterhorn berselimut salju abadi. Menikmati keju fondue hangat di pondok kayu lereng gunung.',
    highlights: ['Kereta Glacier Express Alpen', 'Mencicipi cokelat Swiss asli di Lindt Home of Chocolate', 'Berlayar santai di Danau Zurich'],
    cost: 'CHF 180 / hari',
    createdAt: 1716681600000
  },
  {
    id: 'mem_eropa_roma',
    title: 'Napak Tilas Kejayaan Kuno di Colosseum Roma',
    category: 'negara',
    region: 'Eropa',
    country: 'Italia',
    flag: '🇮🇹',
    city: 'Roma',
    spot: 'Colosseum & Air Mancur Trevi',
    date: '2025-05-30',
    season: 'Awal Musim Panas',
    companions: 'Pasangan',
    mood: 'Budaya & Sejarah',
    rating: 5,
    favorite: false,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    coords: [41.8902, 12.4922],
    notes: 'Menyusuri jalan berbatu kuno yang pernah dilalui kaisar Romawi ribuan tahun silam. Melempar koin ke Fontana di Trevi sambil membuat permohonan agar suatu hari nanti bisa kembali lagi ke kota abadi ini.',
    highlights: ['Tur ruang bawah tanah Colosseum', 'Pizza margherita tipis renyah otentik Italia', 'Pistachio Gelato dekat Pantheon'],
    cost: '€ 130 / hari',
    createdAt: 1717027200000
  },
  {
    id: 'mem_eropa_amsterdam',
    title: 'Gowes Sepeda di Sepanjang Kanal Amsterdam',
    category: 'negara',
    region: 'Eropa',
    country: 'Belanda',
    flag: '🇳🇱',
    city: 'Amsterdam',
    spot: 'Kanal Prinsengracht & Rijksmuseum',
    date: '2025-06-03',
    season: 'Awal Musim Panas',
    companions: 'Geng Sahabat',
    mood: 'Santai & Seru',
    rating: 5,
    favorite: false,
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1200&q=80',
    coords: [52.3676, 4.9041],
    notes: 'Menyewa sepeda klasik dan menyusuri tepian kanal berbunga tulip. Rumah-rumah bata abad ke-17 yang miring anggun dan jembatan melengkung menciptakan suasana kota paling santai di Eropa.',
    highlights: ['Wisata perahu menyusuri kanal air', 'Mencicipi stroopwafel hangat lumer karamel', 'Taman Vondelpark yang rindang'],
    cost: '€ 125 / hari',
    createdAt: 1717372800000
  }
];

window.memoryDB = new MemoryDB();
window.PRESET_MEMORIES = PRESET_MEMORIES;
