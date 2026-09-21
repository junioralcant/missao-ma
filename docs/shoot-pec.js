const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const { chromium } = require("playwright");

const URL = process.env.BASE_URL || "http://localhost:3100";
const OUT = __dirname + "/shots";
const PASS = process.env.ADMIN_PASSWORD || "demo123";
const DB_PATH = process.env.DATABASE_PATH || "/tmp/demo-pec/app.db";

const MOBILE = { width: 420, height: 900 };
const DESKTOP = { width: 1280, height: 900 };

const DEMO_CPF = "31703186087";
const DEMO_EMAIL = "maria.silva@example.com";

const PENDING = {
  name: "Raimundo Nonato Serra",
  cpf: "72019544075",
  email: "raimundo.serra@example.com",
  city: "Imperatriz",
};

const shot = async (page, name, opts = {}) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log("captured", name);
};

const shotCard = async (page, index, name) => {
  const clip = await page.evaluate(i => {
    const card = document.querySelectorAll(".card")[i];
    const top = card.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(top - 24, 0));
    const c = card.getBoundingClientRect();
    return {
      x: Math.max(c.x - 8, 0),
      y: Math.max(c.y - 8, 0),
      width: c.width + 16,
      height: Math.min(c.height + 16, window.innerHeight - Math.max(c.y - 8, 0)),
    };
  }, index);
  await page.waitForTimeout(400);
  await shot(page, name, { clip });
};

const scrollToCardOf = (page, selector) =>
  page.evaluate(sel => {
    const card = document.querySelector(sel).closest(".card");
    window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - 24);
  }, selector);

const stealToken = cpf => {
  const token = crypto.randomBytes(32).toString("hex");
  const db = new DatabaseSync(DB_PATH);
  db.prepare("UPDATE signature_requests SET token_hash = ? WHERE cpf = ?").run(
    crypto.createHash("sha256").update(token).digest("hex"),
    cpf,
  );
  db.close();
  return token;
};

const createPendingRequest = async () => {
  const response = await fetch(`${URL}/api/pec/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...PENDING, consent: true, hasReadDocument: true }),
  });
  if (!response.ok) {
    console.error("falhou ao criar o pedido pendente", await response.json());
    process.exit(1);
  }
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });

  // ---------- FLUXO PÚBLICO (celular) ----------
  const mobile = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    locale: "pt-BR",
  });
  const m = await mobile.newPage();

  await m.goto(`${URL}/pec`, { waitUntil: "networkidle" });
  await shot(m, "01-pec-inicial");

  await m.fill("#signature-name", "Maria dos Santos Silva");
  await m.fill("#signature-cpf", DEMO_CPF);
  await m.fill("#signature-email", DEMO_EMAIL);
  await m.click("#signature-city");
  await m.fill("#signature-city", "São Lu");
  await m.waitForTimeout(500);
  await m.evaluate(() => {
    const field = document.querySelector("#signature-name").closest(".field");
    window.scrollTo(0, field.getBoundingClientRect().top + window.scrollY - 24);
  });
  await shot(m, "02-pec-cidade");

  await m.click('.combobox-option:has-text("São Luís")');
  await m.waitForTimeout(300);
  await shot(m, "03-pec-formulario");

  await m.evaluate(() => {
    document.querySelector(".document-callout").scrollIntoView({ block: "center" });
  });
  await shot(m, "04-pec-leitura");

  const boxes = await m.$$(".checkbox-input");
  for (const box of boxes) await box.check();
  await m.click('button[type="submit"]');
  await m.waitForSelector(".alert--success", { timeout: 15000 });
  await scrollToCardOf(m, ".alert--success");
  await shot(m, "05-pec-email-enviado");

  await m.goto(`${URL}/pec/confirmar/${stealToken(DEMO_CPF)}`, {
    waitUntil: "networkidle",
  });
  await shot(m, "06-pec-confirmacao");

  await m.click('button:has-text("Assinar PEC")');
  await m.waitForSelector(".receipt-code", { timeout: 15000 });
  await scrollToCardOf(m, ".receipt-code");
  await shot(m, "07-pec-recibo");

  await m.goto(`${URL}/pec/minuta`, { waitUntil: "networkidle" });
  await shot(m, "08-pec-minuta");

  await m.goto(`${URL}/pec`, { waitUntil: "networkidle" });
  await shotCard(m, 2, "09-pec-requisitos");

  // ---------- PAINEL PÚBLICO (desktop) ----------
  const desktop = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    locale: "pt-BR",
  });
  const d = await desktop.newPage();

  await d.goto(`${URL}/pec/painel`, { waitUntil: "networkidle" });
  await shotCard(d, 0, "10-painel-metas");
  await shotCard(d, 1, "11-painel-municipios");

  // ---------- ÁREA ADMINISTRATIVA (desktop) ----------
  await d.goto(`${URL}/admin/login`, { waitUntil: "networkidle" });
  await shot(d, "12-admin-login", {
    clip: await d.evaluate(() => {
      const c = document.querySelector(".card").getBoundingClientRect();
      return { x: c.x - 8, y: c.y - 8, width: c.width + 16, height: c.height + 16 };
    }),
  });

  await d.fill("#password", PASS);
  await d.click("button[type=submit]");
  await d.waitForURL("**/admin", { timeout: 15000 });

  await createPendingRequest();

  await d.goto(`${URL}/admin/pec`, { waitUntil: "networkidle" });
  await shotCard(d, 0, "13-admin-requisitos");
  await shotCard(d, 1, "14-admin-assinaturas");
  await shotCard(d, 2, "15-admin-pendentes");
  await shotCard(d, 3, "16-admin-municipios");
  await shotCard(d, 4, "17-admin-proposta");
  await shotCard(d, 5, "18-admin-integridade");

  await browser.close();
  console.log("done");
})();
