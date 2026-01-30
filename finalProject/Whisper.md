项目名称
悄悄话 Whisper（Solana 加密匿名信箱）

💻 项目 Repo
https://github.com/Tools-touch/Whisper

📌 项目简介
悄悄话是一个基于 Solana 的匿名消息收集与加密收件箱应用。任何人都可以在公开页面匿名留言，消息在客户端使用接收者的加密公钥进行端到端加密，服务器只保存密文。

收件箱查看需要钱包签名授权，并校验地址是否在 allowlist 中。即使数据库泄露，没有对应的钱包解密密钥也无法读取内容，从而提升隐私与安全性。

🛠️ 技术栈
- 智能合约：Rust + Anchor Framework
- 后端：Python + FastAPI + SQLite/Postgres
- 前端：React + TypeScript + Wallet Adapter
- 加密：tweetnacl (X25519 + XSalsa20-Poly1305)
- 工具：Solana CLI, @solana/web3.js

🎬 Demo 演示
- 🎥 视频演示：https://youtu.be/_nfwPKMySyM


功能截图
- 首页：匿名发送

![alt text](https://github.com/Tools-touch/Whisper/blob/main/images/image.png)


- 收件箱：钱包签名 + 本地解密

![alt text](https://github.com/Tools-touch/Whisper/blob/main/images/image-1.png)

- 身份与配置：创建 Profile / 查看已绑定 handle
- 
![alt text](https://github.com/Tools-touch/Whisper/blob/main/images/image-2.png)

💡 核心功能
- 匿名发送消息（无需连接钱包）
- 钱包签名授权查看收件箱
- 端到端加密，服务器只保存密文
- Profile 上链与 allowlist 访问控制
- 分享链接：一键生成 /send?handle=xxx

🧰 本地安装与运行

1) 克隆并进入项目
```bash
cd SolanaDemo
```

1) 前端环境变量
复制模板并填写：
```bash
cp frontend/.env.example frontend/.env
```

`frontend/.env` 需要填写：
- `VITE_API_BASE`：后端地址（本地为 http://localhost:8001）
- `VITE_RPC_URL`：Solana RPC（建议 devnet）
- `VITE_PROGRAM_ID`：已部署合约的 Program ID

3) 后端环境变量
```bash
cp backend/.env.example backend/.env
```

`backend/.env` 需要填写：
- `RPC_URL`：Solana RPC
- `PROGRAM_ID`：合约 Program ID
- `DATABASE_URL`：SQLite 文件路径（本地可用）

4) 启动后端（FastAPI）
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

5) 启动前端（Vite）
```bash
cd frontend
npm install
npm run dev
```

6) 合约部署（可选）
```bash
cd ..
anchor build
anchor deploy
```

✅ 本地演示完成后访问：
- 前端：http://localhost:5173
- 后端：http://localhost:8001

✍️ 项目创作者：
- 创作者昵称：`Codecat`
- 创作者联系方式：`codecat66@gmail.com`
- 创作者 Solana USDC 钱包地址：`3ZQbnu1nfA2MLS6PgkrRJkB2tepctsBvadsRyi2oEuDU`
