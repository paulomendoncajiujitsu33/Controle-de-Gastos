import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, CreditCard, ChevronLeft, ChevronRight, X } from "lucide-react";

const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const CATEGORIAS = [
  { nome: "Alimentação", cor: "#C6A15B" },
  { nome: "Transporte", cor: "#7C9885" },
  { nome: "Casa", cor: "#8B7FA8" },
  { nome: "Saúde", cor: "#C4694F" },
  { nome: "Lazer", cor: "#6FA3C9" },
  { nome: "Assinaturas", cor: "#B08968" },
  { nome: "Outros", cor: "#8A93A6" },
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

const CHAVE_LANCAMENTOS = "controle-gastos:lancamentos";
const CHAVE_CARTOES = "controle-gastos:cartoes";
const CHAVE_MOEDA = "controle-gastos:moeda";

export default function App() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [lancamentos, setLancamentos] = useState([]);
  const [cartoes, setCartoes] = useState(["Nubank", "Inter"]);
  const [cartaoFiltro, setCartaoFiltro] = useState("Todos");
  const [moeda, setMoeda] = useState(MOEDAS[0]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: CATEGORIAS[0].nome,
    cartao: "Nubank",
    dia: String(hoje.getDate()).padStart(2, "0"),
  });

  function formatoMoeda(v) {
    return v.toLocaleString(moeda.locale, { style: "currency", currency: moeda.codigo });
  }

  // Carrega dados salvos do navegador
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_LANCAMENTOS);
      if (salvo) setLancamentos(JSON.parse(salvo));
    } catch (e) {}
    try {
      const salvoCartoes = localStorage.getItem(CHAVE_CARTOES);
      if (salvoCartoes) setCartoes(JSON.parse(salvoCartoes));
    } catch (e) {}
    try {
      const salvoMoeda = localStorage.getItem(CHAVE_MOEDA);
      if (salvoMoeda) {
        const encontrada = MOEDAS.find((m) => m.codigo === salvoMoeda);
        if (encontrada) setMoeda(encontrada);
      }
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
    const encontrada = MOEDAS.find((m) => m.codigo === codigo);
    if (!encontrada) return;
    setMoeda(encontrada);
    try {
      localStorage.setItem(CHAVE_MOEDA, codigo);
    } catch (e) {}
  }

  const doMes = useMemo(() => {
    return lancamentos.filter((l) => {
      const d = new Date(l.data);
      return d.getFullYear() === ano && d.getMonth() === mes && (cartaoFiltro === "Todos" || l.cartao === cartaoFiltro);
    });
  }, [lancamentos, ano, mes, cartaoFiltro]);

  const total = doMes.reduce((s, l) => s + l.valor, 0);

  const porCategoria = useMemo(() => {
    const mapa = {};
    doMes.forEach((l) => {
      mapa[l.categoria] = (mapa[l.categoria] || 0) + l.valor;
    });
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [doMes]);

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
      cartao: cartoes[0] || "Nubank",
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

  const maiorCategoria = porCategoria[0]?.[1] || 1;

  return (
    <div className="min-h-screen w-full" style={{ background: "#10141C", fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-md mx-auto px-5 pt-8 pb-28">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "#6B7280" }}>Extrato pessoal</p>
            <h1 className="font-display text-2xl" style={{ color: "#F2EFE6" }}>Controle de Gastos</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={moeda.codigo}
              onChange={(e) => mudarMoeda(e.target.value)}
              className="text-xs font-mono bg-transparent border rounded-full px-2 py-1 outline-none cursor-pointer"
              style={{ color: "#C6A15B", borderColor: "rgba(198,161,91,0.35)" }}
              aria-label="Selecionar moeda"
            >
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo} style={{ background: "#1B2233" }}>{m.codigo}</option>
              ))}
            </select>
            <CreditCard size={22} color="#C6A15B" strokeWidth={1.5} />
          </div>
        </div>

        {/* Cartão visual */}
        <div
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1B2233 0%, #232B40 55%, #1B2233 100%)",
            border: "1px solid rgba(198,161,91,0.25)",
          }}
        >
          <div
            className="absolute -right-10 -top-10 w-40 h-40 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(198,161,91,0.15) 0%, transparent 70%)" }}
          />
          <div className="flex items-center justify-between mb-8 relative">
            <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="p-1 opacity-70 hover:opacity-100 transition-opacity">
              <ChevronLeft size={18} color="#F2EFE6" />
            </button>
            <span className="text-xs tracking-[0.15em] uppercase font-mono" style={{ color: "#8A93A6" }}>
              {MESES_LONGOS[mes]} {ano}
            </span>
            <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="p-1 opacity-70 hover:opacity-100 transition-opacity">
              <ChevronRight size={18} color="#F2EFE6" />
            </button>
          </div>

          <p className="text-[11px] uppercase tracking-[0.2em] mb-1" style={{ color: "#8A93A6" }}>Total do mês</p>
          <p className="font-display text-4xl mb-6" style={{ color: "#F2EFE6", letterSpacing: "0.01em" }}>
            {formatoMoeda(total)}
          </p>

          <div className="flex items-center justify-between relative">
            <select
              value={cartaoFiltro}
              onChange={(e) => setCartaoFiltro(e.target.value)}
              className="text-xs font-mono bg-transparent border-none outline-none cursor-pointer"
              style={{ color: "#C6A15B" }}
            >
              <option value="Todos" style={{ background: "#1B2233" }}>Todos os cartões</option>
              {cartoes.map((c) => (
                <option key={c} value={c} style={{ background: "#1B2233" }}>{c}</option>
              ))}
            </select>
            <span className="text-[10px] font-mono" style={{ color: "#6B7280" }}>{doMes.length} lançamentos</span>
          </div>
        </div>

        {/* Resumo por categoria */}
        {porCategoria.length > 0 && (
          <div className="mb-7">
            <p className="text-[11px] tracking-[0.2em] uppercase mb-3" style={{ color: "#6B7280" }}>Por categoria</p>
            <div className="space-y-2.5">
              {porCategoria.map(([cat, valor]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs w-24 shrink-0 truncate" style={{ color: "#C7CAD1" }}>{cat}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(valor / maiorCategoria) * 100}%`, background: corCategoria(cat) }}
                    />
                  </div>
                  <span className="text-xs font-mono w-20 text-right shrink-0" style={{ color: "#8A93A6" }}>{formatoMoeda(valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de lançamentos */}
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase mb-3" style={{ color: "#6B7280" }}>Lançamentos</p>

          {carregando ? (
            <p className="text-sm" style={{ color: "#6B7280" }}>Carregando...</p>
          ) : doMes.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ border: "1px dashed rgba(255,255,255,0.12)" }}>
              <p className="text-sm" style={{ color: "#6B7280" }}>Nenhum gasto lançado neste mês ainda.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {doMes.map((l) => (
                <div
                  key={l.id}
                  className="group flex items-center justify-between py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: corCategoria(l.categoria) }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: "#F2EFE6" }}>{l.descricao}</p>
                      <p className="text-[11px] font-mono" style={{ color: "#6B7280" }}>
                        {String(new Date(l.data).getDate()).padStart(2, "0")}/{String(mes + 1).padStart(2, "0")} · {l.cartao} · {l.categoria}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono" style={{ color: "#F2EFE6" }}>{formatoMoeda(l.valor)}</span>
                    <button
                      onClick={() => excluir(l.id)}
                      aria-label="Excluir lançamento"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 size={14} color="#C4694F" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {erro && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full" style={{ background: "#C4694F", color: "#10141C" }}>
            {erro}
          </div>
        )}

        {/* Botão flutuante */}
        <button
          onClick={abrirModal}
          className="fixed bottom-8 right-1/2 translate-x-[calc(50%+0px)] sm:right-8 sm:translate-x-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "#C6A15B" }}
          aria-label="Adicionar gasto"
        >
          <Plus size={24} color="#10141C" strokeWidth={2.5} />
        </button>
      </div>

      {/* Modal de novo lançamento */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setModalAberto(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvarLancamento}
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6"
            style={{ background: "#1B2233", border: "1px solid rgba(198,161,91,0.2)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg" style={{ color: "#F2EFE6" }}>Novo gasto</h2>
              <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar">
                <X size={18} color="#8A93A6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider" style={{ color: "#6B7280" }}>Descrição</label>
                <input
                  autoFocus
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Supermercado"
                  className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F2EFE6" }}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] uppercase tracking-wider" style={{ color: "#6B7280" }}>Valor ({moeda.codigo})</label>
                  <input
                    inputMode="decimal"
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    placeholder="0,00"
                    className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none font-mono"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F2EFE6" }}
                  />
                </div>
                <div className="w-20">
                  <label className="text-[11px] uppercase tracking-wider" style={{ color: "#6B7280" }}>Dia</label>
                  <input
                    inputMode="numeric"
                    value={form.dia}
                    onChange={(e) => setForm({ ...form, dia: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    className="w-full mt-1 bg-transparent border-b py-1.5 text-sm outline-none font-mono"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "#F2EFE6" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider" style={{ color: "#6B7280" }}>Categoria</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATEGORIAS.map((c) => (
                    <button
                      type="button"
                      key={c.nome}
                      onClick={() => setForm({ ...form, categoria: c.nome })}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: form.categoria === c.nome ? c.cor : "transparent",
                        border: `1px solid ${form.categoria === c.nome ? c.cor : "rgba(255,255,255,0.15)"}`,
                        color: form.categoria === c.nome ? "#10141C" : "#C7CAD1",
                      }}
                    >
                      {c.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider" style={{ color: "#6B7280" }}>Cartão</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cartoes.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, cartao: c })}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: form.cartao === c ? "#C6A15B" : "transparent",
                        border: `1px solid ${form.cartao === c ? "#C6A15B" : "rgba(255,255,255,0.15)"}`,
                        color: form.cartao === c ? "#10141C" : "#C7CAD1",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const nome = prompt("Nome do novo cartão:");
                      if (nome && nome.trim() && !cartoes.includes(nome.trim())) {
                        const lista = [...cartoes, nome.trim()];
                        salvarCartoes(lista);
                        setForm({ ...form, cartao: nome.trim() });
                      }
                    }}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{ border: "1px dashed rgba(255,255,255,0.25)", color: "#8A93A6" }}
                  >
                    + novo
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 rounded-xl text-sm font-medium"
              style={{ background: "#C6A15B", color: "#10141C" }}
            >
              Salvar gasto
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
