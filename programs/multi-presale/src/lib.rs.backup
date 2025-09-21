use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Program ID - will be generated during build
declare_id!("11111111111111111111111111111112");

#[program]
pub mod multi_presale {
    use super::*;

    /// Initialize the platform with admin authority
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee: u16,              // Platform fee in basis points (e.g., 250 = 2.5%)
        min_project_duration: i64,      // Minimum sale duration in seconds
        max_project_duration: i64,      // Maximum sale duration in seconds
    ) -> Result<()> {
        require!(platform_fee <= 10000, ErrorCode::InvalidPlatformFee);
        require!(min_project_duration > 0, ErrorCode::InvalidDuration);
        require!(max_project_duration > min_project_duration, ErrorCode::InvalidDuration);

        let platform = &mut ctx.accounts.platform_account;
        platform.authority = ctx.accounts.authority.key();
        platform.treasury = ctx.accounts.treasury.key();
        platform.platform_fee = platform_fee;
        platform.total_projects = 0;
        platform.is_paused = false;
        platform.min_project_duration = min_project_duration;
        platform.max_project_duration = max_project_duration;
        platform.bump = ctx.bumps.platform_account;

        emit!(PlatformInitialized {
            authority: platform.authority,
            treasury: platform.treasury,
            platform_fee: platform_fee,
        });

        Ok(())
    }

    /// Update platform configuration (admin only)
    pub fn update_platform_config(
        ctx: Context<UpdatePlatformConfig>,
        new_platform_fee: Option<u16>,
        new_min_duration: Option<i64>,
        new_max_duration: Option<i64>,
        new_treasury: Option<Pubkey>,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform_account;

        if let Some(fee) = new_platform_fee {
            require!(fee <= 10000, ErrorCode::InvalidPlatformFee);
            platform.platform_fee = fee;
        }

        if let Some(min_dur) = new_min_duration {
            require!(min_dur > 0, ErrorCode::InvalidDuration);
            platform.min_project_duration = min_dur;
        }

        if let Some(max_dur) = new_max_duration {
            require!(max_dur > platform.min_project_duration, ErrorCode::InvalidDuration);
            platform.max_project_duration = max_dur;
        }

        if let Some(treasury) = new_treasury {
            platform.treasury = treasury;
        }

        emit!(PlatformConfigUpdated {
            platform_fee: platform.platform_fee,
            min_duration: platform.min_project_duration,
            max_duration: platform.max_project_duration,
        });

        Ok(())
    }

    /// Emergency pause all platform operations (admin only)
    pub fn pause_platform(ctx: Context<PausePlatform>) -> Result<()> {
        let platform = &mut ctx.accounts.platform_account;
        platform.is_paused = true;

        emit!(PlatformPaused {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Resume platform operations (admin only)
    pub fn unpause_platform(ctx: Context<UnpausePlatform>) -> Result<()> {
        let platform = &mut ctx.accounts.platform_account;
        platform.is_paused = false;

        emit!(PlatformUnpaused {
            authority: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create a new project (any user)
    pub fn create_project(
        ctx: Context<CreateProject>,
        name: String,
        description: String,
        logo_url: String,
        website: String,
        twitter: String,
        discord: String,
        telegram: String,
        category: ProjectCategory,
        tags: Vec<String>,
        token_name: String,
        token_symbol: String,
        token_decimals: u8,
    ) -> Result<()> {
        require!(!ctx.accounts.platform_account.is_paused, ErrorCode::PlatformPaused);
        require!(name.len() <= 50, ErrorCode::NameTooLong);
        require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
        require!(tags.len() <= 10, ErrorCode::TooManyTags);

        let platform = &mut ctx.accounts.platform_account;
        let project = &mut ctx.accounts.project_account;
        let current_time = Clock::get()?.unix_timestamp;

        // Assign unique project ID
        platform.total_projects += 1;
        let project_id = platform.total_projects;

        project.id = project_id;
        project.creator = ctx.accounts.creator.key();
        project.name = name.clone();
        project.description = description;
        project.logo_url = logo_url;
        project.website = website;
        project.twitter = twitter;
        project.discord = discord;
        project.telegram = telegram;
        project.category = category;
        project.tags = tags;
        project.token_mint = ctx.accounts.token_mint.key();
        project.token_name = token_name;
        project.token_symbol = token_symbol;
        project.token_decimals = token_decimals;
        project.status = ProjectStatus::Draft;
        project.created_at = current_time;
        project.updated_at = current_time;
        project.approval_status = ApprovalStatus::Pending;
        project.approved_by = None;
        project.approved_at = None;
        project.bump = ctx.bumps.project_account;

        emit!(ProjectCreated {
            project_id,
            creator: project.creator,
            name,
            token_mint: project.token_mint,
            category,
        });

        Ok(())
    }

    /// Update project metadata (creator only, before approval)
    pub fn update_project(
        ctx: Context<UpdateProject>,
        name: Option<String>,
        description: Option<String>,
        logo_url: Option<String>,
        website: Option<String>,
        twitter: Option<String>,
        discord: Option<String>,
        telegram: Option<String>,
        category: Option<ProjectCategory>,
        tags: Option<Vec<String>>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project_account;
        
        // Only allow updates for draft projects
        require!(
            project.status == ProjectStatus::Draft || 
            project.approval_status == ApprovalStatus::Rejected,
            ErrorCode::ProjectNotEditable
        );

        if let Some(n) = name {
            require!(n.len() <= 50, ErrorCode::NameTooLong);
            project.name = n;
        }

        if let Some(d) = description {
            require!(d.len() <= 500, ErrorCode::DescriptionTooLong);
            project.description = d;
        }

        if let Some(logo) = logo_url {
            project.logo_url = logo;
        }

        if let Some(w) = website {
            project.website = w;
        }

        if let Some(t) = twitter {
            project.twitter = t;
        }

        if let Some(d) = discord {
            project.discord = d;
        }

        if let Some(t) = telegram {
            project.telegram = t;
        }

        if let Some(c) = category {
            project.category = c;
        }

        if let Some(t) = tags {
            require!(t.len() <= 10, ErrorCode::TooManyTags);
            project.tags = t;
        }

        project.updated_at = Clock::get()?.unix_timestamp;

        emit!(ProjectUpdated {
            project_id: project.id,
            creator: project.creator,
            updated_at: project.updated_at,
        });

        Ok(())
    }

    /// Submit project for admin approval (creator only)
    pub fn submit_for_approval(ctx: Context<SubmitForApproval>) -> Result<()> {
        let project = &mut ctx.accounts.project_account;
        
        require!(project.status == ProjectStatus::Draft, ErrorCode::ProjectNotEditable);
        require!(!project.name.is_empty(), ErrorCode::IncompleteProject);
        require!(!project.description.is_empty(), ErrorCode::IncompleteProject);

        project.status = ProjectStatus::Submitted;
        project.approval_status = ApprovalStatus::Pending;
        project.updated_at = Clock::get()?.unix_timestamp;

        emit!(ProjectSubmitted {
            project_id: project.id,
            creator: project.creator,
            submitted_at: project.updated_at,
        });

        Ok(())
    }

    /// Approve a project (admin only)
    pub fn approve_project(ctx: Context<ApproveProject>) -> Result<()> {
        let project = &mut ctx.accounts.project_account;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(project.status == ProjectStatus::Submitted, ErrorCode::InvalidProjectStatus);
        require!(project.approval_status == ApprovalStatus::Pending, ErrorCode::InvalidApprovalStatus);

        project.status = ProjectStatus::Active;
        project.approval_status = ApprovalStatus::Approved;
        project.approved_by = Some(ctx.accounts.admin.key());
        project.approved_at = Some(current_time);
        project.updated_at = current_time;

        emit!(ProjectApproved {
            project_id: project.id,
            admin: ctx.accounts.admin.key(),
            approved_at: current_time,
        });

        Ok(())
    }

    /// Reject a project (admin only)
    pub fn reject_project(
        ctx: Context<RejectProject>,
        rejection_reason: String,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project_account;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(project.status == ProjectStatus::Submitted, ErrorCode::InvalidProjectStatus);
        require!(project.approval_status == ApprovalStatus::Pending, ErrorCode::InvalidApprovalStatus);
        require!(rejection_reason.len() <= 200, ErrorCode::ReasonTooLong);

        project.status = ProjectStatus::Draft; // Allow resubmission
        project.approval_status = ApprovalStatus::Rejected;
        project.updated_at = current_time;

        emit!(ProjectRejected {
            project_id: project.id,
            admin: ctx.accounts.admin.key(),
            reason: rejection_reason,
            rejected_at: current_time,
        });

        Ok(())
    }

    /// Configure a sale tier for an approved project (creator only)
    pub fn configure_sale_tier(
        ctx: Context<ConfigureSaleTier>,
        sale_type: SaleType,
        token_price: u64,              // Price per token in payment token lamports
        total_tokens: u64,             // Total tokens for this tier
        min_purchase: u64,             // Minimum purchase amount
        max_purchase: u64,             // Maximum purchase amount per buyer
        start_time: i64,               // Sale start timestamp
        end_time: i64,                 // Sale end timestamp
        is_whitelist_only: bool,       // Requires whitelist
        requires_kyc: bool,            // Requires KYC verification
        referral_enabled: bool,        // Enable referral rewards
        referral_rate: u16,            // Referral rate in basis points
    ) -> Result<()> {
        let project = &ctx.accounts.project_account;
        
        // Validate project is approved and active
        require!(project.status == ProjectStatus::Active, ErrorCode::ProjectNotActive);
        require!(project.approval_status == ApprovalStatus::Approved, ErrorCode::ProjectNotApproved);
        
        // Validate timing
        let current_time = Clock::get()?.unix_timestamp;
        require!(start_time > current_time, ErrorCode::InvalidStartTime);
        require!(end_time > start_time, ErrorCode::InvalidEndTime);
        require!(
            end_time - start_time >= ctx.accounts.platform_account.min_project_duration,
            ErrorCode::SaleTooShort
        );
        require!(
            end_time - start_time <= ctx.accounts.platform_account.max_project_duration,
            ErrorCode::SaleTooLong
        );
        
        // Validate parameters
        require!(token_price > 0, ErrorCode::InvalidPrice);
        require!(total_tokens > 0, ErrorCode::InvalidTokenAmount);
        require!(min_purchase > 0, ErrorCode::InvalidPurchaseAmount);
        require!(max_purchase >= min_purchase, ErrorCode::InvalidPurchaseAmount);
        require!(referral_rate <= 10000, ErrorCode::InvalidReferralRate);
        
        let sale_config = &mut ctx.accounts.sale_configuration;
        sale_config.project_id = project.id;
        sale_config.sale_type = sale_type;
        sale_config.token_price = token_price;
        sale_config.total_tokens = total_tokens;
        sale_config.tokens_sold = 0;
        sale_config.min_purchase = min_purchase;
        sale_config.max_purchase = max_purchase;
        sale_config.start_time = start_time;
        sale_config.end_time = end_time;
        sale_config.is_whitelist_only = is_whitelist_only;
        sale_config.requires_kyc = requires_kyc;
        sale_config.referral_enabled = referral_enabled;
        sale_config.referral_rate = referral_rate;
        sale_config.payment_mint = ctx.accounts.payment_mint.key();
        sale_config.is_active = true;
        sale_config.bump = ctx.bumps.sale_configuration;

        // Transfer tokens to sale vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.creator_token_account.to_account_info(),
                to: ctx.accounts.sale_vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, total_tokens)?;

        emit!(SaleConfigured {
            project_id: project.id,
            sale_type,
            token_price,
            total_tokens,
            start_time,
            end_time,
            is_whitelist_only,
        });

        Ok(())
    }

    /// Create participant account for tracking contributions
    pub fn create_participant_account(ctx: Context<CreateParticipantAccount>) -> Result<()> {
        let participant = &mut ctx.accounts.participant_account;
        participant.wallet = ctx.accounts.participant.key();
        participant.project_id = ctx.accounts.sale_configuration.project_id;
        participant.sale_type = ctx.accounts.sale_configuration.sale_type;
        participant.total_contributed = 0;
        participant.tokens_allocated = 0;
        participant.tokens_claimed = 0;
        participant.last_claim_time = 0;
        participant.referrer = None;
        participant.referral_rewards = 0;
        participant.kyc_verified = false;
        participant.kyc_provider = None;
        participant.joined_at = Clock::get()?.unix_timestamp;
        participant.bump = ctx.bumps.participant_account;

        Ok(())
    }

    /// Add wallets to sale whitelist (creator or admin only)
    pub fn add_to_whitelist(
        ctx: Context<AddToWhitelist>,
        wallet_addresses: Vec<Pubkey>,
        max_allocations: Vec<u64>,
    ) -> Result<()> {
        require!(wallet_addresses.len() == max_allocations.len(), ErrorCode::MismatchedArrays);
        require!(wallet_addresses.len() <= 50, ErrorCode::TooManyWallets); // Batch limit
        
        let sale_config = &ctx.accounts.sale_configuration;
        require!(sale_config.is_whitelist_only, ErrorCode::WhitelistNotRequired);
        
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time < sale_config.start_time, ErrorCode::SaleAlreadyStarted);

        // Store whitelist entries (simplified - in production, use separate accounts)
        emit!(WhitelistUpdated {
            project_id: sale_config.project_id,
            sale_type: sale_config.sale_type,
            wallet_addresses,
            max_allocations,
            added_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Participate in a token sale
    pub fn participate_in_sale(
        ctx: Context<ParticipateInSale>,
        token_amount: u64,              // How many tokens to buy
        referrer: Option<Pubkey>,       // Optional referrer
    ) -> Result<()> {
        let sale_config = &ctx.accounts.sale_configuration;
        let current_time = Clock::get()?.unix_timestamp;
        
        // Basic sale validation
        require!(sale_config.is_active, ErrorCode::SaleNotActive);
        require!(!ctx.accounts.platform_account.is_paused, ErrorCode::PlatformPaused);
        require!(current_time >= sale_config.start_time, ErrorCode::SaleNotStarted);
        require!(current_time <= sale_config.end_time, ErrorCode::SaleEnded);
        require!(token_amount > 0, ErrorCode::InvalidTokenAmount);
        require!(token_amount >= sale_config.min_purchase, ErrorCode::BelowMinimumPurchase);
        require!(token_amount <= sale_config.max_purchase, ErrorCode::ExceedsPurchaseLimit);
        require!(token_amount <= sale_config.total_tokens - sale_config.tokens_sold, ErrorCode::InsufficientTokens);
        
        // KYC validation (simplified - would integrate with KYC provider)
        if sale_config.requires_kyc {
            require!(ctx.accounts.participant_account.kyc_verified, ErrorCode::KycRequired);
        }
        
        // Calculate payment amounts
        let gross_payment = token_amount
            .checked_mul(sale_config.token_price)
            .ok_or(ErrorCode::MathOverflow)?;
            
        let platform_fee = gross_payment
            .checked_mul(ctx.accounts.platform_account.platform_fee as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;
            
        let referral_reward = if sale_config.referral_enabled && referrer.is_some() {
            gross_payment
                .checked_mul(sale_config.referral_rate as u64)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(10000)
                .ok_or(ErrorCode::MathOverflow)?
        } else {
            0
        };
        
        let creator_payment = gross_payment
            .checked_sub(platform_fee)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_sub(referral_reward)
            .ok_or(ErrorCode::MathOverflow)?;

        // Transfer payment from participant to creator
        if creator_payment > 0 {
            let payment_transfer = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.participant_payment_account.to_account_info(),
                    to: ctx.accounts.creator_payment_account.to_account_info(),
                    authority: ctx.accounts.participant.to_account_info(),
                },
            );
            token::transfer(payment_transfer, creator_payment)?;
        }

        // Transfer platform fee
        if platform_fee > 0 {
            let fee_transfer = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.participant_payment_account.to_account_info(),
                    to: ctx.accounts.platform_fee_account.to_account_info(),
                    authority: ctx.accounts.participant.to_account_info(),
                },
            );
            token::transfer(fee_transfer, platform_fee)?;
        }

        // Update participant account
        let participant = &mut ctx.accounts.participant_account;
        participant.total_contributed = participant.total_contributed
            .checked_add(gross_payment)
            .ok_or(ErrorCode::MathOverflow)?;
        participant.tokens_allocated = participant.tokens_allocated
            .checked_add(token_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        
        if referrer.is_some() && participant.referrer.is_none() {
            participant.referrer = referrer;
        }

        // Update sale configuration
        let sale_config = &mut ctx.accounts.sale_configuration;
        sale_config.tokens_sold = sale_config.tokens_sold
            .checked_add(token_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(TokensPurchased {
            project_id: sale_config.project_id,
            participant: ctx.accounts.participant.key(),
            token_amount,
            payment_amount: gross_payment,
            platform_fee,
            referral_reward,
            referrer,
        });

        Ok(())
    }

    /// Claim allocated tokens (for immediate distribution sales)
    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        let participant = &mut ctx.accounts.participant_account;
        let sale_config = &ctx.accounts.sale_configuration;
        
        // Calculate claimable amount (for now, immediate claiming - vesting in Phase 3)
        let claimable_amount = participant.tokens_allocated
            .checked_sub(participant.tokens_claimed)
            .ok_or(ErrorCode::MathOverflow)?;
            
        require!(claimable_amount > 0, ErrorCode::NoTokensToClaim);

        // Transfer tokens from sale vault to participant
        let seeds = &[
            b"sale_config",
            sale_config.project_id.to_le_bytes().as_ref(),
            &[sale_config.sale_type as u8],
            &[sale_config.bump],
        ];
        let signer = &[&seeds[..]];

        let token_transfer = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sale_vault.to_account_info(),
                to: ctx.accounts.participant_token_account.to_account_info(),
                authority: ctx.accounts.sale_configuration.to_account_info(),
            },
            signer,
        );
        token::transfer(token_transfer, claimable_amount)?;

        // Update participant claim tracking
        participant.tokens_claimed = participant.tokens_claimed
            .checked_add(claimable_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        participant.last_claim_time = Clock::get()?.unix_timestamp;

        emit!(TokensClaimed {
            project_id: sale_config.project_id,
            participant: ctx.accounts.participant.key(),
            amount: claimable_amount,
            timestamp: participant.last_claim_time,
        });

        Ok(())
    }
}

/// Platform-wide configuration and state
#[account]
#[derive(Default)]
pub struct PlatformAccount {
    pub authority: Pubkey,              // Platform admin authority (32 bytes)
    pub treasury: Pubkey,               // Platform fee collection wallet (32 bytes)
    pub platform_fee: u16,             // Basis points (e.g., 250 = 2.5%) (2 bytes)
    pub total_projects: u64,            // Counter for project IDs (8 bytes)
    pub is_paused: bool,                // Emergency pause flag (1 byte)
    pub min_project_duration: i64,      // Minimum sale duration in seconds (8 bytes)
    pub max_project_duration: i64,      // Maximum sale duration in seconds (8 bytes)
    pub bump: u8,                       // PDA bump seed (1 byte)
}

impl PlatformAccount {
    pub const INIT_SPACE: usize = 32 + 32 + 2 + 8 + 1 + 8 + 8 + 1; // 92 bytes
}

/// Individual project information and metadata
#[account]
#[derive(Default)]
pub struct ProjectAccount {
    pub id: u64,                        // Unique project identifier (8 bytes)
    pub creator: Pubkey,                // Project creator/owner (32 bytes)
    pub name: String,                   // Project name (4 + 50 = 54 bytes max)
    pub description: String,            // Project description (4 + 500 = 504 bytes max)
    pub logo_url: String,               // IPFS or web URL for logo (4 + 100 = 104 bytes max)
    pub website: String,                // Project website (4 + 100 = 104 bytes max)
    pub twitter: String,                // Twitter handle (4 + 50 = 54 bytes max)
    pub discord: String,                // Discord invite link (4 + 100 = 104 bytes max)
    pub telegram: String,               // Telegram channel (4 + 100 = 104 bytes max)
    pub category: ProjectCategory,      // DeFi, Gaming, NFT, etc. (1 byte)
    pub tags: Vec<String>,              // Searchable tags (4 + 10 * 24 = 244 bytes max)
    pub token_mint: Pubkey,             // Token being sold (32 bytes)
    pub token_name: String,             // Token name (4 + 50 = 54 bytes max)
    pub token_symbol: String,           // Token symbol (4 + 10 = 14 bytes max)
    pub token_decimals: u8,             // Token decimal places (1 byte)
    pub status: ProjectStatus,          // Draft, Active, Paused, Completed, Failed (1 byte)
    pub created_at: i64,                // Unix timestamp (8 bytes)
    pub updated_at: i64,                // Last update timestamp (8 bytes)
    pub approval_status: ApprovalStatus, // Pending, Approved, Rejected (1 byte)
    pub approved_by: Option<Pubkey>,    // Admin who approved (1 + 32 = 33 bytes)
    pub approved_at: Option<i64>,       // Approval timestamp (1 + 8 = 9 bytes)
    pub bump: u8,                       // PDA bump seed (1 byte)
}

impl ProjectAccount {
    pub const INIT_SPACE: usize = 8 + 32 + 54 + 504 + 104 + 104 + 54 + 104 + 104 + 1 + 244 + 32 + 54 + 14 + 1 + 1 + 8 + 8 + 1 + 33 + 9 + 1; // ~1330 bytes
}

/// Sale configuration for different tiers
#[account]
#[derive(Default)]
pub struct SaleConfiguration {
    pub project_id: u64,               // Associated project (8 bytes)
    pub sale_type: SaleType,           // Seed, Private, Public (1 byte)
    pub token_price: u64,              // Price per token (in payment token lamports) (8 bytes)
    pub total_tokens: u64,             // Total tokens for this sale tier (8 bytes)
    pub tokens_sold: u64,              // Tokens already sold (8 bytes)
    pub min_purchase: u64,             // Minimum purchase amount (8 bytes)
    pub max_purchase: u64,             // Maximum purchase amount (8 bytes)
    pub start_time: i64,               // Sale start timestamp (8 bytes)
    pub end_time: i64,                 // Sale end timestamp (8 bytes)
    pub is_whitelist_only: bool,       // Requires whitelist approval (1 byte)
    pub requires_kyc: bool,            // Requires KYC verification (1 byte)
    pub referral_enabled: bool,        // Enable referral rewards (1 byte)
    pub referral_rate: u16,            // Referral reward rate (basis points) (2 bytes)
    pub payment_mint: Pubkey,          // Payment token mint (32 bytes)
    pub is_active: bool,               // Sale is active (1 byte)
    pub bump: u8,                      // PDA bump seed (1 byte)
}

impl SaleConfiguration {
    pub const INIT_SPACE: usize = 8 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1 + 2 + 32 + 1 + 1; // 104 bytes
}

/// Participant account to track individual contributions and allocations
#[account]
#[derive(Default)]
pub struct ParticipantAccount {
    pub wallet: Pubkey,                 // Participant's wallet (32 bytes)
    pub project_id: u64,                // Associated project (8 bytes)
    pub sale_type: SaleType,            // Which sale tier they participated in (1 byte)
    pub total_contributed: u64,         // Total payment tokens contributed (8 bytes)
    pub tokens_allocated: u64,          // Total tokens allocated (8 bytes)
    pub tokens_claimed: u64,            // Tokens already claimed (8 bytes)
    pub last_claim_time: i64,           // Last vesting claim timestamp (8 bytes)
    pub referrer: Option<Pubkey>,       // Who referred this participant (1 + 32 = 33 bytes)
    pub referral_rewards: u64,          // Referral rewards earned (8 bytes)
    pub kyc_verified: bool,             // KYC verification status (1 byte)
    pub kyc_provider: Option<String>,   // KYC provider identifier (1 + 20 = 21 bytes max)
    pub joined_at: i64,                 // When they first participated (8 bytes)
    pub bump: u8,                       // PDA bump seed (1 byte)
}

impl ParticipantAccount {
    pub const INIT_SPACE: usize = 32 + 8 + 1 + 8 + 8 + 8 + 8 + 33 + 8 + 1 + 21 + 8 + 1; // 145 bytes
}

/// Project categories for filtering and organization
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProjectCategory {
    DeFi,
    Gaming,
    NFT,
    Infrastructure,
    Social,
    Metaverse,
    AI,
    Other,
}

impl Default for ProjectCategory {
    fn default() -> Self {
        ProjectCategory::Other
    }
}

/// Project status lifecycle
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProjectStatus {
    Draft,        // Being created
    Submitted,    // Awaiting approval
    Active,       // Approved and can configure sales
    Paused,       // Temporarily stopped
    Completed,    // Successfully finished
    Failed,       // Did not meet goals
    Cancelled,    // Cancelled by creator
}

impl Default for ProjectStatus {
    fn default() -> Self {
        ProjectStatus::Draft
    }
}

/// Admin approval status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

impl Default for ApprovalStatus {
    fn default() -> Self {
        ApprovalStatus::Pending
    }
}

/// Sale tier types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum SaleType {
    Seed,     // Early investors, small allocation
    Private,  // Whitelisted participants
    Public,   // Open to everyone
}

impl Default for SaleType {
    fn default() -> Self {
        SaleType::Public
    }
}

/// Type alias for sale tiers (same as SaleType)
pub type SaleTier = SaleType;

// Account validation structs

/// Initialize platform account
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Treasury account for platform fees
    pub treasury: AccountInfo<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PlatformAccount::INIT_SPACE,
        seeds = [b"platform"],
        bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,

    pub system_program: Program<'info, System>,
}

/// Update platform configuration
#[derive(Accounts)]
pub struct UpdatePlatformConfig<'info> {
    #[account(
        mut,
        constraint = authority.key() == platform_account.authority @ ErrorCode::UnauthorizedAccess
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,
}

