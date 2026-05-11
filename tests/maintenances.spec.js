import { expect, test } from "@playwright/test";
import {
  BASE_URL,
  clearSession,
  createMaintenance,
  createVehicle,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

let credentials;
let seedVehicle;
let seedMaintenance;

test.describe("maintenances", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("maintenances");
    seedVehicle = {
      model: `Maintenance Vehicle ${Date.now()}`,
      plate: `MNT${String(Date.now()).slice(-4)}`,
    };
    seedMaintenance = {
      typeLabel: "Preventiva",
      description: `Manutenção Seed ${Date.now()}`,
      km: 87420,
      cost: 380,
    };

    await clearSession(page);
    await registerUser(page, credentials);
    await page.goto(`${BASE_URL}/#/veiculos`);
    await createVehicle(page, seedVehicle);

    await page.goto(`${BASE_URL}/#/manutencoes`);
    await createMaintenance(page, seedMaintenance, seedVehicle);
  });

  test("listar manutenção", async ({ page }) => {
    const row = page.locator(".fg-maint-table tbody tr", {
      hasText: seedMaintenance.description,
    });

    await expect(row).toBeVisible();
    await expect(row).toContainText(seedMaintenance.description);
    await expect(row).toContainText(seedVehicle.model);
  });

  test("criar manutenção", async ({ page }) => {
    const maintenance = {
      typeLabel: "Corretiva",
      description: `Manutenção Nova ${Date.now()}`,
      km: 90500,
      cost: 1250,
    };

    await createMaintenance(page, maintenance, seedVehicle);

    const row = page.locator(".fg-maint-table tbody tr", {
      hasText: maintenance.description,
    });

    await expect(row).toBeVisible();
    await expect(row).toContainText(maintenance.description);
  });
});
