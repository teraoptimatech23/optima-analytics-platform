/**
 * Reference (dimension) data for the synthetic Kopi Kenangan estate.
 *
 * Numbers here are the "business facts" the simulation is built on: store
 * footprint weighted the way a large Indonesian coffee chain actually skews
 * (Jabodetabek-heavy), menu pricing in the Rp 18k–35k band, and per-outlet
 * operating quality that later drives waiting time, satisfaction and churn.
 */

export const PERIOD_START = '2025-07-01'
export const PERIOD_END = '2026-06-15' // matches the "Diperbarui 15 Jun 2026" header

export const REGIONS = [
  { id: 'RG01', name: 'Jabodetabek' },
  { id: 'RG02', name: 'Jawa Barat' },
  { id: 'RG03', name: 'Jawa Tengah & DIY' },
  { id: 'RG04', name: 'Jawa Timur' },
  { id: 'RG05', name: 'Sumatera' },
  { id: 'RG06', name: 'Bali & Nusa Tenggara' },
  { id: 'RG07', name: 'Sulawesi' },
  { id: 'RG08', name: 'Kalimantan' },
]

/**
 * Outlet types carry their own economics:
 *   footfall  – relative daily traffic
 *   speed     – service throughput (higher = shorter queues)
 *   ambience  – seating comfort, drives the "tempat nyaman" scores
 *   delivery  – share of orders arriving from aggregators
 */
export const OUTLET_TYPES = {
  Mall: { footfall: 1.25, speed: 0.95, ambience: 4.3, delivery: 0.34, seats: 46 },
  'Street Store': { footfall: 1.0, speed: 1.0, ambience: 3.8, delivery: 0.46, seats: 28 },
  'Office Tower': { footfall: 1.15, speed: 1.1, ambience: 3.9, delivery: 0.3, seats: 24 },
  Transit: { footfall: 1.45, speed: 0.85, ambience: 3.2, delivery: 0.18, seats: 12 },
  'Drive Thru': { footfall: 1.1, speed: 1.2, ambience: 3.5, delivery: 0.26, seats: 20 },
  Kiosk: { footfall: 0.85, speed: 1.05, ambience: 2.9, delivery: 0.5, seats: 6 },
}

