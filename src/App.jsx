import { useState, useEffect, useMemo, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, X,
  Home, PieChart as PieChartIcon, User, Wallet, AlertTriangle, Sun, Moon,
  UtensilsCrossed, Car, HeartPulse, Gamepad2, Repeat2, MoreHorizontal,
} from "lucide-react";

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CATEGORIAS = [
  { nome: "Alimentação", cor: "#7C3AED", icone: UtensilsCrossed },
  { nome: "Transporte", cor: "#F59E0B", icone: Car },
  { nome: "Casa", cor: "#EC4899", icone: Home },
  { nome: "Saúde", cor: "#22C55E", icone: HeartPulse },
  { nome: "Lazer", cor: "#3B82F6", icone: Gamepad2 },
  { nome: "Assinaturas", cor: "#F97316", icone: Repeat2 },
  { nome: "Outros", cor: "#94A3B8", icone: MoreHorizontal },
];

const MOEDAS = [
  { codigo: "BRL", nome: "Real", locale: "pt-BR" },
  { codigo: "USD", nome: "Dólar", locale: "en-US" },
  { codigo: "EUR", nome: "Euro", locale: "de-DE" },
  { codigo: "AED", nome: "Dirham", locale: "ar-AE" },
  { codigo: "GBP", nome: "Libra", locale: "en-GB" },
];

const BANDEIRAS = ["Visa", "Mastercard"];

const CORES_CARTAO = [
  { nome: "Preto", valor: "#141414" },
  { nome: "Branco", valor: "#F5F5F5" },
  { nome: "Vermelho", valor: "#DC2626" },
  { nome: "Azul", valor: "#1D4ED8" },
  { nome: "Dourado", valor: "#B8952E" },
  { nome: "Prata", valor: "#9CA3AF" },
  { nome: "Verde", valor: "#16A34A" },
  { nome: "Roxo", valor: "#7C3AED" },
];

