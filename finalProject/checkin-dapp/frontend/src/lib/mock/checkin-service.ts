export interface CheckInStats {
  totalCheckins: number;
  streak: number; // 连续打卡（可选）
  lastCheckinTime: number | null;
  canCheckIn: boolean;
}

export interface Badge {
  level: number;
  id: string;
  name: string;
  description: string;
  imageUrl: string; // 可以是 emoji 或者本地图片路径
  threshold: number;
  unlocked: boolean;
  claimed: boolean;
}

export interface CheckInService {
  getStats(address: string): Promise<CheckInStats>;
  checkIn(address: string): Promise<boolean>;
  claimBadge(address: string, level: number): Promise<boolean>;
  getHistory(address: string): Promise<{ date: string; checked: boolean }[]>;
  getBadges(address: string): Promise<Badge[]>;
}

const STORAGE_KEY_PREFIX = "checkin_dapp_";
const BADGE_THRESHOLDS = [
  { level: 1, id: "badge_1", name: "初出茅庐", description: "累计打卡 1 天", threshold: 1, emoji: "🌱" },
  { level: 2, id: "badge_2", name: "坚持不懈", description: "累计打卡 21 天", threshold: 21, emoji: "🔥" },
  { level: 3, id: "badge_3", name: "打卡大师", description: "累计打卡 30 天", threshold: 30, emoji: "🏆" },
];

export class MockCheckInService implements CheckInService {
  private getStorageKey(address: string) {
    return `${STORAGE_KEY_PREFIX}${address}`;
  }

  private getUserData(address: string): {
    total: number;
    lastTime: number;
    history: number[];
    claimedMask: number;
  } {
    if (typeof window === "undefined") return { total: 0, lastTime: 0, history: [], claimedMask: 0 };
    
    const data = localStorage.getItem(this.getStorageKey(address));
    if (!data) return { total: 0, lastTime: 0, history: [], claimedMask: 0 };
    const parsed = JSON.parse(data);
    return {
      total: Number(parsed?.total ?? 0),
      lastTime: Number(parsed?.lastTime ?? 0),
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      claimedMask: Number(parsed?.claimedMask ?? 0),
    };
  }

  private saveUserData(address: string, data: any) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getStorageKey(address), JSON.stringify(data));
  }

  private isSameDay(timestamp1: number, timestamp2: number): boolean {
    if (!timestamp1 || !timestamp2) return false;
    const d1 = new Date(timestamp1);
    const d2 = new Date(timestamp2);
    // 使用 UTC 天，避免时区问题导致的不同
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  }

  async getStats(address: string): Promise<CheckInStats> {
    const data = this.getUserData(address);
    const now = Date.now();
    const canCheckIn = !this.isSameDay(now, data.lastTime);

    // 简单计算 streak (这里简化处理，如果昨天打卡了 streak+1，否则重置)
    // 实际项目中需要遍历 history
    let streak = 0;
    // TODO: 实现 streak 计算逻辑

    return {
      totalCheckins: data.total,
      streak: 0, // 暂时 mock 0
      lastCheckinTime: data.lastTime > 0 ? data.lastTime : null,
      canCheckIn,
    };
  }

  async checkIn(address: string): Promise<boolean> {
    const data = this.getUserData(address);
    const now = Date.now();

    if (this.isSameDay(now, data.lastTime)) {
      throw new Error("今天已经打过卡啦！明天再来吧~");
    }

    data.total += 1;
    data.lastTime = now;
    data.history.push(now);
    
    this.saveUserData(address, data);
    return true;
  }

  /**
   * 领取徽章（Mock 版）：达标后置位 claimedMask，防止重复领取。
   */
  async claimBadge(address: string, level: number): Promise<boolean> {
    const data = this.getUserData(address);
    const badge = BADGE_THRESHOLDS.find((b) => b.level === level);
    if (!badge) throw new Error("徽章等级不合法");
    if (data.total < badge.threshold) throw new Error("累计打卡次数不足，暂不可领取该徽章");

    const bit = 1 << (level - 1);
    if ((data.claimedMask & bit) !== 0) throw new Error("该徽章已领取，不能重复领取");

    data.claimedMask |= bit;
    this.saveUserData(address, data);
    return true;
  }

  async getHistory(address: string): Promise<{ date: string; checked: boolean }[]> {
    // 返回最近 7 天的状态
    const data = this.getUserData(address);
    const result: { date: string; checked: boolean }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i); // 使用本地时间展示给用户看会更自然，或者统一 UTC
      // 这里为了展示简单，暂且混合使用（存储用 UTC 判断，展示用本地日期）
      // 实际生产建议统一。
      
      // 查找这一天是否有打卡记录
      // 为了准确，这里应该把 history 里的 timestamp 转成 UTC day string 对比
      // 简化版：
      const isChecked = data.history.some(ts => this.isSameDay(ts, d.getTime()));
      
      result.push({
        date: d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        checked: isChecked
      });
    }
    return result;
  }

  async getBadges(address: string): Promise<Badge[]> {
    const data = this.getUserData(address);
    
    return BADGE_THRESHOLDS.map(b => ({
      level: b.level,
      id: b.id,
      name: b.name,
      description: b.description,
      imageUrl: b.emoji,
      threshold: b.threshold,
      unlocked: data.total >= b.threshold,
      claimed: (data.claimedMask & (1 << (b.level - 1))) !== 0,
    }));
  }
}

export const mockCheckInService = new MockCheckInService();
