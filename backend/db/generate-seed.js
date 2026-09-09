#!/usr/bin/env node
// Deterministic seed generator — writes backend/db/seed.sql
// Run: node backend/db/generate-seed.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- RNG helpers
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260908);
const rand = (min, max) => min + rnd() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const round1 = (n) => Math.round(n * 10) / 10;

const esc = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

// ---------------------------------------------------------------- SQL helpers
let out = [];
const push = (s) => out.push(s);

const seq = { n: 0 };
const nextUid = () =>
  '00000000-0000-4000-8000-' + (++seq.n).toString(16).padStart(12, '0');

// ---------------------------------------------------------------- Vocabulary
const NAMES = [
  'আব্দুর রহিম', 'করিম মিয়া', 'আব্দুল মান্নান', 'জাহাঙ্গীর আলম', 'মোশাররফ হোসেন', 'নুরুল ইসলাম',
  'আব্দুল কাদের', 'সাইফুল ইসলাম', 'মজিবর রহমান', 'আবুল কালাম', 'ছোটন মিয়া', 'শফিকুল ইসলাম',
  'আনোয়ার হোসেন', 'দেলোয়ার হোসেন', 'হাবিবুর রহমান', 'ইসমাইল হোসেন', 'জামাল উদ্দিন', 'কবির হোসেন',
  'লুৎফর রহমান', 'মোস্তফা কামাল', 'নাজমুল হুদা', 'ওমর আলী', 'পলাশ মিয়া', 'রফিকুল ইসলাম',
  'সেলিম রেজা', 'তাজুল ইসলাম', 'উজ্জল হোসেন', 'রবিউল ইসলাম', 'শাকিল আহমেদ', 'তপন কুমার দাস',
  'আলমগীর হোসেন', 'বেলাল হোসেন', 'চন্দন কুমার', 'দিলিপ কুমার', 'এনামুল হক', 'ফরিদ উদ্দিন',
  'গোলাম মোস্তফা', 'হারুন অর রশিদ', 'ইকবাল হোসেন', 'জসিম উদ্দিন',
];

const DIVISIONS = [
  'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ',
];
const DISTRICTS = {
  'ঢাকা': ['টাঙ্গাইল', 'কিশোরগঞ্জ', 'ফরিদপুর', 'গাজীপুর', 'মাদারীপুর', 'নরসিংদী'],
  'চট্টগ্রাম': ['কুমিল্লা', 'ব্রাহ্মণবাড়িয়া', 'ফেনী', 'চাঁদপুর', 'নোয়াখালী'],
  'রাজশাহী': ['বগুড়া', 'পাবনা', 'নাটোর', 'সিরাজগঞ্জ', 'নওগাঁ', 'রাজশাহী'],
  'খুলনা': ['যশোর', 'কুষ্টিয়া', 'সাতক্ষীরা', 'ঝিনাইদহ', 'খুলনা'],
  'বরিশাল': ['বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর'],
  'সিলেট': ['সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'],
  'রংপুর': ['রংপুর', 'দিনাজপুর', 'গাইবান্ধা', 'কুড়িগ্রাম', 'ঠাকুরগাঁও'],
  'ময়মনসিংহ': ['ময়মনসিংহ', 'নেত্রকোণা', 'জামালপুর', 'শেরপুর'],
};
const UPAZILAS = ['সদর', 'গফরগাঁও', 'ভাঙ্গা', 'মির্জাপুর', 'কালীগঞ্জ', 'দৌলতপুর', 'শিবগঞ্জ', 'কোটালীপাড়া', 'নলিতাবাড়ী', 'ফুলবাড়িয়া'];
const LAND_LABELS = ['পূর্ব পাড়ের খেত', 'ভিটা সংলগ্ন', 'গোয়াল ঘরের পাশে', 'নদীর ধারের খেত', 'বড় পুকুর পাড়', 'উত্তরের খেত', 'কাঁচা রাস্তার পাশে', 'মামার বাড়ির খেত', 'পুরোনো বাগান', 'দেরি খেত', 'খালের পাড়', 'বজ্রখিলা মাঠ'];
const SOIL_TYPES = ['পলি দোআঁশ', 'কাদা মাটি', 'এঁটেল দোআঁশ', 'বেলে দোআঁশ', 'পলি মাটি', 'কৃষ্ণ মাটি'];
const IRRIGATIONS = ['গভীর নলকূপ', 'নলকূপ', 'খাল / নদী', 'পুকুর', 'বৃষ্টি নির্ভর'];
const SEASONS = ['বোরো', 'আমন', 'আউশ', 'রবি', 'খরিপ', 'বারোমাসি'];
const CONDITIONS = ['রোদ', 'মেঘলা', 'বৃষ্টি', 'মুষলধারে বৃষ্টি'];

