// =====================================================================
// Lógica de cálculo de taxas — réplica fiel do script original (bash).
// Validada caso a caso contra a saída do script.
// "Sempre arredonda pra cima" -> mantemos o mesmo truque do original:
//   printf "%.2f" de (valor*100 + 0.999)/100
// (esse método pode somar 1 centavo em valores exatos, exatamente como
//  no script — foi mantido de propósito para os resultados baterem.)
// =====================================================================

export const OPERADORAS = {
  PAGBANK: 1,
  INFINITYPAY: 2,
};

// --- PagBank -------------------------------------------------------
// Taxa total = intermediação fixa (1,80%) + parcelamento por faixa.
export const PAGBANK_INTERMEDIACAO = 1.8;

const PAGBANK_FAIXAS = [
  { min: 1, max: 1, parcelamento: 0 },
  { min: 2, max: 2, parcelamento: 2.19 },
  { min: 3, max: 6, parcelamento: 3.19 },
  { min: 7, max: 12, parcelamento: 6.89 },
  { min: 13, max: 18, parcelamento: 13.19 },
];

export const PAGBANK_MAX_PARCELAS = 18;

function pagbankParcelamento(parcelas) {
  const faixa = PAGBANK_FAIXAS.find((f) => parcelas >= f.min && parcelas <= f.max);
  return faixa ? faixa.parcelamento : null;
}

// --- InfinityPay ---------------------------------------------------
// Taxa por número de parcelas e prazo de recebimento.
// prazo 1 = "1 dia útil"  |  prazo 2 = "na hora"
export const INFINITYPAY_TAXAS = {
  1: { umDiaUtil: 3.15, naHora: 5.99 },
  2: { umDiaUtil: 5.39, naHora: 11.39 },
  3: { umDiaUtil: 6.12, naHora: 12.49 },
  4: { umDiaUtil: 6.85, naHora: 13.09 },
  5: { umDiaUtil: 7.57, naHora: 13.79 },
  6: { umDiaUtil: 8.28, naHora: 14.49 },
  7: { umDiaUtil: 8.99, naHora: 15.49 },
  8: { umDiaUtil: 9.69, naHora: 16.09 },
  9: { umDiaUtil: 10.18, naHora: 16.69 },
  10: { umDiaUtil: 11.06, naHora: 17.39 },
  11: { umDiaUtil: 11.74, naHora: 18.39 },
  12: { umDiaUtil: 12.4, naHora: 18.79 },
};

export const INFINITYPAY_MAX_PARCELAS = 12;

export const PRAZOS = {
  UM_DIA_UTIL: 1,
  NA_HORA: 2,
};

// --- Arredondamento (mesmo comportamento do script) ----------------
function arredondaParaCima(valor) {
  // equivalente a: printf "%.2f" "$(echo "($valor*100+0.999)/100" | bc -l)"
  return Math.round(valor * 100 + 0.999) / 100;
}

function arredonda2(valor) {
  return Math.round(valor * 100) / 100;
}

// --- Taxa total da operação ----------------------------------------
export function taxaTotal({ operadora, parcelas, prazo }) {
  if (operadora === OPERADORAS.PAGBANK) {
    const p = pagbankParcelamento(parcelas);
    if (p === null) return null;
    return PAGBANK_INTERMEDIACAO + p;
  }
  if (operadora === OPERADORAS.INFINITYPAY) {
    const linha = INFINITYPAY_TAXAS[parcelas];
    if (!linha) return null;
    return prazo === PRAZOS.NA_HORA ? linha.naHora : linha.umDiaUtil;
  }
  return null;
}

// --- Cálculo principal ---------------------------------------------
// Recebe o líquido desejado e devolve quanto cobrar do cliente.
export function calcular({ operadora, liquido, parcelas, prazo }) {
  const taxa = taxaTotal({ operadora, parcelas, prazo });
  if (taxa === null) return { erro: "Parcelamento inválido para a operadora." };
  if (!liquido || liquido <= 0) {
    return { taxaTotal: taxa, valorCobrar: 0, valorParcela: 0, taxaReais: 0, liquido: 0 };
  }

  const taxaDecimal = taxa / 100;
  let valorCobrar = liquido / (1 - taxaDecimal);
  valorCobrar = arredondaParaCima(valorCobrar);

  const taxaReais = arredonda2(valorCobrar - liquido);

  let valorParcela = valorCobrar / parcelas;
  valorParcela = arredondaParaCima(valorParcela);

  return { taxaTotal: taxa, valorCobrar, valorParcela, taxaReais, liquido };
}

export function maxParcelas(operadora) {
  return operadora === OPERADORAS.INFINITYPAY
    ? INFINITYPAY_MAX_PARCELAS
    : PAGBANK_MAX_PARCELAS;
}
