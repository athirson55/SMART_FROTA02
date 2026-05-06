# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> auth >> login
- Location: tests\auth.spec.js:32:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /#\/home/
Received string:  "http://localhost:5173/#/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:5173/#/login"

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - heading "SMART FROTA" [level=1] [ref=e8]
      - paragraph [ref=e9]: SOLUÇÕES EM FROTA
    - paragraph [ref=e10]:
      - text: Acesse o
      - strong [ref=e11]: PORTAL DE GESTÃO
    - generic [ref=e12]:
      - generic [ref=e13]: EMAIL
      - textbox "EMAIL" [ref=e14]:
        - /placeholder: Digite seu e-mail
        - text: auth.3c44393f@example.com
    - generic [ref=e15]:
      - generic [ref=e16]: SENHA
      - textbox "SENHA" [ref=e17]:
        - /placeholder: Digite sua senha
        - text: password123
    - generic [ref=e18]:
      - generic [ref=e19] [cursor=pointer]:
        - checkbox "Manter Conectado" [ref=e20]
        - generic [ref=e21]: Manter Conectado
      - link "Recuperar senha" [ref=e22] [cursor=pointer]:
        - /url: "#/recuperar-senha"
    - button "ENTRAR" [ref=e23] [cursor=pointer]
    - paragraph [ref=e24]:
      - link "Não possui conta? Cadastre-se" [ref=e25] [cursor=pointer]:
        - /url: "#/cadastro"
    - paragraph [ref=e26]: E-mail ou senha incorretos.
