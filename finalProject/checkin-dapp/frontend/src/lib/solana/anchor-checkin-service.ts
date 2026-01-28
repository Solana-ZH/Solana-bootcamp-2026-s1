import { AnchorProvider, Program, type Idl, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Connection,
} from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/program.json";
import type { Badge, CheckInService, CheckInStats } from "@/lib/mock/checkin-service";

const USER_CHECKIN_SEED = "user_checkin";
const USER_BADGES_SEED = "user_badges";
const SECONDS_PER_DAY = 86_400;

const BADGE_THRESHOLDS = [
  { level: 1, id: "badge_1", name: "初出茅庐", description: "累计打卡 1 天", threshold: 1, emoji: "🌱" },
  { level: 2, id: "badge_2", name: "坚持不懈", description: "累计打卡 21 天", threshold: 21, emoji: "🔥" },
  { level: 3, id: "badge_3", name: "打卡大师", description: "累计打卡 30 天", threshold: 30, emoji: "🏆" },
];

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
const MINT_SIZE_BYTES = 82;

function getDayIndexFromNow(): number {
  return Math.floor(Date.now() / 1000 / SECONDS_PER_DAY);
}

function getUserCheckinPda(authority: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_CHECKIN_SEED), authority.toBuffer()],
    programId
  );
  return pda;
}

function getUserBadgesPda(authority: PublicKey, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_BADGES_SEED), authority.toBuffer()],
    programId
  );
  return pda;
}

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ata;
}

/**
 * 构造 SPL Token InitializeMint 指令（不依赖 @solana/spl-token）。
 */
function createInitializeMintInstruction(params: {
  mint: PublicKey;
  decimals: number;
  mintAuthority: PublicKey;
}): TransactionInstruction {
  const data = Buffer.alloc(1 + 1 + 32 + 1);
  data.writeUInt8(0, 0);
  data.writeUInt8(params.decimals, 1);
  params.mintAuthority.toBuffer().copy(data, 2);
  data.writeUInt8(0, 34);

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: params.mint, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * 构造 SPL Token MintTo 指令（amount 使用 u64 little-endian）。
 */
function createMintToInstruction(params: {
  mint: PublicKey;
  destination: PublicKey;
  authority: PublicKey;
  amount: bigint;
}): TransactionInstruction {
  const data = Buffer.alloc(1 + 8);
  data.writeUInt8(7, 0);
  data.writeBigUInt64LE(params.amount, 1);

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: params.mint, isSigner: false, isWritable: true },
      { pubkey: params.destination, isSigner: false, isWritable: true },
      { pubkey: params.authority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

/**
 * 构造 SPL Token SetAuthority 指令：将 mint authority 置空，确保后续无法继续增发。
 */
function createSetMintAuthorityToNoneInstruction(params: {
  mint: PublicKey;
  currentAuthority: PublicKey;
}): TransactionInstruction {
  const data = Buffer.alloc(3);
  data.writeUInt8(6, 0);
  data.writeUInt8(0, 1);
  data.writeUInt8(0, 2);

  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: params.mint, isSigner: false, isWritable: true },
      { pubkey: params.currentAuthority, isSigner: true, isWritable: false },
    ],
    data,
  });
}

/**
 * 构造 ATA Create 指令（不依赖 @solana/spl-token）。
 */
function createAssociatedTokenAccountInstruction(params: {
  payer: PublicKey;
  ata: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.ata, isSigner: false, isWritable: true },
      { pubkey: params.owner, isSigner: false, isWritable: false },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });
}

function parseBadgeLevel(level: number | string): number {
  if (typeof level === "number") return level;
  const match = String(level).match(/(\d+)$/);
  return match ? Number(match[1]) : NaN;
}

function isAccountNotFoundError(e: unknown): boolean {
  const message = String((e as any)?.message ?? "");
  return (
    message.includes("Account does not exist") ||
    message.includes("does not exist") ||
    message.includes("has no data")
  );
}

function isAlreadyCheckedInTodayError(e: unknown): boolean {
  const err = e as any;
  const code = err?.error?.errorCode?.code ?? err?.errorCode?.code;
  const message = String(err?.error?.errorMessage ?? err?.message ?? "");
  return code === "AlreadyCheckedInToday" || message.includes("今天已经打过卡");
}

function isBlockhashNotFoundError(e: unknown): boolean {
  const message = String((e as any)?.message ?? e ?? "");
  return message.toLowerCase().includes("blockhash not found");
}

function isProgramNotDeployedError(e: unknown): boolean {
  const message = String((e as any)?.message ?? e ?? "");
  return (
    message.includes("Attempt to load a program that does not exist") ||
    message.includes("ProgramAccountNotFound") ||
    message.includes("program account not found") ||
    message.includes("Program does not exist")
  );
}

