import { expect, test } from "@playwright/test";
import {
  BASE_URL,
  clearSession,
  createDriver,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

let credentials;
let seedDriver;

test.describe("drivers", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("drivers");
    seedDriver = {
      name: `Driver Seed ${Date.now()}`,
      email: `seed-driver+${Date.now()}@example.com`,
      phone: "+55 11 99999-0000",
      role: "Motorista Teste",
      cnh: String(Date.now()).slice(-10),
    };

    await clearSession(page);
    await registerUser(page, credentials);
    await page.goto(`${BASE_URL}/#/motoristas`);
    await createDriver(page, seedDriver);
  });

  test("listar motorista", async ({ page }) => {
    const row = page.locator(".fg-drivers-table tbody tr", {
      hasText: seedDriver.email,
    });

    await expect(row).toBeVisible();
    await expect(row).toContainText(seedDriver.name);
    await expect(row).toContainText(seedDriver.email);
  });

  test("criar motorista", async ({ page }) => {
    const initialCount = await page
      .locator(".fg-drivers-table tbody tr")
      .count();
    const driver = {
      name: `Driver New ${Date.now()}`,
      email: `new-driver+${Date.now()}@example.com`,
      phone: "+55 11 98888-0000",
      role: "Motorista Sênior",
      cnh: String(Date.now() + 1).slice(-10),
    };

    await createDriver(page, driver);

    await expect(page.locator(".fg-drivers-table tbody tr")).toHaveCount(
      initialCount + 1,
    );
    const row = page.locator(".fg-drivers-table tbody tr", {
      hasText: driver.email,
    });
    await expect(row).toBeVisible();
    await expect(row).toContainText(driver.name);
  });

  test("remover motorista", async ({ page }) => {
    const initialCount = await page
      .locator(".fg-drivers-table tbody tr")
      .count();
    const row = page.locator(".fg-drivers-table tbody tr", {
      hasText: seedDriver.email,
    });

    await expect(row).toBeVisible();
    await row
      .getByRole("button", { name: `Remover ${seedDriver.name}` })
      .click();

    await expect(page.locator(".fg-drivers-table tbody tr")).toHaveCount(
      initialCount - 1,
    );
    await expect(page.locator(".fg-drivers-table")).not.toContainText(
      seedDriver.email,
    );
  });
});
