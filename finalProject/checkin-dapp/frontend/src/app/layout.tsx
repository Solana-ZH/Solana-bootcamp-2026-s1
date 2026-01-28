import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Solana 幸运抓娃娃 - 每日打卡赢 NFT",
  description: "Solana 链上抓娃娃机，每日打卡领取游戏币，抓取珍稀 NFT 徽章。",
};

/**
 * 应用根布局。
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

