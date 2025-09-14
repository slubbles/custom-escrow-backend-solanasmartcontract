use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// This is your program's on-chain address
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod escrow {
    use super::*;

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
}