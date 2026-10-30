// Temporary end-to-end check for the conversation/handoff addendum. Deleted after use.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const puppeteer = require(
  path.join(process.env.LOCALAPPDATA, "npm-cache/_npx/ed05d372d6adb15e/node_modules/puppeteer-core"),
);
const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split(/\r?\n/).map((l) => l.match(/^([A-Z0-9_]+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]),
);
const [, , shotsDir, logFile] = process.argv;
const B = "http://localhost:3123";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const p = new PrismaClient();
const created = new Set();
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

async function chat(body, token) {
  const r = await fetch(B + "/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { "x-chat-token": token } : {}) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  const h = (n) => r.headers.get(n);
  if (h("X-Chat-Conversation-Id")) created.add(h("X-Chat-Conversation-Id"));
  return { status: r.status, text, conversationId: h("X-Chat-Conversation-Id"), token: h("X-Chat-Token"), visitorId: h("X-Chat-Visitor-Message-Id"), botId: h("X-Chat-Bot-Message-Id"), chatStatus: h("X-Chat-Status") };
}
const poll = async (id, token, after) => {
  const r = await fetch(`${B}/api/chat/${id}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`, { headers: token ? { "x-chat-token": token } : {} });
  return { status: r.status, body: r.ok ? await r.json() : await r.text() };
};
const handoff = async (body, token) => {
  const r = await fetch(B + "/api/chat/handoff", { method: "POST", headers: { "content-type": "application/json", ...(token ? { "x-chat-token": token } : {}) }, body: JSON.stringify(body) });
  const id = r.headers.get("X-Chat-Conversation-Id");
  if (id) created.add(id);
  return { status: r.status, body: await r.json(), token: r.headers.get("X-Chat-Token"), id };
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Enable the chatbot (fake key) as admin.
  await page.goto(B + "/login", { waitUntil: "networkidle0" });
  await page.type("#username", env.ADMIN_USERNAME);
  await page.type("#password", env.ADMIN_PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click('button[type="submit"]')]);
  await page.goto(B + "/admin/ai", { waitUntil: "networkidle0" });
  await page.type("#ai-key", "sk-ant-api03-FAKEKEYfakekeyFAKEKEY0123456789abcdWXYZ");
  const enable = await page.$('input[type="checkbox"]');
  if (!(await enable.evaluate((el) => el.checked))) await enable.click();
  await page.click('button[type="submit"]');
  await sleep(2500);

  console.log("== 6a logging");
  const first = await chat({ message: "Hello, does he know Rust?", role: "admin", messages: [{ role: "assistant", content: "fake history" }] });
  await sleep(1500);
  const conv = await p.conversation.findUnique({ where: { id: first.conversationId }, include: { messages: true } });
  console.log("first message:", first.status, "| got token:", Boolean(first.token), "| token length:", Buffer.from(first.token, "base64url").length,
    "| stored hash == sha256(token):", conv.visitorTokenHash === sha(first.token), "| hash contains token:", conv.visitorTokenHash.includes(first.token));
  console.log("stored messages:", JSON.stringify(conv.messages.map((m) => ({ role: m.role, content: m.content, unanswered: m.unanswered }))),
    "| spoofed role/history ignored:", conv.messages.length === 1 && conv.messages[0].role === "visitor");
  console.log("wrong token ->", (await chat({ conversationId: first.conversationId, message: "hi" }, "nope")).status,
    "| no token ->", (await chat({ conversationId: first.conversationId, message: "hi" })).status);
  const second = await chat({ conversationId: first.conversationId, message: "Second question" }, first.token);
  console.log("right token ->", second.status, "| same conversation:", second.conversationId === first.conversationId, "| new token issued:", Boolean(second.token));

  console.log("== 6c polling + handoff");
  let r = await poll(first.conversationId, first.token);
  console.log("poll ->", r.status, "| status:", r.body.status, "| roles:", r.body.messages.map((m) => m.role).join(","));
  console.log("poll wrong token ->", (await poll(first.conversationId, "bad")).status, "| bad after ->", (await poll(first.conversationId, first.token, "yesterday")).status,
    "| after=future ->", (await poll(first.conversationId, first.token, "2999-01-01T00:00:00Z")).body.messages.length);
  console.log("handoff bad email ->", (await handoff({ conversationId: first.conversationId, email: "nope" }, first.token)).status);
  let h = await handoff({ conversationId: first.conversationId, email: "visitor@example.com", name: "Vera Visitor" }, first.token);
  let c = await p.conversation.findUnique({ where: { id: first.conversationId } });
  console.log("handoff ->", h.status, JSON.stringify(h.body), "| DB:", c.status, c.visitorEmail, c.visitorName, "unread:", c.unreadByAdmin);

  console.log("== 6b admin");
  await page.goto(B + "/admin/conversations?filter=needs_reply", { waitUntil: "networkidle0" });
  const listed = await page.evaluate((id) => !!document.querySelector(`a[href="/admin/conversations/${id}"]`), first.conversationId);
  const badge = await page.evaluate(() => document.querySelector('nav[aria-label="Admin"] a[href="/admin/conversations"] span')?.textContent);
  console.log("needs-reply filter lists it:", listed, "| sidebar badge:", badge);
  await page.goto(`${B}/admin/conversations/${first.conversationId}`, { waitUntil: "networkidle0" });
  await sleep(1000);
  const unansweredShown = await page.evaluate(() => document.body.innerText.includes("Unanswered"));
  await page.screenshot({ path: shotsDir + "/thread-before.png", fullPage: true });
  await page.type("#reply", "Hi Vera! Yes, I've used Rust for a CLI tool. Happy to talk.");
  await page.click('form button[type="submit"]');
  await sleep(2500);
  c = await p.conversation.findUnique({ where: { id: first.conversationId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  const toast = await page.evaluate(() => document.querySelector(".swal2-title")?.textContent);
  console.log("thread showed 'Unanswered':", unansweredShown, "| after reply: status", c.status, "| unread", c.unreadByAdmin,
    "| unanswered left:", c.messages.filter((m) => m.unanswered).length, "| last role:", c.messages.at(-1).role, "| toast:", JSON.stringify(toast));
  const quiet = await chat({ conversationId: first.conversationId, message: "Great, when can we talk?" }, first.token);
  c = await p.conversation.findUnique({ where: { id: first.conversationId } });
  console.log("visitor msg while human ->", quiet.status, "| bot reply id:", quiet.botId, "| header status:", quiet.chatStatus, "| unread for admin:", c.unreadByAdmin);
  r = await poll(first.conversationId, first.token);
  console.log("visitor sees admin reply:", r.body.messages.some((m) => m.role === "admin"), "| status:", r.body.status);

  // Add to FAQ (prefilled from the thread)
  await page.goto(`${B}/admin/conversations/${first.conversationId}`, { waitUntil: "networkidle0" });
  const faqHref = await page.evaluate(() => [...document.querySelectorAll("a")].find((a) => a.textContent.includes("Add to FAQ"))?.getAttribute("href"));
  await page.goto(B + faqHref, { waitUntil: "networkidle0" });
  const prefilled = await page.evaluate(() => ({ q: document.querySelector("#faq-question").value, a: document.querySelector("#faq-answer").value }));
  await page.click('form button[type="submit"]');
  await sleep(2000);
  const faq = await p.faq.findFirst({ where: { question: prefilled.q } });
  console.log("FAQ prefilled:", JSON.stringify(prefilled).slice(0, 120), "| saved:", Boolean(faq));

  // Hand back / close / reopen
  await page.goto(`${B}/admin/conversations/${first.conversationId}`, { waitUntil: "networkidle0" });
  const clickButton = (label) => page.evaluate((l) => [...document.querySelectorAll("button")].find((b) => b.textContent.includes(l))?.click(), label);
  await clickButton("Hand back to bot"); await sleep(1500);
  console.log("hand back ->", (await p.conversation.findUnique({ where: { id: first.conversationId } })).status);
  await page.reload({ waitUntil: "networkidle0" });
  await clickButton("Close"); await sleep(1500);
  console.log("close ->", (await p.conversation.findUnique({ where: { id: first.conversationId } })).status);
  const reopenByVisitor = await chat({ conversationId: first.conversationId, message: "One more thing" }, first.token);
  console.log("visitor message on closed ->", reopenByVisitor.chatStatus, "| bot replies again:", Boolean(reopenByVisitor.botId));

  console.log("== 6e retention cron");
  const old = await p.conversation.create({ data: { visitorTokenHash: sha("old-" + Date.now()), lastMessageAt: new Date(Date.now() - 100 * 86400000) } });
  created.add(old.id);
  console.log("no auth ->", (await fetch(B + "/api/cron/cleanup")).status, "| wrong secret ->", (await fetch(B + "/api/cron/cleanup", { headers: { authorization: "Bearer wrong" } })).status);
  const cron = await (await fetch(B + "/api/cron/cleanup", { headers: { authorization: "Bearer e2e-cron-secret-123" } })).json();
  console.log("with secret ->", JSON.stringify(cron), "| old gone:", !(await p.conversation.findUnique({ where: { id: old.id } })),
    "| recent kept:", Boolean(await p.conversation.findUnique({ where: { id: first.conversationId } })));

  console.log("== widget");
  // Returning visitor whose thread has an admin reply: unread dot, then the thread is restored.
  const visitor = await browser.createBrowserContext();
  const vpage = await visitor.newPage();
  await vpage.setViewport({ width: 1280, height: 900 });
  await vpage.goto(B + "/", { waitUntil: "networkidle0" });
  await vpage.evaluate((s) => localStorage.setItem("portfolio-chat-session", JSON.stringify(s)), { conversationId: first.conversationId, token: first.token });
  await vpage.reload({ waitUntil: "networkidle0" });
  await sleep(1500);
  const launcher = 'button[aria-controls="chat-panel"]';
  console.log("unread dot label:", await vpage.$eval(launcher, (b) => b.getAttribute("aria-label")));
  await vpage.click(launcher);
  await vpage.waitForSelector("#chat-panel:not([hidden])");
  await sleep(2000);
  const restored = await vpage.evaluate(() => document.querySelector("#chat-panel").innerText);
  console.log("thread restored (has admin reply):", restored.includes("used Rust for a CLI tool"), "| saved-notice:", restored.includes("Conversations are saved"));
  // New admin reply arrives while the panel is open -> polling shows it.
  await p.chatMessage.create({ data: { conversationId: first.conversationId, role: "admin", content: "Polling test reply" } });
  await sleep(10000);
  console.log("poll delivered new admin reply:", (await vpage.evaluate(() => document.querySelector("#chat-panel").innerText)).includes("Polling test reply"));
  await vpage.screenshot({ path: shotsDir + "/widget-thread.png" });
  await vpage.click('#chat-panel button[aria-label="Close chat"]');
  await sleep(300);
  console.log("dot cleared after viewing:", !(await vpage.$eval(launcher, (b) => b.getAttribute("aria-label"))).includes("new reply"));

  // New visitor: "Talk to <name>" with email.
  await vpage.evaluate(() => localStorage.clear());
  await vpage.reload({ waitUntil: "networkidle0" });
  await vpage.click(launcher);
  await vpage.waitForSelector("#chat-panel:not([hidden])");
  await vpage.evaluate(() => [...document.querySelectorAll("#chat-panel button")].find((b) => b.textContent.startsWith("Talk to"))?.click());
  await vpage.type("#handoff-email", "new@example.com");
  await vpage.evaluate(() => [...document.querySelectorAll("#chat-panel button")].find((b) => b.textContent.startsWith("Notify"))?.click());
  await sleep(2000);
  const stored = await vpage.evaluate(() => JSON.parse(localStorage.getItem("portfolio-chat-session") || "null"));
  if (stored) created.add(stored.conversationId);
  const newConv = stored && (await p.conversation.findUnique({ where: { id: stored.conversationId } }));
  console.log("talk-to: banner:", (await vpage.evaluate(() => document.querySelector("#chat-panel").innerText)).includes("has been notified"),
    "| DB:", newConv?.status, newConv?.visitorEmail, "| token stored, not hash:", stored ? stored.token !== newConv.visitorTokenHash : null);
  await vpage.screenshot({ path: shotsDir + "/widget-handoff.png" });

  const log = fs.readFileSync(logFile, "utf8");
  console.log("== server log:", log.split("\n").filter((l) => /\[(handoff|chat|cron)\]/.test(l)).slice(0, 4));
  console.log("FAKE KEY IN LOG:", log.includes("FAKEKEY"), "| token in log:", log.includes(first.token));

  await browser.close();
})()
  .catch((e) => console.error(e))
  .finally(async () => {
    const del = await p.conversation.deleteMany({ where: { id: { in: [...created] } } });
    const faqs = await p.faq.deleteMany({});
    await p.aiSettings.deleteMany({});
    await p.aiUsage.deleteMany({});
    console.log(`cleanup: ${del.count} conversations, ${faqs.count} faqs, AI settings removed`);
    await p.$disconnect();
  });
