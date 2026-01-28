import { AnchorProvider, Program, type Idl, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, type Connection } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/program.json";
import type { Badge, CheckInService, CheckInStats } from "@/lib/mock/checkin-service";

const USER_CHECKIN_SEED = "user_checkin";
const SECONDS_PER_DAY = 86_400;

const BADGE_THRESHOLDS = [
  { id: "badge_1", name: "初出茅庐", description: "累计打卡 7 天", threshold: 7, emoji: "🌱" },
  { id: "badge_2", name: "坚持不懈", description: "累计打卡 21 天", threshold: 21, emoji: "🔥" },
  { id: "badge_3", name: "打卡大师", description: "累计打卡 30 天", threshold: 30, emoji: "🏆" },
];

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

  async function ensureInitialized(authority: PublicKey) {
    const { pda, account } = await fetchUserCheckinAccount(authority);
    if (account) return pda;

    await rpcWithBlockhashRetry(async () => {
      await (program as any).methods
        .initializeUser()
        .accounts({
          authority,
          user_checkin: pda,
          system_program: SystemProgram.programId,
        })
        .rpc();
    });

    return pda;
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
    const userCheckin = await ensureInitialized(authority);

    try {
      await rpcWithBlockhashRetry(async () => {
        await (program as any).methods
          .checkIn()
          .accounts({
            authority,
            user_checkin: userCheckin,
          })
          .rpc();
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
    const stats = await getStats(address);
    const total = stats.totalCheckins;
    return BADGE_THRESHOLDS.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      imageUrl: b.emoji,
      threshold: b.threshold,
      unlocked: total >= b.threshold,
      claimed: false,
    }));
  }

  return { getStats, checkIn, getHistory, getBadges };
}
