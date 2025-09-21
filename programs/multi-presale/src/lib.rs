use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Multi-project presale platform program ID
declare_id!("11111111111111111111111111111112");

#[program]
pub mod multi_presale {
    use super::*;

    /// Initialize the platform with admin authority - PHASE 1
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_fee: u16,
        min_project_duration: i64,
        max_project_duration: i64,
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

    /// Create a new project (any user) - PHASE 1
    pub fn create_project(
        ctx: Context<CreateProject>,
        name: String,
        description: String,
        logo_url: String,
        website: String,
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

        platform.total_projects += 1;
        let project_id = platform.total_projects;

        project.id = project_id;
        project.creator = ctx.accounts.creator.key();
        project.name = name.clone();
        project.description = description;
        project.logo_url = logo_url;
        project.website = website;
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

    /// Configure sale tier for a project (creator only) - PHASE 2
    pub fn configure_sale_tier(
        ctx: Context<ConfigureSaleTier>,
        sale_type: SaleType,
        token_price: u64,
        total_tokens: u64,
        min_purchase: u64,
        max_purchase: u64,
        start_time: i64,
        end_time: i64,
        is_whitelist_only: bool,
        requires_kyc: bool,
        referral_enabled: bool,
        referral_rate: u16,
    ) -> Result<()> {
        require!(!ctx.accounts.platform_account.is_paused, ErrorCode::PlatformPaused);
        require!(ctx.accounts.project_account.status == ProjectStatus::Active, ErrorCode::ProjectNotActive);
        require!(token_price > 0, ErrorCode::InvalidPrice);
        require!(total_tokens > 0, ErrorCode::InvalidTokenAmount);
        require!(min_purchase > 0, ErrorCode::InvalidPrice);
        require!(max_purchase >= min_purchase, ErrorCode::InvalidPrice);
        require!(end_time > start_time, ErrorCode::SaleEndTimeInPast);
        require!(referral_rate <= 10000, ErrorCode::InvalidPlatformFee);
        
        let current_time = Clock::get()?.unix_timestamp;
        require!(start_time > current_time, ErrorCode::SaleEndTimeInPast);
        
        let duration = end_time - start_time;
        require!(
            duration >= ctx.accounts.platform_account.min_project_duration,
            ErrorCode::InvalidDuration
        );
        require!(
            duration <= ctx.accounts.platform_account.max_project_duration,
            ErrorCode::InvalidDuration
        );

        let sale_config = &mut ctx.accounts.sale_configuration;
        sale_config.project_id = ctx.accounts.project_account.id;
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

        emit!(SaleConfigured {
            project_id: sale_config.project_id,
            sale_type,
            token_price,
            total_tokens,
            start_time,
            end_time,
        });

        Ok(())
    }

    /// Approve a project (admin only) - PHASE 1
    pub fn approve_project(ctx: Context<ApproveProject>) -> Result<()> {
        let project = &mut ctx.accounts.project_account;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(project.status == ProjectStatus::Draft, ErrorCode::InvalidProjectStatus);
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

    /// LEGACY ESCROW FUNCTIONS (to be replaced with Phase 2 multi-project functions)
    /// Initialize a new token sale with production security features
    pub fn initialize_sale(
        ctx: Context<InitializeSale>,
        price_per_token: u64,           // Price in lamports (1 USDC = 1_000_000 lamports)
        total_tokens: u64,              // How many tokens to sell
        sale_start_time: i64,           // Unix timestamp when sale starts
        sale_end_time: i64,             // Unix timestamp when sale ends
        max_tokens_per_buyer: u64,      // Maximum tokens per buyer (0 = no limit)
        platform_fee_bps: u16,         // Platform fee in basis points (100 = 1%)
        platform_fee_recipient: Pubkey, // Where platform fees are sent
    ) -> Result<()> {
        // Input validation
        require!(price_per_token > 0, ErrorCode::InvalidPrice);
        require!(total_tokens > 0, ErrorCode::InvalidTokenAmount);
        require!(sale_start_time > 0, ErrorCode::InvalidStartTime);
        require!(sale_end_time > sale_start_time, ErrorCode::InvalidEndTime);
        require!(platform_fee_bps <= 10000, ErrorCode::InvalidPlatformFee); // Max 100%
        
        let current_time = Clock::get()?.unix_timestamp;
        require!(sale_end_time > current_time, ErrorCode::SaleEndTimeInPast);

        let sale = &mut ctx.accounts.token_sale;
        
        // Initialize sale account with security features
        sale.seller = ctx.accounts.seller.key();
        sale.token_mint = ctx.accounts.token_mint.key();
        sale.payment_mint = ctx.accounts.payment_mint.key();
        sale.price_per_token = price_per_token;
        sale.total_tokens = total_tokens;
        sale.tokens_available = total_tokens;
        sale.sale_start_time = sale_start_time;
        sale.sale_end_time = sale_end_time;
        sale.max_tokens_per_buyer = max_tokens_per_buyer;
        sale.platform_fee_bps = platform_fee_bps;
        sale.platform_fee_recipient = platform_fee_recipient;
        sale.is_active = true;
        sale.is_paused = false;
        sale.bump = ctx.bumps.token_sale;

        // Transfer seller's tokens to the program's vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.token_vault.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, total_tokens)?;

        msg!("Token sale initialized: {} tokens at {} lamports each, from {} to {}", 
            total_tokens, price_per_token, sale_start_time, sale_end_time);
        Ok(())
    }

    /// Create a buyer tracking account (first-time buyers only)
    pub fn create_buyer_account(ctx: Context<CreateBuyerAccount>) -> Result<()> {
        let buyer_account = &mut ctx.accounts.buyer_account;
        buyer_account.buyer = ctx.accounts.buyer.key();
        buyer_account.token_sale = ctx.accounts.token_sale.key();
        buyer_account.tokens_purchased = 0;
        buyer_account.bump = ctx.bumps.buyer_account;
        
        msg!("Buyer account created for {}", ctx.accounts.buyer.key());
        Ok(())
    }

    /// Buy tokens from the sale with comprehensive security checks
    pub fn buy_tokens(
        ctx: Context<BuyTokens>,
        token_amount: u64,           // How many tokens to buy
    ) -> Result<()> {
        // Get sale data and perform security checks
        let sale = &ctx.accounts.token_sale;
        
        // Basic sale status checks
        require!(sale.is_active, ErrorCode::SaleNotActive);
        require!(!sale.is_paused, ErrorCode::SalePaused);
        require!(token_amount > 0, ErrorCode::InvalidTokenAmount);
        require!(token_amount <= sale.tokens_available, ErrorCode::InsufficientTokens);
        
        // Time-based validation
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time >= sale.sale_start_time, ErrorCode::SaleNotStarted);
        require!(current_time <= sale.sale_end_time, ErrorCode::SaleEnded);
        
        // Check per-buyer purchase limit if set
        if sale.max_tokens_per_buyer > 0 {
            let current_purchased = ctx.accounts.buyer_account.tokens_purchased;
            let total_after_purchase = current_purchased
                .checked_add(token_amount)
                .ok_or(ErrorCode::MathOverflow)?;
            require!(
                total_after_purchase <= sale.max_tokens_per_buyer,
                ErrorCode::ExceedsPurchaseLimit
            );
        }

        // Calculate payment amount and platform fee
        let gross_payment = token_amount
            .checked_mul(sale.price_per_token)
            .ok_or(ErrorCode::MathOverflow)?;
            
        let platform_fee = if sale.platform_fee_bps > 0 {
            gross_payment
                .checked_mul(sale.platform_fee_bps as u64)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(10000)
                .ok_or(ErrorCode::MathOverflow)?
        } else {
            0
        };
        
        let seller_payment = gross_payment
            .checked_sub(platform_fee)
            .ok_or(ErrorCode::MathOverflow)?;

        // Transfer payment from buyer to seller
        if seller_payment > 0 {
            let payment_transfer_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_payment_account.to_account_info(),
                    to: ctx.accounts.seller_payment_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            );
            token::transfer(payment_transfer_ctx, seller_payment)?;
        }

        // Transfer platform fee if applicable
        if platform_fee > 0 {
            let fee_transfer_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_payment_account.to_account_info(),
                    to: ctx.accounts.platform_fee_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            );
            token::transfer(fee_transfer_ctx, platform_fee)?;
        }