const CROPS = [
  { name: 'ধান', varieties: ['ব্রি-২৮', 'ব্রি-২৯', 'ব্রি-৫৮', 'স্বর্না', 'বিআর-৩', 'মিনিকেট'], seasons: ['বোরো', 'আমন', 'আউশ'], baseYield: 1500, costPerBigha: 24000 },
  { name: 'গম', varieties: ['বারি গম-২৫', 'বারি গম-৩৩', 'সবজি ৮'], seasons: ['রবি'], baseYield: 900, costPerBigha: 15000 },
  { name: 'ভুট্টা', varieties: ['বারি ভুট্টা-৮', 'বারি ভুট্টা-৯', 'পাচারেড'], seasons: ['খরিপ', 'রবি'], baseYield: 1600, costPerBigha: 16000 },
  { name: 'আলু', varieties: ['কার্ডিনাল', 'ডায়মন্ড', 'গ্রানোলা'], seasons: ['রবি'], baseYield: 1800, costPerBigha: 30000 },
  { name: 'পাট', varieties: ['টোসা-১৩', 'ডেসমি', 'কেনাফ'], seasons: ['খরিপ'], baseYield: 600, costPerBigha: 14000 },
  { name: 'সরিষা', varieties: ['বারি সরিষা-১৪', 'তোরি-৭', 'বাইনালি'], seasons: ['রবি'], baseYield: 300, costPerBigha: 12000 },
  { name: 'চা', varieties: ['বিটি-১', 'বিটি-২', 'স্কম্বার'], seasons: ['বারোমাসি'], baseYield: 400, costPerBigha: 18000 },
  { name: 'টমেটো', varieties: ['বাউ টমেটো-২', 'মিন্টু', 'রূপালী'], seasons: ['রবি'], baseYield: 1300, costPerBigha: 26000 },
  { name: 'পেঁয়াজ', varieties: ['বারি পেঁয়াজ-১', 'বারি পেঁয়াজ-৪', 'লাল ফজলি'], seasons: ['রবি'], baseYield: 900, costPerBigha: 22000 },
  { name: 'রসুন', varieties: ['বারি রসুন-১', 'চায়না রসুন'], seasons: ['রবি'], baseYield: 500, costPerBigha: 25000 },
  { name: 'কাঁচা মরিচ', varieties: ['বারি মরিচ-৩', 'হাইব্রিড সীতাকুণ্ড'], seasons: ['খরিপ'], baseYield: 800, costPerBigha: 20000 },
  { name: 'বেগুন', varieties: ['বারি বেগুন-৪', 'নয়নতারা', 'নয়নী'], seasons: ['খরিপ', 'বারোমাসি'], baseYield: 1300, costPerBigha: 24000 },
  { name: 'লাউ', varieties: ['বারি লাউ-২', 'হাইব্রিড লাউ'], seasons: ['খরিপ', 'বারোমাসি'], baseYield: 900, costPerBigha: 18000 },
];

const DISEASES = {
  'ধান': [
    { d: 'পাতা ব্লাস্ট', p: 'ম্যাগনাপোর্তে গ্রিসিয়া', sev: ['MEDIUM', 'HIGH'], sym: 'পাতায় অক্ষ কাটা দাগ, ডালপালা ও পাতার উভয় পাশে লম্বা দাগ', tr: 'ট্রাইসাইক্লাজল ০.০৬% স্প্রে করুন ১০ দিন পরপর' },
    { d: 'Brown Spot', p: 'হেলমিন্থোস্পোরিয়াম', sev: ['LOW', 'MEDIUM'], sym: 'পাতায় ছোট বাদামি দাগ, ফলক ক্ষতিগ্রস্ত', tr: 'সুষম সার প্রয়োগ, পটাশ বাড়ান, প্রোপিকোনাজল স্প্রে' },
    { d: 'Sheath Blight', p: 'রাইজোক্টোনিয়া', sev: ['MEDIUM', 'HIGH'], sym: 'কান্ডের খৈল অংশে বাদামি দাগ, কান্ড হলুদ', tr: 'আজোক্সিস্ট্রোবিন স্প্রে, অতিরিক্ত নাইট্রোজেন এড়ান' },
    { d: 'বাকানা রোগ', p: 'মাজরা পোকা', sev: ['LOW', 'MEDIUM'], sym: 'চারা হলুদ ও দুর্বল, ডগা পচে যায়', tr: 'আক্রান্ত চারা তুলে ফেলুন, কার্বোফুরান প্রয়োগ' },
  ],
  'গম': [
    { d: 'পাতার মরিচা', p: 'পুচিনিয়া', sev: ['MEDIUM'], sym: 'পাতায় কমলা বাদামি পুঁজ, শস্য হালকা হয়', tr: 'টেবুকোনাজল স্প্রে, প্রতিরোধী জাত চাষ' },
  ],
  'ভুট্টা': [
    { d: 'কোমল মাথা পচা', p: 'ব্যাকটেরিয়া', sev: ['MEDIUM', 'HIGH'], sym: 'কাঁচা শিষ পচে যায়, দুর্গন্ধ হয়', tr: 'ক্ষেত পরিষ্কার রাখুন, ছত্রাকনাশক প্রয়োগ' },
    { d: 'Fall Armyworm', p: 'ফল আর্মি ওয়ার্ম', sev: ['HIGH'], sym: 'পাতা খেয়ে ফেলে, নতুন কচি পাতায় ছিদ্র', tr: 'ইমামেকটিন বেনজোয়েট স্প্রে, ফেরোমন ফাঁদ ব্যবহার' },
  ],
  'আলু': [
    { d: 'লেট ব্লাইট', p: 'ফাইটোফথোরা', sev: ['HIGH'], sym: 'পাতা ও কান্ড বাদামি পচা, টিউবার পচে', tr: 'ম্যানকোজেব + মেটালাক্সিল স্প্রে প্রতি ৭ দিন' },
    { d: 'আর্লি ব্লাইট', p: 'অলটারনেরিয়া', sev: ['MEDIUM'], sym: 'পাতায় গাঢ় বাদামি বৃত্তাকার দাগ', tr: 'প্রোপিনেব স্প্রে, ঘূর্ণায়মান ফসল' },
  ],
  'টমেটো': [
    { d: 'আর্লি ব্লাইট', p: 'অলটারনেরিয়া', sev: ['MEDIUM'], sym: 'নিচের পাতা হলদে, বাদামি দাগ', tr: 'ম্যানকোজেব স্প্রে, মালচিং করুন' },
    { d: 'Bacterial Wilt', p: 'র্যালস্টোনিয়া', sev: ['HIGH'], sym: 'গাছ হঠাৎ শুকিয়ে যায়, কান্ড ভেতরে কালো', tr: 'আক্রান্ত গাছ তুলে ফেলুন, জমি রোদে শুকান' },
  ],
  'বেগুন': [
    { d: 'কাণ্ড ও ফল ছিদ্রকারী পোকা', p: 'লিউসিনোডস', sev: ['MEDIUM', 'HIGH'], sym: 'ফল ও কুঁড়ি ঝরে যায়, ফলের ভেতরে পোকার দানা', tr: 'আক্রান্ত ফল সংগ্রহ, কারবোসালফান স্প্রে' },
  ],
  'পেঁয়াজ': [
    { d: 'Purple Blotch', p: 'অলটারনেরিয়া', sev: ['MEDIUM', 'HIGH'], sym: 'পাতায় সাদা কেন্দ্রবিশিষ্ট বেগুনি দাগ', tr: 'ম্যানকোজেব + ক্লোরোথ্যালোনিল স্প্রে' },
    { d: 'Downy Mildew', p: 'পেরোনোস্পোরা', sev: ['MEDIUM'], sym: 'পাতায় ধূসর বেগুনি ছাপ, ঝরে পড়ে', tr: 'মেটালাক্সিল স্প্রে, বায়ু চলাচল ঠিক রাখুন' },
  ],
  'রসুন': [
    { d: 'Downy Mildew', p: 'পেরোনোস্পোরা', sev: ['MEDIUM'], sym: 'পাতা হলুদ, ডগা শুকায়', tr: 'ম্যানকোজেব স্প্রে, বেশি জল জমতে দেবেন না' },
  ],
  'কাঁচা মরিচ': [
    { d: 'Leaf Curl Virus', p: 'সাদা মাছি', sev: ['HIGH'], sym: 'পাতা কুঁকড়ে যায়, ফুল ঝরে', tr: 'ইমিডাক্লোপ্রিড স্প্রে, সাদা মাছি নিয়ন্ত্রণ' },
    { d: 'Antracnose', p: 'কোলেটোট্রিকাম', sev: ['MEDIUM'], sym: 'ফলে কালো বাদামি ক্ষত, পচে যায়', tr: 'প্রোপিকোনাজল স্প্রে, আক্রান্ত ফল অপসারণ' },
  ],
  'লাউ': [
    { d: 'Downy Mildew', p: 'পেরোনোস্পোরা', sev: ['MEDIUM'], sym: 'পাতার উপর হলুদ ছাপ, নিচে ধূসর ছত্রাক', tr: 'মেটালাক্সিল স্প্রে' },
  ],
  'চা': [
    { d: 'Blister Blight', p: 'এক্সো ব্যাসিডিয়াম', sev: ['MEDIUM', 'HIGH'], sym: 'কচি পাতায় পাকানো দাগ, ঝরে পড়ে', tr: 'কপার ছত্রাকনাশক স্প্রে, ছায়া ব্যবস্থাপনা' },
  ],
};

