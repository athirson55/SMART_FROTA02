# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> auth >> login
- Location: tests\auth.spec.js:33:3

# Error details

```
TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('#nome') to be visible

```

# Test source

```ts
  1   | import { expect } from "@playwright/test";
  2   | import { randomUUID } from "node:crypto";
  3   | 
  4   | export const BASE_URL =
  5   |   process.env.E2E_BASE_URL || process.env.BASE_URL || "http://localhost:5173";
  6   | 
  7   | export function makeCredentials(prefix) {
  8   |   const token = randomUUID().slice(0, 8);
  9   |   return {
  10  |     nome: `${prefix} ${token}`,
  11  |     email: `${prefix}.${token}@example.com`,
  12  |     senha: "SmartFrota@123",
  13  |   };
  14  | }
  15  | 
  16  | export async function clearSession(page) {
  17  |   await page.goto(BASE_URL, { waitUntil: "commit" });
  18  |   await page.evaluate(() => {
  19  |     localStorage.clear();
  20  |     sessionStorage.clear();
  21  |   });
  22  |   await page.goto(`${BASE_URL}/#/login`, { waitUntil: "networkidle" });
  23  | }
  24  | 
  25  | export async function registerUser(page, credentials) {
  26  |   await page.goto(`${BASE_URL}/#/cadastro`, { waitUntil: "networkidle" });
> 27  |   await page.locator("#nome").waitFor({ state: "visible", timeout: 20000 });
      |                               ^ TimeoutError: locator.waitFor: Timeout 20000ms exceeded.
  28  |   await page.locator("#nome").fill(credentials.nome);
  29  |   await page.locator("#email").fill(credentials.email);
  30  |   await page.locator("#senha").fill(credentials.senha);
  31  |   await page.locator("#confirmar").fill(credentials.senha);
  32  |   const registerResponsePromise = page.waitForResponse(
  33  |     (response) =>
  34  |       response.request().method() === "POST" &&
  35  |       response.url().includes("/auth/registrar"),
  36  |   );
  37  |   await page.getByRole("button", { name: "CADASTRAR" }).click();
  38  |   const registerResponse = await registerResponsePromise;
  39  |   const registerData = await registerResponse.json();
  40  |   const debugToken = registerData?.data?.debugVerificationToken;
  41  | 
  42  |   if (debugToken) {
  43  |     await page.goto(
  44  |       `${BASE_URL}/#/verificar-email?token=${encodeURIComponent(debugToken)}&email=${encodeURIComponent(credentials.email)}`,
  45  |       { waitUntil: "networkidle" },
  46  |     );
  47  |     await page.waitForURL(/#\/home/, { timeout: 15000 });
  48  | 
  49  |     await expect(page).toHaveURL(/#\/home/);
  50  |     await expect(page.locator(".fg-home-user-chip-btn")).toContainText(
  51  |       credentials.nome,
  52  |     );
  53  |     return;
  54  |   }
  55  | 
  56  |   await expect(page).toHaveURL(/#\/email-enviado/);
  57  | }
  58  | 
  59  | export async function loginUser(page, credentials) {
  60  |   await page.goto(`${BASE_URL}/#/login`, { waitUntil: "networkidle" });
  61  |   await page.locator("#email").waitFor({ state: "visible", timeout: 20000 });
  62  |   await page.locator("#email").fill(credentials.email);
  63  |   await page.locator("#senha").fill(credentials.senha);
  64  |   await page.getByRole("button", { name: "ENTRAR" }).click();
  65  |   await expect(page).toHaveURL(/#\/home/);
  66  | }
  67  | 
  68  | export async function logoutUser(page) {
  69  |   await page.locator(".fg-home-user-chip-btn").click();
  70  |   await page.locator(".fg-header-dropdown-item.is-danger").click();
  71  |   await expect(page).toHaveURL(/#\/login/);
  72  | }
  73  | 
  74  | export async function openNotifications(page) {
  75  |   await page.getByLabel("Notificações").click();
  76  |   await expect(page.locator(".fg-header-notification-dropdown")).toBeVisible();
  77  | }
  78  | 
  79  | export async function createDriver(page, driver) {
  80  |   await page.getByRole("button", { name: "Adicionar Motorista" }).click();
  81  |   const form = page.locator("#form-motorista");
  82  |   await form.getByPlaceholder("Ex: João Silva").fill(driver.name);
  83  |   await form.locator('input[type="email"]').fill(driver.email);
  84  |   await form.getByPlaceholder("+55 11 99999-0000").fill(driver.phone);
  85  |   await form.getByPlaceholder("Ex: Motorista Sênior").fill(driver.role);
  86  |   await form.getByPlaceholder("Ex: 05498233411").fill(driver.cnh);
  87  |   await page.locator('button[type="submit"][form="form-motorista"]').click();
  88  |   await expect(page.locator(".fg-drivers-table")).toContainText(driver.email);
  89  | }
  90  | 
  91  | export async function createVehicle(page, vehicle) {
  92  |   await page.getByRole("button", { name: "Cadastrar Veículo" }).click();
  93  |   const form = page.locator("#form-veiculo");
  94  |   await form.getByPlaceholder("Ex: Volvo FH 460").fill(vehicle.model);
  95  |   await form.getByPlaceholder("Ex: ABC1D23").fill(vehicle.plate);
  96  |   await Promise.all([
  97  |     page.waitForResponse(
  98  |       (response) =>
  99  |         response.request().method() === "POST" &&
  100 |         response.url().includes("/veiculos"),
  101 |     ),
  102 |     page.locator('button[type="submit"][form="form-veiculo"]').click(),
  103 |   ]);
  104 |   const card = page.locator(".fg-vehicle-card", { hasText: vehicle.model });
  105 |   await expect(card).toBeVisible({ timeout: 15000 });
  106 |   await expect(card).toContainText(vehicle.plate);
  107 | }
  108 | 
  109 | export async function createMaintenance(page, maintenance, vehicle) {
  110 |   await page.getByRole("button", { name: "Nova Manutenção" }).click();
  111 |   const form = page.locator("#form-manutencao");
  112 |   await form
  113 |     .getByRole("combobox")
  114 |     .first()
  115 |     .selectOption({ label: `${vehicle.model} — ${vehicle.plate}` });
  116 |   await form
  117 |     .getByRole("combobox")
  118 |     .nth(1)
  119 |     .selectOption({ label: maintenance.typeLabel });
  120 |   await form
  121 |     .getByPlaceholder("Descreva o serviço a ser realizado…")
  122 |     .fill(maintenance.description);
  123 |   await form.getByPlaceholder("Ex: 87420").fill(String(maintenance.km));
  124 |   await form.getByPlaceholder("Ex: 380.00").fill(String(maintenance.cost));
  125 |   await Promise.all([
  126 |     page.waitForResponse(
  127 |       (response) =>
```