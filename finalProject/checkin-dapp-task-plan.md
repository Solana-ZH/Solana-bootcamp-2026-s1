# 链上打卡 + 成就徽章（NFT）DApp 任务计划清单

本文档将项目按 4 个阶段拆解：
1) 纯前端静态版；2) 集成钱包、假数据打卡；3) Anchor 上链打卡逻辑；4) NFT 成就系统。

## 0. 项目范围与原则

### 目标
- 用户连接 Solana 钱包后可以“打卡”（每天最多 1 次）
- 前端展示：累计打卡次数、（可选）连续打卡、最近打卡状态、成就徽章
- 达到阈值（例如 7/21/30 次）后可领取或自动获得 NFT 徽章

### 非目标（第一版先不做）
- 复杂社交（关注、评论、排行榜）
- 代币经济（质押、奖励金库、手续费分配）
- 链上完整历史索引（第一版只依赖账户状态；历史列表可简化）

### 技术约束
- 智能合约：Rust + Anchor Framework
- 前端：Next.js + TypeScript + Wallet Adapter
- 工具：Solana CLI, @solana/web3.js
- 网络：本地 validator → devnet（后续可 mainnet）

### 关键验收点（全程贯穿）
- 一天只能打一次卡（链上强制）
- 前端状态机清晰：未连接 / 可打卡 / 打卡中 / 今日已打卡 / 失败重试
- 程序有基本测试：初始化、打卡、重复打卡失败

## 1) 第 1 步：纯前端静态版（不接钱包、不接链）

### 目标
- 产品形态先跑通：页面结构、组件、交互流程、状态展示
- 所有数据用本地 mock（不依赖网络，不依赖钱包）

### 任务清单
- 页面与路由
  - 首页：项目介绍、开始按钮、示例截图区（可选）
  - 打卡页：打卡按钮、统计卡片、历史列表、徽章墙
  - 个人页（可选）：未来展示“我的徽章 / 我的记录”
- 设计前端数据模型（TypeScript types）
  - 用户：address（先用 mock 地址）
  - 统计：累计次数、连续次数（可选）、最后打卡日期
  - 历史：最近 7 天（或 30 天）的打卡标记
  - 徽章：阈值、名称、图片、状态（锁定/点亮/已领取）
- 组件拆分
  - `CheckInButton`：可打卡 / 处理中 / 今日已打卡
  - `StatsCard`：累计/连续/最后打卡
  - `HistoryList`：最近 N 天
  - `BadgeShelf`：徽章墙（阈值点亮）
- Mock 数据与状态机
  - 点击“打卡”后：更新 mock 统计、刷新历史、更新徽章点亮状态
  - 可选：用 LocalStorage 保存 mock 结果，刷新不丢

### 产出物
- 可演示的纯前端页面（不需要钱包即可完整演示）
- UI 组件与类型定义（后续上链尽量不改 UI）

### 验收标准
- 不接钱包也能演示完整流程：打卡 → UI 更新 → 徽章点亮
- “今日已打卡”状态不会重复触发（mock 规则正确）

## 2) 第 2 步：集成钱包 + 假数据打卡（链上仍不写入）

### 目标
- 打通 Web3 登录体验：连接钱包、获取地址（可选：签名登录）
- 打卡仍使用 mock，但数据按真实钱包地址隔离

### 任务清单
- 钱包连接
  - 先支持 Phantom（最小可用）；后续可扩展 Solana Wallet Adapter
  - UI：Connect / Disconnect、地址缩写显示
- 会话状态管理
  - 当前地址（PublicKey）
  - 网络（固定 devnet，或可切换但默认 devnet）
- （可选但推荐）签名登录
  - 生成一次性 message（含时间戳/随机数）
  - `signMessage` 获取签名；前端仅保存“已签名”状态（暂不做服务端校验）
- 抽象数据访问层（为上链做准备）
  - 定义 `CheckInService` 接口：`getStats()` / `checkIn()` / `getBadges()`
  - 当前实现：`MockCheckInService`（按地址存储）

### 产出物
- 连接钱包后能看到“你的地址”
- 同一浏览器切换不同地址，打卡 mock 数据互不影响

### 验收标准
- 连接/断开钱包逻辑稳定
- mock 数据按地址隔离且可重复演示
- 代码结构支持后续替换为链上实现（不重写 UI）

## 3) 第 3 步：把打卡逻辑搬到链上（Anchor 程序 + 前端真实读写）

### 目标
- 打卡变成链上交易：前端发交易，Anchor 程序写入用户状态
- 核心规则链上强制：一天只能打一次卡

### 链上程序设计（建议最小模型）

