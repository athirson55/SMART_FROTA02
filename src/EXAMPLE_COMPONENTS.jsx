/**
 * EXEMPLO DE USO - Componentes Reutilizáveis
 * Smart Frota Frontend Consolidado
 *
 * Este arquivo demonstra como usar os novos componentes
 * Input, SearchInput, AppCard, AppButton, etc.
 */

import { useState } from "react";
import { Input, SearchInput, AppCard, AppButton } from "./components/ui";
import { Modal } from "./components/Modal";

/**
 * Exemplo 1: Formulário com Input Reutilizável
 */
export function FormExamplePage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.nome) newErrors.nome = "Nome é obrigatório";
    if (!formData.email) newErrors.email = "Email é obrigatório";
    if (!formData.telefone) newErrors.telefone = "Telefone é obrigatório";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("Formulário enviado:", formData);
    alert("Formulário enviado com sucesso!");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Exemplo: Formulário com Input Reutilizável</h1>

      <AppCard>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input
            label="Nome Completo"
            type="text"
            placeholder="João Silva"
            value={formData.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            error={errors.nome}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="joao@example.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.telefone}
            onChange={(e) => handleChange("telefone", e.target.value)}
            error={errors.telefone}
            required
          />

          <AppButton onClick={handleSubmit}>Enviar Formulário</AppButton>
        </div>
      </AppCard>
    </div>
  );
}

/**
 * Exemplo 2: Search com Debounce
 */
export function SearchExamplePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([
    "Motorista 1",
    "Motorista 2",
    "Motorista 3",
  ]);

  const filteredResults = results.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Exemplo: SearchInput com Debounce</h1>

      <AppCard>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar motoristas..."
            debounce={300}
          />

          <div>
            <h3>Resultados ({filteredResults.length})</h3>
            {filteredResults.length > 0 ? (
              <ul>
                {filteredResults.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Nenhum resultado encontrado</p>
            )}
          </div>
        </div>
      </AppCard>
    </div>
  );
}

/**
 * Exemplo 3: Modal com Componentes
 */
export function ModalExamplePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const handleConfirm = () => {
    setConfirmData({
      timestamp: new Date().toLocaleString("pt-BR"),
      message: "Ação confirmada com sucesso!",
    });
    setModalOpen(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Exemplo: Modal Reutilizável</h1>

      <AppCard>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <AppButton onClick={() => setModalOpen(true)}>
            Abrir Modal de Confirmação
          </AppButton>

          {confirmData && (
            <div
              style={{
                padding: "12px",
                background: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "8px",
                color: "#155724",
              }}
            >
              <strong>✓ {confirmData.message}</strong>
              <br />
              <small>{confirmData.timestamp}</small>
            </div>
          )}
        </div>
      </AppCard>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirmar Ação"
        size="md"
        footer={
          <>
            <AppButton
              onClick={() => setModalOpen(false)}
              style={{
                background: "#f5f7fb",
                color: "#1e2a3b",
                border: "1px solid #d8dde6",
              }}
            >
              Cancelar
            </AppButton>
            <AppButton
              onClick={handleConfirm}
              style={{ background: "#16a34a" }}
            >
              Confirmar
            </AppButton>
          </>
        }
      >
        <p>Tem certeza que deseja confirmar esta ação?</p>
        <p style={{ fontSize: "12px", color: "#7b8ca0" }}>
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

/**
 * Exemplo 4: Componentes Combinados
 */
export function CombinedExamplePage() {
  const [drivers, setDrivers] = useState([
    "João Silva",
    "Maria Santos",
    "Pedro Oliveira",
  ]);
  const [search, setSearch] = useState("");
  const [newDriver, setNewDriver] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filteredDrivers = drivers.filter((driver) =>
    driver.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddDriver = () => {
    if (newDriver.trim()) {
      setDrivers([...drivers, newDriver]);
      setNewDriver("");
      setShowModal(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Exemplo: Componentes Combinados</h1>

      <AppCard style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar motorista..."
            style={{ flex: 1 }}
          />
          <AppButton onClick={() => setShowModal(true)}>+ Adicionar</AppButton>
        </div>

        <h3>Motoristas ({filteredDrivers.length})</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {filteredDrivers.map((driver) => (
            <div
              key={driver}
              style={{
                padding: "10px",
                background: "#f5f7fb",
                borderRadius: "8px",
                border: "1px solid #d8dde6",
              }}
            >
              {driver}
            </div>
          ))}
        </div>
      </AppCard>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Adicionar Motorista"
        size="md"
        footer={
          <>
            <AppButton onClick={() => setShowModal(false)}>Cancelar</AppButton>
            <AppButton
              onClick={handleAddDriver}
              style={{ background: "#16a34a" }}
            >
              Adicionar
            </AppButton>
          </>
        }
      >
        <Input
          label="Nome do Motorista"
          placeholder="Digite o nome..."
          value={newDriver}
          onChange={(e) => setNewDriver(e.target.value)}
          required
        />
      </Modal>
    </div>
  );
}

/**
 * COMO USAR ESTE ARQUIVO:
 *
 * 1. Importe o componente desejado em suas páginas:
 *    import { FormExamplePage } from "./EXAMPLE_COMPONENTS.jsx";
 *
 * 2. Use em suas rotas:
 *    <Route path="/example/form" element={<FormExamplePage />} />
 *    <Route path="/example/search" element={<SearchExamplePage />} />
 *    <Route path="/example/modal" element={<ModalExamplePage />} />
 *    <Route path="/example/combined" element={<CombinedExamplePage />} />
 *
 * 3. Para usar em seus próprios componentes:
 *    import { Input, SearchInput, AppCard, AppButton } from "./components/ui";
 *    import { Modal } from "./components/Modal";
 */
