import { spawn } from "node:child_process";

const SHELL =
  "/Users/alpha/Library/Caches/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-mac-x64/chrome-headless-shell";
const PORT = 9335;
const URL = "http://localhost:3000/dev/graphics-editor";

const browser = spawn(SHELL, [
  `--remote-debugging-port=${PORT}`,
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(300);
  }
  throw new Error("CDP not ready");
}

const EXPR = `(() => {
  const R = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width) };
  };
  const box = document.querySelector('[class*="rounded-2xl"][class*="ring-1"]');
  const stage = document.querySelector('[style*="radial-gradient"]');
  const lanes = document.querySelector('[class*="overflow-x-auto"]');
  // timeline = ancêtre du bouton Couper avec bg-black/60
  const cut = [...document.querySelectorAll("button")].find(b => b.textContent && b.textContent.includes("Couper"));
  const timeline = cut ? cut.closest('[class*="bg-black/60"]') : null;
  // transport = barre avec "Position"
  const pos = [...document.querySelectorAll("span")].find(s => s.textContent && s.textContent.includes("sur 00:"));
  const transport = pos ? pos.closest('[class*="border-t"]') : null;
  return {
    viewport: [window.innerWidth, window.innerHeight],
    bodyScrollH: document.body.scrollHeight,
    videoBox: R(box),
    stage: R(stage),
    transport: R(transport),
    timeline: R(timeline),
    lanes: R(lanes),
    overlap: (() => {
      if (!box || !timeline) return null;
      const b = box.getBoundingClientRect();
      const t = timeline.getBoundingClientRect();
      return { boxBottom: Math.round(b.bottom), timelineTop: Math.round(t.top), boxCoversTimeline: b.bottom > t.top };
    })(),
  };
})()`;

const ws = new WebSocket(await getWsUrl());
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }
};
await new Promise((r) => (ws.onopen = r));

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1749, height: 957, deviceScaleFactor: 1, mobile: false,
});
await send("Page.navigate", { url: URL });
await sleep(15000);

const result = await send("Runtime.evaluate", { expression: EXPR, returnByValue: true });
console.log(JSON.stringify(result.result.value, null, 2));

ws.close();
browser.kill("SIGKILL");
process.exit(0);
