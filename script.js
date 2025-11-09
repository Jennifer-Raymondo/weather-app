// script.js — simplified Magical Weather
// Usage: type a country or city name and submit the form.

const DOM = {
  form: document.getElementById('search-form'),
  q: document.getElementById('q'),
  place: document.getElementById('place'),
  temp: document.getElementById('temp'),
  desc: document.getElementById('desc'),
  icon: document.getElementById('icon'),
  toast: document.getElementById('toast'),
};

function showToast(msg, ms = 1400){
  if(!DOM.toast) return console.log(msg);
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  setTimeout(()=> DOM.toast.classList.remove('show'), ms);
}

function formatTemp(celsius){
  return `${Math.round(celsius)}°C`;
}

/* 1) Geocode using Nominatim (works for countries & cities) */
async function geocode(query){
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' }});
  if (!res.ok) throw new Error('Geocoding failed');
  const arr = await res.json();
  if (!arr || arr.length === 0) throw new Error('Location not found');
  const p = arr[0];
  return { name: p.display_name, lat: parseFloat(p.lat), lon: parseFloat(p.lon) };
}

/* 2) Fetch simple current weather from Open-Meteo */
async function fetchWeather(lat, lon){
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: 'true',
    timezone: 'auto'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

/* 3) Render minimal UI */
function renderWeather(placeLabel, data){
  const cur = data.current_weather;
  if (!cur) throw new Error('No current weather data');
  DOM.place.textContent = placeLabel;
  DOM.temp.textContent = formatTemp(cur.temperature);
  DOM.desc.textContent = `Wind ${Math.round(cur.windspeed)} m/s • code ${cur.weathercode}`;
  DOM.icon.innerHTML = simpleSVGIcon(cur.weathercode, cur.is_day === 1);
}

/* tiny icon helper — very small set */
function simpleSVGIcon(code, isDay){
  if ([0,1].includes(code)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.3"/></svg>`;
  }
  if ([2,3,45,48].includes(code)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M17 18H6a4 4 0 010-8 5 5 0 019.9 1A3 3 0 0117 18z" stroke="currentColor" stroke-width="1.3"/></svg>`;
  }
  if ([51,53,55,61,63,65,80,81,82].includes(code)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M7 13v4M11 13v4M3 18a6 6 0 0112 0" stroke="currentColor" stroke-width="1.3"/></svg>`;
  }
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.3"/></svg>`;
}

/* 4) Full flow */
async function searchAndShow(query){
  try{
    showToast('Searching…');
    const loc = await geocode(query);
    showToast('Found: ' + loc.name, 900);
    const weather = await fetchWeather(loc.lat, loc.lon);
    renderWeather(loc.name, weather);
  } catch(err){
    console.error(err);
    showToast(err.message || 'Failed');
  }
}

/* Event wiring */
DOM.form?.addEventListener('submit', e => {
  e.preventDefault();
  const q = DOM.q.value.trim();
  if (!q) return showToast('Type a country or city name first');
  searchAndShow(q);
});

/* Optional: search a demo default on load (comment out if you prefer empty start) */
window.addEventListener('load', () => {
  // demo default — change or remove
  // searchAndShow('Kampala, Uganda');
});