const MARKET = {
  'ধান': { price: 42, dist: ['বগুড়া', 'টাঙ্গাইল'] },
  'গম': { price: 40, dist: ['দিনাজপুর', 'পাবনা'] },
  'ভুট্টা': { price: 30, dist: ['যশোর', 'বগুড়া'] },
  'আলু': { price: 28, dist: ['বগুড়া', 'রংপুর'] },
  'পাট': { price: 82, dist: ['নরসিংদী', 'কিশোরগঞ্জ'] },
  'সরিষা': { price: 115, dist: ['কুষ্টিয়া', 'নাটোর'] },
  'চা': { price: 220, dist: ['সিলেট', 'মৌলভীবাজার'] },
  'টমেটো': { price: 38, dist: ['ঢাকা', 'গাজীপুর'] },
  'পেঁয়াজ': { price: 62, dist: ['ফরিদপুর', 'ঢাকা'] },
  'রসুন': { price: 165, dist: ['মৌলভীবাজার', 'ঢাকা'] },
  'কাঁচা মরিচ': { price: 85, dist: ['বগুড়া', 'চট্টগ্রাম'] },
  'বেগুন': { price: 45, dist: ['ঢাকা', 'রাজশাহী'] },
  'লাউ': { price: 22, dist: ['কুমিল্লা', 'চট্টগ্রাম'] },
};

// ---------------------------------------------------------------- Date helpers
const D = (y, m, day) => {
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt;
};
const iso = (dt) => dt.toISOString().slice(0, 10);

// Season planting/harvest (month, day) anchor windows for 2026 crop year
const SEASON_DATES = {
  'বোরো': { plant: [12, 5], harvest: [4, 30] },      // planted Dec 2025, harvest Apr 2026
  'আমন': { plant: [7, 5], harvest: [11, 20] },       // planted Jul 2026, harvest Nov 2026
  'আউশ': { plant: [3, 5], harvest: [6, 25] },        // Mar 2026 -> Jun 2026
  'রবি': { plant: [11, 5], harvest: [2, 25] },       // Nov 2025 -> Feb 2026
  'খরিপ': { plant: [4, 5], harvest: [8, 20] },       // Apr 2026 -> Aug 2026
  'বারোমাসি': { plant: [5, 15], harvest: [9, 20] },   // May 2026 -> Sep 2026
};

function seasonPlantHarvest(season) {
  const s = SEASON_DATES[season];
  let py = 2026;
  let hy = 2026;
  if (season === 'বোরো' || season === 'রবি') { py = 2025; hy = 2026; }
  return { plant: D(py, s.plant[0], s.plant[1]), harvest: D(hy, s.harvest[0], s.harvest[1]) };
}

// ================================================================ BUILD DATA
const baseN = 1;

// --- Users ----------------------------------------------------------
const users = [];
const addUser = (name, email, role, division, district, phone) =>
  users.push({ name, email, role, division, district, phone });