function escurecerCor(hex, quantidade = 40) {
  const num = parseInt(hex.replace("#", ""), 16);
  let r = Math.max(0, (num >> 16) - quantidade);
  let g = Math.max(0, ((num >> 8) & 0x00FF) - quantidade);
  let b = Math.max(0, (num & 0x0000FF) - quantidade);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function corTextoContraste(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.55 ? "#141414" : "#ffffff";
}

function corCategoria(nome) {
  return (CATEGORIAS.find((c) => c.nome === nome) || CATEGORIAS[CATEGORIAS.length - 1]).cor;
}

function iconeCategoria(nome) {
  return (CATEGORIAS.find((c) => c.nome === nome) || CATEGORIAS[CATEGORIAS.length - 1]).icone;
}

function idNovo() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function iniciais(nome) {
  if (!nome || !nome.trim()) return "?";
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();
}

const CHAVE_LANCAMENTOS = "controle-gastos:lancamentos";
const CHAVE_CARTOES = "controle-gastos:cartoes";
const CHAVE_CARTAO_INFO = "controle-gastos:cartaoInfo";
const CHAVE_MOEDA = "controle-gastos:moeda";
const CHAVE_PERFIL = "controle-gastos:perfil";
const CHAVE_SALARIO = "controle-gastos:salario";
const CHAVE_TEMA = "controle-gastos:tema";

export default function App() {
  const hoje = new Date();
  const corPersonalizadaRef = useRef(null);
  const [aba, setAba] = useState("home");
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [lancamentos, setLancamentos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [cartaoInfo, setCartaoInfo] = useState({});
  const [modalCartaoAberto, setModalCartaoAberto] = useState(false);
  const [visaoStat, setVisaoStat] = useState("mensal");
  const [editandoCartao, setEditandoCartao] = useState(null);
  const [formCartao, setFormCartao] = useState({ nome: "", bandeira: BANDEIRAS[0], cor: CORES_CARTAO[0].valor });
  const [moeda, setMoeda] = useState(MOEDAS[0]);
  const [nome, setNome] = useState("");
  const [salario, setSalario] = useState("");
  const [escuro, setEscuro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: CATEGORIAS[0].nome,
    cartao: "",
    dia: String(hoje.getDate()).padStart(2, "0"),
  });

  function formatoMoeda(v) {
    return v.toLocaleString(moeda.locale, { style: "currency", currency: moeda.codigo });
  }

  useEffect(() => {
    try {
      const s = localStorage.getItem(CHAVE_LANCAMENTOS);
      if (s) setLancamentos(JSON.parse(s));
    } catch (e) {}
    try {
      const s = localStorage.getItem(CHAVE_CARTOES);
      if (s) setCartoes(JSON.parse(s));
    } catch (e) {}
    try {
      const s = localStorage.getItem(CHAVE_CARTAO_INFO);
      if (s) setCartaoInfo(JSON.parse(s));
    } catch (e) {}
    try {
      const s = localStorage.getItem(CHAVE_MOEDA);
      if (s) {
        const m = MOEDAS.find((x) => x.codigo === s);
        if (m) setMoeda(m);
      }
    } catch (e) {}
    try {
      const s = localStorage.getItem(CHAVE_PERFIL);
      if (s) setNome(s);
    } catch (e) {}
    try {
      const s = localStorage.getItem(CHAVE_SALARIO);
      if (s) setSalario(s);
    } catch (e) {}
    try {
      const s = localStorage.getItem(CHAVE_TEMA);
      if (s) setEscuro(s === "1");
    } catch (e) {}
    setCarregando(false);
  }, []);

  // Bloqueia o gesto de beliscar pra dar zoom (reforço além do viewport)
  useEffect(() => {
    const bloquearGesto = (e) => e.preventDefault();
    const bloquearMultiToque = (e) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    let ultimoToque = 0;
    const bloquearDuploToque = (e) => {
      const agora = Date.now();
      if (agora - ultimoToque <= 300) e.preventDefault();
      ultimoToque = agora;
    };
    document.addEventListener("gesturestart", bloquearGesto);
    document.addEventListener("touchmove", bloquearMultiToque, { passive: false });
    document.addEventListener("touchend", bloquearDuploToque, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", bloquearGesto);
      document.removeEventListener("touchmove", bloquearMultiToque);
      document.removeEventListener("touchend", bloquearDuploToque);
    };
  }, []);

  // Sincroniza a cor de fundo por trás da barra de status com o tema atual
  useEffect(() => {
    const cor = escuro ? "#121022" : "#F6F5FB";
    document.documentElement.style.background = cor;
    document.body.style.background = cor;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", cor);
  }, [escuro]);

  function salvar(lista) {
    setLancamentos(lista);
    try {
      localStorage.setItem(CHAVE_LANCAMENTOS, JSON.stringify(lista));
    } catch (e) {
      setErro("Não consegui salvar agora. Tenta de novo em instantes.");
      setTimeout(() => setErro(""), 3000);
    }
  }

  function salvarCartoes(lista) {
    setCartoes(lista);
    try {
      localStorage.setItem(CHAVE_CARTOES, JSON.stringify(lista));
    } catch (e) {}
  }

  function mudarMoeda(codigo) {
    const m = MOEDAS.find((x) => x.codigo === codigo);
    if (!m) return;
    setMoeda(m);
    try {
      localStorage.setItem(CHAVE_MOEDA, codigo);
    } catch (e) {}
  }

  function salvarNome(valor) {
    setNome(valor);
    try {
      localStorage.setItem(CHAVE_PERFIL, valor);
    } catch (e) {}
  }

  function salvarSalario(valor) {
    setSalario(valor);
    try {
      localStorage.setItem(CHAVE_SALARIO, valor);
    } catch (e) {}
  }

  function alternarTema(valor) {
    setEscuro(valor);
    try {
      localStorage.setItem(CHAVE_TEMA, valor ? "1" : "0");
    } catch (e) {}
  }

  const doMes = useMemo(() => {
    return lancamentos.filter((l) => {
      const d = new Date(l.data);
      return d.getFullYear() === ano && d.getMonth() === mes;
    });
  }, [lancamentos, ano, mes]);

  const total = doMes.reduce((s, l) => s + l.valor, 0);

  const porCategoria = useMemo(() => {
    const mapa = {};
    doMes.forEach((l) => {
      mapa[l.categoria] = (mapa[l.categoria] || 0) + l.valor;
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [doMes]);

  const porCartao = useMemo(() => {
    const mapa = {};
    cartoes.forEach((c) => { mapa[c] = 0; });
    doMes.forEach((l) => {
      mapa[l.cartao] = (mapa[l.cartao] || 0) + l.valor;
    });
    return mapa;
  }, [doMes, cartoes]);

  const porMesDoAno = useMemo(() => {
    const totais = Array(12).fill(0);
    lancamentos.forEach((l) => {
      const d = new Date(l.data);
      if (d.getFullYear() === ano) {
        totais[d.getMonth()] += l.valor;
      }
    });
    return MESES_LONGOS.map((nomeMes, i) => ({ mes: nomeMes.slice(0, 3), valor: totais[i] }));
  }, [lancamentos, ano]);

  const porMesECategoria = useMemo(() => {
    const base = MESES_LONGOS.map((nomeMes) => {
      const linha = { mes: nomeMes.slice(0, 3) };
      CATEGORIAS.forEach((c) => { linha[c.nome] = 0; });
      return linha;
    });
    lancamentos.forEach((l) => {
      const d = new Date(l.data);
      if (d.getFullYear() === ano) {
        base[d.getMonth()][l.categoria] = (base[d.getMonth()][l.categoria] || 0) + l.valor;
      }
    });
    return base;
  }, [lancamentos, ano]);

  const categoriasAtivasAno = useMemo(() => {
    return CATEGORIAS.filter((c) => porMesECategoria.some((m) => m[c.nome] > 0));
  }, [porMesECategoria]);

  const totalAno = useMemo(() => porMesDoAno.reduce((s, m) => s + m.valor, 0), [porMesDoAno]);

  function mudarMes(delta) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0) { novoMes = 11; novoAno -= 1; }
    if (novoMes > 11) { novoMes = 0; novoAno += 1; }
    setMes(novoMes);
    setAno(novoAno);
  }

  function mudarAno(delta) {
    setAno(ano + delta);
  }

  function abrirModal() {
    setForm({
      descricao: "",
      valor: "",
      categoria: CATEGORIAS[0].nome,
      cartao: cartoes[0] || "",
      dia: String(Math.min(hoje.getDate(), new Date(ano, mes + 1, 0).getDate())).padStart(2, "0"),
    });
    setModalAberto(true);
  }

  function salvarLancamento(e) {
    e.preventDefault();
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (!form.descricao.trim() || isNaN(valorNum) || valorNum <= 0) return;
    const diaNum = Math.min(parseInt(form.dia, 10) || 1, new Date(ano, mes + 1, 0).getDate());
    const data = new Date(ano, mes, diaNum).toISOString();
    const novo = {
      id: idNovo(),
      descricao: form.descricao.trim(),
      valor: valorNum,
      categoria: form.categoria,
      cartao: form.cartao,
      data,
    };
    salvar([...lancamentos, novo].sort((a, b) => new Date(b.data) - new Date(a.data)));
    setModalAberto(false);
  }

  function excluir(id) {
    salvar(lancamentos.filter((l) => l.id !== id));
  }

  function adicionarCartao() {
    const n = prompt("Nome do novo cartão:");
    if (n && n.trim() && !cartoes.includes(n.trim())) {
      salvarCartoes([...cartoes, n.trim()]);
    }
  }

  function salvarCartaoInfo(info) {
    setCartaoInfo(info);
    try {
      localStorage.setItem(CHAVE_CARTAO_INFO, JSON.stringify(info));
    } catch (e) {}
  }

  function abrirModalCartao(nomeExistente) {
    if (nomeExistente) {
      const info = cartaoInfo[nomeExistente] || {};
      setFormCartao({
        nome: nomeExistente,
        bandeira: info.bandeira || BANDEIRAS[0],
        cor: info.cor || CORES_CARTAO[0].valor,
      });
      setEditandoCartao(nomeExistente);
    } else {
      setFormCartao({ nome: "", bandeira: BANDEIRAS[0], cor: CORES_CARTAO[0].valor });
      setEditandoCartao(null);
    }
    setModalCartaoAberto(true);
  }

  function salvarFormCartao(e) {
    e.preventDefault();
    const nome = formCartao.nome.trim();
    if (!nome) return;
    if (!editandoCartao) {
      if (cartoes.includes(nome)) return;
      salvarCartoes([...cartoes, nome]);
    }
    salvarCartaoInfo({
      ...cartaoInfo,
      [nome]: { bandeira: formCartao.bandeira, cor: formCartao.cor },
    });
    setModalCartaoAberto(false);
  }

  function removerCartao(c) {
    if (confirm(`Remover o cartão "${c}"? Os lançamentos feitos nele continuam salvos.`)) {
      salvarCartoes(cartoes.filter((x) => x !== c));
      const novoInfo = { ...cartaoInfo };
      delete novoInfo[c];
      salvarCartaoInfo(novoInfo);
    }
  }

  const NAV = [
    { id: "home", label: "Home", icone: Home },
    { id: "card", label: "Cartões", icone: CreditCard },
    { id: "stat", label: "Stat", icone: PieChartIcon },
    { id: "profile", label: "Perfil", icone: User },
  ];

  const T = {
    bg: escuro ? "#121022" : "#F6F5FB",
    card: escuro ? "#1E1B2E" : "#FFFFFF",
    text: escuro ? "#F2F0FA" : "#1E1B2E",
    textSecondary: escuro ? "#A9A5C4" : "#9691A4",
    border: escuro ? "#332F52" : "#EDE9FE",
    track: escuro ? "#2A2740" : "#F6F5FB",
    avatarBg: escuro ? "#2A2740" : "#EDE9FE",
    navInactive: escuro ? "#5B5775" : "#C4C1D1",
    pillText: escuro ? "#C7C3DA" : "#4B4759",
    ring: escuro ? "#2A2740" : "#EDEBF5",
  };

  return (
    <div className="min-h-screen w-full transition-colors duration-500" style={{ background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <div
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none transition-colors duration-500"
        style={{
          height: "calc(env(safe-area-inset-top) + 2rem)",
          background: `linear-gradient(to bottom, ${T.bg} 0%, ${T.bg} 45%, transparent 100%)`,
        }}
      />

      <div
        className="max-w-md mx-auto px-5 min-h-screen"
        style={{
          paddingTop: "max(calc(env(safe-area-inset-top) + 1rem), 4.5rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 7rem)",
        }}
      >

        {/* ===== ABA HOME ===== */}
        {aba === "home" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: T.avatarBg, color: "#7C3AED" }}
                >
                  {iniciais(nome)}
                </div>
                <div>
                  <p className="text-xs" style={{ color: T.textSecondary }}>Olá, {nome ? nome.split(" ")[0] : "tudo bem"}!</p>
                  <p className="text-sm font-semibold" style={{ color: T.text }}>Bem-vindo(a) de volta</p>
                </div>
              </div>
            </div>

            {/* Cartão de saldo */}
            <div
              className="rounded-3xl p-6 mb-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)" }}
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />

              <div className="flex items-center justify-between mb-6 relative">
                <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="p-1 opacity-80 hover:opacity-100">
                  <ChevronLeft size={18} color="#fff" />
                </button>
                <span className="text-xs tracking-wide font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {MESES_LONGOS[mes]} {ano}
                </span>
                <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="p-1 opacity-80 hover:opacity-100">
                  <ChevronRight size={18} color="#fff" />
                </button>
              </div>

              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>Total gasto no mês</p>
              <p className="text-4xl font-extrabold text-white mb-1">{formatoMoeda(total)}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>{doMes.length} lançamentos</p>
            </div>

            {salario && parseFloat(salario.replace(",", ".")) > 0 && total > parseFloat(salario.replace(",", ".")) && (
              <div
                className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                style={{ background: "#D61616" }}
              >
                <AlertTriangle size={32} color="#fff" className="shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">Você ultrapassou o limite de gastos</p>
                  <p className="text-xs mt-0.5 text-white" style={{ opacity: 0.9 }}>
                    Gasto de {formatoMoeda(total)} contra um salário de {formatoMoeda(parseFloat(salario.replace(",", ".")))}
                  </p>
                </div>
              </div>
            )}

            {/* Ações rápidas */}
            <div className="flex justify-between mb-8 px-1">
              {[
                { label: "Adicionar", icone: Plus, acao: abrirModal },
                { label: "Cartões", icone: CreditCard, acao: () => setAba("card") },
                { label: "Stat", icone: PieChartIcon, acao: () => setAba("stat") },
                { label: "Moeda", icone: Wallet, acao: () => setAba("profile") },
              ].map((item) => (
                <button key={item.label} onClick={item.acao} className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: "#7C3AED" }}
                  >
                    <item.icone size={22} color="#fff" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: T.pillText }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Transações recentes */}
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Lançamentos recentes</p>
              {carregando ? (
                <p className="text-sm" style={{ color: T.textSecondary }}>Carregando...</p>
              ) : doMes.length === 0 ? (
                <div className="rounded-2xl p-6 text-center" style={{ background: T.card }}>
                  <p className="text-sm" style={{ color: T.textSecondary }}>Nenhum gasto lançado neste mês ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doMes.slice(0, 6).map((l) => (
                    <div key={l.id} className="group flex items-center justify-between rounded-2xl p-3.5" style={{ background: T.card }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${corCategoria(l.categoria)}1A` }}
                        >
                          {(() => {
                            const Icone = iconeCategoria(l.categoria);
                            return <Icone size={17} color={corCategoria(l.categoria)} strokeWidth={2} />;
                          })()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{l.descricao}</p>
                          <p className="text-[11px]" style={{ color: T.textSecondary }}>
                            {l.cartao ? `${l.cartao} · ` : ""}{String(new Date(l.data).getDate()).padStart(2, "0")}/{String(mes + 1).padStart(2, "0")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold" style={{ color: T.text }}>{formatoMoeda(l.valor)}</span>
                        <button onClick={() => excluir(l.id)} className="opacity-0 group-hover:opacity-100 p-1">
                          <Trash2 size={14} color="#EC4899" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== ABA CARTÕES ===== */}
        {aba === "card" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-extrabold" style={{ color: T.text }}>Meus cartões</h1>
              <button onClick={() => abrirModalCartao(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#7C3AED" }}>
                <Plus size={18} color="#fff" />
              </button>
            </div>

            {cartoes.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: T.card }}>
                <CreditCard size={28} color="#C4B5FD" className="mx-auto mb-3" />
                <p className="text-sm mb-4" style={{ color: T.textSecondary }}>Você ainda não tem cartões cadastrados.</p>
                <button onClick={() => abrirModalCartao(null)} className="text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "#7C3AED" }}>
                  Adicionar cartão
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartoes.map((c) => {
                  const info = cartaoInfo[c] || {};
                  const cor = info.cor || CORES_CARTAO[0].valor;
                  const bandeira = info.bandeira || BANDEIRAS[0];
                  const corTexto = corTextoContraste(cor);
                  const corTextoSuave = corTexto === "#141414" ? "rgba(20,20,20,0.65)" : "rgba(255,255,255,0.65)";
                  const corCirculo = corTexto === "#141414" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
                  return (
                    <div
                      key={c}
                      onClick={() => abrirModalCartao(c)}
                      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer"
                      style={{ background: `linear-gradient(135deg, ${cor}, ${escurecerCor(cor)})` }}
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full" style={{ background: corCirculo }} />
                      <div className="flex items-center justify-between mb-8 relative">
                        <p className="text-sm font-semibold" style={{ color: corTexto }}>{c}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); removerCartao(c); }}
                          className="opacity-70 hover:opacity-100"
                        >
                          <Trash2 size={15} color={corTexto} />
                        </button>
                      </div>
                      <p className="text-[11px] mb-1" style={{ color: corTextoSuave }}>Gasto em {MESES_LONGOS[mes]}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-extrabold" style={{ color: corTexto }}>{formatoMoeda(porCartao[c] || 0)}</p>
                        <span className="text-xs font-black italic tracking-wide opacity-90" style={{ color: corTexto }}>{bandeira.toUpperCase()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== ABA ESTATÍSTICA ===== */}
        {aba === "stat" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-extrabold" style={{ color: T.text }}>Estatística</h1>
              {visaoStat === "mensal" ? (
                <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: T.card }}>
                  <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="p-1">
                    <ChevronLeft size={16} color="#7C3AED" />
                  </button>
                  <span className="text-xs font-semibold px-1" style={{ color: T.text }}>{MESES_LONGOS[mes].slice(0, 3)} {ano}</span>
                  <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="p-1">
                    <ChevronRight size={16} color="#7C3AED" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: T.card }}>
                  <button onClick={() => mudarAno(-1)} aria-label="Ano anterior" className="p-1">
                    <ChevronLeft size={16} color="#7C3AED" />
                  </button>
                  <span className="text-xs font-semibold px-1" style={{ color: T.text }}>{ano}</span>
                  <button onClick={() => mudarAno(1)} aria-label="Próximo ano" className="p-1">
                    <ChevronRight size={16} color="#7C3AED" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setVisaoStat("mensal")}
                className="flex-1 text-sm font-semibold py-2 rounded-full"
                style={{
                  background: visaoStat === "mensal" ? "#7C3AED" : T.card,
                  color: visaoStat === "mensal" ? "#fff" : T.pillText,
                }}
              >
                Mensal
              </button>
              <button
                onClick={() => setVisaoStat("anual")}
                className="flex-1 text-sm font-semibold py-2 rounded-full"
                style={{
                  background: visaoStat === "anual" ? "#7C3AED" : T.card,
                  color: visaoStat === "anual" ? "#fff" : T.pillText,
                }}
              >
                Anual
              </button>
            </div>

            {visaoStat === "mensal" ? (
              porCategoria.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: T.card }}>
                <p className="text-sm" style={{ color: T.textSecondary }}>Sem gastos neste mês pra mostrar no gráfico.</p>
              </div>
            ) : (
              <>
                <div className="rounded-3xl p-6 mb-6" style={{ background: T.card }}>
                  <p className="text-xs mb-4" style={{ color: T.textSecondary }}>Total de gastos</p>
                  <div className="relative" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ nome: "fundo", valor: 1 }]}
                          dataKey="valor"
                          innerRadius={78}
                          outerRadius={95}
                          fill={T.ring}
                          stroke="none"
                          isAnimationActive={false}
                        >
                          <Cell fill={T.ring} />
                        </Pie>
                        <Pie
                          data={porCategoria.map(([nome, valor]) => ({ nome, valor }))}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius={78}
                          outerRadius={95}
                          paddingAngle={0}
                          strokeWidth={0}
                        >
                          {porCategoria.map(([nome]) => (
                            <Cell key={nome} fill={corCategoria(nome)} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[11px]" style={{ color: T.textSecondary }}>Total</p>
                      <p className="text-xl font-extrabold" style={{ color: T.text }}>{formatoMoeda(total)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Por categoria</p>
                <div className="space-y-2">
                  {porCategoria.map(([cat, valor]) => (
                    <div key={cat} className="flex items-center justify-between rounded-2xl p-3.5" style={{ background: T.card }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${corCategoria(cat)}1A` }}
                        >
                          {(() => {
                            const Icone = iconeCategoria(cat);
                            return <Icone size={14} color={corCategoria(cat)} strokeWidth={2} />;
                          })()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: T.text }}>{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${corCategoria(cat)}1A`, color: corCategoria(cat) }}
                        >
                          {((valor / total) * 100).toFixed(0)}%
                        </span>
                        <span className="text-sm font-bold w-24 text-right" style={{ color: T.text }}>{formatoMoeda(valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
              )
            ) : (
              <div className="rounded-3xl p-6" style={{ background: T.card }}>
                <p className="text-xs mb-1" style={{ color: T.textSecondary }}>Total no ano</p>
                <p className="text-2xl font-extrabold mb-4" style={{ color: T.text }}>{formatoMoeda(totalAno)}</p>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={porMesECategoria} margin={{ top: 5, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.track} vertical={false} />
                      <XAxis
                        dataKey="mes"
                        tick={{ fontSize: 11, fill: T.textSecondary }}
                        axisLine={false}
                        tickLine={false}
                        padding={{ left: 12, right: 12 }}
                      />
                      <YAxis hide width={0} />
                      <Tooltip
                        formatter={(valor) => formatoMoeda(valor)}
                        contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: T.text }}
                      />
                      {categoriasAtivasAno.map((c) => (
                        <Line
                          key={c.nome}
                          type="monotone"
                          dataKey={c.nome}
                          name={c.nome}
                          stroke={c.cor}
                          strokeWidth={2.5}
                          dot={{ r: 2.5, fill: c.cor }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {categoriasAtivasAno.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                    {categoriasAtivasAno.map((c) => (
                      <div key={c.nome} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.cor }} />
                        <span className="text-[11px]" style={{ color: T.textSecondary }}>{c.nome}</span>
                      </div>
                    ))}
                  </div>
                )}

                {totalAno === 0 && (
                  <p className="text-sm text-center mt-2" style={{ color: T.textSecondary }}>Sem gastos registrados em {ano}.</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== ABA PERFIL ===== */}
        {aba === "profile" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-extrabold" style={{ color: T.text }}>Perfil</h1>
              <button
                onClick={() => alternarTema(!escuro)}
                aria-label="Alternar modo escuro"
                className="relative w-16 h-9 rounded-full transition-colors duration-300"
                style={{ background: escuro ? "#0B0A14" : "#E5E3ED" }}
              >
                <div
                  className="absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 ease-in-out"
                  style={{
                    background: T.card,
                    transform: escuro ? "translateX(28px)" : "translateX(0px)",
                  }}
                >
                  {escuro ? <Moon size={15} color="#C7C3DA" /> : <Sun size={15} color="#F59E0B" />}
                </div>
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                style={{ background: T.avatarBg, color: "#7C3AED" }}
              >
                {iniciais(nome)}
              </div>
            </div>

            <div className="rounded-2xl p-5 mb-4" style={{ background: T.card }}>
              <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Seu nome</label>
              <input
                value={nome}
                onChange={(e) => salvarNome(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full mt-2 bg-transparent border-b py-2 text-sm outline-none"
                style={{ borderColor: T.border, color: T.text }}
              />
            </div>

            <div className="rounded-2xl p-5 mb-4" style={{ background: T.card }}>
              <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Salário mensal ({moeda.codigo})</label>
              <input
                inputMode="decimal"
                value={salario}
                onChange={(e) => salvarSalario(e.target.value)}
                placeholder="Ex: 5000,00"
                className="w-full mt-2 bg-transparent border-b py-2 text-sm outline-none"
                style={{ borderColor: T.border, color: T.text }}
              />
              <p className="text-[11px] mt-2" style={{ color: T.textSecondary }}>Você recebe um aviso quando os gastos do mês passarem esse valor.</p>
            </div>

            <div className="rounded-2xl p-5 mb-4" style={{ background: T.card }}>
              <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Moeda</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {MOEDAS.map((m) => (
                  <button
                    key={m.codigo}
                    onClick={() => mudarMoeda(m.codigo)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: moeda.codigo === m.codigo ? "#7C3AED" : T.track,
                      color: moeda.codigo === m.codigo ? "#fff" : T.pillText,
                    }}
                  >
                    {m.nome} ({m.codigo})
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: T.card }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: T.text }}>Total de lançamentos</p>
                <p className="text-[11px]" style={{ color: T.textSecondary }}>Em todos os meses</p>
              </div>
              <span className="text-lg font-extrabold" style={{ color: "#7C3AED" }}>{lancamentos.length}</span>
            </div>
          </>
        )}

        {erro && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full text-white" style={{ background: "#EC4899" }}>
            {erro}
          </div>
        )}
      </div>

      {/* Barra de navegação inferior */}
      <div className="fixed left-0 right-0" style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.25rem)" }}>
        <div className="max-w-md mx-auto px-5">
        <div className="rounded-3xl shadow-lg flex items-center justify-between px-4 py-2.5" style={{ background: T.card }}>
          {NAV.slice(0, 2).map((item) => {
            const ativo = aba === item.id;
            return (
              <button key={item.id} onClick={() => setAba(item.id)} aria-label={item.label} className="flex flex-col items-center gap-1 px-2 py-1">
                <item.icone size={20} color={ativo ? "#7C3AED" : T.navInactive} strokeWidth={2.2} />
                <span className="text-[10px] font-medium" style={{ color: ativo ? "#7C3AED" : T.navInactive }}>{item.label}</span>
              </button>
            );
          })}

          <button onClick={abrirModal} aria-label="Adicionar gasto" className="p-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "#7C3AED" }}>
              <Plus size={22} color="#fff" strokeWidth={2.5} />
            </div>
          </button>

          {NAV.slice(2).map((item) => {
            const ativo = aba === item.id;
            return (
              <button key={item.id} onClick={() => setAba(item.id)} aria-label={item.label} className="flex flex-col items-center gap-1 px-2 py-1">
                <item.icone size={20} color={ativo ? "#7C3AED" : T.navInactive} strokeWidth={2.2} />
                <span className="text-[10px] font-medium" style={{ color: ativo ? "#7C3AED" : T.navInactive }}>{item.label}</span>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Modal de novo lançamento */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(30,27,46,0.5)" }}
          onClick={() => setModalAberto(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvarLancamento}
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6"
            style={{ background: T.card, paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold" style={{ color: T.text }}>Novo gasto</h2>
              <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar">
                <X size={18} color={T.textSecondary} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Descrição</label>
                <input
                  autoFocus
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Supermercado"
                  className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Valor ({moeda.codigo})</label>
                  <input
                    inputMode="decimal"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    placeholder="0,00"
                    className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                    style={{ borderColor: T.border, color: T.text }}
                  />
                </div>
                <div className="w-20">
                  <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Dia</label>
                  <input
                    inputMode="numeric"
                    value={form.dia}
                    onChange={(e) => setForm({ ...form, dia: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                    style={{ borderColor: T.border, color: T.text }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Categoria</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIAS.map((c) => (
                    <button
                      type="button"
                      key={c.nome}
                      onClick={() => setForm({ ...form, categoria: c.nome })}
                      className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5"
                      style={{
                        background: form.categoria === c.nome ? c.cor : T.track,
                        color: form.categoria === c.nome ? "#fff" : T.pillText,
                      }}
                    >
                      <c.icone size={13} strokeWidth={2.2} />
                      {c.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Cartão</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cartoes.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, cartao: c })}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{
                        background: form.cartao === c ? "#7C3AED" : T.track,
                        color: form.cartao === c ? "#fff" : T.pillText,
                      }}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={adicionarCartao}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ border: "1px dashed #C4B5FD", color: "#7C3AED" }}
                  >
                    + novo
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              Salvar gasto
            </button>
          </form>
        </div>
      )}

      {/* Modal de bandeira e cor do cartão */}
      {modalCartaoAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(30,27,46,0.5)" }}
          onClick={() => setModalCartaoAberto(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvarFormCartao}
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6"
            style={{ background: T.card, paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold" style={{ color: T.text }}>
                {editandoCartao ? "Editar cartão" : "Novo cartão"}
              </h2>
              <button type="button" onClick={() => setModalCartaoAberto(false)} aria-label="Fechar">
                <X size={18} color={T.textSecondary} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Nome do cartão</label>
                <input
                  autoFocus={!editandoCartao}
                  disabled={!!editandoCartao}
                  value={formCartao.nome}
                  onChange={(e) => setFormCartao({ ...formCartao, nome: e.target.value })}
                  placeholder="Ex: Nubank"
                  className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none disabled:opacity-60"
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Bandeira</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {BANDEIRAS.map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setFormCartao({ ...formCartao, bandeira: b })}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{
                        background: formCartao.bandeira === b ? "#7C3AED" : T.track,
                        color: formCartao.bandeira === b ? "#fff" : T.pillText,
                      }}
                    >
                      {b}
                    </button>
                  ))}

                  {formCartao.bandeira && !BANDEIRAS.includes(formCartao.bandeira) && (
                    <button
                      type="button"
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ background: "#7C3AED", color: "#fff" }}
                    >
                      {formCartao.bandeira}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const b = prompt("Nome da bandeira:");
                      if (b && b.trim()) setFormCartao({ ...formCartao, bandeira: b.trim() });
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                    style={{ border: `1px dashed ${T.textSecondary}`, color: T.textSecondary }}
                  >
                    + personalizada
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: T.textSecondary }}>Cor</label>
                <div className="flex flex-wrap gap-3 mt-3">
                  {CORES_CARTAO.map((cr) => (
                    <button
                      type="button"
                      key={cr.valor}
                      onClick={() => setFormCartao({ ...formCartao, cor: cr.valor })}
                      aria-label={cr.nome}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: cr.valor,
                        border: formCartao.cor === cr.valor ? `3px solid ${T.text}` : "3px solid transparent",
                        outline: formCartao.cor === cr.valor ? `1px solid ${cr.valor}` : "none",
                      }}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => corPersonalizadaRef.current?.click()}
                    aria-label="Escolher cor personalizada"
                    className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: CORES_CARTAO.some((cr) => cr.valor === formCartao.cor)
                        ? T.track
                        : formCartao.cor,
                      border: !CORES_CARTAO.some((cr) => cr.valor === formCartao.cor)
                        ? `3px solid ${T.text}`
                        : `1px dashed ${T.textSecondary}`,
                    }}
                  >
                    {CORES_CARTAO.some((cr) => cr.valor === formCartao.cor) && (
                      <Plus size={16} color={T.textSecondary} />
                    )}
                    <input
                      ref={corPersonalizadaRef}
                      type="color"
                      value={formCartao.cor}
                      onChange={(e) => setFormCartao({ ...formCartao, cor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </button>
                </div>
              </div>

              <div
                className="rounded-2xl p-4 mt-2"
                style={{ background: `linear-gradient(135deg, ${formCartao.cor}, ${escurecerCor(formCartao.cor)})` }}
              >
                <p className="text-xs font-semibold" style={{ color: corTextoContraste(formCartao.cor) }}>{formCartao.nome || "Nome do cartão"}</p>
                <p className="text-[10px] font-black italic opacity-90 mt-3" style={{ color: corTextoContraste(formCartao.cor) }}>{formCartao.bandeira.toUpperCase()}</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              {editandoCartao ? "Salvar alterações" : "Adicionar cartão"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