        // Transfer tokens from vault to buyer
        let seeds = &[
            b"token_sale",
            sale.seller.as_ref(),
            sale.token_mint.as_ref(),
            &[sale.bump],
        ];
        let signer = &[&seeds[..]];

        let token_transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_vault.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.token_sale.to_account_info(),
            },
            signer,
        );
        token::transfer(token_transfer_ctx, token_amount)?;

        // Update sale state
        let sale = &mut ctx.accounts.token_sale;
        sale.tokens_available = sale.tokens_available
            .checked_sub(token_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // Update buyer tracking
        let buyer_account = &mut ctx.accounts.buyer_account;
        buyer_account.tokens_purchased = buyer_account.tokens_purchased
            .checked_add(token_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        msg!("Sold {} tokens for {} payment (fee: {})", token_amount, seller_payment, platform_fee);
        Ok(())
    }

    /// Cancel sale and return unsold tokens to seller
    pub fn cancel_sale(ctx: Context<CancelSale>) -> Result<()> {
        let sale = &ctx.accounts.token_sale;
        require!(sale.is_active, ErrorCode::SaleNotActive);

        // Return remaining tokens to seller
        if sale.tokens_available > 0 {
            let seeds = &[
                b"token_sale",
                sale.seller.as_ref(),
                sale.token_mint.as_ref(),
                &[sale.bump],
            ];
            let signer = &[&seeds[..]];

            let return_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.token_vault.to_account_info(),
                    to: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.token_sale.to_account_info(),
                },
                signer,
            );
            token::transfer(return_ctx, sale.tokens_available)?;
        }

        // Update sale state
        let sale = &mut ctx.accounts.token_sale;
        sale.is_active = false;
        sale.tokens_available = 0;

        msg!("Sale cancelled, tokens returned to seller");
        Ok(())
    }

    /// Emergency pause/unpause functionality (seller only)
    pub fn toggle_pause(ctx: Context<TogglePause>) -> Result<()> {
        let sale = &mut ctx.accounts.token_sale;
        require!(sale.is_active, ErrorCode::SaleNotActive);
        
        sale.is_paused = !sale.is_paused;
        
        msg!("Sale pause status changed to: {}", sale.is_paused);
        Ok(())
    }

    /// Update sale parameters (seller only, before sale starts)
    pub fn update_sale_params(
        ctx: Context<UpdateSaleParams>,
        new_price_per_token: Option<u64>,
        new_sale_start_time: Option<i64>,
        new_sale_end_time: Option<i64>,
        new_max_tokens_per_buyer: Option<u64>,
    ) -> Result<()> {
        let sale = &mut ctx.accounts.token_sale;
        require!(sale.is_active, ErrorCode::SaleNotActive);
        
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time < sale.sale_start_time, ErrorCode::SaleAlreadyStarted);

        // Update price if provided
        if let Some(price) = new_price_per_token {
            require!(price > 0, ErrorCode::InvalidPrice);
            sale.price_per_token = price;
        }

        // Update start time if provided
        if let Some(start_time) = new_sale_start_time {
            require!(start_time > current_time, ErrorCode::InvalidStartTime);
            sale.sale_start_time = start_time;
        }

        // Update end time if provided
        if let Some(end_time) = new_sale_end_time {
            require!(end_time > sale.sale_start_time, ErrorCode::InvalidEndTime);
            sale.sale_end_time = end_time;
        }

        // Update purchase limit if provided
        if let Some(limit) = new_max_tokens_per_buyer {
            sale.max_tokens_per_buyer = limit;
        }

        msg!("Sale parameters updated");
        Ok(())
    }
}

