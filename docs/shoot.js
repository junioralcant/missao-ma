const { chromium } = require("playwright");

const URL = "http://localhost:3100";
const OUT = __dirname + "/shots";
const PASS = "demo123";

const MOBILE = { width: 420, height: 900 };
const DESKTOP = { width: 1280, height: 900 };

const shot = async (page, name, opts = {}) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log("captured", name);
};

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });

  const mobile = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    locale: "pt-BR",
  });
  const m = await mobile.newPage();

  await m.goto(URL, { waitUntil: "networkidle" });
  await shot(m, "01-publica-inicial");

  await m.fill("#name", "Maria dos Santos Silva");
  await m.fill("#cpf", "10433218100");
  await shot(m, "02-publica-preenchida");

  await m.click("#city");
  await m.fill("#city", "São");
  await shot(m, "03-publica-busca-cidade");

  await m.fill("#city", "São Luís");
  await m.waitForTimeout(400);
  await m.click('.combobox-option:has-text("São Luís")');
  await m.check(".checkbox-input");
  await shot(m, "04-publica-pronta");

  const desktop = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    locale: "pt-BR",
  });
  const d = await desktop.newPage();

  await d.goto(`${URL}/admin/login`, { waitUntil: "networkidle" });
  await shot(d, "05-admin-login");

  await d.fill("#password", PASS);
  await d.click("button[type=submit]");
  await d.waitForURL("**/admin", { timeout: 15000 });
  await d.waitForLoadState("networkidle");
  await shot(d, "06-admin-painel", { fullPage: true });

  await d.evaluate(() => {
    const card = document.querySelectorAll(".card")[0];
    card.scrollIntoView({ block: "center" });
  });
  await shot(d, "07-admin-grupo-padrao", {
    clip: await d.evaluate(() => {
      const c = document.querySelectorAll(".card")[0].getBoundingClientRect();
      return {
        x: c.x - 8,
        y: c.y - 8,
        width: c.width + 16,
        height: c.height + 16,
      };
    }),
  });

  await d.click("#group-city");
  await d.fill("#group-city", "Bal");
  await d.waitForTimeout(400);
  await shot(d, "08-admin-cadastrar-grupo", {
    clip: await d.evaluate(() => {
      const c = document.querySelectorAll(".card")[1].getBoundingClientRect();
      return {
        x: c.x - 8,
        y: c.y - 8,
        width: c.width + 16,
        height: Math.min(c.height + 120, window.innerHeight - c.y + 100),
      };
    }),
  });

  await d.keyboard.press("Escape");
  await d.evaluate(() => {
    document.querySelectorAll(".card")[2].scrollIntoView({ block: "center" });
  });
  await shot(d, "09-admin-cadastros", {
    clip: await d.evaluate(() => {
      const c = document.querySelectorAll(".card")[2].getBoundingClientRect();
      return {
        x: c.x - 8,
        y: c.y - 8,
        width: c.width + 16,
        height: c.height + 16,
      };
    }),
  });

  await browser.close();
  console.log("done");
})();
