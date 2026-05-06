# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: drivers.spec.js >> drivers >> listar motorista
- Location: tests\drivers.spec.js:29:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.fg-drivers-table')
Expected substring: "seed-driver+1778061981330@example.com"
Received string:    "MotoristaEmailTelefoneCNHCategoriaStatusVeículoAções"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.fg-drivers-table')
    9 × locator resolved to <table class="fg-drivers-table">…</table>
      - unexpected value "MotoristaEmailTelefoneCNHCategoriaStatusVeículoAções"

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
              - generic [ref=e105]: DB
              - generic [ref=e106]:
                - strong [ref=e107]: drivers b5baad6b
                - paragraph [ref=e108]: Perfil
      - generic [ref=e109]:
        - generic [ref=e110]:
          - generic [ref=e111]:
            - heading "Gestão de Motoristas" [level=3] [ref=e112]
            - paragraph [ref=e113]: Visualize, cadastre e gerencie os motoristas da sua frota
          - button "+ Adicionar Motorista" [ref=e114] [cursor=pointer]:
            - generic [ref=e115]: +
            - text: Adicionar Motorista
        - generic [ref=e116]:
          - article [ref=e117]:
            - img [ref=e119]
            - generic [ref=e124]:
              - strong [ref=e125]: "0"
              - generic [ref=e126]: Total de motoristas
          - article [ref=e127]:
            - img [ref=e129]
            - generic [ref=e132]:
              - strong [ref=e133]: "0"
              - generic [ref=e134]: Em rota
          - article [ref=e135]:
            - img [ref=e137]
            - generic [ref=e140]:
              - strong [ref=e141]: "0"
              - generic [ref=e142]: Disponíveis
          - article [ref=e143]:
            - img [ref=e145]
            - generic [ref=e148]:
              - strong [ref=e149]: "0"
              - generic [ref=e150]: Afastados
        - generic [ref=e151]:
          - generic [ref=e152]:
            - button "Todos 0" [ref=e153] [cursor=pointer]:
              - generic [ref=e154]: Todos
              - emphasis [ref=e155]: "0"
            - button "Em rota 0" [ref=e156] [cursor=pointer]:
              - generic [ref=e157]: Em rota
              - emphasis [ref=e158]: "0"
            - button "Disponível 0" [ref=e159] [cursor=pointer]:
              - generic [ref=e160]: Disponível
              - emphasis [ref=e161]: "0"
            - button "Afastado 0" [ref=e162] [cursor=pointer]:
              - generic [ref=e163]: Afastado
              - emphasis [ref=e164]: "0"
          - generic [ref=e165]:
            - generic [ref=e166]:
              - generic:
                - img
              - textbox "Buscar por nome, email, telefone ou CNH" [ref=e167]
            - generic [ref=e168]:
              - button "Visualização tabela" [ref=e169] [cursor=pointer]:
                - img [ref=e170]
              - button "Visualização cards" [ref=e172] [cursor=pointer]:
                - img [ref=e173]
        - generic [ref=e179]:
          - table [ref=e180]:
            - rowgroup [ref=e181]:
              - row "Motorista Email Telefone CNH Categoria Status Veículo Ações" [ref=e182]:
                - columnheader "Motorista" [ref=e183]
                - columnheader "Email" [ref=e184]
                - columnheader "Telefone" [ref=e185]
                - columnheader "CNH" [ref=e186]
                - columnheader "Categoria" [ref=e187]
                - columnheader "Status" [ref=e188]
                - columnheader "Veículo" [ref=e189]
                - columnheader "Ações" [ref=e190]
            - rowgroup
          - status [ref=e191]:
            - strong [ref=e192]: Nenhum motorista encontrado
            - paragraph [ref=e193]: Refine a busca ou cadastre um novo motorista.
            - button "Cadastrar motorista" [ref=e194] [cursor=pointer]
      - dialog "Adicionar Motorista" [ref=e195]:
        - generic [ref=e196]:
          - generic [ref=e197]:
            - heading "Adicionar Motorista" [level=2] [ref=e198]
            - button "Fechar modal" [ref=e199] [cursor=pointer]: ✕
          - generic [ref=e202]:
            - generic [ref=e203]: Dados pessoais
            - generic [ref=e204]:
              - generic [ref=e205]: Nome completo *
              - 'textbox "Ex: João Silva" [ref=e206]': Driver Seed 1778061981330
            - generic [ref=e207]:
              - generic [ref=e208]: E-mail *
              - textbox "joao@exemplo.com" [ref=e209]: seed-driver+1778061981330@example.com
            - generic [ref=e210]:
              - generic [ref=e211]: Telefone
              - textbox "+55 11 99999-0000" [ref=e212]
            - generic [ref=e213]:
              - generic [ref=e214]: Cargo
              - 'textbox "Ex: Motorista Sênior" [ref=e215]': Motorista Teste
            - generic [ref=e216]:
              - generic [ref=e217]: Status
              - combobox [ref=e218] [cursor=pointer]:
                - option "Disponível" [selected]
                - option "Em rota"
                - option "Afastado"
                - option "Inativo"
            - generic [ref=e219]: Habilitação
            - generic [ref=e220]:
              - generic [ref=e221]: Número da CNH *
              - 'textbox "Ex: 05498233411" [ref=e222]': "8061981330"
            - generic [ref=e223]:
              - generic [ref=e224]: Categoria
              - combobox [ref=e225] [cursor=pointer]:
                - option "A"
                - option "B"
                - option "C"
                - option "D" [selected]
                - option "E"
                - option "AB"
                - option "AC"
                - option "AD"
                - option "AE"
            - generic [ref=e226]:
              - generic [ref=e227]: Vencimento da CNH
              - textbox [ref=e228]
            - generic [ref=e229]: Cor do avatar
            - generic [ref=e231]:
              - 'button "Cor #2f67d8" [ref=e232] [cursor=pointer]'
              - 'button "Cor #16a34a" [ref=e233] [cursor=pointer]'
              - 'button "Cor #d97706" [ref=e234] [cursor=pointer]'
              - 'button "Cor #dc2626" [ref=e235] [cursor=pointer]'
              - 'button "Cor #7c3aed" [ref=e236] [cursor=pointer]'
              - 'button "Cor #0891b2" [ref=e237] [cursor=pointer]'
              - 'button "Cor #db2777" [ref=e238] [cursor=pointer]'
              - 'button "Cor #ea580c" [ref=e239] [cursor=pointer]'
          - generic [ref=e240]:
            - button "Cancelar" [ref=e241] [cursor=pointer]
            - button "Adicionar Motorista" [ref=e242] [cursor=pointer]
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
> 69  |   await expect(page.locator(".fg-drivers-table")).toContainText(driver.email);
      |                                                   ^ Error: expect(locator).toContainText(expected) failed
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