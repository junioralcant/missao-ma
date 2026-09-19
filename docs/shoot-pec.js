const { chromium } = require("playwright");

const URL = process.env.BASE_URL || "http://localhost:3100";
const OUT = __dirname + "/shots";
const PASS = process.env.ADMIN_PASSWORD || "demo123";

const MOBILE = { width: 420, height: 900 };
const DESKTOP = { width: 1280, height: 900 };

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
  await m.fill("#signature-cpf", "31703186087");
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
  await m.waitForSelector(".receipt-code", { timeout: 15000 });
  await m.evaluate(() => {
    const card = document.querySelector(".receipt-code").closest(".card");
    window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - 24);
  });
  await shot(m, "05-pec-recibo");

  await m.goto(`${URL}/pec/minuta`, { waitUntil: "networkidle" });
  await shot(m, "06-pec-minuta");

  await m.goto(`${URL}/pec`, { waitUntil: "networkidle" });
  await shotCard(m, 2, "07-pec-requisitos");

  // ---------- PAINEL PÚBLICO (desktop) ----------
  const desktop = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    locale: "pt-BR",
  });
  const d = await desktop.newPage();

  await d.goto(`${URL}/pec/painel`, { waitUntil: "networkidle" });
  await shotCard(d, 0, "08-painel-metas");
  await shotCard(d, 1, "09-painel-municipios");

  // ---------- ÁREA ADMINISTRATIVA (desktop) ----------
  await d.goto(`${URL}/admin/login`, { waitUntil: "networkidle" });
  await shot(d, "10-admin-login", {
    clip: await d.evaluate(() => {
      const c = document.querySelector(".card").getBoundingClientRect();
      return { x: c.x - 8, y: c.y - 8, width: c.width + 16, height: c.height + 16 };
    }),
  });

  await d.fill("#password", PASS);
  await d.click("button[type=submit]");
  await d.waitForURL("**/admin", { timeout: 15000 });

  await d.goto(`${URL}/admin/pec`, { waitUntil: "networkidle" });
  await shotCard(d, 0, "11-admin-requisitos");
  await shotCard(d, 1, "12-admin-assinaturas");
  await shotCard(d, 2, "13-admin-municipios");
  await shotCard(d, 3, "14-admin-proposta");
  await shotCard(d, 4, "15-admin-integridade");

  await browser.close();
  console.log("done");
})();
