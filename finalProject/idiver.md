# iDiver - 像素风格潜水日志 DApp

> Proof of Dive - 让每一次潜水都成为链上永恒的记忆

## 💻 项目 Repo

https://github.com/your-username/proof-of-dive

## 📌 项目简介

**iDiver (Proof of Dive)** 是一个受《Dave the Diver》启发的复古像素风格潜水日志应用，部署在 Solana 区块链上。潜水爱好者可以记录每一次潜水的照片、深度、位置等数据，并将这些珍贵的潜水记忆铸造成链上 NFT。通过区块链的不可篡改特性，每一张潜水证书都成为独一无二的数字收藏品，同时构建一个去中心化的潜水社区。

项目采用全像素艺术风格设计，从街机风格的启动页、到带有 ASCII 潜水员动画的界面，再到带闪光效果的全息 NFT 卡片，整体呈现 8-bit 复古美学。用户可以通过移动端优先的响应式设计，随时随地记录潜水体验，积累潜水次数、最大深度和经验值(XP)，打造属于自己的链上潜水成就系统。

## 🛠️ 技术栈

- **前端框架**: Next.js 16 (App Router) + TypeScript
- **样式系统**: Tailwind CSS v4 (像素艺术风格定制)
- **区块链**: @solana/web3.js + @solana/wallet-adapter-react
- **NFT 铸造**: @metaplex-foundation/umi (Compressed NFT)
- **UI 组件**: Radix UI + Lucide Icons
- **状态管理**: React Hooks + Context API
- **图片处理**: EXIF 数据提取 + 自动压缩
- **存储**: IPFS (Pinata) + 本地草稿自动保存

## 🎬 Demo 演示

### 演示链接
- 🌐 在线 Demo: https://idiver.deanqin.ac.cn
- 📦 GitHub Repo: https://github.com/dylean/proof-of-dive

### 功能截图

**1. 启动页面 - 街机风格**
- ASCII 艺术潜水员动画
- 深海气泡背景特效
- 3D 红色街机按钮
- CRT 扫描线效果

![image](https://pub-52ec1fbc298546f5a24d3a5301b9a2f2.r2.dev/2026/01/9c88aaf268700a78dd4d16b11617c1df.png)

**2. 日志记录页 - 移动端优先**
- 拖拽/点击上传潜水照片
- EXIF 数据自动提取（深度、位置）
- 装备记忆功能（智能默认值）
- 统计卡片展示（潜水次数、最大深度、XP）
- 像素风格表单和按钮

![image](https://pub-52ec1fbc298546f5a24d3a5301b9a2f2.r2.dev/2026/01/b05c622e4f6c9e1d794542429d55b13e.png)

**3. NFT 铸造成功页**
- 全息 NFT 卡片展示
- 稀有度发光效果 (COMMON/RARE/EPIC/LEGENDARY)
- 一键分享到 X (Twitter)
- Solana Explorer 链接

![image](https://pub-52ec1fbc298546f5a24d3a5301b9a2f2.r2.dev/2026/01/924aaac374ed721cf1f3d6b81cea8b31.png)

## 💡 核心功能

1. **潜水日志记录** - 上传照片并记录深度、位置、装备、天气等完整数据，支持草稿自动保存
2. **智能数据提取** - 自动从照片 EXIF 读取 GPS 位置和时间戳，减少手动输入
3. **链上 NFT 铸造** - 将潜水记录铸造成 Solana Compressed NFT，永久存储在区块链
4. **稀有度系统** - 根据深度、经验值等维度自动计算 NFT 稀有度等级
5. **成就统计系统** - 追踪总潜水次数、最大深度、累计经验值，构建个人潜水档案

## 🎯 参赛信息

- **黑客松**: Solana 线上黑客松 2026
- **主办方**: [@trendsdotfun](https://twitter.com/trendsdotfun) & [@Solana_zh](https://twitter.com/solana_zh)
- **赛道**: 消费与娱乐应用 (Consumer & Entertainment)
- **标签**: #SolanaHackathon #BuildInPublic #ProofOfDive

## 🌟 项目亮点

### 设计层面
- **独特的像素艺术风格** - 100% 无圆角设计，硬边框阴影，8-bit 配色
- **沉浸式深海主题** - 动画气泡、水下光线、ASCII 艺术
- **移动端优先** - 适配潜水员在船上/海边记录的场景

### 技术层面
- **Compressed NFT** - 使用 Metaplex UMI 降低铸造成本
- **IPFS 存储** - 图片和元数据去中心化存储
- **智能表单** - 装备记忆、地点预设、数据验证
- **草稿自动保存** - 防止数据丢失，提升用户体验

### 商业价值
- **潜水旅游结合** - 可与潜店、度假村合作推广
- **社交传播** - NFT 分享到社交媒体，形成病毒式传播
- **收藏价值** - 稀有深度/地点的 NFT 具有收藏和交易价值

## ✍️ 项目创作者

1. **创作者昵称**: Dean
2. **联系方式**: 
   - Twitter: @DeanBitsqiu
   - Email: bitsqiu@gmail.com
3. **Solana USDC 钱包地址**: `6XxyHYkmJxQKgfSVG2qyTXqqTiQvvzbub7CAtjYBKbw7`

## 🔮 未来规划

- [ ] 集成更多 Solana 钱包 (Phantom, Solflare, Backpack)
- [ ] 实现潜水日志列表和画廊页面
- [ ] 添加潜水地点地图可视化
- [ ] 构建潜水员社区和排行榜
- [ ] 支持多语言 (中文/英文/日文)
- [ ] NFT 二级市场交易功能

---

<div align="center">

**Built with 💙 for Solana Hackathon 2026**

*Dive Deep, Mint Forever* 🌊

</div>
