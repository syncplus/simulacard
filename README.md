# Simulador de Taxas — Cartão

Calculadora web (Next.js) para descobrir **quanto cobrar no cartão** a fim de
receber um valor **líquido** desejado. Suporta **PagBank** e **InfinityPay**,
com a mesma lógica do script original (cálculo reverso / gross-up e
arredondamento sempre para cima).

## Rodar localmente

Pré-requisito: Node.js 18.18+ instalado.

```bash
npm install
npm run dev
```

Abra http://localhost:3000

Para gerar a versão de produção:

```bash
npm run build
npm start
```

## Publicar (deploy)

### Opção 1 — Vercel (mais simples, recomendado)
1. Crie uma conta gratuita em https://vercel.com
2. Suba este projeto para um repositório no GitHub.
3. No painel da Vercel: **Add New → Project → Import** o repositório.
4. Deixe as opções padrão (a Vercel detecta Next.js automaticamente) e clique **Deploy**.
5. Em ~1 minuto você recebe uma URL pública (ex.: `https://seu-projeto.vercel.app`)
   para enviar aos clientes.

Sem GitHub? Instale a CLI e rode na pasta do projeto:
```bash
npm i -g vercel
vercel
```

### Opção 2 — qualquer servidor Node
```bash
npm install
npm run build
npm start   # serve na porta 3000
```

## Onde mexer nas taxas

Todas as taxas e regras ficam em **`app/lib/taxas.js`**:

- `PAGBANK_INTERMEDIACAO` — intermediação fixa do PagBank (1,80%).
- `PAGBANK_FAIXAS` — parcelamento por faixa de parcelas do PagBank.
- `INFINITYPAY_TAXAS` — taxa por parcela e prazo (1 dia útil / na hora) da InfinityPay.

Basta editar os números; a interface e a tabela exibida se atualizam sozinhas.

## Como o cálculo funciona

A partir do líquido desejado:

```
valor_a_cobrar = liquido / (1 - taxa_total/100)
```

O resultado é arredondado **para cima** (mesmo método do script original),
garantindo que você receba pelo menos o líquido informado. A divisão pelo número
de parcelas mostra o valor de cada parcela.

> A lógica desta versão foi validada caso a caso contra a saída do script
> original em bash — os valores são idênticos.

## Estrutura

```
app/
  layout.js        # fontes e metadados
  page.js          # interface da calculadora
  globals.css      # estilo (tema escuro)
  lib/taxas.js     # TODAS as taxas e o cálculo
```
