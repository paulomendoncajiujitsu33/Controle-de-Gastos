import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, X,
  Home, PieChart as PieChartIcon, User, Wallet, AlertTriangle,
} from "lucide-react";

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CATEGORIAS = [
  { nome: "Alimentação", cor: "#7C3AED" },
  { nome: "Transporte", cor: "#F59E0B" },
  { nome: "Casa", cor: "#EC4899" },
  { nome: "Saúde", cor: "#22C55E" },
  { nome: "Lazer", cor: "#3B82F6" },
  { nome: "Assinaturas", cor: "#F97316" },
  { nome: "Outros", cor: "#94A3B8" },
];

const MOEDAS = [
  { codigo: "BRL", nome: "Real", locale: "pt-BR" },
  { codigo: "USD", nome: "Dólar", locale: "en-US" },
  { codigo: "EUR", nome: "Euro", locale: "de-DE" },
  { codigo: "AED", nome: "Dirham", locale: "ar-AE" },
  { codigo: "GBP", nome: "Libra", locale: "en-GB" },
];

function corCategoria(nome) {
  return (CATEGORIAS.find((c) => c.nome === nome) || CATEGORIAS[CATEGORIAS.length - 1]).cor;
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
const CHAVE_MOEDA = "controle-gastos:moeda";
const CHAVE_PERFIL = "controle-gastos:perfil";
const CHAVE_SALARIO = "controle-gastos:salario";

export default function App() {
  const hoje = new Date();
  const [aba, setAba] = useState("home");
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [lancamentos, setLancamentos] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [moeda, setMoeda] = useState(MOEDAS[0]);
  const [nome, setNome] = useState("");
  const [salario, setSalario] = useState("");
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
    setCarregando(false);
  }, []);

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

  function mudarMes(delta) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 0) { novoMes = 11; novoAno -= 1; }
    if (novoMes > 11) { novoMes = 0; novoAno += 1; }
    setMes(novoMes);
    setAno(novoAno);
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

  function removerCartao(c) {
    if (confirm(`Remover o cartão "${c}"? Os lançamentos feitos nele continuam salvos.`)) {
      salvarCartoes(cartoes.filter((x) => x !== c));
    }
  }

  const NAV = [
    { id: "home", label: "Home", icone: Home },
    { id: "card", label: "Cartões", icone: CreditCard },
    { id: "stat", label: "Stat", icone: PieChartIcon },
    { id: "profile", label: "Perfil", icone: User },
  ];

  return (
    <div className="min-h-screen w-full" style={{ background: "#F6F5FB", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <div className="max-w-md mx-auto px-5 pt-8 pb-28 min-h-screen">

        {/* ===== ABA HOME ===== */}
        {aba === "home" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "#EDE9FE", color: "#7C3AED" }}
                >
                  {iniciais(nome)}
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#9691A4" }}>Olá, {nome ? nome.split(" ")[0] : "tudo bem"}!</p>
                  <p className="text-sm font-semibold" style={{ color: "#1E1B2E" }}>Bem-vindo(a) de volta</p>
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
                style={{ background: "#FEE2E2", border: "1px solid #FCA5A5" }}
              >
                <AlertTriangle size={32} color="#DC2626" className="shrink-0" />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#DC2626" }}>Você ultrapassou o limite de gastos</p>
                  <p className="text-xs mt-0.5" style={{ color: "#B91C1C" }}>
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
                  <span className="text-[11px] font-medium" style={{ color: "#4B4759" }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Transações recentes */}
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: "#1E1B2E" }}>Lançamentos recentes</p>
              {carregando ? (
                <p className="text-sm" style={{ color: "#9691A4" }}>Carregando...</p>
              ) : doMes.length === 0 ? (
                <div className="rounded-2xl p-6 text-center bg-white">
                  <p className="text-sm" style={{ color: "#9691A4" }}>Nenhum gasto lançado neste mês ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doMes.slice(0, 6).map((l) => (
                    <div key={l.id} className="group flex items-center justify-between bg-white rounded-2xl p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${corCategoria(l.categoria)}1A` }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: corCategoria(l.categoria) }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#1E1B2E" }}>{l.descricao}</p>
                          <p className="text-[11px]" style={{ color: "#9691A4" }}>
                            {l.cartao ? `${l.cartao} · ` : ""}{String(new Date(l.data).getDate()).padStart(2, "0")}/{String(mes + 1).padStart(2, "0")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold" style={{ color: "#1E1B2E" }}>{formatoMoeda(l.valor)}</span>
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
              <h1 className="text-xl font-extrabold" style={{ color: "#1E1B2E" }}>Meus cartões</h1>
              <button onClick={adicionarCartao} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#7C3AED" }}>
                <Plus size={18} color="#fff" />
              </button>
            </div>

            {cartoes.length === 0 ? (
              <div className="rounded-2xl p-8 text-center bg-white">
                <CreditCard size={28} color="#C4B5FD" className="mx-auto mb-3" />
                <p className="text-sm mb-4" style={{ color: "#9691A4" }}>Você ainda não tem cartões cadastrados.</p>
                <button onClick={adicionarCartao} className="text-sm font-semibold px-4 py-2 rounded-full text-white" style={{ background: "#7C3AED" }}>
                  Adicionar cartão
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartoes.map((c, i) => (
                  <div
                    key={c}
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{
                      background: i % 2 === 0
                        ? "linear-gradient(135deg, #7C3AED, #5B21B6)"
                        : "linear-gradient(135deg, #1E1B2E, #3F3B54)",
                    }}
                  >
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="flex items-center justify-between mb-8 relative">
                      <p className="text-sm font-semibold text-white">{c}</p>
                      <button onClick={() => removerCartao(c)} className="opacity-70 hover:opacity-100">
                        <Trash2 size={15} color="#fff" />
                      </button>
                    </div>
                    <p className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>Gasto em {MESES_LONGOS[mes]}</p>
                    <p className="text-2xl font-extrabold text-white">{formatoMoeda(porCartao[c] || 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== ABA ESTATÍSTICA ===== */}
        {aba === "stat" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-extrabold" style={{ color: "#1E1B2E" }}>Estatística</h1>
              <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1">
                <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="p-1">
                  <ChevronLeft size={16} color="#7C3AED" />
                </button>
                <span className="text-xs font-semibold px-1" style={{ color: "#1E1B2E" }}>{MESES_LONGOS[mes].slice(0, 3)} {ano}</span>
                <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="p-1">
                  <ChevronRight size={16} color="#7C3AED" />
                </button>
              </div>
            </div>

            {porCategoria.length === 0 ? (
              <div className="rounded-2xl p-8 text-center bg-white">
                <p className="text-sm" style={{ color: "#9691A4" }}>Sem gastos neste mês pra mostrar no gráfico.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl p-6 mb-6">
                  <p className="text-xs mb-4" style={{ color: "#9691A4" }}>Total de gastos</p>
                  <div className="relative" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ nome: "fundo", valor: 1 }]}
                          dataKey="valor"
                          innerRadius={78}
                          outerRadius={95}
                          fill="#EDEBF5"
                          stroke="none"
                          isAnimationActive={false}
                        >
                          <Cell fill="#EDEBF5" />
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
                      <p className="text-[11px]" style={{ color: "#9691A4" }}>Total</p>
                      <p className="text-xl font-extrabold" style={{ color: "#1E1B2E" }}>{formatoMoeda(total)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm font-bold mb-3" style={{ color: "#1E1B2E" }}>Por categoria</p>
                <div className="space-y-2">
                  {porCategoria.map(([cat, valor]) => (
                    <div key={cat} className="flex items-center justify-between bg-white rounded-2xl p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: corCategoria(cat) }} />
                        <span className="text-sm font-medium" style={{ color: "#1E1B2E" }}>{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${corCategoria(cat)}1A`, color: corCategoria(cat) }}
                        >
                          {((valor / total) * 100).toFixed(0)}%
                        </span>
                        <span className="text-sm font-bold w-24 text-right" style={{ color: "#1E1B2E" }}>{formatoMoeda(valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ===== ABA PERFIL ===== */}
        {aba === "profile" && (
          <>
            <h1 className="text-xl font-extrabold mb-6" style={{ color: "#1E1B2E" }}>Perfil</h1>

            <div className="flex flex-col items-center mb-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                style={{ background: "#EDE9FE", color: "#7C3AED" }}
              >
                {iniciais(nome)}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 mb-4">
              <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Seu nome</label>
              <input
                value={nome}
                onChange={(e) => salvarNome(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full mt-2 bg-transparent border-b py-2 text-sm outline-none"
                style={{ borderColor: "#EDE9FE", color: "#1E1B2E" }}
              />
            </div>

            <div className="bg-white rounded-2xl p-5 mb-4">
              <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Salário mensal ({moeda.codigo})</label>
              <input
                inputMode="decimal"
                value={salario}
                onChange={(e) => salvarSalario(e.target.value)}
                placeholder="Ex: 5000,00"
                className="w-full mt-2 bg-transparent border-b py-2 text-sm outline-none"
                style={{ borderColor: "#EDE9FE", color: "#1E1B2E" }}
              />
              <p className="text-[11px] mt-2" style={{ color: "#9691A4" }}>Você recebe um aviso quando os gastos do mês passarem esse valor.</p>
            </div>

            <div className="bg-white rounded-2xl p-5 mb-4">
              <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Moeda</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {MOEDAS.map((m) => (
                  <button
                    key={m.codigo}
                    onClick={() => mudarMoeda(m.codigo)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: moeda.codigo === m.codigo ? "#7C3AED" : "#F6F5FB",
                      color: moeda.codigo === m.codigo ? "#fff" : "#4B4759",
                    }}
                  >
                    {m.nome} ({m.codigo})
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1E1B2E" }}>Total de lançamentos</p>
                <p className="text-[11px]" style={{ color: "#9691A4" }}>Em todos os meses</p>
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
      <div className="fixed bottom-6 left-0 right-0">
        <div className="max-w-md mx-auto px-5">
        <div className="bg-white rounded-3xl shadow-lg flex items-center justify-between px-4 py-2.5">
          {NAV.slice(0, 2).map((item) => {
            const ativo = aba === item.id;
            return (
              <button key={item.id} onClick={() => setAba(item.id)} aria-label={item.label} className="flex flex-col items-center gap-1 px-2 py-1">
                <item.icone size={20} color={ativo ? "#7C3AED" : "#C4C1D1"} strokeWidth={2.2} />
                <span className="text-[10px] font-medium" style={{ color: ativo ? "#7C3AED" : "#C4C1D1" }}>{item.label}</span>
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
                <item.icone size={20} color={ativo ? "#7C3AED" : "#C4C1D1"} strokeWidth={2.2} />
                <span className="text-[10px] font-medium" style={{ color: ativo ? "#7C3AED" : "#C4C1D1" }}>{item.label}</span>
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
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 bg-white"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold" style={{ color: "#1E1B2E" }}>Novo gasto</h2>
              <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar">
                <X size={18} color="#9691A4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Descrição</label>
                <input
                  autoFocus
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Supermercado"
                  className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                  style={{ borderColor: "#EDE9FE", color: "#1E1B2E" }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Valor ({moeda.codigo})</label>
                  <input
                    inputMode="decimal"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    placeholder="0,00"
                    className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                    style={{ borderColor: "#EDE9FE", color: "#1E1B2E" }}
                  />
                </div>
                <div className="w-20">
                  <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Dia</label>
                  <input
                    inputMode="numeric"
                    value={form.dia}
                    onChange={(e) => setForm({ ...form, dia: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                    style={{ borderColor: "#EDE9FE", color: "#1E1B2E" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Categoria</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIAS.map((c) => (
                    <button
                      type="button"
                      key={c.nome}
                      onClick={() => setForm({ ...form, categoria: c.nome })}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{
                        background: form.categoria === c.nome ? c.cor : "#F6F5FB",
                        color: form.categoria === c.nome ? "#fff" : "#4B4759",
                      }}
                    >
                      {c.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "#9691A4" }}>Cartão</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cartoes.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, cartao: c })}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{
                        background: form.cartao === c ? "#7C3AED" : "#F6F5FB",
                        color: form.cartao === c ? "#fff" : "#4B4759",
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
    </div>
  );
}
