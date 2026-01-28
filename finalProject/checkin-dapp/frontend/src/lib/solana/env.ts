import { PublicKey } from "@solana/web3.js";

export type SolanaFrontendConfig = {
  rpcUrl: string;
  programId: PublicKey | null;
};

/**
 * 读取前端侧 Solana 配置（来自 NEXT_PUBLIC_* 环境变量）。
 */
export function getSolanaFrontendConfig(): SolanaFrontendConfig {
  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL?.trim() ?? "https://api.devnet.solana.com";

  const programIdText = process.env.NEXT_PUBLIC_PROGRAM_ID?.trim();
  const programId = programIdText ? new PublicKey(programIdText) : null;

  return { rpcUrl, programId };
}