addUser('অ্যাডমিন', 'admin@cropyield.com', 'ADMIN', 'ঢাকা', 'ঢাকা', '01711111111');
addUser('কৃষি কর্মকর্তা', 'officer@cropyield.com', 'OFFICER', 'ঢাকা', 'টাঙ্গাইল', '01722222222');
addUser('সিনিয়র কৃষি কর্মকর্তা', 'officer2@cropyield.com', 'OFFICER', 'রাজশাহী', 'বগুড়া', '01722223333');
addUser('রহিম উদ্দিন', 'farmer@cropyield.com', 'FARMER', 'ঢাকা', 'টাঙ্গাইল', '01733333333');
NAMES.forEach((nm, i) => {
  const div = pick(DIVISIONS);
  const dist = pick(DISTRICTS[div]);
  addUser(nm, `farmer${i + 1}@cropyield.com`, 'FARMER', div, dist, `017${String(randInt(10000000, 99999999))}`);
});

// --- Farmers --------------------------------------------------------
const farmers = users
  .filter((u) => u.role === 'FARMER')
  .map((u, i) => ({ user: u, idx: i, landIds: [], cropIds: [] }));

// --- Lands ----------------------------------------------------------
const lands = [];
farmers.forEach((f) => {
  const nLands = f.idx === 0 ? 3 : randInt(1, 3);
  for (let k = 0; k < nLands; k++) {
    const area = round1(rand(1, 12));
    lands.push({
      farmerId: f.idx, label: pick(LAND_LABELS), area,
      soilType: pick(SOIL_TYPES), irrigation: pick(IRRIGATIONS),
      lat: round1(rand(22.0, 26.0)), lng: round1(rand(88.5, 92.5)),
      addr: pick(UPAZILAS), division: f.user.division, district: f.user.district,
    });
    f.landIds.push(lands.length - 1);
  }
});

// --- Crops ----------------------------------------------------------
const crops = [];
farmers.forEach((f) => {
  f.landIds.forEach((li) => {
    const crop = pick(CROPS);
    const season = pick(crop.seasons);
    const variety = pick(crop.varieties);
    const hp = { plant: D(2026, 1, randInt(1, 28)), harvest: D(2026, 5, randInt(1, 28)), status: 'GROWING' };
    if (chance(0.12)) {
      // upcoming harvest within ~2 weeks (dashboard "আসন্ন ফসল কাটা")
      const today = new Date();
      hp.plant = new Date(today.getTime() - 100 * 86400000);
      hp.harvest = new Date(today.getTime() + randInt(1, 10) * 86400000);
    } else {
      const sd = seasonPlantHarvest(season);
      if (chance(0.5)) { hp.plant = sd.plant; hp.harvest = sd.harvest; }
    }
    const id = crops.length;
    crops.push({
      id, landId: li, farmerId: f.idx, name: crop.name, variety,
      season, plantDate: hp.plant <= hp.harvest ? hp.plant : hp.harvest,
      harvestDate: hp.harvest, status: hp.status, care: '',
      cropMeta: crop,
    });
    f.cropIds.push(id);
  });
});

// Mark some crops HARVESTED (they will get production records)
const harvestedIdx = [];
crops.forEach((c, idx) => {
  if (idx % 2 === 1 && harvestedIdx.length < 55) harvestedIdx.push(c.id);
});

// Guarantee the default farmer account (idx 0) has a full dashboard:
// 1 upcoming-harvest crop, 1 HARVESTED crop (for production), 1 open disease.
{
  const f0Crops = crops.filter((c) => c.farmerId === 0);
  if (f0Crops.length > 0) {
    const upcoming = f0Crops[0];
    const today = new Date();
    upcoming.plantDate = new Date(today.getTime() - 95 * 86400000);
    upcoming.harvestDate = new Date(today.getTime() + 6 * 86400000);
    upcoming.status = 'GROWING';
    const harvested = f0Crops.find((c) => c.id !== upcoming.id && c.status !== 'HARVESTED') || f0Crops[f0Crops.length - 1];
    harvested.status = 'HARVESTED';
    if (!harvestedIdx.includes(harvested.id)) harvestedIdx.push(harvested.id);
  }
}
harvestedIdx.forEach((id) => { crops[id].status = 'HARVESTED'; });

// --- Soil tests ------------------------------------------------------
const soilTests = [];
lands.forEach((li, i) => {
  const n = chance(0.2) ? 2 : 1;
  for (let k = 0; k < n; k++) {
    soilTests.push({
      landIdx: i,
      testedAt: iso(D(2026, randInt(2, 8), randInt(1, 27))),
      ph: round1(rand(5.0, 7.4)), n: round1(rand(0.15, 0.7)),
      p: round1(rand(6, 35)), k: round1(rand(35, 175)),
      om: round1(rand(0.8, 3.4)),
      rec: pick(['সুষম সার প্রয়োগ করুন', 'কমপোস্ট সার প্রয়োগ করুন, ইউরিয়া কম দিন', 'ফসফেট সার বাড়ান', 'পটাশ সার বাড়ান', 'উপযুক্ত মাটি, স্বাভাবিক সার পরিকল্পনা']),
    });
  }
});
// latest soil test index per land (for training data + recommendations)
const latestSoilIdx = {};
soilTests.forEach((s, i) => { latestSoilIdx[s.landIdx] = i; });

// --- Weather ---------------------------------------------------------
const weatherRecords = [];
DIVISIONS.forEach((div, di) => {
  const dist = pick(DISTRICTS[div]);
  for (let dayAgo = 12; dayAgo >= 0; dayAgo--) {
    if (chance(0.45)) continue;
    const dt = new Date(Date.now() - dayAgo * 86400000);
    weatherRecords.push({
      division: div, district: dist, date: iso(dt),
      condition: pick(CONDITIONS),
      temp: round1(rand(24, 34)), hum: randInt(55, 95),
      wind: round1(rand(4, 22)), rain: round1(rand(0, 40)),
    });
  }
});

