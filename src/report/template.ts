export function renderPage(model: unknown): string {
  const json = JSON.stringify(model).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AWS Security Feature Coverage</title>
<meta name="description" content="Every AWS security feature, and what each one actually covers, with a source for every claim.">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
/* Plerion palette: Burnt Violet ground, Primary Orange accent, Cloud Blue text,
   Lemon Yellow pop. No colour outside the brand palette. */
:root{
  --violet-0:#0A020F; --violet-1:#150A1C; --violet-2:#261432; --violet-3:#35204a; --violet-4:#4a2f63;
  --orange:#FF732E; --orange-deep:#FF5400;
  --blue-light:#F2F7F8; --blue-mid:#C7DEE5;
  --yellow:#F8E14F; --yellow-soft:#F8E77D;

  --bg:var(--violet-0); --panel:var(--violet-1); --panel2:var(--violet-2);
  --line:var(--violet-3); --line2:var(--violet-4);
  --fg:var(--blue-light); --dim:#9DB6BF; --dim2:#6D7F88;
  --accent:var(--orange);
  --covered:var(--orange); --partial:var(--yellow); --absent:var(--blue-mid); --unstated:#3A2B45;
  --tier1:var(--orange); --tier2:var(--blue-mid);
  --mono:"SF Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --sans:"Archivo",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
}
:root[data-theme="light"]{
  --bg:var(--blue-light); --panel:#FFFFFF; --panel2:#E7EFF1;
  --line:var(--blue-mid); --line2:#A8C6D0;
  --fg:var(--violet-0); --dim:#5A4A66; --dim2:#8395A0;
  --accent:var(--orange-deep);
  --covered:var(--orange-deep); --partial:#D9BE12; --absent:#7FA9B8; --unstated:#D9E6EA;
  --tier1:var(--orange-deep); --tier2:#1F6E80;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:400 14px/1.55 var(--sans);-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
header{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid var(--line);padding:16px 22px 0}
.titlebar{display:flex;align-items:center;gap:13px;flex-wrap:wrap;margin-bottom:14px}
.pleri{width:46px;height:46px;object-fit:contain;flex:none;filter:drop-shadow(0 2px 6px rgba(255,115,46,.28))}
.themetoggle{width:26px;height:26px;padding:0;border-radius:50%;cursor:pointer;flex:none;
  border:1px solid var(--line2);background:linear-gradient(105deg,var(--violet-0) 0 50%,var(--blue-light) 50% 100%)}
.themetoggle:hover{border-color:var(--accent)}
.themetoggle span{display:block;width:100%;height:100%;border-radius:50%}
h1{font-size:18px;font-weight:700;margin:0;letter-spacing:-.3px}
h1 .mark{color:var(--accent)}
.sub{color:var(--dim2);font-size:12px}
.spacer{flex:1}
button.ghost{background:none;border:1px solid var(--line2);color:var(--dim);padding:5px 11px;border-radius:6px;cursor:pointer;font:500 12px var(--sans)}
button.ghost:hover{color:var(--fg);border-color:var(--accent)}
.stats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:8px 13px;min-width:92px}
.stat .n{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1;color:var(--fg)}
.stat.hero .n{color:var(--accent)}
.stat .l{font-size:10px;color:var(--dim2);text-transform:uppercase;letter-spacing:.7px;margin-top:3px;font-weight:500}
nav{display:flex;gap:2px;flex-wrap:wrap}
nav button{background:none;border:0;border-bottom:2px solid transparent;color:var(--dim);padding:10px 13px;cursor:pointer;font:500 13px var(--sans)}
nav button:hover{color:var(--fg)}
nav button.on{color:var(--fg);border-bottom-color:var(--accent)}
nav button .c{color:var(--dim2);font-size:11px;margin-left:5px;font-variant-numeric:tabular-nums}
main{padding:18px 22px 90px}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
input[type=search],select{background:var(--panel);border:1px solid var(--line);color:var(--fg);padding:7px 11px;border-radius:6px;font:400 13px var(--sans)}
input[type=search]{min-width:270px;flex:1;max-width:470px}
input[type=search]:focus,select:focus{outline:none;border-color:var(--accent)}
.muted{color:var(--dim);font-size:12px}
.legend{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:12px;font-size:11.5px;color:var(--dim)}
.legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:var(--dim2);font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;padding:8px 10px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);cursor:pointer;white-space:nowrap}
th:hover{color:var(--accent)}
td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
tr.row{cursor:pointer;user-select:text}
tr.row td:first-child::before{content:"\\25B8";color:var(--dim2);margin-right:7px;font-size:10px;display:inline-block;transition:transform .12s}
tr.row.open td:first-child::before{transform:rotate(90deg);color:var(--accent)}
tr.row:hover{background:var(--panel)}
tr.detail>td{background:var(--panel);padding:0}
.det{padding:14px 18px;border-left:2px solid var(--accent)}
.det h4{margin:0 0 7px;font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;color:var(--dim2);font-weight:600}
.det section{margin-bottom:15px}
.quote{font-family:var(--mono);font-size:11.5px;background:var(--panel2);border:1px solid var(--line);border-radius:5px;padding:8px 10px;margin:5px 0;white-space:pre-wrap;word-break:break-word;color:var(--dim)}
.pill{display:inline-block;padding:1px 8px;border-radius:20px;font-size:11px;border:1px solid var(--line2);white-space:nowrap;font-weight:500}
.pill.tier1{color:var(--tier1);border-color:var(--tier1)}
.pill.tier2{color:var(--tier2);border-color:var(--tier2)}
.pill.llm{color:var(--yellow);border-color:var(--yellow)}
.pill.deterministic{color:var(--accent);border-color:var(--accent)}
.pill.manual{color:var(--blue-mid);border-color:var(--blue-mid)}
.mono{font-family:var(--mono);font-size:12px}
.bar{display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--unstated);min-width:96px;flex:none;border:1px solid var(--line)}
.bar i{display:block;height:100%}
.bar .c{background:var(--covered)}.bar .p{background:var(--partial)}.bar .n{background:var(--absent)}
.ratio{font-variant-numeric:tabular-nums;font-size:12px;color:var(--dim);white-space:nowrap}
.empty{padding:50px;text-align:center;color:var(--dim)}
.chips{display:flex;gap:4px;flex-wrap:wrap}
.chip{font-size:10.5px;color:var(--dim);background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:1px 6px;font-family:var(--mono)}
.stage{display:flex;gap:9px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line);font-size:12.5px}
.dot{width:8px;height:8px;border-radius:50%;flex:none}
.dot.ok{background:var(--covered)}.dot.partial{background:var(--partial)}.dot.failed{background:var(--absent)}.dot.skipped{background:var(--dim2)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:14px}
.card h3{margin:0 0 7px;font-size:13px;font-weight:600}
.scroll{overflow-x:auto}
.axisrow{display:flex;gap:7px;align-items:center;margin-bottom:3px}
</style>
</head>
<body>
<header>
  <div class="titlebar">
    <img class="pleri" src="pleri.png" alt="Pleri, Plerion's AI cloud security engineer" width="46" height="46">
    <h1>AWS Security Feature <span class="mark">Coverage</span></h1>
    <span class="sub" id="stamp"></span>
    <span class="spacer"></span>
    <button id="theme" class="themetoggle" type="button" aria-label="Switch between the dark and light theme"><span></span></button>
  </div>
  <div class="stats" id="stats"></div>
  <nav id="tabs"></nav>
