import { expect, test } from "@playwright/test";
import {
  BASE_URL,
  clearSession,
  loginUser,
  logoutUser,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

let credentials;

test.describe("auth", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("auth");
    await clearSession(page);
    await page.goto(`${BASE_URL}/#/cadastro`);
    await page.waitForLoadState("domcontentloaded");
  });

  test("registro", async ({ page }) => {
    await registerUser(page, credentials);

    const token = await page.evaluate(() =>
      localStorage.getItem("smart-frota-token"),
    );
    expect(token).toBeTruthy();
    await expect(page.locator(".fg-home-user-chip-btn")).toContainText(
      credentials.nome,
    );
  });

  test("login", async ({ page }) => {
    await registerUser(page, credentials);
    await logoutUser(page);
    await loginUser(page, credentials);

    await expect(page.locator(".fg-home-user-chip-btn")).toContainText(
      credentials.nome,
    );
  });

  test("logout", async ({ page }) => {
    await registerUser(page, credentials);
    await logoutUser(page);

    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#senha")).toBeVisible();
  });
});