/// Account structure for token sale state
#[account]
#[derive(Default)]
pub struct TokenSale {
    pub seller: Pubkey,              // Who created the sale (32 bytes)
    pub token_mint: Pubkey,          // Token being sold (32 bytes)
    pub payment_mint: Pubkey,        // Payment token (32 bytes)
    pub price_per_token: u64,        // Price in payment token lamports (8 bytes)
    pub total_tokens: u64,           // Original token amount (8 bytes)
    pub tokens_available: u64,       // Tokens left to sell (8 bytes)
    pub sale_start_time: i64,        // Unix timestamp when sale starts (8 bytes)
    pub sale_end_time: i64,          // Unix timestamp when sale ends (8 bytes)
    pub max_tokens_per_buyer: u64,   // Maximum tokens one buyer can purchase (8 bytes)
    pub platform_fee_bps: u16,       // Platform fee in basis points (2 bytes)
    pub platform_fee_recipient: Pubkey, // Where platform fees go (32 bytes)
    pub is_active: bool,             // Sale status (1 byte)
    pub is_paused: bool,             // Emergency pause status (1 byte)
    pub bump: u8,                    // PDA bump seed (1 byte)
}

impl TokenSale {
    pub const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 2 + 32 + 1 + 1 + 1; // 181 bytes
}