</header>
<main id="main"></main>
<script id="model" type="application/json">${json}</script>
<script>
const M = JSON.parse(document.getElementById("model").textContent);
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const state = { tab: "services", q: "", tier: "", method: "", sort: {}, open: new Set() };
const US = M.universeSizes || {};
const AXIS = M.axisKinds || {};
const isCatalogue = (a) => (AXIS[a] || {}).kind === "catalogue";

/* Evidence is fetched on demand so the page itself stays small. */
let DETAIL = null, detailStatus = "idle";
async function loadDetail() {
  if (detailStatus !== "idle") return;
  detailStatus = "loading";
  try {
    const r = await fetch("detail.json");
    DETAIL = await r.json();
    detailStatus = "ready";
  } catch (e) {
    detailStatus = "unavailable";
  }
  render();
}

document.getElementById("theme").onclick = () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
};
try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch {}

$("#stamp").textContent = "built " + new Date(M.generatedAt).toLocaleString();

const U = M.universes;
const withCoverage = M.features.filter((f) => f.claimCount > 0).length;
$("#stats").innerHTML = [
  ["security services", M.services.length, true],
  ["features", M.features.length, true],
  ["coverage claims", M.features.reduce((a, f) => a + f.claimCount, 0), true],
  ["features mapped", withCoverage, false],
  ["services adjudicated", U.adjudicated + " / " + U.services, false],
  ["regions", U.regions, false],
  ["resource types", U.resourceTypes, false],
  ["open gaps", M.gaps.length, false],
].map(([l, n, hero]) => '<div class="stat' + (hero ? " hero" : "") + '"><div class="n">' + n + '</div><div class="l">' + l + "</div></div>").join("");