// --- Market prices ---------------------------------------------------
const marketPrices = [];
const marketDates = [];
for (let m = 3; m <= 9; m++) marketDates.push(D(2026, m, m === 9 ? 2 : 15));
marketDates.push(D(2026, 9, 8));
Object.entries(MARKET).forEach(([cropName, cfg]) => {
  cfg.dist.forEach((district, k) => {
    let price = cfg.price * rand(0.92, 1.08);
    marketDates.forEach((d) => {
      price *= rand(0.97, 1.04);
      marketPrices.push({ cropName, district, unit: 'kg', price: Math.round(price * 100) / 100, date: iso(d) });
    });
  });
});

// --- Disease logs ----------------------------------------------------
const diseaseLogs = [];
const outCrops = crops.filter((c) => c.status === 'HARVESTED');
const activeCrops = crops.filter((c) => c.status !== 'HARVESTED');
const poolCrops = [...activeCrops.slice(0, 28), ...outCrops.slice(0, 14)];
poolCrops.forEach((c) => {
  if (!chance(0.6)) return;
  const ds = DISEASES[c.name] || DISEASES['ধান'];
  const dd = pick(ds);
  const status = chance(0.4) ? 'RESOLVED' : chance(0.6) ? 'OPEN' : 'IN_PROGRESS';
  diseaseLogs.push({
    cropId: c.id, landIdx: c.landId, farmerId: c.farmerId,
    diseaseName: dd.d, pest: dd.p, severity: pick(dd.sev),
    symptoms: dd.sym, treatment: dd.tr, status,
    reportedAt: iso(D(2026, randInt(5, 9), randInt(1, 28))),
  });
});
// Guarantee the default farmer (idx 0) has one OPEN disease report
{
  const f0Active = crops.filter((c) => c.farmerId === 0 && c.status !== 'HARVESTED');
  const target = f0Active[0] || crops[0];
  const already = diseaseLogs.some((d) => d.cropId === target.id);
  if (!already && target) {
    const dd = pick(DISEASES[target.name] || DISEASES['ধান']);
    diseaseLogs.push({
      cropId: target.id, landIdx: target.landId, farmerId: 0,
      diseaseName: dd.d, pest: dd.p, severity: pick(dd.sev),
      symptoms: dd.sym, treatment: dd.tr, status: 'OPEN',
      reportedAt: iso(D(2026, 8, randInt(1, 20))),
    });
  }
}

// --- Production + yield training data --------------------------------
const productions = [];
const yieldTraining = [];
harvestedIdx.forEach((id, k) => {
  const c = crops[id];
  const land = lands[c.landId];
  const farmer = farmers[c.farmerId];
  const season = c.season;
  const yBase = c.cropMeta.baseYield * rand(0.9, 1.35);
  const seasonMult = season === 'বোরো' ? 1.05 : season === 'আমন' ? 0.95 : season === 'আউশ' ? 0.85 : 1;
  const y = Math.round((yBase * seasonMult) * 10) / 10;
  const area = land.area;
  const total = Math.round(y * area * 10) / 10;
  const cost = Math.round(area * c.cropMeta.costPerBigha * rand(0.85, 1.25));
  const unitP = MARKET[c.name] ? MARKET[c.name].price * rand(0.9, 1.15) : 40;
  const revenue = Math.round(total * unitP);
  const harvestDate = iso(D(2026, 9 - (k % 6), randInt(1, 27)));
  const plantDate = iso(new Date(new Date(harvestDate).getTime() - randInt(90, 160) * 86400000));
  const li = latestSoilIdx[c.landId];

  productions.push({
    cropId: c.id, landIdx: c.landId, farmerIdx: c.farmerId, area,
    total, yieldBigha: y, cost, revenue, harvestedAt: harvestDate,
  });

  yieldTraining.push({
    cropName: c.name, variety: c.variety, season, landIdx: c.landId,
    division: farmer.user.division, district: farmer.user.district, area,
    actualYieldKg: total, yieldPerBigha: y,
    ph: soilTests[li]?.ph ?? round1(rand(5.5, 6.8)),
    n: soilTests[li]?.n ?? round1(rand(0.25, 0.55)),
    p: soilTests[li]?.p ?? round1(rand(10, 25)),
    k: soilTests[li]?.k ?? round1(rand(60, 150)),
    om: soilTests[li]?.om ?? round1(rand(1.2, 2.8)),
    temp: round1(rand(22, 32)), rain: round1(rand(30, 160)), hum: randInt(60, 92),
    cost, revenue, plantDate, harvestDate,
  });
});

// Extra historical training samples — guarantee >=10 per crop for the ML models
const cropTempRange = (name) => {
  if (name === 'চা') return [18, 30];
  if (name === 'গম' || name === 'সরিষা' || name === 'পেঁয়াজ' || name === 'রসুন') return [15, 27];
  if (name === 'আলু') return [14, 24];
  return [22, 34];
};
CROPS.forEach((cmeta) => {
  for (let n = 0; n < 12; n++) {
    const season = pick(cmeta.seasons);
    const div = pick(DIVISIONS);
    const dist = pick(DISTRICTS[div]);
    const area = round1(rand(1, 10));
    const seasonMult = season === 'বোরো' ? 1.05 : season === 'আমন' ? 0.95 : season === 'আউশ' ? 0.85 : 1;
    const y = round1(cmeta.baseYield * rand(0.85, 1.3) * seasonMult);
    const total = round1(y * area);
    const cost = Math.round(area * cmeta.costPerBigha * rand(0.85, 1.2));
    const unitP = (MARKET[cmeta.name] ? MARKET[cmeta.name].price : 40) * rand(0.9, 1.15);
    const revenue = Math.round(total * unitP);
    const harvest = D(2026, randInt(1, 9), randInt(1, 27));
    const plant = new Date(new Date(harvest).getTime() - randInt(80, 160) * 86400000);
    const [tmin, tmax] = cropTempRange(cmeta.name);
    yieldTraining.push({
      cropName: cmeta.name, variety: pick(cmeta.varieties), season,
      landIdx: null, division: div, district: dist, area,
      actualYieldKg: total, yieldPerBigha: y,
      ph: round1(rand(5.2, 7.2)), n: round1(rand(0.2, 0.6)),
      p: round1(rand(8, 30)), k: round1(rand(50, 160)),
      om: round1(rand(1, 3)),
      temp: round1(rand(tmin, tmax)), rain: round1(rand(20, 140)), hum: randInt(55, 92),
      cost, revenue, plantDate: iso(plant), harvestDate: iso(harvest),
    });
  }
});

