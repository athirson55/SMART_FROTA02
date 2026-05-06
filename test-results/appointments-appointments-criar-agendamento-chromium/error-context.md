# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: appointments.spec.js >> appointments >> criar agendamento
- Location: tests\appointments.spec.js:47:3

# Error details

```
TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - complementary [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7] [cursor=pointer]:
          - img [ref=e9]
          - generic [ref=e14]: Smart Frota
        - navigation [ref=e15]:
          - link "Home" [ref=e16] [cursor=pointer]:
            - /url: "#/home"
            - img [ref=e18]
            - generic [ref=e21]: Home
          - link "Dashboard" [ref=e22] [cursor=pointer]:
            - /url: "#/dashboard"
            - img [ref=e24]
            - generic [ref=e29]: Dashboard
          - link "Veículos" [ref=e30] [cursor=pointer]:
            - /url: "#/veiculos"
            - img [ref=e32]
            - generic [ref=e37]: Veículos
          - link "Motoristas" [ref=e38] [cursor=pointer]:
            - /url: "#/motoristas"
            - img [ref=e40]
            - generic [ref=e45]: Motoristas
          - link "Manutenções" [ref=e46] [cursor=pointer]:
            - /url: "#/manutencoes"
            - img [ref=e48]
            - generic [ref=e50]: Manutenções
          - link "Agendamentos" [ref=e51] [cursor=pointer]:
            - /url: "#/agendamentos"
            - img [ref=e53]
            - generic [ref=e56]: Agendamentos
          - link "Alertas" [ref=e57] [cursor=pointer]:
            - /url: "#/alertas"
            - img [ref=e59]
            - generic [ref=e62]: Alertas
          - link "Relatórios" [ref=e63] [cursor=pointer]:
            - /url: "#/relatorios"
            - img [ref=e65]
            - generic [ref=e67]: Relatórios
          - link "Configurações" [ref=e68] [cursor=pointer]:
            - /url: "#/configuracoes"
            - img [ref=e70]
            - generic [ref=e73]: Configurações
      - button "Sair" [ref=e74] [cursor=pointer]:
        - img [ref=e76]
        - generic [ref=e79]: Sair
    - generic [ref=e80]:
      - generic [ref=e81]:
        - generic [ref=e83]:
          - generic [ref=e84]:
            - textbox "Pesquisar" [ref=e85]:
              - /placeholder: Buscar por veículo, placa, motorista ou ID...
            - button "Pesquisar" [ref=e86] [cursor=pointer]:
              - img [ref=e87]
          - button "Filtros" [ref=e90] [cursor=pointer]:
            - img [ref=e91]
        - generic [ref=e93]:
          - button "+ Novo Pedido" [ref=e94] [cursor=pointer]:
            - generic [ref=e95]: +
            - text: Novo Pedido
          - button "Notificações" [ref=e97] [cursor=pointer]:
            - img [ref=e98]
            - generic [ref=e101]: "3"
          - button "Perfil" [ref=e103] [cursor=pointer]:
            - generic [ref=e104]:
              - generic [ref=e105]: A5
              - generic [ref=e106]:
                - strong [ref=e107]: appointments 531abe65
                - paragraph [ref=e108]: Perfil
      - generic [ref=e109]:
        - generic [ref=e110]:
          - generic [ref=e111]:
            - heading "Todos os Veículos - 0 encontrados" [level=3] [ref=e112]:
              - text: Todos os Veículos
              - generic [ref=e113]: "- 0 encontrados"
            - generic [ref=e114]:
              - generic [ref=e115]:
                - button "Visualização em grade" [ref=e116] [cursor=pointer]:
                  - img [ref=e117]
                - button "Visualização em lista" [ref=e122] [cursor=pointer]:
                  - img [ref=e123]
              - button "+ Cadastrar Veículo" [ref=e125] [cursor=pointer]:
                - generic [ref=e126]: +
                - text: Cadastrar Veículo
          - generic [ref=e127]:
            - generic [ref=e128]:
              - generic:
                - img
              - textbox "Buscar veículo, placa ou motorista" [ref=e129]
            - button "Agendar manutenção" [ref=e130] [cursor=pointer]
          - tablist "Filtros de veículos" [ref=e131]:
            - tab "Todos 0" [selected] [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: Todos
              - emphasis [ref=e134]: "0"
            - tab "Ativos 0" [ref=e135] [cursor=pointer]:
              - generic [ref=e136]: Ativos
              - emphasis [ref=e137]: "0"
            - tab "Com Pendências 0" [ref=e138] [cursor=pointer]:
              - generic [ref=e139]: Com Pendências
              - emphasis [ref=e140]: "0"
            - tab "Em Manutenção 0" [ref=e141] [cursor=pointer]:
              - generic [ref=e142]: Em Manutenção
              - emphasis [ref=e143]: "0"
            - tab "Disponíveis 0" [ref=e144] [cursor=pointer]:
              - generic [ref=e145]: Disponíveis
              - emphasis [ref=e146]: "0"
        - status [ref=e148]:
          - strong [ref=e149]: Nenhum veículo cadastrado
          - paragraph [ref=e150]: Ajuste os filtros ou adicione um novo veículo para começar.
          - button "Adicionar veículo" [ref=e151] [cursor=pointer]
      - dialog "Cadastro de Veículo" [ref=e152]:
        - generic [ref=e153]:
          - generic [ref=e154]:
            - heading "Cadastro de Veículo" [level=2] [ref=e155]
            - button "Fechar modal" [ref=e156] [cursor=pointer]: ✕
          - generic [ref=e159]:
            - generic [ref=e160]: Dados do veículo
            - generic [ref=e161]:
              - generic [ref=e162]: Modelo *
              - 'textbox "Ex: Volvo FH 460" [ref=e163]': Appointment Vehicle 1778061929050
            - generic [ref=e164]:
              - generic [ref=e165]: Marca
              - 'textbox "Ex: Volvo" [ref=e166]'
            - generic [ref=e167]:
              - generic [ref=e168]: Placa *
              - 'textbox "Ex: ABC1D23" [ref=e169]': APT9050
              - generic [ref=e170]: Sem traço ou espaço
            - generic [ref=e171]:
              - generic [ref=e172]: Ano
              - spinbutton [ref=e173]: "2026"
            - generic [ref=e174]:
              - generic [ref=e175]: Status
              - combobox [ref=e176] [cursor=pointer]:
                - option "Ativo" [selected]
                - option "Em manutenção"
                - option "Inativo"
            - generic [ref=e177]:
              - generic [ref=e178]: Combustível
              - combobox [ref=e179] [cursor=pointer]:
                - option "Diesel" [selected]
                - option "Gasolina"
                - option "Etanol"
                - option "Flex"
                - option "Elétrico"
                - option "GNV"
            - generic [ref=e180]:
              - generic [ref=e181]: KM atual
              - spinbutton [ref=e182]
            - generic [ref=e183]:
              - generic [ref=e184]: Chassi
              - textbox "Número do chassi" [ref=e185]
            - generic [ref=e186]:
              - generic [ref=e187]: Motorista responsável
              - combobox [ref=e188] [cursor=pointer]:
                - option "Sem motorista" [selected]
            - generic [ref=e189]: Datas de vencimento
            - generic [ref=e190]:
              - generic [ref=e191]: Vencimento do CRLV
              - textbox [ref=e192]
            - generic [ref=e193]:
              - generic [ref=e194]: Vencimento do seguro
              - textbox [ref=e195]
            - generic [ref=e196]: Próxima revisão
            - generic [ref=e197]:
              - generic [ref=e198]: Por KM
              - spinbutton [ref=e199]
            - generic [ref=e200]:
              - generic [ref=e201]: Por data
              - textbox [ref=e202]
          - generic [ref=e203]:
            - button "Cancelar" [ref=e204] [cursor=pointer]
            - button "Cadastrar Veículo" [ref=e205] [cursor=pointer]
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
  46  |   await expect(page).toHaveURL(/#\/home/);
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
> 78  |     page.waitForResponse(
      |          ^ TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
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
  147 |     .getByPlaceholder("Buscar veiculo, placa, tipo ou responsavel")
  148 |     .fill(appointment.responsavel);
  149 |   const row = page.locator(".fg-appt-table tbody tr", {
  150 |     hasText: appointment.responsavel,
  151 |   });
  152 |   await expect(row).toBeVisible({ timeout: 15000 });
  153 |   await expect(row).toContainText(appointment.responsavel);
  154 | }
  155 | 
```