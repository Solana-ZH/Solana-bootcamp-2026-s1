# 前端卡通风改造与 Mock 功能实现计划

## 1. 基础设施与样式配置

* **安装依赖**：引入 Tailwind CSS 作为样式引擎，Framer Motion 用于交互动画，Lucide React 用于图标。

  * `npm install -D tailwindcss postcss autoprefixer`

  * `npx tailwindcss init -p`

  * `npm install framer-motion lucide-react clsx tailwind-merge`

* **配置 Tailwind**：

  * 设置“糖果色”主题（粉色、明黄、天蓝）。

  * 配置大圆角（Border Radius）和粗边框（Border Width）风格。

* **全局样式**：

  * 设置页面背景为柔和的米色或浅黄色，营造温馨氛围。

  * 设置全局字体样式。

## 2. Mock 数据服务层 (`src/lib/mock`)

* **定义接口**：`CheckInService` 接口，包含打卡、获取统计、获取历史、获取徽章等方法。

* **实现 Mock 服务**：

  * 使用 `localStorage` 模拟后端数据库。

  * 实现“每日一次”的校验逻辑（基于本地时间）。

  * 模拟打卡成功后的状态更新（累计次数 +1，更新最后打卡时间）。

## 3. 卡通 UI 组件开发 (`src/components`)

* **基础组件**：

  * `CartoonCard`：带粗边框、阴影和大圆角的通用卡片。

  * `CartoonButton`：点击有回弹效果（Framer Motion）的彩色按钮。

* **业务组件**：

  * `CheckInButton`：核心交互按钮，支持“打卡中”动画和“已打卡”状态。

  * `StatsDisplay`：展示累计打卡次数，使用大字体和鲜艳颜色。

  * `BadgeGrid`：展示成就徽章，未解锁时显示锁定状态（灰色+锁图标）。

  * `CheckInHistory`：以日历或时间轴形式展示最近打卡记录。

## 4. 页面重构

* **首页 (`/`)**：

  * 重新设计为欢迎页，包含项目标题、简单的卡通介绍图（或 Emoji 组合）、“开始打卡”主按钮。

* **打卡页 (`/checkin`)**：

  * 移除原有纯文本骨架。

  * 组装上述组件，连接 Mock 服务。

  * 实现完整的打卡交互流程：加载状态 -> 点击打卡 -> 动画反馈 -> 数据更新。

## 5. 验证

* 启动开发服务器 `npm run dev`。

* 验证“每日只能打卡一次”逻辑。

* 确认 UI 风格符合“可爱、卡通”的要求。

