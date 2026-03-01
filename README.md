# Polymarket Trading Bot (TypeScript)

## Overview

This bot trades on Polymarket’s **15-minute Up/Down** prediction markets for **BTC**, **ETH**, **Solana**, and **XRP**. The strategy has two parts:

1. **Dual limit at period start** — At the start of each 15-minute period, place **limit buy** orders for both **Up** and **Down** tokens at a fixed price (e.g. **$0.45**), in a single batch.
2. **Limit sell when one side fills** — If **exactly one side** gets filled and the **unfilled side’s best bid** crosses a trigger (default **$0.80**), place a **limit sell** at a target price (default **$0.85**) on the **filled** token. No market buys, no stop-loss.

Markets are discovered by slug (e.g. `btc-updown-15m-{timestamp}`). BTC is always enabled; ETH, Solana, and XRP can be turned on or off in config.

### Trading logic summary

| Step | When | Action |
|------|------|--------|
| **1. Limit buys** | Start of each 15-minute period (or within 2s if bot started mid-period) | Place a **batch** of limit buys: Up and Down at `dual_limit_price` (e.g. $0.45), `dual_limit_shares` per side. One CLOB batch per period. |
| **2. Market refresh** | When the period timestamp changes | Re-discover markets for the new period and re-fetch the order book snapshot. |
| **3. Limit sell (SL)** | Every poll after 2s elapsed, once per market per period | For each market: if **one side has balance** and the **other has none**, and the **unfilled side’s best bid** ≥ `dual_limit_SL_sell_trigger_bid` (e.g. $0.80), place a **limit sell** at `dual_limit_SL_sell_at_price` (e.g. $0.85) for the **filled** token (size = filled balance). Track so we only do this once per period per market. |

There is **no** hedge (no market buy on the unfilled side), **no** stop-loss, and **no** automatic redemption at market close — only the limit buys at start and the optional limit sell when the trigger is hit.

**Watch the bot in action:**