// [outletId, name, city, regionId, type, openedOn, parking, qualityIndex]
// qualityIndex (0.85–1.15) is the store's own execution level: staffing,
// barista tenure, equipment age. It is the main reason two outlets with the
// same traffic report different satisfaction.
export const OUTLETS = [
  ['OT01', 'Grand Indonesia', 'Jakarta Pusat', 'RG01', 'Mall', '2019-03-14', true, 1.08],
  ['OT02', 'Sudirman Plaza', 'Jakarta Pusat', 'RG01', 'Office Tower', '2019-08-02', true, 1.05],
  ['OT03', 'Thamrin City', 'Jakarta Pusat', 'RG01', 'Mall', '2020-11-20', true, 0.97],
  ['OT04', 'Stasiun Gambir', 'Jakarta Pusat', 'RG01', 'Transit', '2021-06-11', false, 0.92],
  ['OT05', 'Menteng Raya', 'Jakarta Pusat', 'RG01', 'Street Store', '2018-09-01', false, 1.02],
  ['OT06', 'Senopati', 'Jakarta Selatan', 'RG01', 'Street Store', '2018-05-19', false, 1.12],
  ['OT07', 'Kemang Raya', 'Jakarta Selatan', 'RG01', 'Street Store', '2019-02-08', true, 1.06],
  ['OT08', 'Blok M Plaza', 'Jakarta Selatan', 'RG01', 'Mall', '2019-11-15', true, 0.99],
  ['OT09', 'SCBD Lot 8', 'Jakarta Selatan', 'RG01', 'Office Tower', '2020-02-24', true, 1.1],
  ['OT10', 'Fatmawati', 'Jakarta Selatan', 'RG01', 'Street Store', '2021-01-30', false, 0.94],
  ['OT11', 'Tebet Timur', 'Jakarta Selatan', 'RG01', 'Street Store', '2021-09-04', false, 0.96],
  ['OT12', 'Kelapa Gading', 'Jakarta Utara', 'RG01', 'Mall', '2019-06-21', true, 1.01],
  ['OT13', 'Pluit Village', 'Jakarta Utara', 'RG01', 'Mall', '2020-08-13', true, 0.93],
  ['OT14', 'Sunter Podomoro', 'Jakarta Utara', 'RG01', 'Street Store', '2022-02-17', true, 0.9],
  ['OT15', 'Puri Indah', 'Jakarta Barat', 'RG01', 'Mall', '2019-09-27', true, 1.03],
  ['OT16', 'Taman Anggrek', 'Jakarta Barat', 'RG01', 'Mall', '2020-01-18', true, 1.0],
  ['OT17', 'Kebon Jeruk', 'Jakarta Barat', 'RG01', 'Drive Thru', '2021-11-06', true, 1.04],
  ['OT18', 'Cakung Raya', 'Jakarta Timur', 'RG01', 'Street Store', '2021-04-23', false, 0.89],
  ['OT19', 'Cibubur Junction', 'Jakarta Timur', 'RG01', 'Mall', '2020-06-05', true, 0.98],
  ['OT20', 'Rawamangun', 'Jakarta Timur', 'RG01', 'Street Store', '2022-05-14', false, 0.91],
  ['OT21', 'Bekasi Cyber Park', 'Bekasi', 'RG01', 'Mall', '2020-10-09', true, 0.95],
  ['OT22', 'Summarecon Bekasi', 'Bekasi', 'RG01', 'Mall', '2021-07-16', true, 0.99],
  ['OT23', 'Margonda Depok', 'Depok', 'RG01', 'Street Store', '2019-12-12', false, 1.02],
  ['OT24', 'UI Depok', 'Depok', 'RG01', 'Kiosk', '2022-08-19', false, 0.93],
  ['OT25', 'BSD Green Office', 'Tangerang Selatan', 'RG01', 'Office Tower', '2020-03-06', true, 1.07],
  ['OT26', 'Alam Sutera', 'Tangerang Selatan', 'RG01', 'Mall', '2021-02-26', true, 1.0],
  ['OT27', 'Bintaro Xchange', 'Tangerang Selatan', 'RG01', 'Mall', '2022-01-21', true, 0.97],
  ['OT28', 'Tangcity', 'Tangerang', 'RG01', 'Mall', '2021-05-28', true, 0.92],
  ['OT29', 'Dago Bandung', 'Bandung', 'RG02', 'Street Store', '2019-07-05', false, 1.09],
  ['OT30', 'Paris Van Java', 'Bandung', 'RG02', 'Mall', '2020-09-11', true, 1.04],
  ['OT31', 'Buah Batu', 'Bandung', 'RG02', 'Street Store', '2022-03-25', false, 0.94],
  ['OT32', 'Cirebon Grage', 'Cirebon', 'RG02', 'Mall', '2022-09-30', true, 0.88],
  ['OT33', 'Bogor Botani', 'Bogor', 'RG02', 'Mall', '2021-03-19', true, 0.98],
  ['OT34', 'Simpang Lima', 'Semarang', 'RG03', 'Mall', '2021-08-27', true, 0.96],
  ['OT35', 'Malioboro', 'Yogyakarta', 'RG03', 'Street Store', '2020-12-04', false, 1.05],
  ['OT36', 'Ambarrukmo', 'Yogyakarta', 'RG03', 'Mall', '2022-06-10', true, 0.99],
  ['OT37', 'Solo Paragon', 'Surakarta', 'RG03', 'Mall', '2023-01-13', true, 0.9],
  ['OT38', 'Tunjungan Plaza', 'Surabaya', 'RG04', 'Mall', '2019-10-25', true, 1.06],
  ['OT39', 'Pakuwon Mall', 'Surabaya', 'RG04', 'Mall', '2020-07-31', true, 1.01],
  ['OT40', 'Darmo Permai', 'Surabaya', 'RG04', 'Street Store', '2022-04-08', false, 0.93],
  ['OT41', 'Malang Kota', 'Malang', 'RG04', 'Street Store', '2022-11-18', false, 0.95],
  ['OT42', 'Sun Plaza Medan', 'Medan', 'RG05', 'Mall', '2020-05-22', true, 0.97],
  ['OT43', 'Ringroad Medan', 'Medan', 'RG05', 'Drive Thru', '2022-07-29', true, 0.92],
  ['OT44', 'Palembang Icon', 'Palembang', 'RG05', 'Mall', '2023-02-24', true, 0.89],
  ['OT45', 'Pekanbaru SKA', 'Pekanbaru', 'RG05', 'Mall', '2023-05-12', true, 0.91],
  ['OT46', 'Sunset Road', 'Denpasar', 'RG06', 'Street Store', '2021-10-15', true, 1.11],
  ['OT47', 'Panakkukang', 'Makassar', 'RG07', 'Mall', '2022-10-07', true, 0.94],
  ['OT48', 'Balikpapan Plaza', 'Balikpapan', 'RG08', 'Mall', '2023-03-17', true, 0.9],
]

