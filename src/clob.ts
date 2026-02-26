import { ethers } from "ethers";
import type { Config } from "./config.js";

/**
 * Minimal internal CLOB client interface used by this bot.
 * The live implementation that talked to the Polymarket CLOB has been
 * removed for security reasons (the previous SDK depended on malware).
 *
 * All functions that would place/cancel orders now throw at runtime.
 * The bot is effectively **simulation-only** in this build.
 */
export interface ClobClient {
  // These mirror the methods that were previously used from clob-client-sdk.
  createAndPostOrder(...args: unknown[]): Promise<unknown>;
  createOrder(...args: unknown[]): Promise<unknown>;
  postOrders(...args: unknown[]): Promise<unknown>;
  createAndPostMarketOrder(...args: unknown[]): Promise<unknown>;
  getBalanceAllowance(...args: unknown[]): Promise<{ balance?: string }>;
  cancelOrder(...args: unknown[]): Promise<unknown>;
  getOpenOrders(...args: unknown[]): Promise<unknown>;
}

/** Create ethers Wallet from private key hex (with or without 0x) */
export function createWallet(privateKey: string): ethers.Wallet {
  const key = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return new ethers.Wallet(key);
}

/** Build authenticated CLOB client for order placement */
export async function createClobClient(cfg: Config["polymarket"]): Promise<ClobClient> {
  // Live CLOB trading has been disabled in this project because the previous
  // external SDK depended on a malicious package. We keep this function only
  // to satisfy the existing call sites; if it is ever invoked, make it clear
  // to the caller that live trading is not available.
  throw new Error(
    "Live CLOB trading is disabled in this build (clob-client-sdk was removed for security). Run in simulation mode only."
  );
}

export interface PlaceLimitOrderParams {
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  tickSize?: "0.1" | "0.01" | "0.001" | "0.0001";
  negRisk?: boolean;
}

/** Place a limit order using createAndPostOrder */
export async function placeLimitOrder(
  client: ClobClient,
  params: PlaceLimitOrderParams
): Promise<{ orderID: string; status: string }> {
  // This should never be called in simulation mode; if it is, make the failure explicit.
  throw new Error("placeLimitOrder is disabled (simulation-only build, no live CLOB client).");
}

export interface PlaceLimitOrderBatchResult {
  orderID: string;
  status: string;
  success?: boolean;
  errorMsg?: string;
}

/** Place multiple limit orders in one batch (single POST /orders). */
export async function placeLimitOrdersBatch(
  client: ClobClient,
  paramsList: PlaceLimitOrderParams[]
): Promise<PlaceLimitOrderBatchResult[]> {
  // Batch order placement is not available without a real CLOB client.
  throw new Error("placeLimitOrdersBatch is disabled (simulation-only build, no live CLOB client).");
}

/** Get balance for a conditional token (shares). Returns 0 if token_id missing or on error. */
export async function getBalance(client: ClobClient, tokenId: string): Promise<number> {
  // Without a live CLOB client, we cannot query balances; treat as 0.
  return 0;
}

export interface PlaceMarketOrderParams {
  tokenId: string;
  side: "BUY" | "SELL";
  /** BUY: USD amount to spend. SELL: shares to sell. */
  amount: number;
  orderType?: "FOK" | "FAK";
}

/** Place a market order (FOK or FAK). */
export async function placeMarketOrder(
  client: ClobClient,
  params: PlaceMarketOrderParams
): Promise<{ orderID: string; status: string }> {
  throw new Error("placeMarketOrder is disabled (simulation-only build, no live CLOB client).");
}

/** Cancel one order by ID. */
export async function cancelOrder(client: ClobClient, orderId: string): Promise<void> {
  throw new Error("cancelOrder is disabled (simulation-only build, no live CLOB client).");
}

/** Get open orders, optionally filtered by asset_id (token_id). */
export async function getOpenOrders(
  client: ClobClient,
  assetId?: string
): Promise<Array<{ id: string; asset_id: string; side: string; original_size: string; price: string }>> {
  // No real CLOB client → no open orders.
  return [];
}
