use anchor_lang::prelude::*;

anchor_lang::declare_id!("B5Zjd3jeSG45nRbbBJqAttHm7aVBFERuGXJv9Pm4WXpd");

pub const USER_CHECKIN_SEED: &[u8] = b"user_checkin";
pub const USER_BADGES_SEED: &[u8] = b"user_badges";

pub const BADGE_1_THRESHOLD: u32 = 1;
pub const BADGE_2_THRESHOLD: u32 = 21;
pub const BADGE_3_THRESHOLD: u32 = 30;

/// 返回指定徽章等级对应的累计打卡阈值（天）。
pub fn badge_threshold(level: u8) -> Option<u32> {
    match level {
        1 => Some(BADGE_1_THRESHOLD),
        2 => Some(BADGE_2_THRESHOLD),
        3 => Some(BADGE_3_THRESHOLD),
        _ => None,
    }
}

#[anchor_lang::program]
pub mod checkin_program {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_checkin = &mut ctx.accounts.user_checkin;
        user_checkin.authority = ctx.accounts.authority.key();
        user_checkin.total_checkins = 0;
        user_checkin.last_checkin_day = -1;
        user_checkin.streak = 0;
        user_checkin.bump = ctx.bumps.user_checkin;
        Ok(())
    }

    pub fn check_in(ctx: Context<CheckIn>) -> Result<()> {
        let clock = Clock::get()?;
        let day_index = clock.unix_timestamp / 86_400;

        let user_checkin = &mut ctx.accounts.user_checkin;
        if user_checkin.last_checkin_day == day_index {
            return Err(CheckinError::AlreadyCheckedInToday.into());
        }

        let new_streak = if user_checkin.last_checkin_day >= 0
            && day_index == user_checkin.last_checkin_day + 1
        {
            user_checkin.streak.saturating_add(1)
        } else {
            1
        };

        user_checkin.total_checkins = user_checkin.total_checkins.saturating_add(1);
        user_checkin.last_checkin_day = day_index;
        user_checkin.streak = new_streak;

        Ok(())
    }

    /// 达到阈值后领取徽章 NFT（每用户每等级唯一，禁止重复领取）。
    pub fn claim_badge(ctx: Context<ClaimBadge>, level: u8) -> Result<()> {
        if level == 0 {
            return Err(CheckinError::InvalidBadgeLevel.into());
        }

        let threshold =
            badge_threshold(level).ok_or_else(|| error!(CheckinError::InvalidBadgeLevel))?;

        let user_checkin = &ctx.accounts.user_checkin;
        if user_checkin.total_checkins < threshold {
            return Err(CheckinError::NotEnoughCheckins.into());
        }

        let bit = 1u32
            .checked_shl((level - 1) as u32)
            .ok_or_else(|| error!(CheckinError::InvalidBadgeLevel))?;
        let user_badges = &mut ctx.accounts.user_badges;
        if (user_badges.claimed_mask & bit) != 0 {
            return Err(CheckinError::BadgeAlreadyClaimed.into());
        }

        user_badges.authority = ctx.accounts.authority.key();
        user_badges.bump = ctx.bumps.user_badges;

        user_badges.claimed_mask |= bit;
        Ok(())
    }

    #[cfg(feature = "test")]
    pub fn set_last_checkin_day(
        ctx: Context<SetLastCheckinDay>,
        last_checkin_day: i64,
    ) -> Result<()> {
        let user_checkin = &mut ctx.accounts.user_checkin;
        user_checkin.last_checkin_day = last_checkin_day;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + UserCheckin::INIT_SPACE,
        seeds = [USER_CHECKIN_SEED, authority.key().as_ref()],
        bump
    )]
    pub user_checkin: Account<'info, UserCheckin>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckIn<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_CHECKIN_SEED, authority.key().as_ref()],
        bump = user_checkin.bump,
        has_one = authority
    )]
    pub user_checkin: Account<'info, UserCheckin>,
}

#[derive(Accounts)]
pub struct SetLastCheckinDay<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_CHECKIN_SEED, authority.key().as_ref()],
        bump = user_checkin.bump,
        has_one = authority
    )]
    pub user_checkin: Account<'info, UserCheckin>,
}

#[derive(Accounts)]
pub struct ClaimBadge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_CHECKIN_SEED, authority.key().as_ref()],
        bump = user_checkin.bump,
        has_one = authority
    )]
    pub user_checkin: Account<'info, UserCheckin>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + UserBadges::INIT_SPACE,
        seeds = [USER_BADGES_SEED, authority.key().as_ref()],
        bump
    )]
    pub user_badges: Account<'info, UserBadges>,
    pub system_program: Program<'info, System>,
}

#[anchor_lang::account]
#[derive(InitSpace)]
pub struct UserCheckin {
    pub authority: Pubkey,
    pub total_checkins: u32,
    pub last_checkin_day: i64,
    pub streak: u16,
    pub bump: u8,
}

#[anchor_lang::account]
#[derive(InitSpace)]
pub struct UserBadges {
    pub authority: Pubkey,
    pub claimed_mask: u32,
    pub bump: u8,
}

#[anchor_lang::error_code]
pub enum CheckinError {
    #[msg("今天已经打过卡啦！明天再来吧~")]
    AlreadyCheckedInToday,

    #[msg("徽章等级不合法")]
    InvalidBadgeLevel,

    #[msg("累计打卡次数不足，暂不可领取该徽章")]
    NotEnoughCheckins,

    #[msg("该徽章已领取，不能重复领取")]
    BadgeAlreadyClaimed,
}