// [productId, name, category, basePrice, popularity]
export const PRODUCTS = [
  ['PR01', 'Kopi Kenangan Mantan', 'Coffee', 22000, 100],
  ['PR02', 'Kopi Kenangan Hazelnut', 'Coffee', 25000, 58],
  ['PR03', 'Kopi Aren Kenangan', 'Coffee', 24000, 62],
  ['PR04', 'Caramel Macchiato', 'Coffee', 30000, 34],
  ['PR05', 'Cafe Latte', 'Coffee', 27000, 41],
  ['PR06', 'Cappuccino', 'Coffee', 27000, 28],
  ['PR07', 'Americano', 'Coffee', 20000, 33],
  ['PR08', 'Cold Brew Original', 'Coffee', 32000, 17],
  ['PR09', 'Kopi Susu Gula Aren Jumbo', 'Coffee', 28000, 26],
  ['PR10', 'Espresso Single', 'Coffee', 18000, 8],
  ['PR11', 'Chocolate Kenangan', 'Non Coffee', 26000, 44],
  ['PR12', 'Matcha Latte', 'Non Coffee', 30000, 31],
  ['PR13', 'Thai Tea Kenangan', 'Non Coffee', 24000, 27],
  ['PR14', 'Red Velvet Latte', 'Non Coffee', 29000, 19],
  ['PR15', 'Lemon Tea Segar', 'Non Coffee', 20000, 22],
  ['PR16', 'Milkshake Vanilla', 'Non Coffee', 32000, 12],
  ['PR17', 'Croissant Butter', 'Snack', 22000, 30],
  ['PR18', 'Cromboloni Pistachio', 'Snack', 28000, 26],
  ['PR19', 'Banana Cake Slice', 'Snack', 18000, 21],
  ['PR20', 'Chicken Wrap', 'Snack', 35000, 14],
  ['PR21', 'Donat Gula Aren', 'Snack', 15000, 18],
  ['PR22', 'Cookies Choco Chip', 'Snack', 12000, 16],
]

/** City-level price index — Jakarta and Bali run above the national list. */
export const CITY_PRICE_INDEX = {
  'Jakarta Pusat': 1.06,
  'Jakarta Selatan': 1.08,
  'Jakarta Utara': 1.04,
  'Jakarta Barat': 1.04,
  'Jakarta Timur': 1.0,
  Bekasi: 0.98,
  Depok: 0.97,
  'Tangerang Selatan': 1.03,
  Tangerang: 0.99,
  Bandung: 1.0,
  Cirebon: 0.94,
  Bogor: 0.98,
  Semarang: 0.95,
  Yogyakarta: 0.93,
  Surakarta: 0.92,
  Surabaya: 1.02,
  Malang: 0.94,
  Medan: 0.97,
  Palembang: 0.95,
  Pekanbaru: 0.96,
  Denpasar: 1.09,
  Makassar: 0.96,
  Balikpapan: 1.01,
}