/// Account to track individual buyer purchases
#[account]
#[derive(Default)]
pub struct BuyerAccount {
    pub buyer: Pubkey,              // Buyer's public key (32 bytes)
    pub token_sale: Pubkey,         // Associated token sale (32 bytes)
    pub tokens_purchased: u64,      // Total tokens purchased (8 bytes)
    pub bump: u8,                   // PDA bump seed (1 byte)
}

impl BuyerAccount {
    pub const INIT_SPACE: usize = 32 + 32 + 8 + 1; // 73 bytes
}

/// Account validation for initializing a sale
#[derive(Accounts)]
pub struct InitializeSale<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        init,
        payer = seller,
        space = 8 + TokenSale::INIT_SPACE,
        seeds = [b"token_sale", seller.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub token_sale: Account<'info, TokenSale>,

    pub token_mint: Account<'info, Mint>,
    pub payment_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = seller_token_account.mint == token_mint.key(),
        constraint = seller_token_account.owner == seller.key()
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = seller,
        token::mint = token_mint,
        token::authority = token_sale,
        seeds = [b"token_vault", token_sale.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

/// Account validation for creating buyer tracking account
#[derive(Accounts)]
pub struct CreateBuyerAccount<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    pub token_sale: Account<'info, TokenSale>,

    #[account(
        init,
        payer = buyer,
        space = 8 + BuyerAccount::INIT_SPACE,
        seeds = [b"buyer", buyer.key().as_ref(), token_sale.key().as_ref()],
        bump
    )]
    pub buyer_account: Account<'info, BuyerAccount>,

    pub system_program: Program<'info, System>,
}

/// Account validation for buying tokens
#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_sale", token_sale.seller.as_ref(), token_sale.token_mint.as_ref()],
        bump = token_sale.bump
    )]
    pub token_sale: Account<'info, TokenSale>,

    #[account(
        mut,
        seeds = [b"buyer", buyer.key().as_ref(), token_sale.key().as_ref()],
        bump = buyer_account.bump
    )]
    pub buyer_account: Account<'info, BuyerAccount>,

    #[account(
        mut,
        constraint = buyer_payment_account.mint == token_sale.payment_mint,
        constraint = buyer_payment_account.owner == buyer.key()
    )]
    pub buyer_payment_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = seller_payment_account.mint == token_sale.payment_mint,
        constraint = seller_payment_account.owner == token_sale.seller
    )]
    pub seller_payment_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = platform_fee_account.mint == token_sale.payment_mint,
        constraint = platform_fee_account.owner == token_sale.platform_fee_recipient
    )]
    pub platform_fee_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = buyer_token_account.mint == token_sale.token_mint,
        constraint = buyer_token_account.owner == buyer.key()
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"token_vault", token_sale.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Account validation for cancelling a sale
#[derive(Accounts)]
pub struct CancelSale<'info> {
    #[account(
        mut,
        constraint = seller.key() == token_sale.seller
    )]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_sale", token_sale.seller.as_ref(), token_sale.token_mint.as_ref()],
        bump = token_sale.bump
    )]
    pub token_sale: Account<'info, TokenSale>,

    #[account(
        mut,
        constraint = seller_token_account.mint == token_sale.token_mint,
        constraint = seller_token_account.owner == seller.key()
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"token_vault", token_sale.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Account validation for toggling pause
#[derive(Accounts)]
pub struct TogglePause<'info> {
    #[account(
        mut,
        constraint = seller.key() == token_sale.seller
    )]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_sale", token_sale.seller.as_ref(), token_sale.token_mint.as_ref()],
        bump = token_sale.bump
    )]
    pub token_sale: Account<'info, TokenSale>,
}