/// Pause platform operations
#[derive(Accounts)]
pub struct PausePlatform<'info> {
    #[account(
        mut,
        constraint = authority.key() == platform_account.authority @ ErrorCode::UnauthorizedAccess
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,
}

/// Unpause platform operations
#[derive(Accounts)]
pub struct UnpausePlatform<'info> {
    #[account(
        mut,
        constraint = authority.key() == platform_account.authority @ ErrorCode::UnauthorizedAccess
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,
}

/// Create new project
#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + ProjectAccount::INIT_SPACE,
        seeds = [b"project", creator.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub project_account: Account<'info, ProjectAccount>,

    pub token_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

/// Update project metadata
#[derive(Accounts)]
pub struct UpdateProject<'info> {
    #[account(
        mut,
        constraint = creator.key() == project_account.creator @ ErrorCode::UnauthorizedAccess
    )]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,
}

/// Submit project for approval
#[derive(Accounts)]
pub struct SubmitForApproval<'info> {
    #[account(
        mut,
        constraint = creator.key() == project_account.creator @ ErrorCode::UnauthorizedAccess
    )]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,
}

/// Approve project
#[derive(Accounts)]
pub struct ApproveProject<'info> {
    #[account(
        mut,
        constraint = admin.key() == platform_account.authority @ ErrorCode::UnauthorizedAccess
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,

    #[account(
        mut,
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,
}