```

# Test source

```ts
  1   | import { expect } from "@playwright/test";
  2   | import { randomUUID } from "node:crypto";
  3   | 
  4   | export const BASE_URL = "http://localhost:5173";
  5   | 
  6   | export function makeCredentials(prefix) {
  7   |   const token = randomUUID().slice(0, 8);
  8   |   return {
  9   |     nome: `${prefix} ${token}`,
  10  |     email: `${prefix}.${token}@example.com`,
  11  |     senha: "password123",
  12  |   };
  13  | }
  14  | 
  15  | export async function clearSession(page) {
  16  |   await page.goto(BASE_URL, { waitUntil: "networkidle" });
  17  |   await page.evaluate(() => {
  18  |     localStorage.clear();
  19  |     sessionStorage.clear();
  20  |   });
  21  | }
  22  | 
  23  | export async function registerUser(page, credentials) {
  24  |   await page.goto(`${BASE_URL}/#/cadastro`, { waitUntil: "networkidle" });
  25  |   await page.locator("#nome").waitFor({ state: "visible", timeout: 20000 });
  26  |   await page.locator("#nome").fill(credentials.nome);
  27  |   await page.locator("#email").fill(credentials.email);
  28  |   await page.locator("#senha").fill(credentials.senha);
  29  |   await page.locator("#confirmar").fill(credentials.senha);
  30  |   await page.getByRole("button", { name: "CADASTRAR" }).click();
  31  |   await expect(page).toHaveURL(/#\/home/);
  32  |   await expect(
  33  |     page
  34  |       .getByRole("heading", { level: 2 })
  35  |       .filter({ hasText: credentials.nome })
  36  |       .first(),
  37  |   ).toBeVisible();
  38  | }
  39  | 
  40  | export async function loginUser(page, credentials) {
  41  |   await page.goto(`${BASE_URL}/#/login`, { waitUntil: "networkidle" });
  42  |   await page.locator("#email").waitFor({ state: "visible", timeout: 20000 });
  43  |   await page.locator("#email").fill(credentials.email);
  44  |   await page.locator("#senha").fill(credentials.senha);
  45  |   await page.getByRole("button", { name: "ENTRAR" }).click();
> 46  |   await expect(page).toHaveURL(/#\/home/);
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  47  | }
  48  | 
  49  | export async function logoutUser(page) {
  50  |   await page.locator(".fg-home-user-chip-btn").click();
  51  |   await page.locator(".fg-header-dropdown-item.is-danger").click();
  52  |   await expect(page).toHaveURL(/#\/login/);
  53  | }
  54  | 
  55  | export async function openNotifications(page) {
  56  |   await page.getByLabel("Notificações").click();
  57  |   await expect(page.locator(".fg-header-notification-dropdown")).toBeVisible();
  58  | }
  59  | 
  60  | export async function createDriver(page, driver) {
  61  |   await page.getByRole("button", { name: "Adicionar Motorista" }).click();
  62  |   const form = page.locator("#form-motorista");
  63  |   await form.getByPlaceholder("Ex: João Silva").fill(driver.name);
  64  |   await form.locator('input[type="email"]').fill(driver.email);
  65  |   await form.getByPlaceholder("+55 11 99999-0000").fill(driver.phone);
  66  |   await form.getByPlaceholder("Ex: Motorista Sênior").fill(driver.role);
  67  |   await form.getByPlaceholder("Ex: 05498233411").fill(driver.cnh);
  68  |   await page.locator('button[type="submit"][form="form-motorista"]').click();
  69  |   await expect(page.locator(".fg-drivers-table")).toContainText(driver.email);
  70  | }
  71  | 
  72  | export async function createVehicle(page, vehicle) {
  73  |   await page.getByRole("button", { name: "Cadastrar Veículo" }).click();
  74  |   const form = page.locator("#form-veiculo");
  75  |   await form.getByPlaceholder("Ex: Volvo FH 460").fill(vehicle.model);
  76  |   await form.getByPlaceholder("Ex: ABC1D23").fill(vehicle.plate);
  77  |   await Promise.all([
  78  |     page.waitForResponse(
  79  |       (response) =>
  80  |         response.request().method() === "POST" &&
  81  |         response.url().includes("/veiculos"),
  82  |     ),
  83  |     page.locator('button[type="submit"][form="form-veiculo"]').click(),
  84  |   ]);
  85  |   const card = page.locator(".fg-vehicle-card", { hasText: vehicle.model });
  86  |   await expect(card).toBeVisible({ timeout: 15000 });
  87  |   await expect(card).toContainText(vehicle.plate);
  88  | }
  89  | 
  90  | export async function createMaintenance(page, maintenance, vehicle) {
  91  |   await page.getByRole("button", { name: "Nova Manutenção" }).click();
  92  |   const form = page.locator("#form-manutencao");
  93  |   await form
  94  |     .getByRole("combobox")
  95  |     .first()
  96  |     .selectOption({ label: `${vehicle.model} — ${vehicle.plate}` });
  97  |   await form
  98  |     .getByRole("combobox")
  99  |     .nth(1)
  100 |     .selectOption({ label: maintenance.typeLabel });
  101 |   await form
  102 |     .getByPlaceholder("Descreva o serviço a ser realizado…")
  103 |     .fill(maintenance.description);
  104 |   await form.getByPlaceholder("Ex: 87420").fill(String(maintenance.km));
  105 |   await form.getByPlaceholder("Ex: 380.00").fill(String(maintenance.cost));
  106 |   await Promise.all([
  107 |     page.waitForResponse(
  108 |       (response) =>
  109 |         response.request().method() === "POST" &&
  110 |         response.url().includes("/manutencoes"),
  111 |     ),
  112 |     page.locator('button[type="submit"][form="form-manutencao"]').click(),
  113 |   ]);
  114 |   await page
  115 |     .getByPlaceholder("Buscar veículo, tipo ou descrição")
  116 |     .fill(maintenance.description);
  117 |   const row = page.locator(".fg-maint-table tbody tr", {
  118 |     hasText: maintenance.description,
  119 |   });
  120 |   await expect(row).toBeVisible({ timeout: 15000 });
  121 |   await expect(row).toContainText(maintenance.description);
  122 | }
  123 | 
  124 | export async function createAppointment(page, appointment, vehicle) {
  125 |   await page.locator(".fg-appt-page-top .fg-home-new-btn").click();
  126 |   const form = page.locator("#form-agendamento");
  127 |   await form
  128 |     .getByRole("combobox")
  129 |     .first()
  130 |     .selectOption({ label: `${vehicle.model} — ${vehicle.plate}` });
  131 |   await form
  132 |     .getByRole("combobox")
  133 |     .nth(1)
  134 |     .selectOption({ label: appointment.type });
  135 |   await form.getByPlaceholder("Ex: 95000").fill(String(appointment.km));
  136 |   await form.getByPlaceholder("Ex: Auto Center VH").fill(appointment.local);
  137 |   await form.getByPlaceholder("Ex: Dep. Técnico").fill(appointment.responsavel);
  138 |   await Promise.all([
  139 |     page.waitForResponse(
  140 |       (response) =>
  141 |         response.request().method() === "POST" &&
  142 |         response.url().includes("/agendamentos"),
  143 |     ),
  144 |     page.locator('button[type="submit"][form="form-agendamento"]').click(),
  145 |   ]);
  146 |   await page
```