export const AGE_BANDS = [
  { id: '18-24', share: 0.3, min: 18, max: 24 },
  { id: '25-35', share: 0.45, min: 25, max: 35 },
  { id: '36-45', share: 0.15, min: 36, max: 45 },
  { id: '46+', share: 0.1, min: 46, max: 62 },
]

/** Occupation depends on age — students collapse to near zero past 25. */
export const OCCUPATION_BY_AGE = {
  '18-24': [['Student', 62], ['Professional', 20], ['Freelancer', 11], ['Entrepreneur', 5], ['Housewife', 2]],
  '25-35': [['Professional', 58], ['Entrepreneur', 16], ['Freelancer', 15], ['Housewife', 8], ['Student', 3]],
  '36-45': [['Professional', 49], ['Entrepreneur', 24], ['Housewife', 17], ['Freelancer', 10], ['Student', 0]],
  '46+': [['Entrepreneur', 33], ['Professional', 31], ['Housewife', 28], ['Freelancer', 8], ['Student', 0]],
}

/** Monthly net income in rupiah — lognormal parameters per occupation. */
export const INCOME_PARAMS = {
  Student: { mu: 14.5, sigma: 0.42 },
  Freelancer: { mu: 15.6, sigma: 0.55 },
  Professional: { mu: 16.1, sigma: 0.48 },
  Entrepreneur: { mu: 16.3, sigma: 0.72 },
  Housewife: { mu: 15.2, sigma: 0.6 },
}

export const PAYMENT_METHODS = [
  ['QRIS', 31],
  ['GoPay', 15],
  ['OVO', 11],
  ['ShopeePay', 10],
  ['Dana', 8],
  ['Kartu Debit', 9],
  ['Kartu Kredit', 5],
  ['Tunai', 6],
  ['Saldo Aplikasi', 5],
]

export const CHANNELS = [
  ['Dine In', 'dinein'],
  ['Take Away', 'takeaway'],
  ['GrabFood', 'grabfood'],
  ['GoFood', 'gofood'],
  ['ShopeeFood', 'shopeefood'],
  ['Aplikasi Kopi Kenangan', 'app'],
]

/** Survey attributes: [id, label, whether the store can move it operationally] */
export const SURVEY_ATTRIBUTES = [
  ['taste', 'Rasa yang konsisten', 'quality'],
  ['price', 'Harga yang terjangkau', 'value'],
  ['service', 'Layanan cepat', 'speed'],
  ['ordering', 'Mudah dipesan', 'digital'],
  ['ambience', 'Tempat yang nyaman', 'ambience'],
  ['variety', 'Banyak pilihan menu', 'quality'],
  ['promo', 'Promo menarik', 'value'],
  ['location', 'Lokasi yang mudah dijangkau', 'ambience'],
  ['app', 'Aplikasi mudah digunakan', 'digital'],
  ['parking', 'Parkir memadai', 'ambience'],
]

/**
 * Marketing plan. Budgets are monthly in rupiah and follow a real cadence:
 * always-on brand search, generic prospecting that scales at quarter starts,
 * and burst campaigns around Ramadan/Lebaran and year-end.
 */