// --- Notifications ----------------------------------------------------
const notifications = [];
const notifUsers = [0, 3, 1, 2].map((i) => users[i]);
const notifBodies = [
  { title: 'আবহাওয়া সতর্কতা', body: 'আগামী ৪৮ ঘণ্টায় ঝড়ো বৃষ্টির সম্ভাবনা রয়েছে', type: 'alert' },
  { title: 'সার প্রয়োগ মনে রাখুন', body: 'ধান খেতে টপ-ড্রেসিংয়ের সময় হয়েছে', type: 'info' },
  { title: 'সেচ ব্যবস্থাপনা', body: 'পর্যাপ্ত বৃষ্টির কারণে সেচ কমিয়ে দিন', type: 'info' },
  { title: 'বাজারদর আপডেট', body: 'আলুর দর বেড়েছে, এখন বিক্রির ভালো সময়', type: 'market' },
  { title: 'ফসল কাটার প্রস্তুতি', body: 'আপনার খেতের ফসল কাটার সময় ঘনিয়ে এসেছে', type: 'harvest' },
];
notifUsers.forEach((u, i) => {
  const n = randInt(2, 4);
  for (let k = 0; k < n; k++) {
    const b = pick(notifBodies);
    notifications.push({
      userId: users.indexOf(u), title: b.title, body: b.body, type: b.type,
      isRead: chance(0.55),
      createdAt: iso(D(2026, randInt(6, 9), randInt(1, 28))),
    });
  }
});

// --- Crop recommendations ---------------------------------------------
const recCrops = ['ধান', 'গম', 'ভুট্টা', 'আলু', 'পাট', 'সরিষা', 'পেঁয়াজ', 'টমেটো', 'বেগুন', 'লাউ'];
const recommendations = [];
const recLandIdx = [];
lands.forEach((l, i) => { if (i % 3 === 0) recLandIdx.push(i); });
recLandIdx.slice(0, 30).forEach((li) => {
  const cs = soilTests[latestSoilIdx[li]] || {};
  const cropN = pick(recCrops);
  recommendations.push({
    landIdx: li, crop: cropN,
    confidence: randInt(70, 97),
    reason: pick([
      'মাটির pH উপযুক্ত, ঋতু অনুকূল', 'মাটির গুণাগুণ অনুযায়ী সেরা পছন্দ',
      'উপযুক্ত মাটি ও জল সরবরাহ নিশ্চিত', 'বাজারদর ও মাটির সাথে সামঞ্জস্যপূর্ণ',
      'এ অঞ্চলে এই ফসল ভালো ফলন দেয়',
    ]),
    season: pick(SEASONS),
    ph: cs.ph ?? null, n: cs.n ?? null, p: cs.p ?? null, k: cs.k ?? null,
    weather: pick(CONDITIONS),
    createdAt: iso(D(2026, randInt(6, 9), randInt(1, 26))),
  });
});

// --- AI predictions ----------------------------------------------------
const aiPredictions = [];
const mkPred = (modelType, entityType, entityId, prediction, confidence, features) => ({
  modelType, entityType, entityId, prediction, confidence, features,
  modelVersion: '1.0.0',
  createdAt: iso(D(2026, randInt(5, 9), randInt(1, 27))),
});
harvestedIdx.slice(0, 12).forEach((cid, i) => {
  const c = crops[cid];
  aiPredictions.push(mkPred(
    'yield', 'crop', 'CROP_' + cid,
    { method: 'ml', per_bigha_kg: yieldTraining[i]?.yieldPerBigha ?? 1800, total_kg: 0 },
    randInt(70, 95),
    { crop_name: c.name, season: c.season, soil_ph: soilTests[i]?.ph ?? 6 }
  ));
});
diseaseLogs.slice(0, 8).forEach((dl, i) => {
  aiPredictions.push(mkPred(
    'disease', 'disease_report', 'CROP_' + dl.cropId,
    { disease_name: dl.diseaseName, severity: dl.severity, confidence: randInt(65, 92) },
    randInt(65, 92),
    { crop_name: crops[dl.cropId]?.name, image: `synthetic_${i}.png` }
  ));
});
recommendations.slice(0, 10).forEach((r, i) => {
  aiPredictions.push(mkPred(
    'recommendation', 'land', 'LAND_' + r.landIdx,
    { recommended_crop: r.crop, score: r.confidence, reason: r.reason },
    r.confidence,
    { soil_ph: r.ph, season: r.season }
  ));
});

// --- disease training data --------------------------------------------
const diseaseTraining = [];
Object.entries(DISEASES).forEach(([cropName, ds]) => {
  ds.forEach((dd, i) => {
    if (diseaseTraining.length >= 26) return;
    diseaseTraining.push({
      cropName, diseaseName: dd.d,
      imageUrl: `synthetic/${cropName}_${i}.png`, verifiedBy: 'কৃষি সম্প্রসারণ অধিদপ্তর',
    });
  });
});

