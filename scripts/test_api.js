(async () => {
  const baseUrl = "http://localhost:3001";
  const frontendOrigin = "http://localhost:5173";
  const now = () => new Date().toISOString();

  async function request(method, path, body, token) {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Origin: frontendOrigin,
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const elapsedMs = Date.now() - startedAt;
      const rawBody = await response.text();
      let parsedBody;
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
      } catch {
        parsedBody = rawBody;
      }

      return {
        ok: response.ok,
        status: response.status,
        elapsedMs,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
      };
    } catch (error) {
      return {
        ok: false,
        status: null,
        elapsedMs: Date.now() - startedAt,
        error: error.message,
      };
    }
  }

  function printSection(title) {
    console.log(`\n=== ${title} ===`);
  }

  function printResult(label, result) {
    console.log(`[${now()}] ${label}`);
    console.log(JSON.stringify(result, null, 2));
  }

  let token = null;

  printSection("GET /");
  const rootResult = await request("GET", "/");
  printResult("GET /", rootResult);

  printSection("GET /health");
  const healthResult = await request("GET", "/health");
  printResult("GET /health", healthResult);

  printSection("POST /auth/login");
  const loginResult = await request("POST", "/auth/login", {
    email: "admin@smartfrota.com",
    senha: "admin123",
  });
  printResult("POST /auth/login", loginResult);

  token = loginResult.body?.data?.token || loginResult.body?.token || null;
  console.log(`[${now()}] TOKEN ${token ? "ENCONTRADO" : "NAO_ENCONTRADO"}`);

  printSection("GET /veiculos");
  const vehiclesResult = await request("GET", "/veiculos", undefined, token);
  printResult("GET /veiculos", vehiclesResult);

  printSection("SUMMARY");
  console.log(
    JSON.stringify(
      {
        root: {
          status: rootResult.status,
          elapsedMs: rootResult.elapsedMs,
          ok: rootResult.ok,
        },
        health: {
          status: healthResult.status,
          elapsedMs: healthResult.elapsedMs,
          ok: healthResult.ok,
        },
        login: {
          status: loginResult.status,
          elapsedMs: loginResult.elapsedMs,
          ok: loginResult.ok,
          tokenFound: Boolean(token),
        },
        vehicles: {
          status: vehiclesResult.status,
          elapsedMs: vehiclesResult.elapsedMs,
          ok: vehiclesResult.ok,
        },
      },
      null,
      2,
    ),
  );
})();
