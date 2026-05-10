import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { AppIcon } from "../components/AppIcon";
import { updateMeRequest, changePasswordRequest } from "../services/auth.js";
import { getSettings, updateSettings } from "../services/settings.js";
import { useTheme } from "../context/ThemeContext";
import { usePreferences } from "../context/PreferencesContext";
import "../styles/dashboard.css";
import "../styles/settings-page.css";

const NAV_SECTIONS = [
  {
    group: "Conta",
    items: [
      { key: "perfil", label: "Perfil", icon: "users" },
      { key: "seguranca", label: "Segurança", icon: "settings", dot: true },
      { key: "sessoes", label: "Sessões ativas", icon: "logout" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { key: "preferencias", label: "Notificações", icon: "bell" },
      { key: "aparencia", label: "Aparência", icon: "settings" },
      { key: "idioma", label: "Idioma e região", icon: "grid" },
    ],
  },
  {
    group: "Frota",
    items: [
      { key: "frota", label: "Configurações da frota", icon: "truck" },
      { key: "integracoes", label: "Integrações", icon: "users" },
    ],
  },
  {
    group: "",
    items: [
      { key: "dados", label: "Zona de perigo", icon: "trash", danger: true },
    ],
  },
];


const COLOR_OPTIONS = [
  "#2563EB",
  "#7C3AED",
  "#16A34A",
  "#D97706",
  "#DC2626",
  "#0891B2",
  "#DB2777",
  "#1E2A3B",
];

const DENSITY_OPTIONS = [
  {
    key: "compacto",
    title: "Compacto",
    desc: "Mais itens visíveis",
  },
  {
    key: "padrao",
    title: "Padrão",
    desc: "Equilíbrio ideal",
  },
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyAccentColor(color) {
  const root = document.documentElement;
  root.style.setProperty("--sf-primary", color);
  root.style.setProperty("--sf-text-active", color);
  root.style.setProperty("--sf-primary-light", hexToRgba(color, 0.12));
  root.style.setProperty("--sf-bg-active", hexToRgba(color, 0.1));
}

function strengthFromPassword(password) {
  if (!password) {
    return { score: 0, label: "Digite uma senha" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labelByScore = ["Muito fraca", "Fraca", "Boa", "Forte"];

  return {
    score,
    label: labelByScore[Math.min(Math.max(score - 1, 0), 3)],
  };
}

function HeaderActionBell() {
  return <AppIcon type="bell" />;
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}

function CheckToast({ message }) {
  return (
    <div className={`fg-settings-toast ${message ? "show" : ""}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function ToggleRow({ title, desc, checked, onToggle }) {
  return (
    <div className="fg-settings-toggle-row">
      <div className="fg-settings-toggle-info">
        <div className="fg-settings-toggle-label">{title}</div>
        <div className="fg-settings-toggle-desc">{desc}</div>
      </div>
      <button
        type="button"
        className={`fg-settings-toggle ${checked ? "on" : ""}`}
        onClick={onToggle}
        aria-label={title}
      />
    </div>
  );
}

async function compressImage(file, maxDimension = 300, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const ratio = Math.min(maxDimension / w, maxDimension / h, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Falha ao processar imagem")); };
    img.src = url;
  });
}

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { prefs, updatePrefs } = usePreferences();
  const fileInputRef = useRef(null);
  const iniciais = user?.nome
    ? user.nome
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  const [avatarFoto, setAvatarFoto] = useState(user?.avatarFoto || "");
  const [activeSection, setActiveSection] = useState("perfil");
  const [toastMessage, setToastMessage] = useState("");
  const toastTimerRef = useRef(null);

  const [documentAlerts, setDocumentAlerts] = useState(true);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [newRequests, setNewRequests] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [dailySummary, setDailySummary] = useState(false);

  const [themeMode, setThemeMode] = useState(theme);
  const [densityMode, setDensityMode] = useState("padrao");
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem("smart-frota-accent") || "#2f67d8";
  });

  const [oilInterval, setOilInterval] = useState(10000);
  const [brakeInterval, setBrakeInterval] = useState(20000);
  const [reviewInterval, setReviewInterval] = useState(30000);
  const [advanceDays, setAdvanceDays] = useState(30);
  const [defaultMaintenanceType, setDefaultMaintenanceType] =
    useState("Troca de óleo");
  const [defaultPriority, setDefaultPriority] = useState("Médio");
  const [defaultWorkshop, setDefaultWorkshop] = useState("Frota Plus");
  const [defaultCapacity, setDefaultCapacity] = useState("10");
  const [autoAlert, setAutoAlert] = useState(true);
  const [blockOverdue, setBlockOverdue] = useState(false);

  const [settingsId, setSettingsId] = useState(null);
  const [companyName, setCompanyName] = useState("Smart Frota");
  const [timezone, setTimezone] = useState(prefs.timezone || "America/Sao_Paulo");
  const [currency, setCurrency] = useState(prefs.currency || "BRL");
  const [dateFormat, setDateFormat] = useState(prefs.dateFormat || "DD/MM/AAAA");
  const [lowDaysThreshold, setLowDaysThreshold] = useState(15);
  const [lowKmThreshold, setLowKmThreshold] = useState(500);

  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNext, setPasswordNext] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordHint, setPasswordHint] = useState("");

  const passwordStrength = useMemo(
    () => strengthFromPassword(passwordNext),
    [passwordNext],
  );

  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  useEffect(() => {
    setAvatarFoto(user?.avatarFoto || "");
  }, [user?.avatarFoto]);

  useEffect(() => {
    getSettings()
      .then((res) => {
        const s = res.data?.data ?? res.data;
        if (!s) return;
        setSettingsId(s.id ?? null);
        setCompanyName(s.companyName || "Smart Frota");
        setTimezone(s.timezone || "America/Sao_Paulo");
        setLowDaysThreshold(s.lowDaysThreshold ?? 15);
        setLowKmThreshold(s.lowKmThreshold ?? 500);
        if (s.emailNotifications !== undefined) setDocumentAlerts(s.emailNotifications);
        if (s.rawJson) {
          try {
            const prefs = JSON.parse(s.rawJson);
            if (prefs.maintenanceAlerts !== undefined) setMaintenanceAlerts(prefs.maintenanceAlerts);
            if (prefs.criticalAlerts !== undefined) setCriticalAlerts(prefs.criticalAlerts);
            if (prefs.weeklyReport !== undefined) setWeeklyReport(prefs.weeklyReport);
            if (prefs.newRequests !== undefined) setNewRequests(prefs.newRequests);
            if (prefs.smsAlerts !== undefined) setSmsAlerts(prefs.smsAlerts);
            if (prefs.dailySummary !== undefined) setDailySummary(prefs.dailySummary);
            if (prefs.theme) setThemeMode(prefs.theme);
          } catch { /* ignore parse errors */ }
        }
      })
      .catch(() => {});
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  async function saveSettings(patch) {
    try {
      await updateSettings(patch);
    } catch {
      showToast("Erro ao salvar no servidor");
    }
  }

  async function handleSaveNotifications() {
    const rawJson = JSON.stringify({
      maintenanceAlerts,
      criticalAlerts,
      weeklyReport,
      newRequests,
      smsAlerts,
      dailySummary,
    });
    await saveSettings({ emailNotifications: documentAlerts, rawJson });
    showToast("Preferências de notificação salvas!");
  }

  async function handleSaveIdioma() {
    updatePrefs({ timezone, currency, dateFormat });
    await saveSettings({ timezone });
    showToast("Configurações de idioma e região salvas!");
  }

  async function handleSaveFlota() {
    const rawJson = JSON.stringify({ oilInterval, brakeInterval, reviewInterval });
    await saveSettings({ lowDaysThreshold: advanceDays, lowKmThreshold, rawJson });
    showToast("Configurações da frota salvas!");
  }

  async function handleSaveEmpresa() {
    await saveSettings({ companyName });
    showToast("Dados da empresa salvos!");
  }

  function showToast(message) {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), 3200);
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.elements.namedItem("profileName")?.value?.trim();

    if (!name) {
      showToast("Preencha o nome do usuário");
      return;
    }

    try {
      const res = await updateMeRequest({ nome: name });
      const updated = res.data?.data ?? res.data;
      updateUser({ ...(user || {}), ...updated });
      showToast("Perfil salvo com sucesso!");
    } catch {
      showToast("Erro ao salvar perfil. Tente novamente.");
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    if (!passwordCurrent || !passwordNext || !passwordConfirm) {
      showToast("Preencha todos os campos de senha");
      return;
    }

    if (passwordNext.length < 8) {
      showToast("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (passwordNext !== passwordConfirm) {
      setPasswordHint("⚠ As senhas não coincidem");
      showToast("As senhas não coincidem");
      return;
    }

    try {
      await changePasswordRequest({ senhaAtual: passwordCurrent, novaSenha: passwordNext });
      setPasswordHint("✓ Senha alterada");
      setPasswordCurrent("");
      setPasswordNext("");
      setPasswordConfirm("");
      showToast("Senha alterada com sucesso!");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Erro ao alterar senha";
      showToast(msg);
    }
  }

  function handleToggleColor(color) {
    setAccentColor(color);
    localStorage.setItem("smart-frota-accent", color);
    applyAccentColor(color);
    showToast("Cor de destaque atualizada!");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () =>
        reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Selecione um arquivo de imagem válido");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Imagem muito grande. Use um arquivo com até 5 MB");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await compressImage(file, 256, 0.85);
      setAvatarFoto(dataUrl);
      const res = await updateMeRequest({ avatarFoto: dataUrl });
      const updated = res.data?.data ?? res.data;
      updateUser({ ...(user || {}), ...updated, avatarFoto: dataUrl });
      showToast("Foto atualizada com sucesso!");
    } catch {
      showToast("Não foi possível salvar a foto. Tente novamente.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarFoto("");
    try {
      await updateMeRequest({ avatarFoto: null });
      updateUser({ ...(user || {}), avatarFoto: null });
      showToast("Foto removida");
    } catch {
      showToast("Erro ao remover foto. Tente novamente.");
    }
  }

  return (
    <AppLayout>
      <div className="fg-settings-page">
        <header className="fg-settings-header">
          <div className="fg-settings-header-title">Configurações</div>
          <div className="fg-settings-header-actions">
            <button
              type="button"
              className="fg-settings-icon-btn"
              aria-label="Notificações"
            >
              <HeaderActionBell />
            </button>
            <button
              type="button"
              className="fg-settings-icon-btn"
              aria-label="Segurança e acesso"
            >
              <LockIcon />
            </button>
            <div className="fg-settings-user-avatar">
              {avatarFoto ? (
                <img src={avatarFoto} alt="Foto de perfil" />
              ) : (
                iniciais
              )}
            </div>
            <div className="fg-settings-user-meta">
              <div className="fg-settings-user-name">
                {user?.nome || "Usuário"}
              </div>
              <div className="fg-settings-user-role">
                {user?.role === "ADMIN" ? "Administrador" : "Gestor de Frota"}
              </div>
            </div>
          </div>
        </header>

        <div className="fg-settings-layout">
          <nav className="fg-settings-nav">
            {NAV_SECTIONS.map((group) => (
              <div key={group.group || "danger"}>
                {group.group ? (
                  <div className="fg-settings-nav-group-label">
                    {group.group}
                  </div>
                ) : null}

                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`fg-settings-nav-item ${activeSection === item.key ? "active" : ""} ${item.danger ? "is-danger" : ""}`}
                    onClick={() => setActiveSection(item.key)}
                  >
                    <span className="fg-settings-nav-icon">
                      <AppIcon type={item.icon} />
                    </span>
                    <span>{item.label}</span>
                    {item.dot ? <span className="fg-settings-nav-dot" /> : null}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <main className="fg-settings-content">
            {activeSection === "perfil" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">
                    Perfil do Usuário
                  </div>
                  <div className="fg-settings-section-sub">
                    Gerencie suas informações pessoais e de contato
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon blue">
                      <AppIcon type="users" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Informações pessoais
                      </div>
                      <div className="fg-settings-card-sub">
                        Foto de perfil e dados básicos
                      </div>
                    </div>
                  </div>

                  <form
                    className="fg-settings-card-body"
                    onSubmit={handleSaveProfile}
                  >
                    <div className="fg-settings-avatar-upload">
                      <div className="fg-settings-avatar-big">
                        {avatarFoto ? (
                          <img
                            src={avatarFoto}
                            alt="Foto de perfil"
                            className="fg-settings-avatar-image"
                            style={{
                              width: "72px",
                              height: "72px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              objectPosition: "center",
                            }}
                          />
                        ) : (
                          iniciais
                        )}
                        <div
                          className="fg-settings-avatar-change"
                          aria-hidden="true"
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M12 7a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5A5 5 0 0 0 12 7m0-7L8 4H4v4L0 12l4 4v4h4l4 4 4-4h4v-4l4-4-4-4V4h-4z" />
                          </svg>
                        </div>
                      </div>

                      <div className="fg-settings-avatar-info">
                        <div className="fg-settings-avatar-name">
                          {user?.nome || "Usuário"}
                        </div>
                        <div className="fg-settings-avatar-role">
                          {user?.role === "ADMIN"
                            ? "Administrador"
                            : "Gestor de Frota"}{" "}
                          · Smart Frota
                        </div>
                        <div className="fg-settings-avatar-btns">
                          <button
                            type="button"
                            className="fg-settings-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <svg viewBox="0 0 24 24">
                              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                            </svg>
                            Alterar foto
                          </button>
                          <button
                            type="button"
                            className="fg-settings-upload-btn is-danger"
                            onClick={handleRemoveAvatar}
                            disabled={!avatarFoto}
                          >
                            Remover
                          </button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>

                    <div className="fg-settings-form-grid">
                      <label className="fg-settings-field">
                        <span>Nome completo *</span>
                        <input
                          name="profileName"
                          type="text"
                          defaultValue={user?.nome || ""}
                        />
                      </label>

                      <label className="fg-settings-field">
                        <span>Cargo / Função</span>
                        <input
                          type="text"
                          value={user?.role === "ADMIN" ? "Administrador" : "Gestor de Frota"}
                          readOnly
                          disabled
                        />
                      </label>

                      <label className="fg-settings-field full">
                        <span>Email</span>
                        <input
                          type="email"
                          value={user?.email || ""}
                          readOnly
                          disabled
                        />
                      </label>
                    </div>

                    <div className="fg-settings-card-footer">
                      <button
                        type="button"
                        className="fg-settings-ghost-btn"
                        onClick={() => showToast("Alterações descartadas")}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="fg-settings-primary-btn">
                        <svg viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        Salvar perfil
                      </button>
                    </div>
                  </form>
                </article>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon purple">
                      <AppIcon type="truck" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Dados da empresa
                      </div>
                      <div className="fg-settings-card-sub">
                        Informações da organização
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-form-grid">
                      <label className="fg-settings-field full">
                        <span>Nome da empresa</span>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="fg-settings-card-footer">
                    <button
                      type="button"
                      className="fg-settings-primary-btn"
                      onClick={handleSaveEmpresa}
                    >
                      Salvar dados
                    </button>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "seguranca" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">Segurança</div>
                  <div className="fg-settings-section-sub">
                    Proteja sua conta com uma senha forte e autenticação em dois
                    fatores
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon red">
                      <LockIcon />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Alterar senha
                      </div>
                      <div className="fg-settings-card-sub">
                        Use uma senha com pelo menos 8 caracteres
                      </div>
                    </div>
                  </div>

                  <form
                    className="fg-settings-card-body"
                    onSubmit={handleChangePassword}
                  >
                    <div className="fg-settings-form-grid">
                      <label className="fg-settings-field full">
                        <span>Senha atual *</span>
                        <input
                          type="password"
                          placeholder="Digite sua senha atual"
                          value={passwordCurrent}
                          onChange={(event) =>
                            setPasswordCurrent(event.target.value)
                          }
                        />
                      </label>

                      <label className="fg-settings-field">
                        <span>Nova senha *</span>
                        <input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          value={passwordNext}
                          onChange={(event) =>
                            setPasswordNext(event.target.value)
                          }
                        />

                        <div className="fg-settings-pwd-strength">
                          <div className="fg-settings-pwd-bars">
                            {[0, 1, 2, 3].map((index) => (
                              <div
                                key={index}
                                className="fg-settings-pwd-bar"
                                data-active={
                                  index < passwordStrength.score
                                    ? "true"
                                    : "false"
                                }
                              />
                            ))}
                          </div>
                          <div className="fg-settings-pwd-label">
                            {passwordStrength.label}
                          </div>
                        </div>
                      </label>

                      <label className="fg-settings-field">
                        <span>Confirmar nova senha *</span>
                        <input
                          type="password"
                          placeholder="Repita a nova senha"
                          value={passwordConfirm}
                          onChange={(event) => {
                            setPasswordConfirm(event.target.value);
                            if (!event.target.value) {
                              setPasswordHint("");
                            } else if (event.target.value === passwordNext) {
                              setPasswordHint("✓ Senhas coincidem");
                            } else {
                              setPasswordHint("⚠ Senhas não coincidem");
                            }
                          }}
                        />
                        <div
                          className={`fg-settings-form-hint ${passwordHint.includes("⚠") ? "error" : ""}`}
                        >
                          {passwordHint}
                        </div>
                      </label>
                    </div>

                    <div className="fg-settings-card-footer">
                      <button type="submit" className="fg-settings-primary-btn">
                        <LockIcon />
                        Alterar senha
                      </button>
                    </div>
                  </form>
                </article>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon purple">
                      <AppIcon type="settings" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Autenticação em dois fatores
                      </div>
                      <div className="fg-settings-card-sub">
                        Adicione uma camada extra de segurança
                      </div>
                    </div>
                    <span
                      className="fg-settings-badge is-amber"
                      style={{ marginLeft: "auto" }}
                    >
                      Não ativado
                    </span>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-twofa-block">
                      <div className="fg-settings-twofa-icon">
                        <LockIcon />
                      </div>
                      <div className="fg-settings-twofa-info">
                        <div className="fg-settings-twofa-title">
                          Verificação por aplicativo
                        </div>
                        <div className="fg-settings-twofa-desc">
                          Use Google Authenticator ou Authy para gerar códigos
                          de 6 dígitos ao fazer login.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="fg-settings-primary-btn"
                        disabled
                        title="Em breve"
                        style={{ opacity: 0.5, cursor: "not-allowed" }}
                      >
                        Em breve
                      </button>
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "sessoes" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">
                    Sessões ativas
                  </div>
                  <div className="fg-settings-section-sub">
                    Dispositivos conectados à sua conta agora
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon blue">
                      <AppIcon type="logout" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Dispositivos conectados
                      </div>
                      <div className="fg-settings-card-sub">
                        1 sessão ativa
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-session-item">
                      <div className="fg-settings-session-icon">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
                        </svg>
                      </div>
                      <div className="fg-settings-session-info">
                        <div className="fg-settings-session-name">
                          Navegador atual
                          <span className="fg-settings-badge is-green" style={{ marginLeft: 6, fontSize: 10 }}>
                            Sessão atual
                          </span>
                        </div>
                        <div className="fg-settings-session-meta">
                          {user?.email} · Agora
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 0 4px", fontSize: 12, color: "var(--fg-muted, #7b8ca0)" }}>
                      O rastreamento de múltiplas sessões estará disponível em breve.
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "preferencias" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">Notificações</div>
                  <div className="fg-settings-section-sub">
                    Escolha quando e como deseja ser notificado
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon amber">
                      <AppIcon type="bell" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Alertas e avisos
                      </div>
                      <div className="fg-settings-card-sub">
                        Configure quais eventos geram notificações
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <ToggleRow
                      title="Documentos prestes a vencer"
                      desc="Receba aviso quando CRLV, seguro ou licença estiver próximo do vencimento"
                      checked={documentAlerts}
                      onToggle={() => setDocumentAlerts((value) => !value)}
                    />
                    <ToggleRow
                      title="Manutenções agendadas"
                      desc="Lembrete automático 3 dias antes da manutenção programada"
                      checked={maintenanceAlerts}
                      onToggle={() => setMaintenanceAlerts((value) => !value)}
                    />
                    <ToggleRow
                      title="Alertas críticos em tempo real"
                      desc="Notificações imediatas para falhas de motor, freios e sistemas críticos"
                      checked={criticalAlerts}
                      onToggle={() => setCriticalAlerts((value) => !value)}
                    />
                    <ToggleRow
                      title="Relatório semanal por email"
                      desc="Resumo de desempenho e custos enviado toda segunda-feira"
                      checked={weeklyReport}
                      onToggle={() => setWeeklyReport((value) => !value)}
                    />
                    <ToggleRow
                      title="Novos pedidos de frete"
                      desc="Aviso quando um novo pedido é criado no sistema"
                      checked={newRequests}
                      onToggle={() => setNewRequests((value) => !value)}
                    />
                    <ToggleRow
                      title="Notificações por SMS"
                      desc="Receba alertas críticos também via mensagem de texto"
                      checked={smsAlerts}
                      onToggle={() => setSmsAlerts((value) => !value)}
                    />
                    <ToggleRow
                      title="Resumo diário"
                      desc="Relatório de fim de dia com status de toda a frota"
                      checked={dailySummary}
                      onToggle={() => setDailySummary((value) => !value)}
                    />
                  </div>

                  <div className="fg-settings-card-footer">
                    <button
                      type="button"
                      className="fg-settings-primary-btn"
                      onClick={handleSaveNotifications}
                    >
                      Salvar preferências
                    </button>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "aparencia" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">Aparência</div>
                  <div className="fg-settings-section-sub">
                    Personalize o visual da interface
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon blue">
                      <AppIcon type="settings" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Cor de destaque
                      </div>
                      <div className="fg-settings-card-sub">
                        Cor principal da interface
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-color-grid">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`fg-settings-color-dot ${accentColor === color ? "selected" : ""}`}
                          style={{ background: color, color }}
                          onClick={() => handleToggleColor(color)}
                          aria-label={`Selecionar cor ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </article>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon gray">
                      <AppIcon type="clock" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">Tema</div>
                      <div className="fg-settings-card-sub">
                        Modo claro ou escuro
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-option-grid">
                      {[
                        {
                          key: "claro",
                          title: "☀️ Modo claro",
                          desc: "Interface clara (padrão)",
                        },
                        {
                          key: "escuro",
                          title: "🌙 Modo escuro",
                          desc: "Reduz o cansaço visual",
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`fg-settings-option-card ${themeMode === option.key ? "selected" : ""}`}
                          onClick={() => {
                            setThemeMode(option.key);
                            setTheme(option.key);
                            showToast(option.key === "escuro" ? "Modo escuro ativado!" : "Modo claro ativado!");
                          }}
                        >
                          <div className="fg-settings-option-title">
                            {option.title}
                          </div>
                          <div className="fg-settings-option-desc">
                            {option.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon blue">
                      <AppIcon type="chart" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Densidade da interface
                      </div>
                      <div className="fg-settings-card-sub">
                        Ajuste o espaçamento dos elementos
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-option-grid">
                      {DENSITY_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`fg-settings-option-card ${densityMode === option.key ? "selected" : ""}`}
                          onClick={() => setDensityMode(option.key)}
                        >
                          <div className="fg-settings-option-title">
                            {option.title}
                          </div>
                          <div className="fg-settings-option-desc">
                            {option.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="fg-settings-card-footer">
                    <button
                      type="button"
                      className="fg-settings-primary-btn"
                      onClick={() => showToast("Aparência salva!")}
                    >
                      Salvar aparência
                    </button>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "idioma" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">
                    Idioma e Região
                  </div>
                  <div className="fg-settings-section-sub">
                    Configurações de localização e formato
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon blue">
                      <AppIcon type="grid" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">Localização</div>
                      <div className="fg-settings-card-sub">
                        Idioma, moeda e fuso horário
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-form-grid">
                      <label className="fg-settings-field">
                        <span>Idioma</span>
                        <select defaultValue="pt-BR" disabled>
                          <option value="pt-BR">Português (Brasil)</option>
                        </select>
                      </label>

                      <label className="fg-settings-field">
                        <span>Fuso horário</span>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                        >
                          <option value="America/Sao_Paulo">America/São Paulo (UTC-3)</option>
                          <option value="America/New_York">America/New_York (UTC-5)</option>
                          <option value="America/Manaus">America/Manaus (UTC-4)</option>
                          <option value="America/Belem">America/Belém (UTC-3)</option>
                        </select>
                      </label>

                      <label className="fg-settings-field">
                        <span>Formato de data</span>
                        <select
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                        >
                          <option value="DD/MM/AAAA">DD/MM/AAAA (padrão BR)</option>
                          <option value="MM/DD/AAAA">MM/DD/AAAA (EUA)</option>
                          <option value="AAAA-MM-DD">AAAA-MM-DD (ISO 8601)</option>
                        </select>
                      </label>

                      <label className="fg-settings-field">
                        <span>Moeda</span>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        >
                          <option value="BRL">Real Brasileiro (BRL)</option>
                          <option value="USD">Dólar Americano (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="fg-settings-card-footer">
                    <button
                      type="button"
                      className="fg-settings-primary-btn"
                      onClick={handleSaveIdioma}
                    >
                      Salvar preferências
                    </button>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "frota" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">
                    Configurações da Frota
                  </div>
                  <div className="fg-settings-section-sub">
                    Parâmetros globais para gestão e manutenção da frota
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon amber">
                      <AppIcon type="wrench" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Intervalos de manutenção
                      </div>
                      <div className="fg-settings-card-sub">
                        Defina os km e dias padrão para cada tipo de serviço
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body fg-settings-stack">
                    <div>
                      <div className="fg-settings-slider-head">
                        <div>Troca de óleo</div>
                        <span className="fg-settings-badge is-blue">
                          {oilInterval.toLocaleString("pt-BR")} km
                        </span>
                      </div>
                      <div className="fg-settings-range-wrap">
                        <input
                          type="range"
                          min="5000"
                          max="20000"
                          step="1000"
                          value={oilInterval}
                          onChange={(event) =>
                            setOilInterval(Number(event.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <div className="fg-settings-slider-head">
                        <div>Inspeção de freios</div>
                        <span className="fg-settings-badge is-blue">
                          {brakeInterval.toLocaleString("pt-BR")} km
                        </span>
                      </div>
                      <div className="fg-settings-range-wrap">
                        <input
                          type="range"
                          min="10000"
                          max="50000"
                          step="2000"
                          value={brakeInterval}
                          onChange={(event) =>
                            setBrakeInterval(Number(event.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <div className="fg-settings-slider-head">
                        <div>Revisão geral</div>
                        <span className="fg-settings-badge is-blue">
                          {reviewInterval.toLocaleString("pt-BR")} km
                        </span>
                      </div>
                      <div className="fg-settings-range-wrap">
                        <input
                          type="range"
                          min="15000"
                          max="60000"
                          step="5000"
                          value={reviewInterval}
                          onChange={(event) =>
                            setReviewInterval(Number(event.target.value))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <div className="fg-settings-slider-head">
                        <div>Alerta antecipado (dias)</div>
                        <span className="fg-settings-badge is-amber">
                          {advanceDays} dias
                        </span>
                      </div>
                      <div className="fg-settings-range-wrap">
                        <input
                          type="range"
                          min="7"
                          max="60"
                          step="1"
                          value={advanceDays}
                          onChange={(event) =>
                            setAdvanceDays(Number(event.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-footer">
                    <button
                      type="button"
                      className="fg-settings-primary-btn"
                      onClick={handleSaveFlota}
                    >
                      Salvar intervalos
                    </button>
                  </div>
                </article>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon green">
                      <AppIcon type="doc" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Padrões da frota
                      </div>
                      <div className="fg-settings-card-sub">
                        Valores padrão ao cadastrar novos registros
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-form-grid">
                      <label className="fg-settings-field">
                        <span>Tipo padrão de manutenção</span>
                        <select
                          value={defaultMaintenanceType}
                          onChange={(event) =>
                            setDefaultMaintenanceType(event.target.value)
                          }
                        >
                          <option>Troca de óleo</option>
                          <option>Inspeção preventiva</option>
                          <option>Revisão geral</option>
                          <option>Revisão de freios</option>
                        </select>
                      </label>

                      <label className="fg-settings-field">
                        <span>Prioridade padrão de alertas</span>
                        <select
                          value={defaultPriority}
                          onChange={(event) =>
                            setDefaultPriority(event.target.value)
                          }
                        >
                          <option>Crítico</option>
                          <option>Médio</option>
                          <option>Baixo</option>
                        </select>
                      </label>

                      <label className="fg-settings-field">
                        <span>Oficina padrão</span>
                        <input
                          type="text"
                          value={defaultWorkshop}
                          onChange={(event) =>
                            setDefaultWorkshop(event.target.value)
                          }
                        />
                      </label>

                      <label className="fg-settings-field">
                        <span>Capacidade máxima padrão (ton)</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={defaultCapacity}
                          onChange={(event) =>
                            setDefaultCapacity(event.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div className="fg-settings-toggles-list">
                      <ToggleRow
                        title="Gerar alerta automático ao vencer km"
                        desc="Criar alerta automaticamente quando o veículo atingir o km de manutenção"
                        checked={autoAlert}
                        onToggle={() => setAutoAlert((value) => !value)}
                      />
                      <ToggleRow
                        title="Bloquear veículo com manutenção vencida"
                        desc="Impedir alocação de pedidos para veículos com manutenção atrasada"
                        checked={blockOverdue}
                        onToggle={() => setBlockOverdue((value) => !value)}
                      />
                    </div>
                  </div>

                  <div className="fg-settings-card-footer">
                    <button
                      type="button"
                      className="fg-settings-primary-btn"
                      onClick={() =>
                        showToast("Configurações da frota salvas!")
                      }
                    >
                      Salvar configurações
                    </button>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "integracoes" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title">Integrações</div>
                  <div className="fg-settings-section-sub">
                    Conecte o Smart Frota com outras ferramentas
                  </div>
                </div>

                <article className="fg-settings-card">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon purple">
                      <AppIcon type="users" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title">
                        Conexões disponíveis
                      </div>
                      <div className="fg-settings-card-sub">
                        APIs e integrações externas
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-card-body">
                    <div className="fg-settings-toggles-list">
                      {[
                        { title: "🗺 Google Maps — Rastreamento", desc: "Exibir rotas e localização dos veículos em tempo real" },
                        { title: "📧 SendGrid — Email", desc: "Envio de alertas e relatórios por email" },
                        { title: "💬 WhatsApp Business — SMS", desc: "Notificações via mensagem de texto" },
                        { title: "📊 Power BI — Relatórios", desc: "Exportar dados para dashboards avançados" },
                      ].map((item) => (
                        <div key={item.title} className="fg-settings-toggle-row">
                          <div className="fg-settings-toggle-info">
                            <div className="fg-settings-toggle-label">{item.title}</div>
                            <div className="fg-settings-toggle-desc">{item.desc}</div>
                          </div>
                          <span className="fg-settings-badge is-amber" style={{ fontSize: 11 }}>Em breve</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "dados" ? (
              <section className="fg-settings-section is-active">
                <div className="fg-settings-section-header">
                  <div className="fg-settings-section-title is-danger">
                    Zona de Perigo
                  </div>
                  <div className="fg-settings-section-sub">
                    Ações irreversíveis — proceda com cuidado
                  </div>
                </div>

                <section className="fg-settings-danger-zone">
                  <div className="fg-settings-card-header">
                    <div className="fg-settings-card-header-icon red">
                      <AppIcon type="settings" />
                    </div>
                    <div>
                      <div className="fg-settings-card-title is-danger">
                        Ações permanentes
                      </div>
                      <div className="fg-settings-card-sub">
                        Essas ações não podem ser desfeitas
                      </div>
                    </div>
                  </div>

                  <div className="fg-settings-danger-item">
                    <div className="fg-settings-danger-item-info">
                      <div className="fg-settings-danger-item-title">
                        Exportar relatório CSV
                      </div>
                      <div className="fg-settings-danger-item-desc">
                        Baixe um relatório CSV com os dados de veículos e manutenções
                      </div>
                    </div>
                    <button
                      type="button"
                      className="fg-settings-ghost-btn"
                      onClick={() => { navigate("/relatorios"); showToast("Acesse a página de Relatórios para exportar CSV"); }}
                    >
                      Ir para Relatórios
                    </button>
                  </div>

                  <div className="fg-settings-danger-item">
                    <div className="fg-settings-danger-item-info">
                      <div className="fg-settings-danger-item-title">
                        Redefinir configurações
                      </div>
                      <div className="fg-settings-danger-item-desc">
                        Restaurar todas as configurações do sistema para os valores padrão
                      </div>
                    </div>
                    <button
                      type="button"
                      className="fg-settings-danger-btn"
                      onClick={async () => {
                        if (window.confirm("Restaurar configurações para o padrão?")) {
                          await saveSettings({
                            companyName: "Smart Frota",
                            timezone: "America/Sao_Paulo",
                            emailNotifications: true,
                            lowDaysThreshold: 15,
                            lowKmThreshold: 500,
                            rawJson: null,
                          });
                          setCompanyName("Smart Frota");
                          setTimezone("America/Sao_Paulo");
                          setLowDaysThreshold(15);
                          setAdvanceDays(30);
                          setDocumentAlerts(true);
                          showToast("Configurações restauradas para o padrão!");
                        }
                      }}
                    >
                      <LockIcon />
                      Redefinir
                    </button>
                  </div>

                  <div className="fg-settings-danger-item is-warning">
                    <div className="fg-settings-danger-item-info">
                      <div className="fg-settings-danger-item-title">
                        Excluir conta permanentemente
                      </div>
                      <div className="fg-settings-danger-item-desc">
                        Todos os dados serão perdidos. Esta ação é irreversível
                        e não pode ser desfeita.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="fg-settings-danger-btn"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Tem certeza? Esta ação é irreversível.",
                          )
                        ) {
                          showToast(
                            "Solicitação de exclusão enviada para revisão.",
                          );
                        }
                      }}
                    >
                      <AppIcon type="settings" />
                      Excluir conta
                    </button>
                  </div>
                </section>
              </section>
            ) : null}
          </main>
        </div>

        <CheckToast message={toastMessage} />
      </div>
    </AppLayout>
  );
}
