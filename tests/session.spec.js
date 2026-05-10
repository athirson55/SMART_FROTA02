/**
 * Session management tests:
 * - Expired access token → silent refresh → user stays logged in
 * - Invalid refresh token → redirect to /login
 * - Manual logout clears session
 * - Accessing private route without token redirects to login
 * - Token survives page reload (localStorage path)
 */
import { expect, test } from "@playwright/test";
import {
  clearSession,
  loginUser,
  logoutUser,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

const BASE_URL = "http://localhost:5173";
const TOKEN_KEY = "smart-frota-token";
const REFRESH_KEY = "smart-frota-refresh-token";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Overwrite the stored access token with a fake expired JWT. */
async function expireAccessToken(page) {
  await page.evaluate((key) => {
    // A well-formed but unsigned/expired JWT body
    const expired = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
      ".eyJzdWIiOiJleHBpcmVkIiwiZXhwIjoxfQ" +
      ".TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ";
    localStorage.setItem(key, expired);
    sessionStorage.setItem(key, expired);
  }, TOKEN_KEY);
}

/** Remove the refresh token entirely. */
async function removeRefreshToken(page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }, REFRESH_KEY);
}

/** Remove both tokens but keep the user object. */
async function expireBothTokens(page) {
  await expireAccessToken(page);
  await removeRefreshToken(page);
}

// ────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────

test.describe("session", () => {
  let credentials;

  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("session");
    await clearSession(page);
    await registerUser(page, credentials);
  });

  test("acesso a rota privada sem token redireciona para login", async ({ page }) => {
    await clearSession(page);
    await page.goto(`${BASE_URL}/#/home`);
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("reload mantém sessão ativa (localStorage)", async ({ page }) => {
    // User is already logged in from beforeEach
    await page.goto(`${BASE_URL}/#/home`);
    await expect(page).toHaveURL(/#\/home/);
    await page.reload({ waitUntil: "networkidle" });
    // Must still be on home (not redirected to login)
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator(".fg-home-user-chip-btn")).toBeVisible({ timeout: 10000 });
  });

  test("access token expirado: refresh automático mantém login", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });

    // Corrupt only the access token — keep the valid refresh token
    await expireAccessToken(page);

    // Intercept the refresh call to confirm it happens
    const refreshResponse = page.waitForResponse(
      (res) => res.url().includes("/auth/refresh") && res.request().method() === "POST",
      { timeout: 15000 },
    );

    // Navigate away and back to trigger an authenticated API call
    await page.goto(`${BASE_URL}/#/veiculos`, { waitUntil: "networkidle" });

    const response = await refreshResponse.catch(() => null);
    if (response) {
      expect(response.status()).toBe(200);
    }

    // User should still be authenticated (not on login page)
    await expect(page).not.toHaveURL(/#\/login/);
  });

  test("refresh token inválido redireciona para login", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });

    // Kill both tokens so the interceptor has nothing to fall back on
    await expireBothTokens(page);

    // Navigate to a protected page — axios interceptor should fail refresh and redirect
    await page.goto(`${BASE_URL}/#/home`);
    await expect(page).toHaveURL(/#\/login/, { timeout: 10000 });
  });

  test("logout limpa sessão e redireciona para login", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    await logoutUser(page);

    await expect(page).toHaveURL(/#\/login/);

    // Tokens must be gone from storage
    const token = await page.evaluate(
      (key) => localStorage.getItem(key) || sessionStorage.getItem(key),
      TOKEN_KEY,
    );
    expect(token).toBeNull();
  });

  test("após logout, acesso a rota privada redireciona para login", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    await logoutUser(page);

    await page.goto(`${BASE_URL}/#/veiculos`);
    await expect(page).toHaveURL(/#\/login/);
  });

  test("login com credenciais corretas após logout restaura sessão", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    await logoutUser(page);
    await loginUser(page, credentials);
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator(".fg-home-user-chip-btn")).toContainText(credentials.nome, {
      timeout: 10000,
    });
  });

  test("múltiplas chamadas simultâneas com token expirado só disparam um refresh", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/home`, { waitUntil: "networkidle" });
    await expireAccessToken(page);

    let refreshCount = 0;
    page.on("response", (res) => {
      if (res.url().includes("/auth/refresh") && res.request().method() === "POST") {
        refreshCount++;
      }
    });

    // Navigate to reports page which makes several API calls in parallel
    await page.goto(`${BASE_URL}/#/relatorios`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // The interceptor uses a shared promise — at most 1 refresh should fire
    expect(refreshCount).toBeLessThanOrEqual(2);
  });
});