// ================================================================ WRITE SQL
const todayStr = iso(new Date());

// Users
push('-- Seed: realistic demo dataset for the Crop Yield system');
push('-- Passwords: admin123 / officer123 / farmer123 / farmer<no>123');
push('');
push(`-- today anchor: ${todayStr}`);
push('');

const userUids = users.map(() => nextUid());
const farmerFlatten = [];
users.forEach((u, i) => {
  const id = userUids[i];
  const login = u.email.split('@')[0];
  const pw = login === 'admin' ? 'admin123' : login.startsWith('officer') ? 'officer123' : login.startsWith('farmer') ? 'farmer123' : 'farmer123';
  push(
    `INSERT INTO users (id, name, email, password_hash, role, phone, address, division, district, is_active) VALUES
  (${esc(id)}, ${esc(u.name)}, ${esc(u.email)}, crypt(${esc(pw)}, gen_salt('bf', 10)), '${u.role}', ${esc(u.phone)}, ${esc(u.district)}, ${esc(u.division)}, ${esc(u.district)}, TRUE);`
  );
});
push('');

// Farmers
const farmerUids = farmers.map(() => nextUid());
const farmerSoldRows = [];
farmers.forEach((f) => {
  const div = f.user.division, dist = f.user.district;
  const totalLand = lands.filter((l) => l.farmerId === f.idx).reduce((s, l) => s + l.area, 0);
  farmerSoldRows.push(
    `INSERT INTO farmers (id, user_id, name, phone, address, division, district, upazila, union_name, total_land_bigha) VALUES
  (${esc(farmerUids[f.idx])}, ${esc(userUids[users.indexOf(f.user)])}, ${esc(f.user.name)}, ${esc(f.user.phone)}, ${esc(pick(UPAZILAS))}, ${esc(div)}, ${esc(dist)}, ${esc(pick(UPAZILAS))}, ${esc(pick(UPAZILAS))}, ${totalLand});`
  );
});
push(farmerSoldRows.join('\n'));

// Lands
push('');
const landUids = lands.map(() => nextUid());
lands.forEach((l, i) => {
  const farmerId = farmerUids[l.farmerId];
  push(`INSERT INTO lands (id, farmer_id, label, area_bigha, soil_type, irrigation_source, lat, lng, address) VALUES
  (${esc(landUids[i])}, ${esc(farmerId)}, ${esc(l.label)}, ${l.area}, ${esc(l.soilType)}, ${esc(l.irrigation)}, ${l.lat}, ${l.lng}, ${esc(l.addr)});`);
});
push('');

// Crops
push('');
const cropUids = crops.map(() => nextUid());
crops.forEach((c) => {
  const landId = landUids[c.landId];
  const farmerId = farmerUids[c.farmerId];
  push(`INSERT INTO crops (id, land_id, farmer_id, name, variety, season, planting_date, expected_harvest_date, status, care_notes) VALUES
  (${esc(cropUids[c.id])}, ${esc(landId)}, ${esc(farmerId)}, ${esc(c.name)}, ${esc(c.variety)}, ${esc(c.season)}, ${esc(iso(c.plantDate))}, ${esc(iso(c.harvestDate))}, '${c.status}', NULL);`);
});
push('');

// Soil tests
push('');
const soilUids = soilTests.map(() => nextUid());
soilTests.forEach((s, i) => {
  push(`INSERT INTO soil_tests (id, land_id, tested_at, ph, nitrogen, phosphorus, potassium, organic_matter, recommendation) VALUES
  (${esc(soilUids[i])}, ${esc(landUids[s.landIdx])}, ${esc(s.testedAt)}, ${s.ph}, ${s.n}, ${s.p}, ${s.k}, ${s.om}, ${esc(s.rec)});`);
});
push('');

// Weather
push('');
const weatherUids = weatherRecords.map(() => nextUid());
weatherRecords.forEach((w, i) => {
  push(`INSERT INTO weather_records (id, division, district, record_date, condition, temperature_c, humidity, wind_kph, rainfall_mm, source) VALUES
  (${esc(weatherUids[i])}, ${esc(w.division)}, ${esc(w.district)}, ${esc(w.date)}, ${esc(w.condition)}, ${w.temp}, ${w.hum}, ${w.wind}, ${w.rain}, 'manual');`);
});
push('');

// Market prices
push('');
const marketUids = marketPrices.map(() => nextUid());
marketPrices.forEach((m, i) => {
  push(`INSERT INTO market_prices (id, crop_name, district, unit, price, price_date) VALUES
  (${esc(marketUids[i])}, ${esc(m.cropName)}, ${esc(m.district)}, ${esc(m.unit)}, ${m.price}, ${esc(m.date)});`);
});
push('');

// Disease logs
push('');
const diseaseUids = diseaseLogs.map(() => nextUid());
diseaseLogs.forEach((dl, i) => {
  push(`INSERT INTO disease_logs (id, crop_id, land_id, farmer_id, disease_name, pest_name, severity, symptoms, treatment, image_url, status, reported_at) VALUES
  (${esc(diseaseUids[i])}, ${esc(cropUids[dl.cropId])}, ${esc(landUids[dl.landIdx])}, ${esc(farmerUids[dl.farmerId])}, ${esc(dl.diseaseName)}, ${esc(dl.pest)}, '${dl.severity}', ${esc(dl.symptoms)}, ${esc(dl.treatment)}, NULL, '${dl.status}', ${esc(dl.reportedAt + 'T09:00:00+06:00')});`);
});
push('');

