import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("Custom Escrow - Production Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Escrow as Program<any>;

  describe("Complete Production Sale Lifecycle", () => {
    it("Full production sale: initialize → multiple buyers → platform fees → completion", async () => {
      // Setup accounts
      const seller = Keypair.generate();
      const buyer1 = Keypair.generate();
      const buyer2 = Keypair.generate();
      const buyer3 = Keypair.generate();
      const platformFeeRecipient = Keypair.generate();

      // Airdrop SOL
      await Promise.all([
        provider.connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(buyer1.publicKey, 2 * LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(buyer2.publicKey, 2 * LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(buyer3.publicKey, 2 * LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(platformFeeRecipient.publicKey, 2 * LAMPORTS_PER_SOL),
      ]);
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create mints
      const tokenMint = await createMint(provider.connection, seller, seller.publicKey, null, 6);
      const paymentMint = await createMint(provider.connection, seller, seller.publicKey, null, 6);

      // Create token accounts
      const sellerTokenAccount = await createAccount(provider.connection, seller, tokenMint, seller.publicKey);
      const sellerPaymentAccount = await createAccount(provider.connection, seller, paymentMint, seller.publicKey);
      const platformFeeAccount = await createAccount(provider.connection, platformFeeRecipient, paymentMint, platformFeeRecipient.publicKey);

      const buyer1TokenAccount = await createAccount(provider.connection, buyer1, tokenMint, buyer1.publicKey);
      const buyer1PaymentAccount = await createAccount(provider.connection, buyer1, paymentMint, buyer1.publicKey);

      const buyer2TokenAccount = await createAccount(provider.connection, buyer2, tokenMint, buyer2.publicKey);
      const buyer2PaymentAccount = await createAccount(provider.connection, buyer2, paymentMint, buyer2.publicKey);

      const buyer3TokenAccount = await createAccount(provider.connection, buyer3, tokenMint, buyer3.publicKey);
      const buyer3PaymentAccount = await createAccount(provider.connection, buyer3, paymentMint, buyer3.publicKey);

      // Setup sale parameters
      const PRICE_PER_TOKEN = 2_000_000; // 2 USDC per token
      const TOTAL_TOKENS = 1000 * Math.pow(10, 6); // 1000 tokens
      const MAX_TOKENS_PER_BUYER = 400 * Math.pow(10, 6); // 400 tokens max per buyer
      const PLATFORM_FEE_BPS = 250; // 2.5% platform fee

      // Mint tokens and payment tokens
      await mintTo(provider.connection, seller, tokenMint, sellerTokenAccount, seller, TOTAL_TOKENS);
      
      // Give buyers payment tokens
      await Promise.all([
        mintTo(provider.connection, seller, paymentMint, buyer1PaymentAccount, seller, 1000 * Math.pow(10, 6)),
        mintTo(provider.connection, seller, paymentMint, buyer2PaymentAccount, seller, 1000 * Math.pow(10, 6)),
        mintTo(provider.connection, seller, paymentMint, buyer3PaymentAccount, seller, 1000 * Math.pow(10, 6)),
      ]);

      // Calculate PDAs
      const [tokenSalePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_sale"), seller.publicKey.toBuffer(), tokenMint.toBuffer()],
        program.programId
      );

      const [tokenVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), tokenSalePDA.toBuffer()],
        program.programId
      );

      const [buyer1AccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyer"), buyer1.publicKey.toBuffer(), tokenSalePDA.toBuffer()],
        program.programId
      );

      const [buyer2AccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyer"), buyer2.publicKey.toBuffer(), tokenSalePDA.toBuffer()],
        program.programId
      );

      const [buyer3AccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyer"), buyer3.publicKey.toBuffer(), tokenSalePDA.toBuffer()],
        program.programId
      );

      const currentTime = Math.floor(Date.now() / 1000);

      // Step 1: Initialize sale with production features
      console.log("🚀 Step 1: Initializing production sale...");
      await program.methods
        .initializeSale(
          new anchor.BN(PRICE_PER_TOKEN),
          new anchor.BN(TOTAL_TOKENS),
          new anchor.BN(currentTime - 100), // Started 100 seconds ago
          new anchor.BN(currentTime + 3600), // Ends in 1 hour
          new anchor.BN(MAX_TOKENS_PER_BUYER),
          PLATFORM_FEE_BPS,
          platformFeeRecipient.publicKey
        )
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
          tokenMint: tokenMint,
          paymentMint: paymentMint,
          sellerTokenAccount: sellerTokenAccount,
          tokenVault: tokenVaultPDA,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();

      // Step 2: Create buyer accounts
      console.log("👥 Step 2: Creating buyer tracking accounts...");
      await Promise.all([
        program.methods
          .createBuyerAccount()
          .accounts({
            buyer: buyer1.publicKey,
            tokenSale: tokenSalePDA,
            buyerAccount: buyer1AccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer1])
          .rpc(),
        
        program.methods
          .createBuyerAccount()
          .accounts({
            buyer: buyer2.publicKey,
            tokenSale: tokenSalePDA,
            buyerAccount: buyer2AccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer2])
          .rpc(),
        
        program.methods
          .createBuyerAccount()
          .accounts({
            buyer: buyer3.publicKey,
            tokenSale: tokenSalePDA,
            buyerAccount: buyer3AccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer3])
          .rpc(),
      ]);

      // Step 3: Multiple buyer purchases with fee tracking
      console.log("💰 Step 3: Multiple buyer purchases...");
      
      const buyer1Purchase = 300 * Math.pow(10, 6); // 300 tokens
      const buyer2Purchase = 350 * Math.pow(10, 6); // 350 tokens  
      const buyer3Purchase = 350 * Math.pow(10, 6); // 350 tokens (total: 1000)

      // Track balances before all purchases
      const platformFeeBalanceBefore = await getAccount(provider.connection, platformFeeAccount);
      const sellerPaymentBalanceBefore = await getAccount(provider.connection, sellerPaymentAccount);

      // Buyer 1 purchase
      await program.methods
        .buyTokens(new anchor.BN(buyer1Purchase))
        .accounts({
          buyer: buyer1.publicKey,
          tokenSale: tokenSalePDA,
          buyerAccount: buyer1AccountPDA,
          buyerPaymentAccount: buyer1PaymentAccount,
          sellerPaymentAccount: sellerPaymentAccount,
          platformFeeAccount: platformFeeAccount,
          buyerTokenAccount: buyer1TokenAccount,
          tokenVault: tokenVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer1])
        .rpc();

      // Buyer 2 purchase
      await program.methods
        .buyTokens(new anchor.BN(buyer2Purchase))
        .accounts({
          buyer: buyer2.publicKey,
          tokenSale: tokenSalePDA,
          buyerAccount: buyer2AccountPDA,
          buyerPaymentAccount: buyer2PaymentAccount,
          sellerPaymentAccount: sellerPaymentAccount,
          platformFeeAccount: platformFeeAccount,
          buyerTokenAccount: buyer2TokenAccount,
          tokenVault: tokenVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer2])
        .rpc();

      // Buyer 3 purchase
      await program.methods
        .buyTokens(new anchor.BN(buyer3Purchase))
        .accounts({
          buyer: buyer3.publicKey,
          tokenSale: tokenSalePDA,
          buyerAccount: buyer3AccountPDA,
          buyerPaymentAccount: buyer3PaymentAccount,
          sellerPaymentAccount: sellerPaymentAccount,
          platformFeeAccount: platformFeeAccount,
          buyerTokenAccount: buyer3TokenAccount,
          tokenVault: tokenVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer3])
        .rpc();

      // Step 4: Verify complete sale state
      console.log("✅ Step 4: Verifying final sale state...");

      // Check token distributions
      const buyer1TokenBalance = await getAccount(provider.connection, buyer1TokenAccount);
      const buyer2TokenBalance = await getAccount(provider.connection, buyer2TokenAccount);
      const buyer3TokenBalance = await getAccount(provider.connection, buyer3TokenAccount);

      assert.equal(Number(buyer1TokenBalance.amount), buyer1Purchase);
      assert.equal(Number(buyer2TokenBalance.amount), buyer2Purchase);
      assert.equal(Number(buyer3TokenBalance.amount), buyer3Purchase);

      // Check buyer tracking
      const buyer1Account = await program.account.buyerAccount.fetch(buyer1AccountPDA);
      const buyer2Account = await program.account.buyerAccount.fetch(buyer2AccountPDA);
      const buyer3Account = await program.account.buyerAccount.fetch(buyer3AccountPDA);

      assert.equal(buyer1Account.tokensPurchased.toNumber(), buyer1Purchase);
      assert.equal(buyer2Account.tokensPurchased.toNumber(), buyer2Purchase);
      assert.equal(buyer3Account.tokensPurchased.toNumber(), buyer3Purchase);

      // Check platform fees collected
      const platformFeeBalanceAfter = await getAccount(provider.connection, platformFeeAccount);
      const sellerPaymentBalanceAfter = await getAccount(provider.connection, sellerPaymentAccount);

      const totalGrossPayment = (buyer1Purchase + buyer2Purchase + buyer3Purchase) * PRICE_PER_TOKEN / Math.pow(10, 6);
      const expectedTotalFee = Math.floor(totalGrossPayment * PLATFORM_FEE_BPS / 10000);
      const expectedSellerPayment = totalGrossPayment - expectedTotalFee;

      const actualPlatformFee = Number(platformFeeBalanceAfter.amount) - Number(platformFeeBalanceBefore.amount);
      const actualSellerPayment = Number(sellerPaymentBalanceAfter.amount) - Number(sellerPaymentBalanceBefore.amount);

      assert.equal(actualPlatformFee, expectedTotalFee);
      assert.equal(actualSellerPayment, expectedSellerPayment);

      // Check sale completion
      const finalSaleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(finalSaleAccount.tokensAvailable.toNumber(), 0); // Sold out

      console.log("🎉 Production sale completed successfully!");
      console.log(`💰 Total revenue: ${totalGrossPayment / Math.pow(10, 6)} USDC`);
      console.log(`🏦 Platform fee: ${actualPlatformFee / Math.pow(10, 6)} USDC`);
      console.log(`👨‍💼 Seller payment: ${actualSellerPayment / Math.pow(10, 6)} USDC`);
    });

    it("Emergency scenarios: pause, update params, and recovery", async () => {
      // Setup new sale for emergency testing
      const seller = Keypair.generate();
      const buyer = Keypair.generate();
      const platformFeeRecipient = Keypair.generate();

      await Promise.all([
        provider.connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(buyer.publicKey, 2 * LAMPORTS_PER_SOL),
        provider.connection.requestAirdrop(platformFeeRecipient.publicKey, 2 * LAMPORTS_PER_SOL),
      ]);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const tokenMint = await createMint(provider.connection, seller, seller.publicKey, null, 6);
      const paymentMint = await createMint(provider.connection, seller, seller.publicKey, null, 6);

      const sellerTokenAccount = await createAccount(provider.connection, seller, tokenMint, seller.publicKey);
      const sellerPaymentAccount = await createAccount(provider.connection, seller, paymentMint, seller.publicKey);
      const platformFeeAccount = await createAccount(provider.connection, platformFeeRecipient, paymentMint, platformFeeRecipient.publicKey);
      const buyerTokenAccount = await createAccount(provider.connection, buyer, tokenMint, buyer.publicKey);
      const buyerPaymentAccount = await createAccount(provider.connection, buyer, paymentMint, buyer.publicKey);

      const TOKENS_TO_SELL = 500 * Math.pow(10, 6);
      await mintTo(provider.connection, seller, tokenMint, sellerTokenAccount, seller, TOKENS_TO_SELL);
      await mintTo(provider.connection, seller, paymentMint, buyerPaymentAccount, seller, 1000 * Math.pow(10, 6));

      const [tokenSalePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_sale"), seller.publicKey.toBuffer(), tokenMint.toBuffer()],
        program.programId
      );

      const [tokenVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), tokenSalePDA.toBuffer()],
        program.programId
      );

      const [buyerAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyer"), buyer.publicKey.toBuffer(), tokenSalePDA.toBuffer()],
        program.programId
      );

      const currentTime = Math.floor(Date.now() / 1000);

      // Initialize sale in future
      console.log("🚀 Initializing future sale for parameter updates...");
      await program.methods
        .initializeSale(
          new anchor.BN(1_000_000), // 1 USDC per token
          new anchor.BN(TOKENS_TO_SELL),
          new anchor.BN(currentTime + 1800), // Start in 30 minutes
          new anchor.BN(currentTime + 5400), // End in 90 minutes
          new anchor.BN(100 * Math.pow(10, 6)), // 100 token limit
          1000, // 10% fee
          platformFeeRecipient.publicKey
        )
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
          tokenMint: tokenMint,
          paymentMint: paymentMint,
          sellerTokenAccount: sellerTokenAccount,
          tokenVault: tokenVaultPDA,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();

      // Test parameter updates before sale starts
      console.log("🔧 Testing parameter updates...");
      await program.methods
        .updateSaleParams(
          new anchor.BN(2_000_000), // Update price to 2 USDC
          new anchor.BN(currentTime - 100), // Start immediately
          null, // Keep same end time
          new anchor.BN(200 * Math.pow(10, 6)) // Increase limit to 200
        )
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      // Verify updates
      let saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.pricePerToken.toNumber(), 2_000_000);
      assert.equal(saleAccount.maxTokensPerBuyer.toNumber(), 200 * Math.pow(10, 6));

      // Create buyer account
      await program.methods
        .createBuyerAccount()
        .accounts({
          buyer: buyer.publicKey,
          tokenSale: tokenSalePDA,
          buyerAccount: buyerAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Test emergency pause
      console.log("🚨 Testing emergency pause...");
      await program.methods
        .togglePause()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      // Verify purchase fails when paused
      try {
        await program.methods
          .buyTokens(new anchor.BN(50 * Math.pow(10, 6)))
          .accounts({
            buyer: buyer.publicKey,
            tokenSale: tokenSalePDA,
            buyerAccount: buyerAccountPDA,
            buyerPaymentAccount: buyerPaymentAccount,
            sellerPaymentAccount: sellerPaymentAccount,
            platformFeeAccount: platformFeeAccount,
            buyerTokenAccount: buyerTokenAccount,
            tokenVault: tokenVaultPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([buyer])
          .rpc();
        
        assert.fail("Should fail when paused");
      } catch (error: any) {
        assert(error.message.includes("SalePaused"));
      }

      // Resume sale
      console.log("▶️ Resuming sale...");
      await program.methods
        .togglePause()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      // Now purchase should work
      await program.methods
        .buyTokens(new anchor.BN(50 * Math.pow(10, 6)))
        .accounts({
          buyer: buyer.publicKey,
          tokenSale: tokenSalePDA,
          buyerAccount: buyerAccountPDA,
          buyerPaymentAccount: buyerPaymentAccount,
          sellerPaymentAccount: sellerPaymentAccount,
          platformFeeAccount: platformFeeAccount,
          buyerTokenAccount: buyerTokenAccount,
          tokenVault: tokenVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      // Emergency cancellation
      console.log("🛑 Testing emergency cancellation...");
      await program.methods
        .cancelSale()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
          sellerTokenAccount: sellerTokenAccount,
          tokenVault: tokenVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();

      // Verify cancellation
      saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.isActive, false);

      console.log("✅ Emergency scenarios tested successfully!");
    });
  });
});