/// Reject project
#[derive(Accounts)]
pub struct RejectProject<'info> {
    #[account(
        mut,
        constraint = admin.key() == platform_account.authority @ ErrorCode::UnauthorizedAccess
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,

    #[account(
        mut,
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,
}

/// Configure sale tier
#[derive(Accounts)]
pub struct ConfigureSaleTier<'info> {
    #[account(
        mut,
        constraint = project_creator.key() == project_account.creator @ ErrorCode::UnauthorizedAccess
    )]
    pub project_creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump,
        constraint = project_account.approval_status == ApprovalStatus::Approved @ ErrorCode::ProjectNotApproved
    )]
    pub project_account: Account<'info, ProjectAccount>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

/// Create participant account
#[derive(Accounts)]
pub struct CreateParticipantAccount<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,

    #[account(
        init,
        payer = participant,
        space = 8 + 145,
        seeds = [b"participant", project_account.key().as_ref(), participant.key().as_ref()],
        bump
    )]
    pub participant_account: Account<'info, ParticipantAccount>,

    #[account(
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,

    pub system_program: Program<'info, System>,
}

/// Add to whitelist
#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    #[account(
        mut,
        constraint = project_creator.key() == project_account.creator @ ErrorCode::UnauthorizedAccess
    )]
    pub project_creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"participant", project_account.key().as_ref(), participant_account.wallet.as_ref()],
        bump = participant_account.bump
    )]
    pub participant_account: Account<'info, ParticipantAccount>,

    #[account(
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,
}

