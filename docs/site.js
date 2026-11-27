const cards = document.querySelector("#cards");
const filters = document.querySelector("#filters");
const query = document.querySelector("#query");
const count = document.querySelector("#count");
const empty = document.querySelector("#empty");
let selection = "all";
let projects = [];

function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
}
function link(url, text) {
    const node = element("a", text);
    node.href = url;
    return node;
}
function render() {
    const term = query.value.trim().toLowerCase();
    const matching = projects.filter(project =>
        (selection === "all" || project.filters.includes(selection))
        && [project.title, project.description, project.stack, project.name].join(" ").toLowerCase().includes(term)
    );
    cards.replaceChildren(...matching.map(project => {
        const card = element("article", "", "card");
        const links = element("div", "", "card-links");
        links.append(link(project.demo, project.live ? "Открыть сайт ↗" : "Демо и запуск ↗"), link(project.code, "Исходники ↗"));
        card.append(element("p", project.stack, "tags"), element("h3", project.title), element("p", project.description), links);
        return card;
    }));
    count.textContent = `${matching.length} из ${projects.length}`;
    empty.hidden = matching.length > 0;
}
filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    selection = button.dataset.filter;
    for (const item of filters.querySelectorAll("button")) item.setAttribute("aria-pressed", String(item === button));
    render();
});
query.addEventListener("input", render);
fetch("projects.json").then(response => {
    if (!response.ok) throw new Error("Could not load projects");
    return response.json();
}).then(items => {
    projects = items;
    render();
}).catch(() => {
    cards.append(link("https://github.com/mainstarkov/portfolio", "Открыть каталог на GitHub ↗"));
});

const scenarios = {
    links: {
        page: "go-expiring-links/",
        command: `curl -i http://127.0.0.1:8081/links -H 'Content-Type: application/json' -d '{"url":"https://example.org","ttl":60}'`,
        result: 'HTTP/1.1 201 Created\nContent-Type: application/json\n\n{"path":"/r/0123456789abcdef01234567"}'
    },
    job: {
        page: "go-job-queue/",
        command: "curl -i http://127.0.0.1:8083/jobs/1",
        result: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":1,"status":"done","sha256":"2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"}'
    },
    event: {
        page: "go-event-inbox/",
        command: `curl -i http://127.0.0.1:8084/events -H 'Content-Type: application/json' -d '{"id":"demo-1","type":"order.created"}'`,
        result: "Первый запрос: HTTP/1.1 201 Created\nПовторный запрос: HTTP/1.1 200 OK\nВ журнале остаётся одна запись."
    }
};
const select = document.querySelector("#scenario");
const command = document.querySelector("#command");
const result = document.querySelector("#result");
const copyStatus = document.querySelector("#copy-status");
function changeScenario() {
    const selected = scenarios[select.value];
    command.textContent = selected.command;
    document.querySelector("#lab-doc").href = selected.page;
    result.hidden = true;
    copyStatus.textContent = "";
}
select.addEventListener("change", changeScenario);
document.querySelector("#execute").addEventListener("click", () => {
    result.textContent = scenarios[select.value].result;
    result.hidden = false;
});
document.querySelector("#copy").addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(command.textContent);
        copyStatus.textContent = "Команда скопирована.";
    } catch {
        copyStatus.textContent = "Выделите команду и скопируйте её вручную.";
    }
});
changeScenario();