// Production
push('');
const prodUids = productions.map(() => nextUid());
productions.forEach((p, i) => {
  push(`INSERT INTO crop_production (id, crop_id, land_id, farmer_id, area_bigha, total_quantity_kg, yield_per_bigha_kg, cost_taka, revenue_taka, harvested_at) VALUES
  (${esc(prodUids[i])}, ${esc(cropUids[p.cropId])}, ${esc(landUids[p.landIdx])}, ${esc(farmerUids[p.farmerIdx])}, ${p.area}, ${p.total}, ${p.yieldBigha}, ${p.cost}, ${p.revenue}, ${esc(p.harvestedAt + 'T10:00:00+06:00')});`);
});
push('');

// Notifications
push('');
const notifUids = notifications.map(() => nextUid());
notifications.forEach((nt, i) => {
  push(`INSERT INTO notifications (id, user_id, title, body, type, is_read, created_at) VALUES
  (${esc(notifUids[i])}, ${esc(userUids[nt.userId])}, ${esc(nt.title)}, ${esc(nt.body)}, ${esc(nt.type)}, ${nt.isRead ? 'TRUE' : 'FALSE'}, ${esc(nt.createdAt + 'T08:00:00+06:00')});`);
});
push('');

// Crop recommendations
push('');
const recUids = recommendations.map(() => nextUid());
recLandIdx.slice(0, 30).forEach((li, i) => {
  const r = recommendations[i];
  if (!r) return;
  push(`INSERT INTO crop_recommendations (id, land_id, recommended_crop, confidence, reason, season, soil_ph, soil_nitrogen, soil_phosphorus, soil_potassium, weather_condition, model_version, created_at) VALUES
  (${esc(recUids[i])}, ${esc(landUids[li])}, ${esc(r.crop)}, ${r.confidence}, ${esc(r.reason)}, ${esc(r.season)}, ${r.ph ?? 'NULL'}, ${r.n ?? 'NULL'}, ${r.p ?? 'NULL'}, ${r.k ?? 'NULL'}, ${esc(r.weather)}, '1.0.0', ${esc(r.createdAt + 'T11:00:00+06:00')});`);
});
push('');

// AI predictions
push('');
const resolveEntity = (id) => {
  if (typeof id !== 'string') return id;
  if (id.startsWith('CROP_')) return cropUids[Number(id.slice(5))];
  if (id.startsWith('LAND_')) return landUids[Number(id.slice(5))];
  return id;
};
const aiUids = aiPredictions.map(() => nextUid());
aiPredictions.forEach((a, i) => {
  const eid = resolveEntity(a.entityId);
  push(`INSERT INTO ai_predictions (id, model_type, entity_type, entity_id, prediction, confidence, model_version, input_features, created_at) VALUES
  (${esc(aiUids[i])}, '${a.modelType}', '${a.entityType}', ${eid ? esc(eid) : 'NULL'}, ${esc(JSON.stringify(a.prediction))}::jsonb, ${a.confidence}, '${a.modelVersion}', ${esc(JSON.stringify(a.features))}::jsonb, ${esc(a.createdAt + 'T12:00:00+06:00')});`);
});
push('');

// Yield training data
push('');
const ytdUids = yieldTraining.map(() => nextUid());
yieldTraining.forEach((yt, i) => {
  const landId = yt.landIdx != null ? landUids[yt.landIdx] : null;
  push(`INSERT INTO yield_training_data (id, crop_name, variety, season, land_id, division, district, area_bigha, actual_yield_kg, yield_per_bigha_kg, soil_ph, soil_nitrogen, soil_phosphorus, soil_potassium, soil_organic_matter, avg_temperature_c, total_rainfall_mm, avg_humidity, cost_taka, revenue_taka, planting_date, harvest_date) VALUES
  (${esc(ytdUids[i])}, ${esc(yt.cropName)}, ${esc(yt.variety)}, ${esc(yt.season)}, ${landId ? esc(landId) : 'NULL'}, ${esc(yt.division)}, ${esc(yt.district)}, ${yt.area}, ${yt.actualYieldKg}, ${yt.yieldPerBigha}, ${yt.ph}, ${yt.n}, ${yt.p}, ${yt.k}, ${yt.om}, ${yt.temp}, ${yt.rain}, ${yt.hum}, ${yt.cost}, ${yt.revenue}, ${esc(yt.plantDate)}, ${esc(yt.harvestDate)});`);
});
push('');

// Disease training data
push('');
const dtdUids = diseaseTraining.map(() => nextUid());
diseaseTraining.forEach((dt, i) => {
  push(`INSERT INTO disease_training_data (id, crop_name, disease_name, image_url, verified_by) VALUES
  (${esc(dtdUids[i])}, ${esc(dt.cropName)}, ${esc(dt.diseaseName)}, ${esc(dt.imageUrl)}, ${esc(dt.verifiedBy)});`);
});
push('');

// ------------------------------------------------------------------ write
const header = `-- Auto-generated by backend/db/generate-seed.js (deterministic)
-- # users, # farmers, # lands, # crops, # soils, # weather, # market,
-- # diseases, # productions, # notifications, # recs, # ai_preds, # ytd, # dtd
`;

const counts = {
  users: userUids.length, farmers: farmers.length, lands: landUids.length,
  crops: Object.keys(cropUids).length, soils: soilUids.length, weather: weatherRecords.length,
  market: marketPrices.length, diseases: Object.keys(diseaseUids).length,
  productions: productions.length, notifications: notifications.length,
  recommendations: recommendations.length, aiPredictions: aiPredictions.length,
  yieldTraining: yieldTraining.length, diseaseTraining: diseaseTraining.length,
};

out = [header, `-- counts: ${JSON.stringify(counts)}`, ''].concat(out);

const target = path.join(__dirname, 'seed.sql');
fs.writeFileSync(target, out.join('\n') + '\n');
console.log(`Wrote ${target}`);
console.log('Counts:', JSON.stringify(counts, null, 0));