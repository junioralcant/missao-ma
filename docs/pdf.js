const { chromium } = require("playwright");
const path = require("path");

const HTML = "file://" + path.join(__dirname, "manual.html");
const OUT = path.join(__dirname, "Missao-Maranhao-Manual-de-Uso.pdf");

const FOOTER = `
<div style="width:100%; font-family:Arial, sans-serif; font-size:7pt; color:#8A9599;
            padding:0 16mm; display:flex; justify-content:space-between;">
  <span>Missão Maranhão · Manual de Uso</span>
  <span class="pageNumber"></span>
</div>`;

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  await page.goto(HTML, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(1500);
  await page.pdf({
    path: OUT,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: FOOTER,
    margin: { top: "14mm", bottom: "14mm", left: "16mm", right: "16mm" },
  });
  await browser.close();
  console.log("pdf gerado:", OUT);
})();