/// Participate in sale
#[derive(Accounts)]
pub struct ParticipateInSale<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,

    #[account(
        mut,
        seeds = [b"participant", project_account.key().as_ref(), participant.key().as_ref()],
        bump = participant_account.bump
    )]
    pub participant_account: Account<'info, ParticipantAccount>,

    #[account(
        mut,
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump,
        constraint = project_account.approval_status == ApprovalStatus::Approved @ ErrorCode::ProjectNotApproved
    )]
    pub project_account: Account<'info, ProjectAccount>,

    #[account(
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,

    #[account(
        mut,
        constraint = participant_token_account.owner == participant.key() @ ErrorCode::UnauthorizedAccess
    )]
    pub participant_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub project_treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub platform_treasury: Account<'info, TokenAccount>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

/// Claim tokens
#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,

    #[account(
        mut,
        seeds = [b"participant", project_account.key().as_ref(), participant.key().as_ref()],
        bump = participant_account.bump
    )]
    pub participant_account: Account<'info, ParticipantAccount>,

    #[account(
        seeds = [b"project", project_account.creator.as_ref(), project_account.name.as_bytes()],
        bump = project_account.bump
    )]
    pub project_account: Account<'info, ProjectAccount>,

    #[account(
        mut,
        constraint = participant_token_account.owner == participant.key() @ ErrorCode::UnauthorizedAccess,
        constraint = participant_token_account.mint == project_account.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub participant_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = project_token_account.mint == project_account.token_mint @ ErrorCode::InvalidTokenMint
    )]
    pub project_token_account: Account<'info, TokenAccount>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

