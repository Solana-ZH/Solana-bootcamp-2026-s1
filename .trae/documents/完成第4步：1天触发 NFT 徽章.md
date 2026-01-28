## 目标与改动点
- 将“徽章 1”的达标条件从累计 7 天改为累计 1 天。
- 新增链上“领取徽章”指令：达标后用户点击即可 mint 一枚徽章 NFT（每用户每徽章唯一，禁止重复领取）。
- 前端徽章墙升级为三态：锁定 / 可领取 / 已领取，并提供领取按钮。

## 链上（Anchor Program）实现
- 扩展 `UserCheckin` 账户：新增 `claimed_mask: u32`（bit0 表示 badge_1 是否已领取，后续可扩展多个徽章）。
- 兼容已存在用户账户：在 `check_in`/`claim_badge` 的 `user_checkin` 账户约束中加入 `realloc = 8 + UserCheckin::INIT_SPACE`（payer=authority，zero=true），确保升级后旧账户可自动扩容而不需要重新建 PDA。
- 增加常量与 seeds：
  - `BADGE_MINT_SEED = b"badge_mint"`
  - `threshold(level)`：level=1 对应 1（其余 level 可保留 21/30 或先只支持 1 个 level）。
- 新增指令 `claim_badge(level: u8)`：
  - 校验：`total_checkins >= threshold(level)`；对应 bit 未置位；level 合法。
  - Mint 方案（最小可用 NFT）：
    - `badge_mint` 使用 PDA（seeds=[BADGE_MINT_SEED, authority, [level]])，`decimals=0`，`mint_authority = badge_mint`（PDA 自身）。
    - `authority_ata` 使用 `associated_token::authority=authority`，并 `init_if_needed`。
    - 通过 `anchor-spl` 的 `mint_to` CPI 给 ATA mint 1。
  - 状态落盘：`claimed_mask |= 1 << (level-1)`。
- 新增错误码：`InvalidBadgeLevel` / `NotEnoughCheckins` / `BadgeAlreadyClaimed`。
- 依赖补齐：在合约 `Cargo.toml` 增加 `anchor-spl`（token + associated_token）。
- 生成并同步新 IDL：`anchor build` 后把最新 IDL JSON 同步到前端 `frontend/src/idl/program.json`（保持你当前前端 Anchor 0.32.x 的 IDL 格式）。

## 前端实现（Next.js）
- 数据与接口层：
  - 扩展 `CheckInService`：新增 `claimBadge(address: string, badgeIdOrLevel: string|number)`（并按你的偏好为新增函数补充函数级注释）。
  - `MockCheckInService`：本地也实现“领取一次后记住已领取”，保证无链模式也能演示。
- Anchor service：
  - 新增 `claimBadge(level)`：
    - 计算 `badgeMintPda(authority, level, programId)` 并传入 `.accounts({ authority, userCheckin, badgeMint, authorityAta, tokenProgram, associatedTokenProgram, systemProgram })`。
  - `getBadges()`：从链上 `userCheckin.claimed_mask` 推导 `claimed`，不再固定 false。
  - 徽章 1 的展示阈值/文案更新为 1 天。
- UI：
  - `BadgeGrid` 增加回调 `onClaim(level|badgeId)`，并根据 `unlocked/claimed` 显示：锁定（灰）/ 可领取（按钮）/ 已领取（徽章 + 已领取标签）。
  - `checkin/page.tsx` 增加领取中的 loading 状态与错误提示；领取成功后复用现有 `loadData()` 刷新。

## 测试与验证
- Anchor 测试新增：
  - `check_in` 一次后 `claim_badge(1)` 成功。
  - 第二次 `claim_badge(1)` 失败（验证防重复领取）。
- 手工验证（UI）：
  - 连接钱包 → 打卡 1 次 → 徽章 1 变为“可领取” → 点击领取 → 状态变“已领取”。

## 可选增强（不影响本次最小可用）
- 若你希望“真正带图片/名称/属性的 NFT（Metaplex metadata + master edition）”，可在 `claim_badge` 里增加 token-metadata CPI，并在前端传入 metadata/masterEdition PDA；这会增加依赖与账户数量，但 UI 展示更直观。

我将按上述“最小可用 NFT（decimals=0, supply=1）+ 可领取按钮 + 1 天阈值”实现第 4 步；确认后我就开始改合约、同步 IDL、改前端并跑测试。