#### 账户（Account）
- `UserCheckin`（PDA）
  - `authority: Pubkey` 用户地址
  - `total_checkins: u32` 累计打卡
  - `last_checkin_day: i64` 上次打卡的 day index（按天）
  - `streak: u16` 连续打卡（可选，但很适合展示）
  - `bump: u8`

#### 指令（Instructions）
- `initialize_user()`
  - 作用：创建 `UserCheckin` PDA
- `check_in()`
  - 作用：校验当天是否已打卡；更新 `total_checkins` / `last_checkin_day` / `streak`
- `get_user`（链上不一定需要，前端直接 fetch account 即可）

#### 一天一次的判定方式
- 读取 `Clock` 的 `unix_timestamp`
- `day_index = unix_timestamp / 86400`
- 若 `day_index == last_checkin_day`：返回错误（今天已打卡）
- streak 更新建议：
  - 若 `day_index == last_checkin_day + 1`：`streak += 1`
  - 否则：`streak = 1`

### Anchor 测试（必须做）
- 初始化用户成功（PDA 创建 + 字段初始化）
- 同一天连续打两次：第二次失败
- 模拟跨天：验证 streak 的增长/重置

### 前端接链任务清单
- 配置环境变量
  - `RPC_URL`（devnet）
  - `PROGRAM_ID`
  - `CLUSTER=devnet`
- 引入 Anchor/IDL 调用（前端）
  - 若用户 PDA 不存在：先调用 `initialize_user`
  - 点击打卡：调用 `check_in`，等待确认后刷新数据
- 将链上账户映射回 UI 模型
  - 把 `UserCheckin` → `CheckInStats`
  - 历史列表第一版可简化（例如只展示“今天/昨天是否打卡”和累计统计）
  - 若要完整历史：后续加事件日志 + 索引（不建议第一版做）

### 产出物
- 一个能在 devnet 上真实写入/读取的打卡 DApp
- Anchor 程序与测试用例

### 验收标准
- 用户在同一天重复打卡会失败且前端提示明确
- 打卡成功后累计次数立即可见
- 本地测试全部通过

## 4) 第 4 步：加入 NFT 成就系统（徽章发放）

### 目标
- 达到阈值后，用户能领取（推荐）或自动获得 NFT 徽章
- 前端展示“已领取徽章”与“可领取徽章”

### 推荐实现方式：手动领取（更稳、更适合 Hackathon）
- `check_in()` 只做统计更新
- 新增 `claim_badge(level)`：用户点击领取触发铸造/发放 NFT

### 链上任务清单
- 成就阈值定义
  - 例如：`LEVEL_1=7`，`LEVEL_2=21`，`LEVEL_3=30`
- 防重复领取
  - 在 `UserCheckin` 增加 `claimed_mask: u32`（位图）或 `claimed_levels: [bool; N]`
- 新增指令：`claim_badge(level)`
  - 校验 `total_checkins >= threshold[level]`
  - 校验该 level 未领取
  - 创建 Mint + 用户 ATA + Mint 1 枚
  - （加分项）通过 Metaplex Token Metadata CPI 写入 metadata（名称/图片/属性）

### 前端任务清单
- 徽章状态三态
  - 锁定：未达阈值
  - 可领取：达阈值但未领取
  - 已领取：已发放
- 领取交互
  - 点击领取 → 钱包确认 → 等确认 → 刷新账户与徽章状态
- NFT 展示
  - 最简：仅根据 `claimed_mask` 展示已领取
  - 加分：读取该 collection 下的 NFT 并展示图片（需要解析 metadata）

### 产出物
- 领取式徽章 NFT 机制（链上 + 前端）
- 至少 1 个徽章可完整演示（建议先做 1 个跑通，再扩 3 个）

### 验收标准
- 达到阈值后可领取；领取后不可重复领取
- 前端可稳定展示徽章状态
- devnet 上能查到用户持有的徽章（至少能证明 mint 成功）

## 部署与交付（你后续部署时用）

### 程序部署顺序（建议）
- 本地：`anchor test` 通过
- devnet：部署程序、记录 `PROGRAM_ID`
- 前端：配置 `RPC_URL` 与 `PROGRAM_ID`，指向 devnet

### Demo 展示建议（路演友好）
- 现场演示 3 分钟流程：连接钱包 → 初始化 → 打卡成功 → 显示累计 → 达标（可用测试账号）→ 领取徽章
- 提供 devnet 浏览器链接（交易 + 账户）方便验证

## 风险清单（提前规避）
- 时区问题：链上按 `unix_timestamp/86400` 是 UTC 天粒度；前端展示时注明“按 UTC 计算”或用更清晰文案
- 交易确认：前端必须处理 pending 状态与失败重试
- NFT 复杂度：先做“mint + ATA + 1 枚”跑通，再加 metadata（不要一上来做全套）