// Events for frontend integration

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub platform_fee: u16,
}

#[event]
pub struct PlatformConfigUpdated {
    pub platform_fee: u16,
    pub min_duration: i64,
    pub max_duration: i64,
}

#[event]
pub struct PlatformPaused {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PlatformUnpaused {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProjectCreated {
    pub project_id: u64,
    pub creator: Pubkey,
    pub name: String,
    pub token_mint: Pubkey,
    pub category: ProjectCategory,
}

#[event]
pub struct ProjectUpdated {
    pub project_id: u64,
    pub creator: Pubkey,
    pub updated_at: i64,
}

#[event]
pub struct ProjectSubmitted {
    pub project_id: u64,
    pub creator: Pubkey,
    pub submitted_at: i64,
}

#[event]
pub struct ProjectApproved {
    pub project_id: u64,
    pub admin: Pubkey,
    pub approved_at: i64,
}

#[event]
pub struct ProjectRejected {
    pub project_id: u64,
    pub admin: Pubkey,
    pub reason: String,
    pub rejected_at: i64,
}

#[event]
pub struct SaleConfigured {
    pub project_id: u64,
    pub tier: SaleTier,
    pub start_time: i64,
    pub end_time: i64,
    pub token_price: u64,
    pub max_allocation: u64,
    pub configured_by: Pubkey,
}

#[event]
pub struct ParticipantRegistered {
    pub project_id: u64,
    pub participant: Pubkey,
    pub referrer: Option<Pubkey>,
    pub timestamp: i64,
}

#[event]
pub struct WhitelistUpdated {
    pub project_id: u64,
    pub participant: Pubkey,
    pub tier: SaleTier,
    pub max_allocation: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TokensPurchased {
    pub project_id: u64,
    pub participant: Pubkey,
    pub tier: SaleTier,
    pub contribution_amount: u64,
    pub token_amount: u64,
    pub referrer: Option<Pubkey>,
    pub timestamp: i64,
}

#[event]
pub struct TokensClaimed {
    pub project_id: u64,
    pub participant: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

/// Custom error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid platform fee: must be 10000 basis points or less")]
    InvalidPlatformFee,
    #[msg("Invalid duration: must be positive and logical")]
    InvalidDuration,
    #[msg("Platform is currently paused")]
    PlatformPaused,
    #[msg("Unauthorized access: incorrect authority")]
    UnauthorizedAccess,
    #[msg("Project name too long: maximum 50 characters")]
    NameTooLong,
    #[msg("Project description too long: maximum 500 characters")]
    DescriptionTooLong,
    #[msg("Too many tags: maximum 10 tags allowed")]
    TooManyTags,
    #[msg("Project is not in editable state")]
    ProjectNotEditable,
    #[msg("Incomplete project: missing required fields")]
    IncompleteProject,
    #[msg("Invalid project status for this operation")]
    InvalidProjectStatus,
    #[msg("Invalid approval status for this operation")]
    InvalidApprovalStatus,
    #[msg("Rejection reason too long: maximum 200 characters")]
    ReasonTooLong,
    #[msg("Project is not approved for sales")]
    ProjectNotApproved,
    #[msg("Project is not currently active")]
    ProjectNotActive,
    #[msg("Sale duration too short: minimum required")]
    SaleTooShort,
    #[msg("Sale duration too long: maximum exceeded")]
    SaleTooLong,
    #[msg("Invalid token price: must be greater than zero")]
    InvalidTokenPrice,
    #[msg("Invalid allocation: must be greater than zero")]
    InvalidAllocation,
    #[msg("Sale tier already configured")]
    SaleTierAlreadyConfigured,
    #[msg("Sale has not started yet")]
    SaleNotStarted,
    #[msg("Sale has already ended")]
    SaleEnded,
    #[msg("Participant not whitelisted for this tier")]
    NotWhitelisted,
    #[msg("Maximum allocation exceeded")]
    AllocationExceeded,
    #[msg("KYC verification required")]
    KycRequired,
    #[msg("Invalid referrer: cannot refer yourself")]
    InvalidReferrer,
    #[msg("No tokens available to claim")]
    NoTokensToClaim,
    #[msg("Tokens already claimed")]
    TokensAlreadyClaimed,
    #[msg("Insufficient token balance in project treasury")]
    InsufficientTokenBalance,
    #[msg("Invalid treasury account")]
    InvalidTreasury,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Sale tier not configured")]
    SaleTierNotConfigured,
    #[msg("Invalid start time: must be in the future")]
    InvalidStartTime,
    #[msg("Invalid end time: must be after start time")]
    InvalidEndTime,
    #[msg("Invalid price: must be greater than zero")]
    InvalidPrice,
    #[msg("Invalid token amount: must be greater than zero")]
    InvalidTokenAmount,
    #[msg("Invalid purchase amount")]
    InvalidPurchaseAmount,
    #[msg("Invalid referral rate: must be 10000 basis points or less")]
    InvalidReferralRate,
    #[msg("Mismatched array lengths")]
    MismatchedArrays,
    #[msg("Too many wallets in batch: maximum 50")]
    TooManyWallets,
    #[msg("Whitelist not required for this sale")]
    WhitelistNotRequired,
    #[msg("Sale has already started")]
    SaleAlreadyStarted,
    #[msg("Sale is not currently active")]
    SaleNotActive,
    #[msg("Purchase amount below minimum")]
    BelowMinimumPurchase,
    #[msg("Purchase amount exceeds limit")]
    ExceedsPurchaseLimit,
    #[msg("Insufficient tokens available")]
    InsufficientTokens,
    #[msg("Mathematical overflow occurred")]
    MathOverflow,
}