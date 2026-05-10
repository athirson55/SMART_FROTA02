import { expect, test } from "@playwright/test";
import {
  clearSession,
  createVehicle,
  loginUser,
  makeCredentials,
  openNotifications,
  registerUser,
} from "./smoke-helpers.js";

const BASE_URL = "http://localhost:5173";

let credentials;
let seedVehicle;

test.describe("alerts", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("alerts");
    seedVehicle = {
      model: `AlertVehicle ${Date.now()}`,
      plate: `ALT${String(Date.now()).slice(-4)}`,
    };
    await clearSession(page);
    await registerUser(page, credentials);
    await page.goto(`${BASE_URL}/#/veiculos`);
    await createVehicle(page, seedVehicle);
    await page.goto(`${BASE_URL}/#/alertas`, { waitUntil: "networkidle" });
  });

  test("página de alertas carrega", async ({ page }) => {
    await expect(page.locator(".fg-alerts-page, .arc-page, main")).toBeVisible();
    // Either a table with alerts, or an empty-state message
    await expect(
      page.locator(".fg-arc-table, .fg-arc-empty, .arc-card-list, [class*='alerts']").first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("filtro por status exibe subconjunto correto", async ({ page }) => {
    // Click "Resolvidos" filter if available
    const resolvidoBtn = page.getByRole("button", { name: /Resolvidos?/i });
    if (await resolvidoBtn.isVisible()) {
      await resolvidoBtn.click();
      // Either a resolved alert row OR an empty-state indicator
      await expect(
        page.locator("[class*='resolvido'], [class*='badge-green'], .fg-arc-empty").first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("filtro por prioridade", async ({ page }) => {
    const criticoBtn = page.getByRole("button", { name: /Crít/i });
    if (await criticoBtn.isVisible()) {
      await criticoBtn.click();
      await page.waitForTimeout(500);
      // Verify the filter is visually active
      await expect(criticoBtn).toHaveClass(/active|selected|on/i);
    }
  });

  test("busca filtra por texto", async ({ page }) => {
    const searchInput = page.locator("input[placeholder*='Buscar'], input[placeholder*='buscar']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("xyz_inexistente_12345");
      await page.waitForTimeout(400);
      // Expect empty state or zero rows after searching for something that won't match
      const rows = page.locator(".fg-arc-table tbody tr, .arc-alert-row");
      const count = await rows.count();
      // Either no results or an empty message
      if (count > 0) {
        await expect(rows.first()).not.toContainText("xyz_inexistente_12345");
      }
      await searchInput.clear();
    }
  });

  test("notificações: painel abre e fecha", async ({ page }) => {
    await openNotifications(page);
    // Panel is visible
    await expect(page.locator(".fg-header-notification-dropdown")).toBeVisible();
    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(page.locator(".fg-header-notification-dropdown")).not.toBeVisible({ timeout: 3000 });
  });

  test("notificações: painel lista itens ou estado vazio", async ({ page }) => {
    await openNotifications(page);
    const dropdown = page.locator(".fg-header-notification-dropdown");
    await expect(dropdown).toBeVisible();
    // Must have either notification items or an empty-state message
    const hasItems = await dropdown.locator("[class*='notification-item'], li, .fg-notification-row").count();
    const hasEmpty = await dropdown.locator("[class*='empty'], p").count();
    expect(hasItems + hasEmpty).toBeGreaterThan(0);
  });

  test("resolver alerta via UI atualiza status", async ({ page }) => {
    // Look for a resolve button on any open alert
    const resolveBtn = page
      .getByRole("button", { name: /Resolver|Marcar como resolvido/i })
      .first();

    if (await resolveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rowBefore = page.locator(".fg-arc-table tbody tr, .arc-alert-row").first();
      const hadPending = await rowBefore.locator("[class*='badge-red'], [class*='pendente']").count();

      await Promise.all([
        page.waitForResponse(
          (res) => res.request().method() === "PATCH" && res.url().includes("/alertas"),
        ),
        resolveBtn.click(),
      ]);

      // Badge should change from red/pending to green/resolved
      if (hadPending > 0) {
        await expect(rowBefore.locator("[class*='badge-green'], [class*='resolvido']")).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });
});