const TABS = [
  ["services", "Services", () => M.services.length],
  ["features", "Features", () => M.features.length],
  ["coverage", "Coverage", () => M.features.filter((f) => f.claimCount > 0).length],
  ["regions", "Regions", () => M.regions.length],
  ["outofscope", "Ruled out", () => M.outOfScope.length],
  ["sources", "Sources", () => (M.sources || []).length],
  ["gaps", "Gaps", () => M.gaps.length],
  ["quarantine", "Quarantine", () => M.quarantine.length],
  ["conflicts", "Conflicts", () => M.conflicts.length],
  ["run", "Run", () => (M.manifest ? M.manifest.stages.length : 0)],
];
$("#tabs").innerHTML = TABS.map(([id, label, count]) =>
  '<button data-tab="' + id + '">' + label + '<span class="c">' + count() + "</span></button>").join("");
$("#tabs").onclick = (e) => {
  const b = e.target.closest("button[data-tab]");
  if (!b) return;
  state.tab = b.dataset.tab; state.open.clear(); render({ keepScroll: false });
};

function axisTotal(axis, stats) {
  const universe = US[axis];
  return universe && universe >= stats.total ? universe : stats.total;
}
function axisBar(axis, stats) {
  const total = axisTotal(axis, stats);
  if (!total) return '<span class="muted">no claims</span>';
  // A service always publishes all of its own catalogue, so a ratio there is 100% by
  // construction and means nothing. Show the count, and the coverage only where a
  // statement is scoped to something outside the service.
  if (isCatalogue(axis)) {
    return '<div class="axisrow"><span class="ratio">' + stats.covered + " published</span>" +
      (stats.notCovered ? ' <span class="pill manual">' + stats.notCovered + " withdrawn</span>" : "") +
      (stats.scoped ? ' <span class="chip" title="statements scoped to a Region or similar">' + stats.scoped + " scoped</span>" : "") +
      "</div>";
  }
  const unstated = Math.max(0, total - stats.covered - stats.notCovered - stats.partial);
  const pc = (v) => (v / total * 100).toFixed(3) + "%";
  const title = stats.covered + " stated as covered, " + stats.partial + " partial, " + stats.notCovered +
    " stated as not covered, " + unstated + " not stated, out of " + total + " known " + axis + " values" +
    (stats.scoped ? " · " + stats.scoped + " statements are scoped to a Region or similar" : "");
  return '<div class="axisrow"><div class="bar" title="' + title + '">' +
    '<i class="c" style="width:' + pc(stats.covered) + '"></i><i class="p" style="width:' + pc(stats.partial) + '"></i>' +
    '<i class="n" style="width:' + pc(stats.notCovered) + '"></i></div>' +
    '<span class="ratio">' + stats.covered + "/" + total +
    (stats.scoped ? ' <span class="chip" title="statements scoped to a Region or similar">' + stats.scoped + " scoped</span>" : "") +
    "</span></div>";
}
function bar(axes) {
  const entries = Object.entries(axes);
  if (!entries.length) return '<span class="muted">not mapped</span>';
  return entries.map(([axis, stats]) =>
    '<div class="axisrow"><span class="chip">' + esc(axis) + "</span>" + axisBar(axis, stats) + "</div>").join("");
}
const LEGEND = '<div class="legend">' +
  '<span><i style="background:var(--covered)"></i>stated as covered</span>' +
  '<span><i style="background:var(--partial)"></i>partial</span>' +
  '<span><i style="background:var(--absent)"></i>stated as not covered</span>' +
  '<span><i style="background:var(--unstated);border:1px solid var(--line)"></i>not stated in any source</span></div>';

function evidenceBlock(list) {
  if (!list || !list.length) return '<span class="muted">none</span>';
  return list.map((e) =>
    '<div><a href="' + esc(String(e.sourceUrl).replace(/\\.md$/, ".html")) + '" target="_blank" rel="noopener">' + esc(e.sourceUrl) + "</a>" +
    (e.locator ? ' <span class="muted">· ' + esc(e.locator) + "</span>" : "") +
    '<div class="quote">' + esc(e.quote) + "</div></div>").join("");
}
function detailFor(key) {
  if (detailStatus === "idle") loadDetail();
  if (detailStatus === "loading") return '<span class="muted">loading sources…</span>';
  if (detailStatus === "unavailable") {
    return '<span class="muted">Source quotes load from detail.json, which a browser will not read over file://. ' +
      'Open the published page, or run <span class="mono">npx http-server docs</span>.</span>';
  }
  return DETAIL && DETAIL[key] ? DETAIL[key] : null;
}

