/**
 * Responsive / breakpoint tests.
 * Each describe block sets a fixed viewport before navigating.
 */
import { expect, test } from "@playwright/test";
import { clearSession, makeCredentials, registerUser } from "./smoke-helpers.js";

const BASE_URL = "http://localhost:5173";

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

// Helper: register once then navigate
async function setupUser(page, viewport) {
  await page.setViewportSize(viewport);
  const creds = makeCredentials("resp");
  await clearSession(page);
  await registerUser(page, creds);
  return creds;
}

// ────────────────────────────────────────────
// MOBILE  (375 × 812)
// ────────────────────────────────────────────
test.describe("responsive — mobile (375px)", () => {
  test.use({ viewport: VIEWPORTS.mobile });

  test("home: página renderiza sem overflow horizontal", async ({ page }) => {
    await setupUser(page, VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 4); // 4px tolerance
  });

  test("sidebar está colapsada ou ocultada no mobile", async ({ page }) => {
    await setupUser(page, VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "domcontentloaded" });
    const sidebar = page.locator(
      ".fg-sidebar, [class*='sidebar'], nav[class*='side'], aside",
    ).first();
    if (await sidebar.isVisible()) {
      // Sidebar may be collapsed (narrow) instead of full-width
      const box = await sidebar.boundingBox();
      if (box) expect(box.width).toBeLessThan(90);
    }
  });

  test("cards da home empilham verticalmente", async ({ page }) => {
    await setupUser(page, VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    const cards = page.locator(".fg-home-summary-card, .fg-home-action-card");
    if (await cards.count() > 1) {
      const box0 = await cards.nth(0).boundingBox();
      const box1 = await cards.nth(1).boundingBox();
      if (box0 && box1) {
        // Stacked = second card is below the first (y2 > y1)
        expect(box1.y).toBeGreaterThan(box0.y);
      }
    }
  });

  test("página de veículos: cards acessíveis no mobile", async ({ page }) => {
    await setupUser(page, VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/veiculos`, { waitUntil: "networkidle" });
    await expect(page.locator(".fg-vehicles-page, .fg-vehicles-grid, main").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("página de relatórios: sem overflow horizontal", async ({ page }) => {
    await setupUser(page, VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/relatorios`, { waitUntil: "networkidle" });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 4);
  });

  test("tabela de relatórios tem scroll horizontal no mobile", async ({ page }) => {
    await setupUser(page, VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/relatorios`, { waitUntil: "networkidle" });
    const tableWrap = page.locator(".table-wrap").first();
    if (await tableWrap.isVisible({ timeout: 10000 }).catch(() => false)) {
      const overflowX = await tableWrap.evaluate((el) => getComputedStyle(el).overflowX);
      expect(["auto", "scroll", "hidden"]).toContain(overflowX);
    }
  });

  test("login: formulário é acessível no mobile", async ({ page }) => {
    await clearSession(page);
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#senha")).toBeVisible();
    // Form must not overflow the viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(VIEWPORTS.mobile.width + 4);
  });
});

// ────────────────────────────────────────────
// TABLET  (768 × 1024)
// ────────────────────────────────────────────
test.describe("responsive — tablet (768px)", () => {
  test.use({ viewport: VIEWPORTS.tablet });

  test("home: sem overflow horizontal no tablet", async ({ page }) => {
    await setupUser(page, VIEWPORTS.tablet);
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 4);
  });

  test("summary cards ocupam 2 colunas no tablet", async ({ page }) => {
    await setupUser(page, VIEWPORTS.tablet);
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    const cards = page.locator(".fg-home-summary-card");
    const count = await cards.count();
    if (count >= 2) {
      const box0 = await cards.nth(0).boundingBox();
      const box1 = await cards.nth(1).boundingBox();
      if (box0 && box1) {
        // On tablet 2-col grid: cards 0 and 1 share the same row (same y or close)
        // Allow 4px difference for borders/gaps
        expect(Math.abs(box1.y - box0.y)).toBeLessThan(8);
      }
    }
  });

  test("páginas internas carregam sem overflow no tablet", async ({ page }) => {
    await setupUser(page, VIEWPORTS.tablet);
    const pages = ["/manutencoes", "/motoristas", "/alertas"];
    for (const route of pages) {
      await page.goto(`${BASE_URL}/#${route}`, { waitUntil: "networkidle" });
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 4);
    }
  });
});
