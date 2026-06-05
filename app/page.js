"use client";

import { useMemo, useState } from "react";
import {
  OPERADORAS,
  PRAZOS,
  PAGBANK_INTERMEDIACAO,
  PAGBANK_MAX_PARCELAS,
  INFINITYPAY_MAX_PARCELAS,
  INFINITYPAY_TAXAS,
  calcular,
  taxaTotal,
  maxParcelas,
} from "./lib/taxas";

const brl = (n) =>
  (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (n) =>
  (n || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + "%";

const num = (n) =>
  (n || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Page() {
  const [operadora, setOperadora] = useState(OPERADORAS.PAGBANK);
  const [cents, setCents] = useState(10000); // R$ 100,00
  const [parcelas, setParcelas] = useState(1);
  const [prazo, setPrazo] = useState(PRAZOS.UM_DIA_UTIL);
  const [copiado, setCopiado] = useState(false);

  const liquido = cents / 100;
  const max = maxParcelas(operadora);

  const opcoesParcelas = useMemo(
    () => Array.from({ length: max }, (_, i) => i + 1),
    [max]
  );

  const resultado = useMemo(
    () => calcular({ operadora, liquido, parcelas, prazo }),
    [operadora, liquido, parcelas, prazo]
  );

  function trocarOperadora(op) {
    setOperadora(op);
    setCopiado(false);
    const novoMax = op === OPERADORAS.INFINITYPAY ? INFINITYPAY_MAX_PARCELAS : PAGBANK_MAX_PARCELAS;
    if (parcelas > novoMax) setParcelas(novoMax);
  }

  function onValor(e) {
    const digits = e.target.value.replace(/\D/g, "");
    setCents(digits ? parseInt(digits, 10) : 0);
    setCopiado(false);
  }

  function copiar() {
    if (resultado.erro) return;
    const nome = operadora === OPERADORAS.PAGBANK ? "PagBank" : "InfinityPay";
    const texto =
      `${nome} — ${parcelas}x\n` +
      `Valor a cobrar: ${brl(resultado.valorCobrar)}\n` +
      `Parcela: ${parcelas}x de ${brl(resultado.valorParcela)}\n` +
      `Taxa: ${pct(resultado.taxaTotal)} (${brl(resultado.taxaReais)})\n` +
      `Você recebe líquido: ${brl(resultado.liquido)}`;
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    });
  }

  const valorInput = (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <div className="grain" />
      <main className="wrap">
        <header className="header">
          <div className="logo">R$</div>
          <div>
            <div className="title">SimulaCard - Simulador de Taxas</div>
            <div className="subtitle">Quanto cobrar no cartão para receber o líquido</div>
          </div>
        </header>

        {/* Operadora */}
        <section className="section">
          <span className="label">Operadora</span>
          <div className="op-grid">
            <button
              className="op"
              data-active={operadora === OPERADORAS.PAGBANK}
              onClick={() => trocarOperadora(OPERADORAS.PAGBANK)}
            >
              <div className="op-name">PagBank</div>
              <div className="op-desc">Intermediação 1,80% + parcelamento</div>
            </button>
            <button
              className="op"
              data-active={operadora === OPERADORAS.INFINITYPAY}
              onClick={() => trocarOperadora(OPERADORAS.INFINITYPAY)}
            >
              <div className="op-name">InfinityPay</div>
              <div className="op-desc">Taxa por parcela e prazo</div>
            </button>
          </div>
        </section>

        {/* Prazo (somente InfinityPay) */}
        {operadora === OPERADORAS.INFINITYPAY && (
          <section className="section">
            <span className="label">Prazo de recebimento</span>
            <div className="seg">
              <button
                data-active={prazo === PRAZOS.UM_DIA_UTIL}
                onClick={() => {
                  setPrazo(PRAZOS.UM_DIA_UTIL);
                  setCopiado(false);
                }}
              >
                1 dia útil
              </button>
              <button
                data-active={prazo === PRAZOS.NA_HORA}
                onClick={() => {
                  setPrazo(PRAZOS.NA_HORA);
                  setCopiado(false);
                }}
              >
                Na hora
              </button>
            </div>
          </section>
        )}

        {/* Líquido + parcelas */}
        <section className="section">
          <span className="label">Quanto deseja receber líquido?</span>
          <div className="field">
            <span className="prefix">R$</span>
            <input
              inputMode="numeric"
              value={valorInput}
              onChange={onValor}
              aria-label="Valor líquido desejado"
            />
          </div>

          <div style={{ height: 12 }} />

          <span className="label">Parcelas</span>
          <div className="select-wrap">
            <select
              value={parcelas}
              onChange={(e) => {
                setParcelas(parseInt(e.target.value, 10));
                setCopiado(false);
              }}
            >
              {opcoesParcelas.map((p) => {
                const t = taxaTotal({ operadora, parcelas: p, prazo });
                return (
                  <option key={p} value={p}>
                    {p}x — taxa {t !== null ? num(t) + "%" : "—"}
                  </option>
                );
              })}
            </select>
          </div>
        </section>

        {/* Resultado */}
        {resultado.erro ? (
          <div className="error">{resultado.erro}</div>
        ) : (
          <div className="result">
            <div className="result-top">
              <div>
                <div className="result-cap">Valor a cobrar do cliente</div>
                <div className="result-big">{brl(resultado.valorCobrar)}</div>
                <div className="result-parcela">
                  {parcelas}x de <b>{brl(resultado.valorParcela)}</b>
                </div>
              </div>
              <button className="copy" data-done={copiado} onClick={copiar}>
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="k">Taxa total</div>
                <div className="v">{pct(resultado.taxaTotal)}</div>
              </div>
              <div className="stat">
                <div className="k">Taxa em R$</div>
                <div className="v">{brl(resultado.taxaReais)}</div>
              </div>
              <div className="stat">
                <div className="k">Você recebe</div>
                <div className="v accent">{brl(resultado.liquido)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de taxas */}
        <details>
          <summary>Ver tabela de taxas</summary>
          <div className="table">
            {operadora === OPERADORAS.PAGBANK ? (
              <table>
                <thead>
                  <tr>
                    <th>Parcelas</th>
                    <th>Parcelamento</th>
                    <th>Total*</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1x</td><td>0,00%</td><td>{num(PAGBANK_INTERMEDIACAO)}%</td></tr>
                  <tr><td>2x</td><td>2,19%</td><td>{num(PAGBANK_INTERMEDIACAO + 2.19)}%</td></tr>
                  <tr><td>3x a 6x</td><td>3,19%</td><td>{num(PAGBANK_INTERMEDIACAO + 3.19)}%</td></tr>
                  <tr><td>7x a 12x</td><td>6,89%</td><td>{num(PAGBANK_INTERMEDIACAO + 6.89)}%</td></tr>
                  <tr><td>13x a 18x</td><td>13,19%</td><td>{num(PAGBANK_INTERMEDIACAO + 13.19)}%</td></tr>
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Parcelas</th>
                    <th>1 dia útil</th>
                    <th>Na hora</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(INFINITYPAY_TAXAS).map(([p, t]) => (
                    <tr key={p}>
                      <td>{p}x</td>
                      <td>{num(t.umDiaUtil)}%</td>
                      <td>{num(t.naHora)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {operadora === OPERADORAS.PAGBANK && (
              <div style={{ color: "var(--muted-2)", fontSize: "0.72rem", marginTop: 10 }}>
                * Total = intermediação fixa de {num(PAGBANK_INTERMEDIACAO)}% + parcelamento.
              </div>
            )}
          </div>
        </details>

        <p className="foot">
          Os valores seguem as tabelas configuradas e o arredondamento sempre para cima.
          Confira as taxas vigentes com a operadora antes de fechar a venda.
        </p>

        <p className="credit">Desenvolvido por Thiago Corá — Sync Plus Tecnologia</p>
      </main>
    </>
  );
}
