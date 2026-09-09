import { config } from '../config.js';

const DIVISION_COORDS = {
  'ঢাকা': { lat: 23.81, lng: 90.41 },
  'চট্টগ্রাম': { lat: 22.35, lng: 91.78 },
  'রাজশাহী': { lat: 24.37, lng: 88.60 },
  'খুলনা': { lat: 22.82, lng: 89.56 },
  'বরিশাল': { lat: 22.70, lng: 90.37 },
  'সিলেট': { lat: 24.89, lng: 91.87 },
  'রংপুর': { lat: 25.74, lng: 89.26 },
  'ময়মনসিংহ': { lat: 24.75, lng: 90.41 },
};

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function simulateWeather(division, date) {
  const d = new Date(date || new Date());
  const month = d.getMonth() + 1;
  const isMonsoon = month >= 6 && month <= 10;
  const isCool = month === 11 || month === 12 || month <= 2;
  const rand = seededRand(hashString(division + date?.toISOString?.()?.slice(0, 10) || d.toISOString().slice(0, 10)));
  const rainfall = isMonsoon ? Math.round(rand() * 40 + rand() * 10) : Math.round(rand() * 6);
  let temperature;
  if (isCool) temperature = 15 + rand() * 9;
  else if (isMonsoon) temperature = 26 + rand() * 6;
  else temperature = 27 + rand() * 8;
  let condition = 'রোদেলা';
  if (rainfall > 20) condition = 'মুষলধারে বৃষ্টি';
  else if (rainfall > 5) condition = 'বৃষ্টি';
  else if (rainfall > 0) condition = 'মেঘলা';
  else if (rand() < 0.35) condition = 'আংশিক মেঘলা';
  return {
    condition,
    temperature_c: Math.round(temperature * 10) / 10,
    humidity: Math.min(95, Math.round(isMonsoon ? 80 + rand() * 15 : 55 + rand() * 25)),
    wind_kph: Math.round((5 + rand() * 15) * 10) / 10,
    rainfall_mm: rainfall,
  };
}

export function simulateForecast(division, days = 7) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    out.push({ date: date.toISOString().slice(0, 10), ...simulateWeather(division, date) });
  }
  return out;
}

async function fetchLive(lat, lng) {
  const { url, key } = config.weather;
  if (!url || !key) return null;
  const nowUrl = `${url}/weather?lat=${lat}&lng=${lng}&appid=${key}&units=metric&lang=bn`;
  const fcUrl = `${url}/forecast?lat=${lat}&lng=${lng}&appid=${key}&units=metric&lang=bn&cnt=40`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const [nowRes, fcRes] = await Promise.all([
      fetch(nowUrl, { signal: ctrl.signal }),
      fetch(fcUrl, { signal: ctrl.signal }),
    ]);
    if (!nowRes.ok || !fcRes.ok) return null;
    const now = await nowRes.json();
    const fc = await fcRes.json();
    const forecast = [];
    const byDay = {};
    for (const item of fc.list || []) {
      const day = item.dt_txt.slice(0, 10);
      if (!byDay[day]) byDay[day] = item;
    }
    for (const [day, item] of Object.entries(byDay).slice(0, 7)) {
      forecast.push({
        date: day,
        condition: item.weather?.[0]?.main || 'রোদেলা',
        temperature_c: item.main?.temp ?? null,
        humidity: item.main?.humidity ?? null,
        wind_kph: item.wind?.speed ? Math.round(item.wind.speed * 3.6 * 10) / 10 : null,
        rainfall_mm: item.rain?.['3h'] ? Math.round(item.rain['3h'] * 10) / 10 : 0,
      });
    }
    clearTimeout(timer);
    return {
      source: 'live',
      current: {
        condition: now.weather?.[0]?.main || 'রোদেলা',
        temperature_c: now.main?.temp ?? null,
        humidity: now.main?.humidity ?? null,
        wind_kph: now.wind?.speed ? Math.round(now.wind.speed * 3.6 * 10) / 10 : null,
        rainfall_mm: now.rain?.['1h'] ? Math.round(now.rain['1h'] * 10) / 10 : 0,
      },
      forecast,
    };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function getWeatherNow(division) {
  const coords = DIVISION_COORDS[division];
  if (coords) {
    const live = await fetchLive(coords.lat, coords.lng);
    if (live) return live;
  }
  return {
    source: 'simulated',
    current: { ...simulateWeather(division, new Date()) },
    forecast: simulateForecast(division, 7),
  };
}
