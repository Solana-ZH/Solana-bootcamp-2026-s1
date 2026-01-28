import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Wallet, type Idl } from "@coral-xyz/anchor";
import { expect } from "chai";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

/**
 * 读取 Anchor build 生成的 IDL JSON，用于在测试里创建 Program 客户端。
 */
function loadIdl(): Idl {
  const filename = fileURLToPath(import.meta.url);
  const dir = dirname(filename);
  const raw = readFileSync(resolve(dir, "../target/idl/checkin_program.json"), "utf8");
  return JSON.parse(raw) as Idl;
}

const idl: Idl = loadIdl();

describe("checkin_program", () => {
  const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");
  const payer = anchor.web3.Keypair.generate();
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const program = new Program(idl, provider);
  const authority = payer.publicKey;
  const [userCheckin] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_checkin"), authority.toBuffer()],
    program.programId
  );
  const [userBadges] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user_badges"), authority.toBuffer()],
    program.programId
  );

  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      authority,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig, "confirmed");
  });

  it("Initialize, check-in once, claim badge once", async () => {
    await program.methods
      .initializeUser()
      .accounts({
        authority,
        userCheckin,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const initialAccount = await program.account.userCheckin.fetch(userCheckin);
    expect(initialAccount.authority.toBase58()).to.equal(authority.toBase58());
    expect(initialAccount.totalCheckins).to.equal(0);
    expect(initialAccount.streak).to.equal(0);

    await program.methods
      .checkIn()
      .accounts({
        authority,
        userCheckin,
      })
      .rpc();

    const afterFirst = await program.account.userCheckin.fetch(userCheckin);
    expect(afterFirst.totalCheckins).to.equal(1);
    expect(afterFirst.streak).to.equal(1);

    let threw = false;
    try {
      await program.methods
        .checkIn()
        .accounts({
          authority,
          userCheckin,
        })
        .rpc();
    } catch (e) {
      threw = true;
      const err = e as any;
      const code = err?.error?.errorCode?.code ?? err?.errorCode?.code;
      const message = String(err?.error?.errorMessage ?? err?.message ?? "");
      expect(code === "AlreadyCheckedInToday" || message.includes("今天已经打过卡")).to.equal(true);
    }
    expect(threw).to.equal(true);

    await program.methods
      .claimBadge(1)
      .accounts({
        authority,
        userCheckin,
        userBadges,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const badgesAfterClaim = await (program as any).account.userBadges.fetch(userBadges);
    expect(Number(badgesAfterClaim.claimedMask ?? badgesAfterClaim.claimed_mask ?? 0)).to.equal(1);

    let threwClaim = false;
    try {
      await program.methods
        .claimBadge(1)
        .accounts({
          authority,
          userCheckin,
          userBadges,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (e) {
      threwClaim = true;
      const err = e as any;
      const code = err?.error?.errorCode?.code ?? err?.errorCode?.code;
      const message = String(err?.error?.errorMessage ?? err?.message ?? "");
      expect(code === "BadgeAlreadyClaimed" || message.includes("已领取")).to.equal(true);
    }
    expect(threwClaim).to.equal(true);
  });
});
