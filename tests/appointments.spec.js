import { expect, test } from "@playwright/test";
import {
  clearSession,
  createAppointment,
  createVehicle,
  makeCredentials,
  registerUser,
} from "./smoke-helpers.js";

let credentials;
let seedVehicle;
let seedAppointment;

test.describe("appointments", () => {
  test.beforeEach(async ({ page }) => {
    credentials = makeCredentials("appointments");
    seedVehicle = {
      model: `Appointment Vehicle ${Date.now()}`,
      plate: `APT${String(Date.now()).slice(-4)}`,
    };
    seedAppointment = {
      type: "Troca de óleo",
      km: 95000,
      local: `Auto Center ${Date.now()}`,
      responsavel: `Dep. Técnico ${Date.now()}`,
    };

    await clearSession(page);
    await registerUser(page, credentials);
    await page.goto("http://localhost:5173/#/veiculos");
    await createVehicle(page, seedVehicle);

    await page.goto("http://localhost:5173/#/agendamentos");
    await createAppointment(page, seedAppointment, seedVehicle);
  });

  test("listar agendamento", async ({ page }) => {
    const row = page.locator(".fg-appt-table tbody tr", {
      hasText: seedAppointment.responsavel,
    });

    await expect(row).toBeVisible();
    await expect(row).toContainText(seedAppointment.responsavel);
    await expect(row).toContainText(seedVehicle.model);
  });

  test("criar agendamento", async ({ page }) => {
    const appointment = {
      type: "Revisão geral",
      km: 98000,
      local: `Oficina Central ${Date.now()}`,
      responsavel: `Equipe de Manutenção ${Date.now()}`,
    };

    await createAppointment(page, appointment, seedVehicle);

    const row = page.locator(".fg-appt-table tbody tr", {
      hasText: appointment.responsavel,
    });
    await expect(row).toBeVisible();
    await expect(row).toContainText(seedVehicle.model);
  });
});