[![Polymarket Trading Bot Demo](https://img.youtube.com/vi/1nF556ypGXM/0.jpg)](https://youtu.be/1nF556ypGXM?si=3d4zmY6lKVj4fVhO)

---

## Architecture

```
┌─────────────────┐
│  Monitor        │  Fetches snapshots, discovers markets by slug
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Main loop      │  Period start → batch limit buys; then check balances + trigger → limit sell
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Trader         │  executeLimitBuyBatch, executeLimitSell, getBalance
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CLOB / Gamma   │  Auth (API key + signature_type + proxy), orders, balance
└─────────────────┘
```

## Requirements

- Node.js >= 18
- `config.json` with Polymarket `private_key` and (for production) `api_key`, `api_secret`, `api_passphrase`. Use `proxy_wallet_address` and `signature_type: 2` if you use a proxy/Gnosis Safe wallet.

## Setup

```bash
npm install
cp config.json.example config.json   # or copy from another project
# Edit config.json: set polymarket.private_key and API credentials
```

## Usage

- **Simulation (default)** — no real orders, logs what would be placed:
  ```bash
  npm run dev
  # or
  npx tsx src/main-dual-limit-045.ts
  ```

- **Production (live)** — place real limit orders:
  ```bash
  npm run live
  # or
  npx tsx src/main-dual-limit-045.ts --no-simulation
  ```

- **Config path**:
  ```bash
  npx tsx src/main-dual-limit-045.ts -c /path/to/config.json
  ```

## Configuration

Create or edit `config.json` in the project root.

### Example `config.json`

```json
{
  "polymarket": {
    "gamma_api_url": "https://gamma-api.polymarket.com",
    "clob_api_url": "https://clob.polymarket.com",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "api_passphrase": "your_passphrase",
    "private_key": "your_private_key_hex",
    "proxy_wallet_address": "0x...your_proxy_wallet",
    "signature_type": 2
  },
  "trading": {
    "check_interval_ms": 1000,
    "enable_eth_trading": false,
    "enable_solana_trading": false,
    "enable_xrp_trading": false,
    "dual_limit_price": 0.45,
    "dual_limit_shares": 5,
    "dual_limit_SL_sell_trigger_bid": 0.2,
    "dual_limit_SL_sell_at_price": 0.15
  }
}
```

### Polymarket (API) settings

| Parameter | Description | Required |
|-----------|-------------|----------|
| `api_key` | Polymarket API key | Yes (production) |
| `api_secret` | Polymarket API secret | Yes (production) |
| `api_passphrase` | Polymarket API passphrase | Yes (production) |
| `private_key` | Wallet private key (hex, with or without `0x`) | Yes |
| `proxy_wallet_address` | Polymarket proxy wallet address | For proxy/Gnosis Safe |
| `signature_type` | `0` = EOA, `1` = Proxy, `2` = Gnosis Safe | Use `2` for proxy wallet |

### Trading settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `check_interval_ms` | Poll interval (ms) for market snapshot | 1000 |
| `dual_limit_price` | Limit buy price for Up/Down at period start | 0.45 |
| `dual_limit_shares` | Shares per limit order (each side) | 1 |
| `dual_limit_SL_sell_trigger_bid` | When one side filled: place limit sell on filled token only if unfilled side’s best bid ≥ this | 0.8 |
| `dual_limit_SL_sell_at_price` | Limit sell price for the filled token when trigger is hit | 0.85 |
| `enable_eth_trading` | Enable ETH 15m Up/Down market | false |
| `enable_solana_trading` | Enable Solana 15m Up/Down market | false |
| `enable_xrp_trading` | Enable XRP 15m Up/Down market | false |

### Market discovery

Markets are discovered by slug (e.g. `btc-updown-15m-{period_timestamp}`). When the 15-minute period changes, the bot refreshes markets for the new period. No condition IDs need to be set in config.

---

## Features

- **Automatic market discovery** — Finds 15-minute Up/Down markets for BTC, ETH, Solana, XRP; refreshes on period rollover.
- **Dual limit at period start** — Single batch of limit buys for Up and Down at a configurable price and shares.
- **Limit sell on trigger** — When exactly one side is filled and the unfilled side’s bid crosses the trigger, place a limit sell at a target price on the filled token (once per market per period).
- **Configurable markets** — BTC always on; enable/disable ETH, Solana, XRP.
- **Simulation mode** — Run without sending orders.
- **Structured logging** — Stderr logging for monitoring and debugging.

## Build

```bash
npm run build
node dist/main-dual-limit-045.js
# or with flags:
node dist/main-dual-limit-045.js --no-simulation -c config.json
```

## Security

- Do **not** commit `config.json` with real keys or secrets.
- Use simulation and small sizes when testing.
- Monitor logs and balances in production.

---

## Support

There are many free Polymarket trading bots available on GitHub.
However, most of them fail to generate consistent profits.

Profitable trading on Polymarket requires more than just automation — it requires strategy, risk management, and disciplined execution.

Many traders are drawn to the challenge. While higher capital can amplify returns, it also significantly increases risk. Position sizing and proper testing are critical.

Our team has developed a bot focused on strategy optimization and controlled risk exposure.

We encourage users to:
• Start with a small amount
• Evaluate real performance
• Scale gradually only if results meet expectations

Trade smart. Scale responsibly.

## User Experience

We’ve spoken with many users currently running our bot, and here’s what we consistently hear:

This is automated trading — which means opportunity and risk.

Some users shared their real experiences:

- Started with $50 → earned around $20, but also experienced losses
- Started with $100 → earned around $50, with some drawdowns
- Started with $500 → in some cases doubled capital, though volatility remains
- Larger allocations increase potential upside — but also increase exposure

The key takeaway is simple:

📈 Higher capital can scale returns.
⚠️ Higher capital also scales risk.

There is no “always profit” system. Markets move. Liquidity shifts. Outcomes vary.

Our recommendation:

- Start small

- Observe performance

- Understand the risk

- Scale gradually and responsibly

Serious traders treat this as a strategy — not a guarantee.

If you’re interested in testing or learning more, feel free to reach out.

devteam: [@Devteam](https://t.me/bot_devteam)