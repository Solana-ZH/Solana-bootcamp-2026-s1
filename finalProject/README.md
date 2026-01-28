# finalProject 启动说明（Check-in DApp）

本目录下的最终项目为 `checkin-dapp`，包含：
- `frontend/`：Next.js 前端（当前默认使用 Mock 数据即可运行）
- `program/`：Solana 智能合约（Anchor）

## 目录结构

```
finalProject/
  checkin-dapp/
    frontend/          # Next.js 前端
    program/           # Anchor 合约工程
```

## 环境准备

### 仅启动前端（推荐先跑通）
- Node.js：建议 18+（已使用 Next.js 14）
- npm：用于安装依赖与启动开发服务器

### 启动合约（可选）
如果你需要在本地链部署/测试合约，额外需要：
- Rust：仓库内指定 `rust-toolchain.toml`（Rust 1.89.0）
- Solana CLI
- Anchor CLI（与依赖版本匹配，项目依赖 `@coral-xyz/anchor@0.32.1`）
- Yarn（合约侧 `Anchor.toml` 指定 `package_manager = "yarn"`）

说明：合约工具链在原生 Windows 上配置成本较高，更推荐使用 WSL2（Ubuntu）来完成 Solana/Anchor 相关工作；前端可直接在 Windows 运行。

## 快速启动（前端 Mock 模式）

前端当前页面使用 Mock 服务（本地 localStorage）即可体验打卡与徽章展示，不依赖链上合约。

1) 进入前端目录

```powershell
cd .\finalProject\checkin-dapp\frontend
```

2) 安装依赖

```powershell
npm ci
```

3) 配置环境变量（可选）

Next.js 推荐使用 `.env.local`。项目提供了示例文件 `.env.example`：

```powershell
copy .env.example .env.local
```

`NEXT_PUBLIC_PROGRAM_ID` 当前可以留空（前端页面暂未接入链上调用）。

4) 启动开发服务器

```powershell
npm run dev
```

5) 打开页面
- http://localhost:3000/
- 入口页包含 “Check-in” 页面链接，或直接访问：http://localhost:3000/checkin

## 部署合约到本地链（可选）

本节适用于你希望把合约部署到本地 `localnet` 并进行 Anchor 测试的场景。

1) 进入合约目录

```bash
cd finalProject/checkin-dapp/program
```

2) 启动本地验证器（新终端窗口执行）

```bash
cd ~/
solana-test-validator
```

3) 配置 Solana CLI 指向 localnet，并准备钱包

```bash
solana config set --url http://127.0.0.1:8899
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2
```

4) 安装合约侧依赖（Anchor 脚本使用 yarn）

```bash
yarn install
```

5) 构建并部署合约

```bash
anchor build
anchor deploy
```

如需运行合约测试（本项目测试用例会调用 `set_last_checkin_day` 指令），请使用：

```bash
anchor test -- --features test
```

部署完成后，会输出 Program Id。该项目当前 Program Id 也已在合约代码中固定：
- `programs/program/src/lib.rs` 中 `declare_id!(...)`

## 让前端连接本地链（可选）

说明：当前前端在“未连接钱包”或“未配置 ProgramId”时会走 Mock；连接钱包且配置 ProgramId 后会走链上调用。

在 `finalProject/checkin-dapp/frontend/.env.local` 中设置：

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8899
NEXT_PUBLIC_PROGRAM_ID=B5Zjd3jeSG45nRbbBJqAttHm7aVBFERuGXJv9Pm4WXpd
```

然后重启前端：

```powershell
npm run dev
```

## 常见问题

### 1) 安装依赖报错或 Node 版本不兼容
- 确认 Node 在 18+：`node -v`
- 建议使用 `npm ci`（项目已提供 `package-lock.json`）

### 2) 本地链启动后无法 airdrop
- 确认 `solana config get` 的 RPC 是否为 `http://127.0.0.1:8899`
- 确认 `solana-test-validator` 进程正在运行

### 3) Anchor 部署/测试失败
- 确认 Anchor、Solana CLI、Rust 工具链版本匹配
- 建议在 WSL2 环境中执行合约相关命令
