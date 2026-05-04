import { expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

export const BASE_URL = "http://localhost:5173";

export function makeCredentials(prefix) {
  const token = randomUUID().slice(0, 8);
  return {
    nome: `${prefix} ${token}`,
    email: `${prefix}.${token}@example.com`,
    senha: "password123",
  };
}

export async function clearSession(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function registerUser(page, credentials) {
  await page.goto(`${BASE_URL}/#/cadastro`, { waitUntil: "networkidle" });
  await page.locator("#nome").waitFor({ state: "visible", timeout: 20000 });
  await page.locator("#nome").fill(credentials.nome);
  await page.locator("#email").fill(credentials.email);
  await page.locator("#senha").fill(credentials.senha);
  await page.locator("#confirmar").fill(credentials.senha);
  await page.getByRole("button", { name: "CADASTRAR" }).click();
  await expect(page).toHaveURL(/#\/home/);
  await expect(
    page
      .getByRole("heading", { level: 2 })
      .filter({ hasText: credentials.nome })
      .first(),
  ).toBeVisible();
}

export async function loginUser(page, credentials) {
  await page.goto(`${BASE_URL}/#/login`, { waitUntil: "networkidle" });
  await page.locator("#email").waitFor({ state: "visible", timeout: 20000 });
  await page.locator("#email").fill(credentials.email);
  await page.locator("#senha").fill(credentials.senha);
  await page.getByRole("button", { name: "ENTRAR" }).click();
  await expect(page).toHaveURL(/#\/home/);
}

export async function logoutUser(page) {
  await page.locator(".fg-home-user-chip-btn").click();
  await page.locator(".fg-header-dropdown-item.is-danger").click();
  await expect(page).toHaveURL(/#\/login/);
}

export async function openNotifications(page) {
  await page.getByLabel("Notificações").click();
  await expect(page.locator(".fg-header-notification-dropdown")).toBeVisible();
}

export async function createDriver(page, driver) {
  await page.getByRole("button", { name: "Adicionar Motorista" }).click();
  const form = page.locator("#form-motorista");
  await form.getByPlaceholder("Ex: João Silva").fill(driver.name);
  await form.locator('input[type="email"]').fill(driver.email);
  await form.getByPlaceholder("+55 11 99999-0000").fill(driver.phone);
  await form.getByPlaceholder("Ex: Motorista Sênior").fill(driver.role);
  await form.getByPlaceholder("Ex: 05498233411").fill(driver.cnh);
  await page.locator('button[type="submit"][form="form-motorista"]').click();
  await expect(page.locator(".fg-drivers-table")).toContainText(driver.email);
}

export async function createVehicle(page, vehicle) {
  await page.getByRole("button", { name: "Cadastrar Veículo" }).click();
  const form = page.locator("#form-veiculo");
  await form.getByPlaceholder("Ex: Volvo FH 460").fill(vehicle.model);
  await form.getByPlaceholder("Ex: ABC1D23").fill(vehicle.plate);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/veiculos"),
    ),
    page.locator('button[type="submit"][form="form-veiculo"]').click(),
  ]);
  const card = page.locator(".fg-vehicle-card", { hasText: vehicle.model });
  await expect(card).toBeVisible({ timeout: 15000 });
  await expect(card).toContainText(vehicle.plate);
}

export async function createMaintenance(page, maintenance, vehicle) {
  await page.getByRole("button", { name: "Nova Manutenção" }).click();
  const form = page.locator("#form-manutencao");
  await form
    .getByRole("combobox")
    .first()
    .selectOption({ label: `${vehicle.model} — ${vehicle.plate}` });
  await form
    .getByRole("combobox")
    .nth(1)
    .selectOption({ label: maintenance.typeLabel });
  await form
    .getByPlaceholder("Descreva o serviço a ser realizado…")
    .fill(maintenance.description);
  await form.getByPlaceholder("Ex: 87420").fill(String(maintenance.km));
  await form.getByPlaceholder("Ex: 380.00").fill(String(maintenance.cost));
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/manutencoes"),
    ),
    page.locator('button[type="submit"][form="form-manutencao"]').click(),
  ]);
  await page
    .getByPlaceholder("Buscar veículo, tipo ou descrição")
    .fill(maintenance.description);
  const row = page.locator(".fg-maint-table tbody tr", {
    hasText: maintenance.description,
  });
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText(maintenance.description);
}

export async function createAppointment(page, appointment, vehicle) {
  await page.locator(".fg-appt-page-top .fg-home-new-btn").click();
  const form = page.locator("#form-agendamento");
  await form
    .getByRole("combobox")
    .first()
    .selectOption({ label: `${vehicle.model} — ${vehicle.plate}` });
  await form
    .getByRole("combobox")
    .nth(1)
    .selectOption({ label: appointment.type });
  await form.getByPlaceholder("Ex: 95000").fill(String(appointment.km));
  await form.getByPlaceholder("Ex: Auto Center VH").fill(appointment.local);
  await form.getByPlaceholder("Ex: Dep. Técnico").fill(appointment.responsavel);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/agendamentos"),
    ),
    page.locator('button[type="submit"][form="form-agendamento"]').click(),
  ]);
  await page
    .getByPlaceholder("Buscar veiculo, placa, tipo ou responsavel")
    .fill(appointment.responsavel);
  const row = page.locator(".fg-appt-table tbody tr", {
    hasText: appointment.responsavel,
  });
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText(appointment.responsavel);
}