/// Account validation for updating sale parameters
#[derive(Accounts)]
pub struct UpdateSaleParams<'info> {
    #[account(
        mut,
        constraint = seller.key() == token_sale.seller
    )]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_sale", token_sale.seller.as_ref(), token_sale.token_mint.as_ref()],
        bump = token_sale.bump
    )]
    pub token_sale: Account<'info, TokenSale>,
}

/// Custom error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Sale is not active")]
    SaleNotActive,
    #[msg("Insufficient tokens available")]
    InsufficientTokens,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid price: must be greater than zero")]
    InvalidPrice,
    #[msg("Invalid token amount: must be greater than zero")]
    InvalidTokenAmount,
    #[msg("Invalid start time: must be greater than zero")]
    InvalidStartTime,
    #[msg("Invalid end time: must be after start time")]
    InvalidEndTime,
    #[msg("Sale end time cannot be in the past")]
    SaleEndTimeInPast,
    #[msg("Sale has not started yet")]
    SaleNotStarted,
    #[msg("Sale has ended")]
    SaleEnded,
    #[msg("Sale is currently paused")]
    SalePaused,
    #[msg("Purchase exceeds per-buyer limit")]
    ExceedsPurchaseLimit,
    #[msg("Invalid platform fee: must be 10000 basis points or less")]
    InvalidPlatformFee,
    #[msg("Sale has already started, cannot modify parameters")]
    SaleAlreadyStarted,
    // New error codes for multi-project platform
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
    #[msg("Project is not active")]
    ProjectNotActive,
}

// NEW MULTI-PROJECT PLATFORM DATA STRUCTURES

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
    pub const INIT_SPACE: usize = 8 + 32 + 54 + 504 + 104 + 104 + 1 + 244 + 32 + 54 + 14 + 1 + 1 + 8 + 8 + 1 + 33 + 9 + 1; // ~1200 bytes
}

/// Sale configuration for different tiers - PHASE 2
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

/// Sale tier types - PHASE 2
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

// NEW ACCOUNT VALIDATION CONTEXTS

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

/// Configure sale tier - PHASE 2
#[derive(Accounts)]
pub struct ConfigureSaleTier<'info> {
    #[account(mut)]
    pub project_creator: Signer<'info>,

    #[account(
        seeds = [b"platform"],
        bump = platform_account.bump
    )]
    pub platform_account: Account<'info, PlatformAccount>,

    #[account(
        mut,
        constraint = project_creator.key() == project_account.creator @ ErrorCode::UnauthorizedAccess
    )]
    pub project_account: Account<'info, ProjectAccount>,

    #[account(
        init,
        payer = project_creator,
        space = 8 + SaleConfiguration::INIT_SPACE,
        seeds = [b"sale_config", project_account.key().as_ref()],
        bump
    )]
    pub sale_configuration: Account<'info, SaleConfiguration>,

    pub payment_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

// NEW EVENTS

#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub platform_fee: u16,
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
pub struct ProjectApproved {
    pub project_id: u64,
    pub admin: Pubkey,
    pub approved_at: i64,
}

#[event]
pub struct SaleConfigured {
    pub project_id: u64,
    pub sale_type: SaleType,
    pub token_price: u64,
    pub total_tokens: u64,
    pub start_time: i64,
    pub end_time: i64,
}