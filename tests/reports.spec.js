import { expect, test } from "@playwright/test";
import path from "node:path";
import {
  BASE_URL,
  clearSession,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

let credentials;

test.describe("reports", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("reports");
    await clearSession(page);
    await registerUser(page, credentials);
    await page.goto(`${BASE_URL}/#/relatorios`, { waitUntil: "networkidle" });
  });

  test("página carrega com spinner e depois exibe conteúdo", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/#/relatorios`);
    // The loading spinner may appear and disappear quickly; verify the page eventually
    // shows the real content wrapper
    await expect(
      page.locator(".fg-reports-page, .fg-home-content"),
    ).toBeVisible({ timeout: 20000 });
    // After data loads, at minimum the KPI strip should be visible (or empty state)
    await expect(
      page.locator(".kpi-strip, .insight-card, .reports-loading").first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("filtro de período dispara novo fetch", async ({ page }) => {
    await expect(page.locator(".filter-select").first()).toBeVisible({
      timeout: 15000,
    });
    const periodSelect = page.locator(".filter-select").first();

    // Intercept the API call that follows the period change
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/relatorios/completo") &&
        res.request().method() === "GET",
      { timeout: 15000 },
    );
    await periodSelect.selectOption("90");
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test("filtro por veículo dispara novo fetch", async ({ page }) => {
    await expect(page.locator(".filter-select").nth(1)).toBeVisible({
      timeout: 15000,
    });
    const vehicleSelect = page.locator(".filter-select").nth(1);
    const options = await vehicleSelect.locator("option").all();
    if (options.length > 1) {
      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/relatorios/completo") &&
          res.request().method() === "GET",
        { timeout: 15000 },
      );
      await vehicleSelect.selectOption({ index: 1 });
      const response = await responsePromise;
      expect(response.status()).toBe(200);
    }
  });

  test("botão Limpar reseta filtros", async ({ page }) => {
    await expect(page.locator(".filter-select").first()).toBeVisible({
      timeout: 15000,
    });
    await page.locator(".filter-select").first().selectOption("90");
    await page.getByRole("button", { name: "Limpar" }).click();
    await expect(page.locator(".filter-select").first()).toHaveValue("30");
  });

  test("KPIs e gráficos estão visíveis após carregamento", async ({ page }) => {
    await expect(page.locator(".kpi-strip")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".kpi-card").first()).toBeVisible();
    // At least one chart card rendered
    await expect(page.locator(".chart-card").first()).toBeVisible();
  });

  test("tabela de veículos renderiza ou exibe estado vazio", async ({
    page,
  }) => {
    await expect(page.locator(".table-card, .chart-empty").first()).toBeVisible(
      { timeout: 20000 },
    );
  });

  test("exportar CSV: botão inicia download ou mostra toast de erro", async ({
    page,
  }) => {
    await expect(page.locator(".export-btn").first()).toBeVisible({
      timeout: 20000,
    });

    // Watch for a download event OR a toast message
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 8000 }).catch(() => null),
      page.locator(".export-btn").first().click(),
    ]);

    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    } else {
      // No download because there's no data — toast should appear
      await expect(page.locator(".reports-toast.show")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("exportar Excel: botão verde dispara requisição ao backend", async ({
    page,
  }) => {
    await expect(page.locator(".export-btn-excel")).toBeVisible({
      timeout: 20000,
    });

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
      page.locator(".export-btn-excel").click(),
    ]);

    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.xlsx$/i);
      expect(filename.toLowerCase()).toContain("smart-frota");
    } else {
      // Backend responded but browser did not open download dialog — still check
      // the toast feedback
      await expect(page.locator(".reports-toast.show")).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("botão Excel desabilitado durante exportação", async ({ page }) => {
    await expect(page.locator(".export-btn-excel")).toBeVisible({
      timeout: 20000,
    });
    // Simulate slow network to catch disabled state
    await page.route(
      "**/relatorios/exportar-excel**",
      (route) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(route.continue()), 800),
        ),
    );
    await page.locator(".export-btn-excel").click();
    await expect(page.locator(".export-btn-excel")).toBeDisabled({
      timeout: 3000,
    });
    await page.unroute("**/relatorios/exportar-excel**");
  });
});
