import {entries} from './demo.js';

const tools = {
  'go-event-inbox': ['Go Event Inbox','Отправьте событие, затем попробуйте повторить его или использовать тот же ID для другого типа.','../go-event-inbox/'],
  'go-job-queue': ['Go Job Queue','Отправьте текст и проследите, как задача из очереди получает результат SHA-256.','../go-job-queue/'],
  'go-stock-counter': ['Складской учёт','Пополните остаток товара или попробуйте списать больше, чем есть на складе.','../go-stock-counter/'],
  taskflow: ['Taskflow','Добавляйте задачи, отмечайте выполненные и следите за прогрессом прямо в браузере.','https://mainstarkov.github.io/taskflow/'],
  'rs-palette-contrast': ['Контраст цветов','Подберите цвет текста и фона и сразу посмотрите, как они выглядят вместе.','../rs-palette-contrast/'],
  'node-query-card': ['Параметры URL','Разберите строку запроса на отдельные параметры. Повторяющиеся значения покажутся вместе.','../node-query-card/']
};
const id = new URLSearchParams(location.search).get('project');
const status = document.querySelector('#status');
const panel = document.querySelector('#panel');
let state = {};

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function stock(form, run) {
  const list = panel.querySelector('#stock');
  function render() {
    const items = Object.entries(run('GET'));
    list.replaceChildren(...items.map(([sku, quantity]) => {
      const item = document.createElement('li');
      item.append(element('span',sku),element('strong',quantity+' шт.'));
      return item;
    }));
    if (!items.length) list.append(element('li','Склад пока пуст.'));
  }
  form.onsubmit = event => {
    event.preventDefault();
    const sku = form.elements.sku.value.trim();
    const delta = Number(form.elements.quantity.value) * Number(event.submitter?.value ?? 1);
    try {
      const result = run(JSON.stringify({sku,delta}));
      status.textContent = typeof result === 'string' ? 'Недостаточно товара для списания.' : 'Остаток обновлён.';
      render();
    } catch (error) {
      status.textContent = error.message;
    }
  };
  panel.querySelector('[data-reset]').onclick = () => {
    state = {};
    form.reset();
    render();
    status.textContent = 'Остатки сброшены.';
  };
  render();
}

function tasks(form, run) {
  const list = panel.querySelector('#tasks');
  function render() {
    const tasks = state.tasks ?? [];
    panel.querySelector('#progress').textContent = `Готово: ${tasks.filter(task=>task.done).length} из ${tasks.length}`;
    list.replaceChildren(...tasks.map(task => {
      const item = document.createElement('li');
      const title = element('label',task.title);
      title.dataset.done = task.done;
      if (!task.done) {
        const done = document.createElement('input');
        done.type = 'checkbox';
        done.onchange = () => {
          run('done '+task.id);
          render();
          status.textContent = 'Задача выполнена.';
          list.querySelectorAll('button')[tasks.indexOf(task)]?.focus();
        };
        title.prepend(done);
      }
      const remove = element('button','Удалить');
      remove.setAttribute('aria-label','Удалить задачу «'+task.title+'»');
      remove.onclick = () => {
        run('remove '+task.id);
        render();
        form.elements.task.focus();
        status.textContent = 'Задача удалена.';
      };
      item.append(title,remove);
      return item;
    }));
    if (!tasks.length) list.append(element('li','Добавьте первую задачу или загрузите пример.'));
  }
  form.onsubmit = event => {
    event.preventDefault();
    const field = form.elements.task;
    if (!field.value.trim()) {
      status.textContent = 'Введите название задачи.';
      return;
    }
    run('add '+field.value);
    form.reset();
    render();
    field.focus();
    status.textContent = 'Задача добавлена.';
  };
  panel.querySelector('[data-example]').onclick = () => {
    state = {};
    ['Проверить README','Запустить демо','Обновить портфолио'].forEach(title=>run('add '+title));
    run('done 1');
    render();
    status.textContent = 'Пример загружен.';
  };
  panel.querySelector('[data-reset]').onclick = () => {
    state = {};
    render();
    status.textContent = 'Список очищен.';
  };
  render();
}

function contrast(form, run) {
  const swatch = panel.querySelector('#swatch');
  const render = () => {
    const text = form.elements.text.value;
    const background = form.elements.background.value;
    swatch.style.color = text;
    swatch.style.backgroundColor = background;
    panel.querySelector('#ratio').textContent = run(text+' '+background);
  };
  form.oninput = render;
  panel.querySelector('[data-example]').onclick = () => {
    form.elements.text.value = '#85929c';
    form.elements.background.value = '#e8eef2';
    render();
  };
  panel.querySelector('[data-reset]').onclick = () => { form.reset(); render(); };
  render();
}

