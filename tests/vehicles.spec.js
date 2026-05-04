import { expect, test } from "@playwright/test";
import {
  clearSession,
  createVehicle,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

let credentials;
let seedVehicle;

test.describe("vehicles", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("vehicles");
    seedVehicle = {
      model: `Vehicle Seed ${Date.now()}`,
      plate: `VSD${String(Date.now()).slice(-4)}`,
    };

    await clearSession(page);
    await registerUser(page, credentials);
    await page.goto("http://localhost:5173/#/veiculos");
    await createVehicle(page, seedVehicle);
  });

  test("listar veículo", async ({ page }) => {
    const card = page.locator(".fg-vehicle-card", {
      hasText: seedVehicle.model,
    });

    await expect(card).toBeVisible();
    await expect(card).toContainText(seedVehicle.plate);
  });

  test("criar veículo", async ({ page }) => {
    const initialCount = await page.locator(".fg-vehicle-card").count();
    const vehicle = {
      model: `Vehicle New ${Date.now()}`,
      plate: `NEW${String(Date.now()).slice(-4)}`,
    };

    await createVehicle(page, vehicle);

    await expect(page.locator(".fg-vehicle-card")).toHaveCount(
      initialCount + 1,
    );
    await expect(page.locator(".fg-vehicles-grid")).toContainText(
      vehicle.model,
    );
    await expect(page.locator(".fg-vehicles-grid")).toContainText(
      vehicle.plate,
    );
  });
});