function toUserFriendlyError(e: unknown): Error {
  if (e instanceof Error && isAlreadyCheckedInTodayError(e)) return e;
  if (isProgramNotDeployedError(e)) {
    return new Error(
      "当前 RPC 上找不到该 Program。请确认：1) 你的前端 RPC 指向本地链（NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8899）；2) solana-test-validator 没有在部署后重启/--reset；3) 重新执行 anchor deploy 并把 ProgramId 同步到前端。"
    );
  }
  if (isBlockhashNotFoundError(e)) {
    return new Error(
      "交易预检失败：Blockhash 不存在或已过期。请重新点击打卡，并尽快在钱包里确认；如果你在用本地链，确认 validator 正在运行且没有刚重启。"
    );
  }
  return e instanceof Error ? e : new Error(String(e ?? "未知错误"));
}

async function rpcWithBlockhashRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isBlockhashNotFoundError(e)) throw toUserFriendlyError(e);
    try {
      return await fn();
    } catch (e2) {
      throw toUserFriendlyError(e2);
    }
  }
}

export function createAnchorCheckInService(params: {
  connection: Connection;
  wallet: AnchorWallet;
  programId: PublicKey;
}): CheckInService {
  const provider = new AnchorProvider(params.connection, params.wallet, {
    commitment: "confirmed",
    preflightCommitment: "processed",
  });

  const idlWithAddress = { ...(idl as any), address: params.programId.toBase58() };
  const program = new Program(idlWithAddress as Idl, provider);

  let programAccountChecked = false;
  async function assertProgramDeployed(): Promise<void> {
    if (programAccountChecked) return;
    const info = await params.connection.getAccountInfo(params.programId);
    if (!info) {
      throw new Error(
        `在 RPC(${(params.connection as any)?.rpcEndpoint ?? "unknown"}) 上找不到 ProgramId(${params.programId.toBase58()})。通常是 validator 重启/--reset 后程序丢失，需要重新 anchor deploy。`
      );
    }
    if (!info.executable) {
      throw new Error(
        `ProgramId(${params.programId.toBase58()}) 在 RPC 上存在但不是可执行账户（executable=false）。请确认你填的是程序地址而不是普通账户地址。`
      );
    }
    programAccountChecked = true;
  }

  async function fetchUserCheckinAccount(authority: PublicKey) {
    await assertProgramDeployed();
    const pda = getUserCheckinPda(authority, params.programId);
    try {
      const account = (await (program as any).account.userCheckin.fetch(pda)) as any;
      return { pda, account };
    } catch (e) {
      if (isAccountNotFoundError(e)) return { pda, account: null as any };
      throw e;
    }
  }

  async function fetchUserBadgesAccount(authority: PublicKey) {
    await assertProgramDeployed();
    const pda = getUserBadgesPda(authority, params.programId);
    try {
      const account = (await (program as any).account.userBadges.fetch(pda)) as any;
      return { pda, account };
    } catch (e) {
      if (isAccountNotFoundError(e)) return { pda, account: null as any };
      throw e;
    }
  }

  async function buildCheckInTransaction(authority: PublicKey): Promise<Transaction> {
    const { pda, account } = await fetchUserCheckinAccount(authority);

    const tx = new Transaction();

    if (!account) {
      const initializeIx = await (program as any).methods
        .initializeUser()
        .accounts({
          authority,
          userCheckin: pda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(initializeIx);
    }

    const checkInIx = await (program as any).methods
      .checkIn()
      .accounts({
        authority,
        userCheckin: pda,
      })
      .instruction();
    tx.add(checkInIx);

    tx.feePayer = authority;
    const latestBlockhash = await params.connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latestBlockhash.blockhash;

    return tx;
  }

  async function getStats(address: string): Promise<CheckInStats> {
    const authority = params.wallet.publicKey;
    if (!authority) {
      return { totalCheckins: 0, streak: 0, lastCheckinTime: null, canCheckIn: false };
    }

    await assertProgramDeployed();
    const { account } = await fetchUserCheckinAccount(authority);
    if (!account) {
      return { totalCheckins: 0, streak: 0, lastCheckinTime: null, canCheckIn: true };
    }

    const totalCheckins = Number(account.totalCheckins ?? account.total_checkins ?? 0);
    const lastCheckinDayValue = account.lastCheckinDay ?? account.last_checkin_day ?? -1;
    const lastCheckinDay = BN.isBN(lastCheckinDayValue)
      ? lastCheckinDayValue.toNumber()
      : Number(lastCheckinDayValue);
    const streak = Number(account.streak ?? 0);

    const today = getDayIndexFromNow();
    const canCheckIn = lastCheckinDay !== today;
    const lastCheckinTime =
      lastCheckinDay >= 0 ? lastCheckinDay * SECONDS_PER_DAY * 1000 : null;

    if (authority.toBase58() !== address) {
      return { totalCheckins, streak, lastCheckinTime, canCheckIn };
    }

    return { totalCheckins, streak, lastCheckinTime, canCheckIn };
  }

  async function checkIn(address: string): Promise<boolean> {
    const authority = params.wallet.publicKey;
    if (!authority || authority.toBase58() !== address) {
      throw new Error("钱包地址不匹配，请重新连接钱包");
    }

    await assertProgramDeployed();

    try {
      await rpcWithBlockhashRetry(async () => {
        const tx = await buildCheckInTransaction(authority);
        await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
      });
      return true;
    } catch (e) {
      if (isAlreadyCheckedInTodayError(e)) {
        throw new Error("今天已经打过卡啦！明天再来吧~");
      }
      throw toUserFriendlyError(e);
    }
  }

  async function getHistory(address: string): Promise<{ date: string; checked: boolean }[]> {
    const authority = params.wallet.publicKey;
    if (!authority || authority.toBase58() !== address) return [];

    const stats = await getStats(address);
    const today = getDayIndexFromNow();
    const lastDay = stats.lastCheckinTime ? Math.floor(stats.lastCheckinTime / 1000 / SECONDS_PER_DAY) : -1;
    const checkedToday = lastDay === today;

    const result: { date: string; checked: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isToday = i === 0;
      result.push({
        date: d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
        checked: isToday ? checkedToday : false,
      });
    }
    return result;
  }

  async function getBadges(address: string): Promise<Badge[]> {
    const authority = params.wallet.publicKey;
    if (!authority || authority.toBase58() !== address) {
      return BADGE_THRESHOLDS.map((b) => ({
        level: b.level,
        id: b.id,
        name: b.name,
        description: b.description,
        imageUrl: b.emoji,
        threshold: b.threshold,
        unlocked: false,
        claimed: false,
      }));
    }

    const stats = await getStats(address);
    const total = stats.totalCheckins;

    const { account: badgesAccount } = await fetchUserBadgesAccount(authority);
    const claimedMask = Number(badgesAccount?.claimedMask ?? badgesAccount?.claimed_mask ?? 0);

    return BADGE_THRESHOLDS.map((b) => {
      const bit = 1 << (b.level - 1);
      return {
        level: b.level,
        id: b.id,
        name: b.name,
        description: b.description,
        imageUrl: b.emoji,
        threshold: b.threshold,
        unlocked: total >= b.threshold,
        claimed: (claimedMask & bit) !== 0,
      };
    });
  }

  /**
   * 领取徽章：在同一笔交易里先 mint 1 枚“不可增发”的 SPL Token（decimals=0），再调用链上 claim_badge 记录领取状态。
   */
  async function claimBadge(address: string, level: number): Promise<boolean> {
    const authority = params.wallet.publicKey;
    if (!authority || authority.toBase58() !== address) {
      throw new Error("钱包地址不匹配，请重新连接钱包");
    }

    await assertProgramDeployed();

    const parsedLevel = parseBadgeLevel(level);
    const badge = BADGE_THRESHOLDS.find((b) => b.level === parsedLevel);
    if (!badge) throw new Error("徽章等级不合法");

    const stats = await getStats(address);
    if (stats.totalCheckins < badge.threshold) {
      throw new Error("累计打卡次数不足，暂不可领取该徽章");
    }

    const { pda: userCheckinPda, account: userCheckinAccount } = await fetchUserCheckinAccount(authority);
    if (!userCheckinAccount) {
      throw new Error("未初始化打卡账户，请先完成一次打卡");
    }

    const { pda: userBadgesPda } = await fetchUserBadgesAccount(authority);

    const mint = Keypair.generate();
    const ata = getAssociatedTokenAddress(mint.publicKey, authority);
    const mintLamports = await params.connection.getMinimumBalanceForRentExemption(MINT_SIZE_BYTES);

    const tx = new Transaction();
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: authority,
        newAccountPubkey: mint.publicKey,
        lamports: mintLamports,
        space: MINT_SIZE_BYTES,
        programId: TOKEN_PROGRAM_ID,
      })
    );
    tx.add(createInitializeMintInstruction({ mint: mint.publicKey, decimals: 0, mintAuthority: authority }));
    tx.add(createAssociatedTokenAccountInstruction({ payer: authority, ata, owner: authority, mint: mint.publicKey }));
    tx.add(
      createMintToInstruction({
        mint: mint.publicKey,
        destination: ata,
        authority,
        amount: 1n,
      })
    );
    tx.add(createSetMintAuthorityToNoneInstruction({ mint: mint.publicKey, currentAuthority: authority }));

    const claimIx = await (program as any).methods
      .claimBadge(parsedLevel)
      .accounts({
        authority,
        userCheckin: userCheckinPda,
        userBadges: userBadgesPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    tx.add(claimIx);

    tx.feePayer = authority;
    const latestBlockhash = await params.connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latestBlockhash.blockhash;

    await rpcWithBlockhashRetry(async () => {
      await provider.sendAndConfirm(tx, [mint], { commitment: "confirmed" });
    });

    return true;
  }

  return { getStats, checkIn, claimBadge, getHistory, getBadges };
}