function query(form, run) {
  const field = form.elements.query;
  const list = panel.querySelector('#params');
  function render() {
    const text = field.value.trim();
    let query = text.split('#')[0];
    list.replaceChildren();
    try {
      if (/^https?:\/\//i.test(text)) query = new URL(text).search;
    } catch {
      status.textContent = 'Проверьте адрес.';
      return;
    }
    const values = Object.entries(run(query));
    status.textContent = values.length ? '' : 'В строке нет параметров.';
    list.replaceChildren(...values.map(([name,value]) => {
      const row = document.createElement('div');
      row.append(element('dt',name || '(без имени)'),
        ...(Array.isArray(value) ? value : [value]).map(entry=>element('dd',entry || '(пусто)')));
      return row;
    }));
  }
  form.onsubmit = event => { event.preventDefault(); render(); };
  panel.querySelector('[data-example]').onclick = () => { form.reset(); render(); };
  render();
}

function historyRow(list, title, value) {
  panel.querySelector('[data-empty]').hidden = true;
  const row = document.createElement('li');
  row.append(element('strong',title),element('p',value));
  list.prepend(row);
  return row;
}

function eventInbox(form, run) {
  const list = panel.querySelector('#events');
  const repeat = panel.querySelector('[data-repeat]');
  const conflict = panel.querySelector('[data-conflict]');
  let lastAccepted;
  const encoder = new TextEncoder();

  function send(id, type) {
    if ([id,type].some(value => !value || encoder.encode(value).length > 128)) {
      status.textContent = 'Введите ID и тип события длиной от 1 до 128 байт.';
      return;
    }
    const response = run(JSON.stringify({id,type}));
    const [code] = response.match(/^HTTP [0-9]{3}/);
    const description = {
      'HTTP 201': 'Событие принято',
      'HTTP 200': 'Повтор принят без создания новой записи',
      'HTTP 409': 'Конфликт: этот ID уже связан с другим типом'
    }[code];
    historyRow(list,code+' · '+description,id+' · '+type);
    status.textContent = description+'.';
    if (code === 'HTTP 201') {
      lastAccepted = {id,type};
      repeat.disabled = conflict.disabled = false;
    }
  }
  form.onsubmit = event => {
    event.preventDefault();
    send(form.elements.eventId.value.trim(),form.elements.eventType.value.trim());
  };
  repeat.onclick = () => send(lastAccepted.id,lastAccepted.type);
  conflict.onclick = () => send(lastAccepted.id,
    lastAccepted.type === 'order.cancelled' ? 'order.created' : 'order.cancelled');
}

function jobQueue(form, run) {
  const list = panel.querySelector('#jobs');
  let pending = Promise.resolve();
  form.onsubmit = event => {
    event.preventDefault();
    const field = form.elements.jobText;
    const text = field.value;
    if (!text.trim()) {
      status.textContent = 'Введите текст задачи.';
      return;
    }
    const row = historyRow(list,'Отправка…',text);
    const heading = row.querySelector('strong');
    pending = pending.then(async () => {
      const response = await run(JSON.stringify({text}));
      const {id} = JSON.parse(response.split('\n')[1]);
      heading.textContent = `#${id} · HTTP 202 · В очереди`;
      status.textContent = `Задача #${id} в очереди.`;
      // Keep the accepted state visible before retrieving the result.
      setTimeout(async () => {
        try {
          const {sha256} = await run(String(id));
          if (!sha256) throw new Error('Result unavailable');
          heading.textContent = `#${id} · HTTP 200 · Готово`;
          const output = element('p','SHA-256 ');
          output.append(element('code',sha256));
          row.append(output);
          status.textContent = `Задача #${id} выполнена.`;
        } catch {
          heading.textContent = `#${id} · Результат недоступен`;
          status.textContent = 'Не удалось получить результат задачи.';
        }
      },1000);
    }).catch(() => {
      heading.textContent = 'Не удалось обработать задачу';
      status.textContent = 'Попробуйте отправить задачу ещё раз.';
    });
  };
}

const screens = {
  'go-event-inbox': eventInbox, 'go-job-queue': jobQueue,
  'go-stock-counter': stock, taskflow: tasks, 'rs-palette-contrast': contrast, 'node-query-card': query
};
if (Object.hasOwn(tools,id)) {
  const [title,intro,guide] = tools[id];
  document.title = title+' · Portfolio';
  document.querySelector('#title').textContent = title;
  document.querySelector('#intro').textContent = intro;
  const link = document.querySelector('#guide');
  link.href = guide;
  link.hidden = false;
  panel.append(document.getElementById(id).content.cloneNode(true));
  screens[id](panel.querySelector('form'),value=>entries.get(id).run(value,state));
} else {
  status.textContent = 'Откройте демо из каталога проектов.';
}