export const CAMPAIGNS = [
  { id: 'CP01', name: 'Brand Search - Always On', platform: 'Google Ads', objective: 'Search', start: '2025-07-01', end: '2026-06-15', monthlyBudget: 145_000_000 },
  { id: 'CP02', name: 'Generic Coffee Prospecting', platform: 'Google Ads', objective: 'Search', start: '2025-07-01', end: '2026-06-15', monthlyBudget: 210_000_000 },
  { id: 'CP03', name: 'Competitor Conquest', platform: 'Google Ads', objective: 'Search', start: '2025-08-01', end: '2026-06-15', monthlyBudget: 95_000_000 },
  { id: 'CP04', name: 'Performance Max - Delivery', platform: 'Google Ads', objective: 'PMax', start: '2025-07-01', end: '2026-06-15', monthlyBudget: 260_000_000 },
  { id: 'CP05', name: 'App Install - Loyalty', platform: 'Google Ads', objective: 'App', start: '2025-09-01', end: '2026-06-15', monthlyBudget: 120_000_000 },
  { id: 'CP06', name: 'Awareness Reels Nusantara', platform: 'Meta Ads', objective: 'Awareness', start: '2025-07-01', end: '2026-06-15', monthlyBudget: 180_000_000 },
  { id: 'CP07', name: 'Traffic Store Locator', platform: 'Meta Ads', objective: 'Traffic', start: '2025-07-01', end: '2026-06-15', monthlyBudget: 130_000_000 },
  { id: 'CP08', name: 'Conversion Bundling Hemat', platform: 'Meta Ads', objective: 'Conversion', start: '2025-10-01', end: '2026-06-15', monthlyBudget: 240_000_000 },
  { id: 'CP09', name: 'Retargeting Cart Abandon', platform: 'Meta Ads', objective: 'Retargeting', start: '2025-08-15', end: '2026-06-15', monthlyBudget: 85_000_000 },
  { id: 'CP10', name: 'Kenangan Story Masterbrand', platform: 'YouTube Ads', objective: 'Video Reach', start: '2025-07-01', end: '2026-06-15', monthlyBudget: 165_000_000 },
  { id: 'CP11', name: 'Ramadan Kenangan Berbagi', platform: 'YouTube Ads', objective: 'Video Views', start: '2026-02-01', end: '2026-03-31', monthlyBudget: 320_000_000 },
  { id: 'CP12', name: 'Menu Baru Cromboloni', platform: 'YouTube Ads', objective: 'Video Views', start: '2025-11-01', end: '2026-01-31', monthlyBudget: 150_000_000 },
]

/** Search terms with their own competitive economics. */
export const KEYWORDS = [
  ['KW01', 'kopi kenangan', 'CP01', 'Brand', 12.4, 1450],
  ['KW02', 'kopi kenangan terdekat', 'CP01', 'Brand', 14.1, 1720],
  ['KW03', 'promo kopi kenangan', 'CP01', 'Brand', 11.2, 1980],
  ['KW04', 'menu kopi kenangan', 'CP01', 'Brand', 9.8, 1380],
  ['KW05', 'kopi susu kekinian', 'CP02', 'Generic', 3.1, 4250],
  ['KW06', 'kedai kopi terdekat', 'CP02', 'Generic', 3.8, 5100],
  ['KW07', 'delivery kopi', 'CP02', 'Generic', 2.9, 4680],
  ['KW08', 'kopi murah enak', 'CP02', 'Generic', 2.4, 3150],
  ['KW09', 'coffee shop jakarta', 'CP02', 'Generic', 2.2, 5850],
  ['KW10', 'kopi janji jiwa', 'CP03', 'Competitor', 1.9, 6200],
  ['KW11', 'fore coffee promo', 'CP03', 'Competitor', 2.1, 5900],
  ['KW12', 'starbucks alternatif', 'CP03', 'Competitor', 1.6, 6750],
  ['KW13', 'pesan kopi online', 'CP04', 'Generic', 3.4, 3980],
  ['KW14', 'aplikasi kopi kenangan', 'CP05', 'Brand', 10.6, 1240],
]

export const DEVICES = [['Mobile', 78], ['Desktop', 15], ['Tablet', 7]]

export const AD_LOCATIONS = [
  ['DKI Jakarta', 34],
  ['Jawa Barat', 21],
  ['Jawa Timur', 12],
  ['Jawa Tengah & DIY', 10],
  ['Banten', 9],
  ['Sumatera Utara', 5],
  ['Bali', 4],
  ['Sulawesi Selatan', 3],
  ['Kalimantan Timur', 2],
]