function table(cols, rows, detail) {
  const key = state.tab;
  const sort = state.sort[key];
  let data = rows.slice();
  if (sort) {
    const col = cols.find((c) => c.id === sort.id);
    if (col && col.value) data.sort((a, b) => {
      const x = col.value(a), y = col.value(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }
  const head = "<tr>" + cols.map((c) =>
    '<th data-col="' + c.id + '">' + esc(c.label) + (sort && sort.id === c.id ? (sort.dir === "asc" ? " ↑" : " ↓") : "") + "</th>").join("") + "</tr>";
  const body = data.map((r, i) => {
    const id = r.id || String(i);
    const open = state.open.has(id);
    return '<tr class="row' + (open ? " open" : "") + '" data-id="' + esc(id) + '">' + cols.map((c) => "<td>" + c.cell(r) + "</td>").join("") + "</tr>" +
      (open && detail ? '<tr class="detail"><td colspan="' + cols.length + '"><div class="det">' + detail(r) + "</div></td></tr>" : "");
  }).join("");
  if (!data.length) return '<div class="empty">Nothing here yet. This view fills in as the pipeline runs.</div>';
  return '<div class="scroll"><table><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";
}

function filters(opts) {
  const parts = ['<input type="search" id="q" placeholder="' + esc(opts.placeholder || "search") + '" value="' + esc(state.q) + '">'];
  if (opts.tier) parts.push('<select id="tier"><option value="">all tiers</option>' +
    ["tier1", "tier2"].map((t) => '<option value="' + t + '"' + (state.tier === t ? " selected" : "") + ">" + t + "</option>").join("") + "</select>");
  if (opts.method) parts.push('<select id="method"><option value="">any method</option>' +
    ["deterministic", "llm", "manual"].map((m) => '<option value="' + m + '"' + (state.method === m ? " selected" : "") + ">" + m + "</option>").join("") + "</select>");
  return '<div class="filters">' + parts.join("") + "</div>";
}

const match = (r, fields) => {
  const q = state.q.toLowerCase().trim();
  if (!q) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(q));
};

function render(opts) {
  // A render replaces the whole table, which loses the scroll position. Expanding a
  // row a screenful down should not throw the reader back to the top.
  const keepScroll = !opts || opts.keepScroll !== false;
  const y = window.scrollY;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
  const main = $("#main");
  main.innerHTML = VIEWS[state.tab]();
  const q = $("#q");
  if (q) { q.oninput = (e) => { state.q = e.target.value; render({ keepScroll: false }); }; q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  const tier = $("#tier"); if (tier) tier.onchange = (e) => { state.tier = e.target.value; render({ keepScroll: false }); };
  const method = $("#method"); if (method) method.onchange = (e) => { state.method = e.target.value; render({ keepScroll: false }); };
  main.querySelectorAll("tr.row").forEach((tr) => tr.onclick = (e) => {
    // Selecting text inside a row must not toggle it, or the text cannot be copied.
    const selection = window.getSelection && window.getSelection();
    if (selection && String(selection).trim().length > 0) return;
    // A link in a row is a link, not a toggle.
    if (e.target.closest && e.target.closest("a")) return;
    const id = tr.dataset.id;
    state.open.has(id) ? state.open.delete(id) : state.open.add(id);
    render();
  });
  main.querySelectorAll("th[data-col]").forEach((th) => th.onclick = (e) => {
    e.stopPropagation();
    const id = th.dataset.col, cur = state.sort[state.tab];
    state.sort[state.tab] = cur && cur.id === id ? { id, dir: cur.dir === "asc" ? "desc" : "asc" } : { id, dir: "asc" };
    render({ keepScroll: false });
  });
  if (keepScroll) window.scrollTo(0, y);
}

const VIEWS = {
  services() {
    const rows = M.services.filter((s) =>
      (!state.tier || s.tier === state.tier) && (!state.method || s.method === state.method) &&
      match(s, [s.id, s.name, s.reason, s.category]));
    return filters({ placeholder: "search services, reasons, categories", tier: true, method: true }) +
      '<div class="muted" style="margin-bottom:10px">' + rows.length + " of " + M.services.length +
      " services carry security capability. Tier 1 is a security service; tier 2 is a service with named security features inside it.</div>" +
      table([
        { id: "id", label: "Service", value: (r) => r.id, cell: (r) => '<span class="mono">' + esc(r.id) + "</span>" },
        { id: "name", label: "Name", value: (r) => r.name, cell: (r) => esc(r.name) },
        { id: "tier", label: "Tier", value: (r) => r.tier, cell: (r) => '<span class="pill ' + r.tier + '">' + r.tier + "</span>" },
        { id: "method", label: "Decided by", value: (r) => r.method, cell: (r) => '<span class="pill ' + r.method + '">' + r.method + "</span>" },
        { id: "features", label: "Features", value: (r) => r.featureCount, cell: (r) => r.featureCount },
        { id: "claims", label: "Claims", value: (r) => r.claimCount, cell: (r) => r.claimCount },
        { id: "regions", label: "Regions", value: (r) => r.regions, cell: (r) => r.regions + " / " + (US.region ?? "?") },
        { id: "actions", label: "IAM actions", value: (r) => r.actionCount, cell: (r) => r.actionCount },
        { id: "reason", label: "Why in scope", value: (r) => r.reason, cell: (r) => '<span class="muted">' + esc(r.reason) + "</span>" },
      ], rows, (r) => {
        const d = detailFor("service:" + r.id);
        return '<section><h4>signals</h4><div class="chips">' + r.signals.map((s) => '<span class="chip">' + esc(s) + "</span>").join("") + "</div></section>" +
          '<section><h4>documentation</h4>' + (r.docGuides.length ? r.docGuides.map((g) =>
            '<div><a href="' + esc(g.url.replace(/\\.md$/, ".html")) + '" target="_blank" rel="noopener">' + esc(g.title) + "</a></div>").join("") : '<span class="muted">no guide joined</span>') + "</section>" +
          '<section><h4>evidence</h4>' + (typeof d === "string" ? d : evidenceBlock(d && d.evidence)) + "</section>";
      });
  },
  features() {
    const rows = M.features.filter((f) =>
      (!state.tier || f.tier === state.tier) && (!state.method || f.method === state.method) &&
      match(f, [f.id, f.name, f.serviceId, f.summary, f.kind]));
    return filters({ placeholder: "search features by name, service or kind", tier: true, method: true }) +
      '<div class="muted" style="margin-bottom:10px">' + rows.length + " of " + M.features.length + " features</div>" + LEGEND +
      table([
        { id: "service", label: "Service", value: (r) => r.serviceId, cell: (r) => '<span class="mono">' + esc(r.serviceId) + "</span>" },
        { id: "name", label: "Feature", value: (r) => r.name, cell: (r) => esc(r.name) },
        { id: "kind", label: "Kind", value: (r) => r.kind, cell: (r) => '<span class="chip">' + esc(r.kind) + "</span>" },
        { id: "tier", label: "Tier", value: (r) => r.tier, cell: (r) => '<span class="pill ' + r.tier + '">' + r.tier + "</span>" },
        { id: "found", label: "Found by", value: (r) => r.discoveredBy.join(","), cell: (r) => '<div class="chips">' + r.discoveredBy.map((d) => '<span class="chip">' + esc(d) + "</span>").join("") + "</div>" },
        { id: "cov", label: "Coverage", value: (r) => r.claimCount, cell: (r) => bar(r.axes) },
      ], rows, (r) => {
        const d = detailFor(r.id);
        const cov = detailFor("coverage:" + r.id);
        return (r.summary ? '<section><h4>summary</h4>' + esc(r.summary) + "</section>" : "") +
          '<section><h4>coverage by axis</h4>' + (Object.keys(r.axes).length ? Object.entries(r.axes).map(([a, v]) =>
            '<div style="margin-bottom:8px">' + esc(a) + " — " + v.covered + " of " + (US[a] ?? v.total) + " stated as covered" +
            (v.notCovered ? ", " + v.notCovered + " stated as not covered" : "") +
            (v.scoped ? ", " + v.scoped + " of those statements name a Region or similar scope" : "") +
            '<div class="chips" style="margin-top:5px">' + ((r.targets && r.targets[a]) ? r.targets[a].slice(0, 80).map((t) => '<span class="chip">' + esc(t) + "</span>").join("") : "") + "</div></div>").join("")
            : '<span class="muted">No source states what this feature covers.</span>') + "</section>" +
          '<section><h4>documentation</h4>' + r.docUrls.map((u) => '<div><a href="' + esc(u.replace(/\\.md$/, ".html")) + '" target="_blank" rel="noopener">' + esc(u) + "</a></div>").join("") + "</section>" +
          '<section><h4>evidence for the feature</h4>' + (typeof d === "string" ? d : evidenceBlock(d && d.evidence)) + "</section>" +
          (cov && typeof cov !== "string" && cov.claims ?
            '<section><h4>evidence for coverage</h4>' + evidenceBlock(cov.claims.slice(0, 6).flatMap((c) => c.evidence)) + "</section>" : "");
      });
  },
  coverage() {
    const rows = M.features.filter((f) => f.claimCount > 0 && match(f, [f.id, f.name, f.serviceId]));
    if (!rows.length) return filters({ placeholder: "search" }) + '<div class="empty">No coverage claims extracted yet.</div>';

    // Region, service and resource type are the axes every AWS service is measured
    // against, so they always get a column. Everything else is specific to one
    // service — a finding type means nothing outside GuardDuty — and shares a column.
    const STANDARD = ["region", "service", "resourceType"];
    const usage = {};
    for (const r of rows) for (const a of Object.keys(r.axes)) usage[a] = (usage[a] || 0) + 1;
    const columns = STANDARD.filter((a) => usage[a]);
    const others = Object.keys(usage).filter((a) => !STANDARD.includes(a)).sort();

    const catalogueCell = (r) => {
      const mine = others.filter((a) => isCatalogue(a) && r.axes[a]);
      if (!mine.length) return '<span class="muted">—</span>';
      return '<div class="chips">' + mine.map((a) =>
        '<span class="chip" title="' + esc((AXIS[a] || {}).label || a) + '">' + esc(a) + " " + r.axes[a].covered +
        (r.axes[a].scoped ? " · " + r.axes[a].scoped + " scoped" : "") + "</span>").join("") + "</div>";
    };
    const otherCell = (r) => {
      const mine = others.filter((a) => !isCatalogue(a) && r.axes[a]);
      if (!mine.length) return '<span class="muted">—</span>';
      return '<div class="chips">' + mine.map((a) =>
        '<span class="chip" title="' + esc(a) + ': ' + r.axes[a].covered + " of " + (US[a] ?? r.axes[a].total) +
        ' stated as covered">' + esc(a) + " " + r.axes[a].covered + "/" + (US[a] ?? r.axes[a].total) + "</span>").join("") + "</div>";
    };

    return filters({ placeholder: "search mapped features" }) + LEGEND +
      '<div class="muted" style="margin-bottom:10px">' +
        '<b>Coverage</b> is measured against a universe that exists whether or not the feature does: Regions, services, resource types, operating systems. ' +
        '<b>Published catalogue</b> is a list the service publishes about itself — GuardDuty finding types, Config managed rules, Security Hub controls. ' +
        'A service holds all of its own catalogue by definition, so those are counts, not coverage.</div>' +
      table([
        { id: "feature", label: "Feature", value: (r) => r.id, cell: (r) => '<span class="mono">' + esc(r.serviceId) + "</span> " + esc(r.name) },
        ...columns.map((a) => ({ id: a, label: a + " (of " + (US[a] ?? "?") + ")", value: (r) => (r.axes[a] ? r.axes[a].covered : -1),
          cell: (r) => r.axes[a] ? axisBar(a, r.axes[a]) : '<span class="muted">—</span>' })),
        ...(others.filter((a) => !isCatalogue(a)).length
          ? [{ id: "other", label: "Other coverage", value: (r) => others.filter((a) => !isCatalogue(a) && r.axes[a]).length, cell: otherCell }] : []),
        ...(others.filter(isCatalogue).length
          ? [{ id: "cat", label: "Published catalogue", value: (r) => others.filter((a) => isCatalogue(a) && r.axes[a]).length, cell: catalogueCell }] : []),
      ], rows, (r) => {
        const cov = detailFor("coverage:" + r.id);
        if (typeof cov === "string") return cov;
        if (!cov) return '<span class="muted">no detail</span>';
        // Grouped by axis. Ungrouped, a feature with 38 condition keys and 92 services
        // listed the condition keys and ran out of room before reaching the services.
        const groups = {};
        for (const c of cov.claims) (groups[c.axis] = groups[c.axis] || []).push(c);
        const order = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
        return '<section><h4>' + (cov.total || cov.claims.length) + ' claims across ' + order.length +
          (order.length === 1 ? ' axis' : ' axes') +
          (cov.total && cov.total > cov.claims.length
            ? ' <span class="muted">\u2014 showing ' + cov.claims.length + ' distinct targets; the rest repeat these under another Region or scope</span>' : "") +
          "</h4></section>" +
          order.map(function (axis) {
            const list = groups[axis];
            const shown = list.slice(0, 40);
            return '<section><h4>' + esc(axis) + " \u2014 " + list.length +
              (isCatalogue(axis) ? " published" : " of " + (US[axis] || list.length)) + "</h4>" +
              shown.map((c) =>
                '<div style="margin-bottom:7px"><span class="mono">' + esc(c.targetId) + "</span> " +
                '<span class="pill ' + (c.status === "covered" ? "deterministic" : "manual") + '">' + esc(c.status) + "</span>" +
                (c.scope ? ' <span class="chip">in ' + esc(c.scope.targetId) + "</span>" : "") +
                (c.qualifier ? ' <span class="muted">' + esc(c.qualifier) + "</span>" : "") +
                (c.evidence && c.evidence[0] ? '<div class="quote">' + esc(c.evidence[0].quote) + "</div>" +
                  '<a href="' + esc(String(c.evidence[0].sourceUrl).replace(/\\.md$/, ".html")) + '" target="_blank" rel="noopener">source</a>' : "") + "</div>").join("") +
              (list.length > shown.length ? '<div class="muted">\u2026and ' + (list.length - shown.length) + " more on this axis</div>" : "") +
              "</section>";
          }).join("");
      });
  },
  sources() {
    const all = M.sources || [];
    const rows = all.filter((s) => match(s, [s.url, s.serviceId, s.source, s.note, s.verdict]));
    const pct = (v) => (v === undefined ? "—" : (v * 100).toFixed(0) + "%");
    return filters({ placeholder: "search source pages" }) +
      '<div class="muted" style="margin-bottom:10px">Every AWS page the map reads. <b>Read</b> is how much of the page became coverage, checked against the live page on every run. A low number means the page holds more than we took from it.</div>' +
      table([
        { id: "service", label: "Service", value: (s) => s.serviceId, cell: (s) => '<span class="mono">' + esc(s.serviceId) + "</span>" },
        { id: "page", label: "Page", value: (s) => s.url,
          cell: (s) => '<a href="' + esc(s.url.replace(/\.md$/, ".html")) + '" target="_blank" rel="noopener">' + esc(s.url.split("/").pop()) + "</a>" },
        { id: "how", label: "Found by", value: (s) => s.source, cell: (s) => '<span class="chip">' + esc(s.source) + "</span>" },
        { id: "recipes", label: "Recipes", value: (s) => s.recipes, cell: (s) => s.recipes || '<span class="muted">generic</span>' },
        { id: "claims", label: "Claims", value: (s) => s.claims, cell: (s) => s.claims },
        { id: "read", label: "Read", value: (s) => (s.readRatio === undefined ? 2 : s.readRatio),
          cell: (s) => s.verdict === "ok" ? '<span class="ratio">' + pct(s.readRatio) + "</span>"
            : '<span class="pill llm">' + pct(s.readRatio) + "</span>" },
        { id: "dropped", label: "Unresolved", value: (s) => s.dropped || 0, cell: (s) => s.dropped ? '<span class="muted">' + s.dropped + "</span>" : "" },
      ], rows.map((s, i) => ({ ...s, id: s.url + i })), (s) =>
        (s.note ? '<section><h4>why this page</h4>' + esc(s.note) + "</section>" : "") +
        '<section><h4>source</h4><a href="' + esc(s.url.replace(/\.md$/, ".html")) + '" target="_blank" rel="noopener">' + esc(s.url) + "</a></section>" +
        (s.dropped ? '<section><h4>unresolved</h4>' + s.dropped + ' value(s) on this page did not match anything in the universes, so no claim was made for them.</section>' : ""));
  },
  regions() {
    const rows = M.regions.filter((r) => match(r, [r.id, r.name, r.partition]));
    return filters({ placeholder: "search regions" }) +
      '<div class="muted" style="margin-bottom:10px">Confirmed independently by the Regions guide, the endpoints file and the SSM global infrastructure parameters.</div>' +
      table([
        { id: "id", label: "Region", value: (r) => r.id, cell: (r) => '<span class="mono">' + esc(r.id) + "</span>" },
        { id: "name", label: "Name", value: (r) => r.name, cell: (r) => esc(r.name) },
        { id: "partition", label: "Partition", value: (r) => r.partition, cell: (r) => '<span class="chip">' + esc(r.partition) + "</span>" },
        { id: "seen", label: "Confirmed by", value: (r) => r.seenIn.length, cell: (r) => '<div class="chips">' + r.seenIn.map((s) => '<span class="chip">' + esc(s) + "</span>").join("") + "</div>" },
      ], rows.map((r, i) => ({ ...r, id: r.id || i })));
  },
  outofscope() {
    const rows = M.outOfScope.filter((r) => match(r, [r.id, r.reason]));
    return filters({ placeholder: "search services ruled out" }) +
      '<div class="muted" style="margin-bottom:10px">Every service the pipeline saw and ruled out, with the reason it was ruled out. ' + rows.length + " shown.</div>" +
      table([
        { id: "id", label: "Service", value: (r) => r.id, cell: (r) => '<span class="mono">' + esc(r.id) + "</span>" },
        { id: "score", label: "Score", value: (r) => r.score, cell: (r) => r.score.toFixed(1) },
        { id: "method", label: "Decided by", value: (r) => r.method, cell: (r) => '<span class="pill ' + r.method + '">' + r.method + "</span>" },
        { id: "reason", label: "Reason", value: (r) => r.reason, cell: (r) => '<span class="muted">' + esc(r.reason) + "</span>" },
      ], rows);
  },
  gaps() {
    const rows = M.gaps.filter((g) => match(g, [g.subject, g.detail, g.kind, g.stage]));
    return filters({ placeholder: "search gaps" }) +
      '<div class="muted" style="margin-bottom:10px">Known holes in the process. Each one is a task, not a silent miss.</div>' +
      table([
        { id: "kind", label: "Kind", value: (g) => g.kind, cell: (g) => '<span class="chip">' + esc(g.kind) + "</span>" },
        { id: "subject", label: "Subject", value: (g) => g.subject, cell: (g) => esc(g.subject) },
        { id: "stage", label: "Stage", value: (g) => g.stage, cell: (g) => '<span class="mono">' + esc(g.stage) + "</span>" },
        { id: "detail", label: "Detail", value: (g) => g.detail, cell: (g) => '<span class="muted">' + esc(g.detail) + "</span>" },
      ], rows);
  },
  quarantine() {
    const rows = M.quarantine.filter((q) => match(q, [q.subject, q.reason, q.stage, q.sourceUrl]));
    return filters({ placeholder: "search quarantine" }) +
      '<div class="muted" style="margin-bottom:10px">Sources the deterministic parsers could not read. Each keeps its raw snapshot, so a parser can be written against it.</div>' +
      table([
        { id: "stage", label: "Stage", value: (q) => q.stage, cell: (q) => '<span class="mono">' + esc(q.stage) + "</span>" },
        { id: "subject", label: "Subject", value: (q) => q.subject, cell: (q) => esc(q.subject) },
        { id: "reason", label: "Reason", value: (q) => q.reason, cell: (q) => '<span class="muted">' + esc(q.reason) + "</span>" },
        { id: "src", label: "Source", value: (q) => q.sourceUrl, cell: (q) => q.sourceUrl ? '<a href="' + esc(q.sourceUrl.replace(/\\.md$/, ".html")) + '" target="_blank" rel="noopener">open</a>' : "" },
      ], rows);
  },
  conflicts() {
    const rows = M.conflicts.filter((c) => match(c, [c.featureId, c.axis, c.targetId]));
    return filters({ placeholder: "search conflicts" }) +
      '<div class="muted" style="margin-bottom:10px">Sources that disagree. Shown, never quietly resolved.</div>' +
      table([
        { id: "feature", label: "Feature", value: (c) => c.featureId, cell: (c) => '<span class="mono">' + esc(c.featureId) + "</span>" },
        { id: "axis", label: "Axis", value: (c) => c.axis, cell: (c) => esc(c.axis) },
        { id: "target", label: "Target", value: (c) => c.targetId, cell: (c) => '<span class="mono">' + esc(c.targetId) + "</span>" },
        { id: "st", label: "Claims", value: (c) => c.statuses.length, cell: (c) => c.statuses.map((s) => '<span class="chip">' + esc(s) + "</span>").join(" ") },
      ], rows, (c) => '<section><h4>sources</h4>' + c.sources.map((s) => '<div><a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(s) + "</a></div>").join("") + "</section>");
  },
  run() {
    if (!M.manifest) return '<div class="empty">No run recorded yet.</div>';
    const m = M.manifest;
    return '<div class="grid"><div class="card"><h3>Last run</h3>' +
      '<div class="muted">started ' + esc(new Date(m.startedAt).toLocaleString()) + "</div>" +
      (m.finishedAt ? '<div class="muted">finished ' + esc(new Date(m.finishedAt).toLocaleString()) + "</div>" : "") +
      (m.fetch ? '<div class="muted" style="margin-top:8px">fetch: ' + Object.entries(m.fetch).map(([k, v]) => k + " " + v).join(", ") + "</div>" : "") +
      "</div></div>" +
      '<div style="margin-top:18px">' + m.stages.map((s) =>
        '<div class="stage"><span class="dot ' + s.status + '"></span><span class="mono">' + esc(s.id) + "</span>" +
        '<span class="muted">' + esc(s.status) + "</span>" +
        '<span class="spacer"></span><span class="muted">' + (s.counts ? Object.entries(s.counts).map(([k, v]) => k + "=" + v).join("  ") : "") + "</span></div>" +
        (s.notes && s.notes.length ? s.notes.map((n) => '<div class="quote">' + esc(n) + "</div>").join("") : "")).join("") + "</div>";
  },
};

render();
loadDetail();
</script>
</body>
</html>`;
}
