const form = document.querySelector('#search');
const input = document.querySelector('#city');
const status = document.querySelector('#status');
const matches = document.querySelector('#matches');
const forecast = document.querySelector('#forecast');
const currentFields = 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m';
const dailyFields = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max';
const citySamples = {
  'Москва': {name:'Москва',country:'Россия',latitude:55.7558,longitude:37.6173},
  'Лондон': {name:'Лондон',country:'Великобритания',latitude:51.5072,longitude:-0.1276},
  'Токио': {name:'Токио',country:'Япония',latitude:35.6762,longitude:139.6503}
};
const dateFormat = new Intl.DateTimeFormat('ru', {weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
let active;

function describe(code) {
  if (code === 0) return '☀️ Ясно';
  if (code === 1 || code === 2) return '⛅ Переменная облачность';
  if (code === 3) return '☁️ Пасмурно';
  if ([45,48].includes(code)) return '🌫️ Туман';
  if ([71,73,75,77,85,86].includes(code)) return '❄️ Снег';
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return '🌧️ Дождь';
  if ([95,96,99].includes(code)) return '⛈️ Гроза';
  return 'Нет данных об облачности';
}

function measure(value, unit) {
  return Number.isFinite(value) ? `${Math.round(value)} ${unit}` : '—';
}

function label(city) {
  return [...new Set([city.name,city.admin1,city.country].filter(Boolean))].join(', ');
}

async function request(path, parameters, signal) {
  const url = new URL(path);
  url.search = new URLSearchParams(parameters);
  const response = await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
  if (!response.ok) throw new Error('Weather service unavailable');
  return response.json();
}

async function run(message, action) {
  active?.abort();
  const controller = new AbortController();
  active = controller;
  matches.hidden = forecast.hidden = true;
  status.textContent = message;
  try {
    await action(controller.signal);
  } catch {
    if (!controller.signal.aborted) status.textContent = 'Не удалось получить данные. Попробуйте ещё раз чуть позже.';
  }
}

function put(id, text) {
  document.getElementById(id).textContent = text;
}

function showWeather(city) {
  return run(`Загружаю прогноз · ${label(city)}…`, async signal => {
    const {current, daily} = await request('https://api.open-meteo.com/v1/forecast',{
      latitude:city.latitude, longitude:city.longitude, current:currentFields,daily:dailyFields,
      timezone:'auto',forecast_days:5
    },signal);
    if (signal.aborted) return;
    put('place',label(city));
    put('observed',`Данные на ${current.time.replace('T',' в ')} по местному времени`);
    put('temperature',measure(current.temperature_2m,'°C'));
    put('conditions',describe(current.weather_code));
    put('details',`Ощущается как ${measure(current.apparent_temperature,'°C')} · Влажность ${measure(current.relative_humidity_2m,'%')} · Ветер ${measure(current.wind_speed_10m,'км/ч')}`);
    const cards = daily.time.map((date,index) => {
      const card = document.createElement('li');
      const values = [
        dateFormat.format(new Date(date)),
        describe(daily.weather_code[index]),
        `${measure(daily.temperature_2m_min[index],'°C')} … ${measure(daily.temperature_2m_max[index],'°C')}`,
        `Осадки: ${measure(daily.precipitation_probability_max[index],'%')}`
      ];
      values.forEach((text,i) => {
        const line = document.createElement(i === 0 ? 'strong' : 'span');
        line.textContent = text;
        card.append(line);
      });
      return card;
    });
    document.querySelector('#days').replaceChildren(...cards);
    forecast.hidden = false;
    status.textContent = `Прогноз загружен · ${label(city)}`;
  });
}

form.addEventListener('submit',event => {
  event.preventDefault();
  const city = input.value.trim();
  if (city.length < 2) {
    active?.abort();
    matches.hidden = forecast.hidden = true;
    status.textContent = 'Введите хотя бы две буквы.';
    return;
  }
  run('Ищу город…',async signal => {
    const {results = []} = await request('https://geocoding-api.open-meteo.com/v1/search',
      {name:city,count:5,language:'ru'},signal);
    if (signal.aborted) return;
    if (!results.length) {
      status.textContent = 'Город не найден. Проверьте написание.';
      return;
    }
    if (results.length === 1) return showWeather(results[0]);
    const options = results.map(result => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label(result);
      button.addEventListener('click',() => showWeather(result));
      item.append(button);
      return item;
    });
    matches.querySelector('ul').replaceChildren(...options);
    matches.hidden = false;
    status.textContent = '';
    options[0].firstElementChild.focus();
  });
});

document.querySelectorAll('#examples button').forEach(button => {
  button.addEventListener('click',() => {
    input.value = button.textContent;
    showWeather(citySamples[button.textContent]);
  });
});
