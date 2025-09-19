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

describe("Custom Escrow - Production Unit Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Escrow as Program<any>;

  // Test constants
  const PRICE_PER_TOKEN = 1_000_000; // 1 USDC per token
  const TOKENS_TO_SELL = 1000 * Math.pow(10, 6); // 1000 tokens
  const MAX_TOKENS_PER_BUYER = 100 * Math.pow(10, 6); // 100 tokens max per buyer
  const PLATFORM_FEE_BPS = 500; // 5% platform fee

  // Test accounts
  let seller: Keypair;
  let buyer: Keypair;
  let platformFeeRecipient: Keypair;
  let tokenMint: PublicKey;
  let paymentMint: PublicKey;
  let sellerTokenAccount: PublicKey;
  let sellerPaymentAccount: PublicKey;
  let buyerTokenAccount: PublicKey;
  let buyerPaymentAccount: PublicKey;
  let platformFeeAccount: PublicKey;
  let tokenSalePDA: PublicKey;
  let tokenVaultPDA: PublicKey;
  let buyerAccountPDA: PublicKey;

  before(async () => {
    // Initialize test accounts
    seller = Keypair.generate();
    buyer = Keypair.generate();
    platformFeeRecipient = Keypair.generate();

    // Airdrop SOL to accounts
    await Promise.all([
      provider.connection.requestAirdrop(seller.publicKey, 2 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(buyer.publicKey, 2 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(platformFeeRecipient.publicKey, 2 * LAMPORTS_PER_SOL),
    ]);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create mints
    tokenMint = await createMint(provider.connection, seller, seller.publicKey, null, 6);
    paymentMint = await createMint(provider.connection, seller, seller.publicKey, null, 6);

    // Create token accounts
    sellerTokenAccount = await createAccount(provider.connection, seller, tokenMint, seller.publicKey);
    sellerPaymentAccount = await createAccount(provider.connection, seller, paymentMint, seller.publicKey);
    buyerTokenAccount = await createAccount(provider.connection, buyer, tokenMint, buyer.publicKey);
    buyerPaymentAccount = await createAccount(provider.connection, buyer, paymentMint, buyer.publicKey);
    platformFeeAccount = await createAccount(provider.connection, platformFeeRecipient, paymentMint, platformFeeRecipient.publicKey);

    // Mint initial tokens
    await mintTo(provider.connection, seller, tokenMint, sellerTokenAccount, seller, TOKENS_TO_SELL);
    await mintTo(provider.connection, seller, paymentMint, buyerPaymentAccount, seller, 1000 * Math.pow(10, 6)); // 1000 USDC

    // Calculate PDAs
    [tokenSalePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_sale"), seller.publicKey.toBuffer(), tokenMint.toBuffer()],
      program.programId
    );

    [tokenVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), tokenSalePDA.toBuffer()],
      program.programId
    );

    [buyerAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("buyer"), buyer.publicKey.toBuffer(), tokenSalePDA.toBuffer()],
      program.programId
    );

    console.log("Test setup completed");
  });

  describe("Sale Initialization Tests", () => {
    it("Successfully initializes sale with all security features", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const saleStartTime = currentTime + 3600; // Start in 1 hour
      const saleEndTime = currentTime + 7200;   // End in 2 hours

      const tx = await program.methods
        .initializeSale(
          new anchor.BN(PRICE_PER_TOKEN),
          new anchor.BN(TOKENS_TO_SELL),
          new anchor.BN(saleStartTime),
          new anchor.BN(saleEndTime),
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

      console.log("Initialize sale transaction:", tx);

      // Verify sale account state
      const saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.seller.toString(), seller.publicKey.toString());
      assert.equal(saleAccount.tokenMint.toString(), tokenMint.toString());
      assert.equal(saleAccount.paymentMint.toString(), paymentMint.toString());
      assert.equal(saleAccount.pricePerToken.toNumber(), PRICE_PER_TOKEN);
      assert.equal(saleAccount.totalTokens.toNumber(), TOKENS_TO_SELL);
      assert.equal(saleAccount.tokensAvailable.toNumber(), TOKENS_TO_SELL);
      assert.equal(saleAccount.saleStartTime.toNumber(), saleStartTime);
      assert.equal(saleAccount.saleEndTime.toNumber(), saleEndTime);
      assert.equal(saleAccount.maxTokensPerBuyer.toNumber(), MAX_TOKENS_PER_BUYER);
      assert.equal(saleAccount.platformFeeBps, PLATFORM_FEE_BPS);
      assert.equal(saleAccount.platformFeeRecipient.toString(), platformFeeRecipient.publicKey.toString());
      assert.equal(saleAccount.isActive, true);
      assert.equal(saleAccount.isPaused, false);

      // Verify tokens transferred to vault
      const vaultAccount = await getAccount(provider.connection, tokenVaultPDA);
      assert.equal(Number(vaultAccount.amount), TOKENS_TO_SELL);
    });

    it("Fails with invalid price (zero)", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const newSeller = Keypair.generate();
      await provider.connection.requestAirdrop(newSeller.publicKey, LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSellerTokenAccount = await createAccount(provider.connection, newSeller, tokenMint, newSeller.publicKey);
      await mintTo(provider.connection, seller, tokenMint, newSellerTokenAccount, seller, 1000);

      const [newSalePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_sale"), newSeller.publicKey.toBuffer(), tokenMint.toBuffer()],
        program.programId
      );

      const [newVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), newSalePDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initializeSale(
            new anchor.BN(0), // Invalid price
            new anchor.BN(1000),
            new anchor.BN(currentTime + 3600),
            new anchor.BN(currentTime + 7200),
            new anchor.BN(100),
            500,
            platformFeeRecipient.publicKey
          )
          .accounts({
            seller: newSeller.publicKey,
            tokenSale: newSalePDA,
            tokenMint: tokenMint,
            paymentMint: paymentMint,
            sellerTokenAccount: newSellerTokenAccount,
            tokenVault: newVaultPDA,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([newSeller])
          .rpc();
        
        assert.fail("Should fail with invalid price");
      } catch (error: any) {
        assert(error.message.includes("InvalidPrice"));
      }
    });

    it("Fails with invalid time window (end before start)", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const newSeller = Keypair.generate();
      await provider.connection.requestAirdrop(newSeller.publicKey, LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSellerTokenAccount = await createAccount(provider.connection, newSeller, tokenMint, newSeller.publicKey);
      await mintTo(provider.connection, seller, tokenMint, newSellerTokenAccount, seller, 1000);

      const [newSalePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_sale"), newSeller.publicKey.toBuffer(), tokenMint.toBuffer()],
        program.programId
      );

      const [newVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), newSalePDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initializeSale(
            new anchor.BN(PRICE_PER_TOKEN),
            new anchor.BN(1000),
            new anchor.BN(currentTime + 7200), // Start after end
            new anchor.BN(currentTime + 3600), // End before start
            new anchor.BN(100),
            500,
            platformFeeRecipient.publicKey
          )
          .accounts({
            seller: newSeller.publicKey,
            tokenSale: newSalePDA,
            tokenMint: tokenMint,
            paymentMint: paymentMint,
            sellerTokenAccount: newSellerTokenAccount,
            tokenVault: newVaultPDA,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([newSeller])
          .rpc();
        
        assert.fail("Should fail with invalid time window");
      } catch (error: any) {
        assert(error.message.includes("InvalidEndTime"));
      }
    });

    it("Fails with excessive platform fee (>100%)", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const newSeller = Keypair.generate();
      await provider.connection.requestAirdrop(newSeller.publicKey, LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSellerTokenAccount = await createAccount(provider.connection, newSeller, tokenMint, newSeller.publicKey);
      await mintTo(provider.connection, seller, tokenMint, newSellerTokenAccount, seller, 1000);

      const [newSalePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_sale"), newSeller.publicKey.toBuffer(), tokenMint.toBuffer()],
        program.programId
      );

      const [newVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), newSalePDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initializeSale(
            new anchor.BN(PRICE_PER_TOKEN),
            new anchor.BN(1000),
            new anchor.BN(currentTime + 3600),
            new anchor.BN(currentTime + 7200),
            new anchor.BN(100),
            15000, // 150% fee - invalid
            platformFeeRecipient.publicKey
          )
          .accounts({
            seller: newSeller.publicKey,
            tokenSale: newSalePDA,
            tokenMint: tokenMint,
            paymentMint: paymentMint,
            sellerTokenAccount: newSellerTokenAccount,
            tokenVault: newVaultPDA,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([newSeller])
          .rpc();
        
        assert.fail("Should fail with excessive platform fee");
      } catch (error: any) {
        assert(error.message.includes("InvalidPlatformFee"));
      }
    });
  });

  describe("Buyer Account Creation Tests", () => {
    it("Successfully creates buyer tracking account", async () => {
      const tx = await program.methods
        .createBuyerAccount()
        .accounts({
          buyer: buyer.publicKey,
          tokenSale: tokenSalePDA,
          buyerAccount: buyerAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      console.log("Create buyer account transaction:", tx);

      // Verify buyer account state
      const buyerAccount = await program.account.buyerAccount.fetch(buyerAccountPDA);
      assert.equal(buyerAccount.buyer.toString(), buyer.publicKey.toString());
      assert.equal(buyerAccount.tokenSale.toString(), tokenSalePDA.toString());
      assert.equal(buyerAccount.tokensPurchased.toNumber(), 0);
    });
  });

  describe("Emergency Pause Tests", () => {
    it("Successfully toggles pause (seller only)", async () => {
      // Pause the sale
      const pauseTx = await program.methods
        .togglePause()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      console.log("Pause transaction:", pauseTx);

      // Verify sale is paused
      let saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.isPaused, true);

      // Unpause the sale
      const unpauseTx = await program.methods
        .togglePause()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      console.log("Unpause transaction:", unpauseTx);

      // Verify sale is unpaused
      saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.isPaused, false);
    });

    it("Fails when non-seller tries to pause", async () => {
      try {
        await program.methods
          .togglePause()
          .accounts({
            seller: buyer.publicKey, // Wrong seller
            tokenSale: tokenSalePDA,
          })
          .signers([buyer])
          .rpc();
        
        assert.fail("Should prevent non-seller from pausing");
      } catch (error: any) {
        assert(error.message.includes("constraint"));
      }
    });
  });

  describe("Sale Parameter Update Tests", () => {
    it("Successfully updates sale parameters before start", async () => {
      const newPrice = 2_000_000; // 2 USDC per token
      const currentTime = Math.floor(Date.now() / 1000);
      const newStartTime = currentTime + 5400; // Start in 1.5 hours
      const newMaxTokens = 200 * Math.pow(10, 6); // 200 tokens max

      const tx = await program.methods
        .updateSaleParams(
          new anchor.BN(newPrice),
          new anchor.BN(newStartTime),
          null, // Don't change end time
          new anchor.BN(newMaxTokens)
        )
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      console.log("Update params transaction:", tx);

      // Verify parameters updated
      const saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.pricePerToken.toNumber(), newPrice);
      assert.equal(saleAccount.saleStartTime.toNumber(), newStartTime);
      assert.equal(saleAccount.maxTokensPerBuyer.toNumber(), newMaxTokens);
    });

    it("Fails to update parameters after sale starts", async () => {
      // First, update sale to start immediately
      const currentTime = Math.floor(Date.now() / 1000);
      await program.methods
        .updateSaleParams(
          null,
          new anchor.BN(currentTime - 100), // Start in past (sale active)
          null,
          null
        )
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      // Now try to update again (should fail)
      try {
        await program.methods
          .updateSaleParams(
            new anchor.BN(3_000_000),
            null,
            null,
            null
          )
          .accounts({
            seller: seller.publicKey,
            tokenSale: tokenSalePDA,
          })
          .signers([seller])
          .rpc();
        
        assert.fail("Should fail to update after sale starts");
      } catch (error: any) {
        assert(error.message.includes("SaleAlreadyStarted"));
      }
    });
  });

  describe("Time-Based Purchase Tests", () => {
    let activeSalePDA: PublicKey;
    let activeSaleVaultPDA: PublicKey;
    let activeBuyerAccountPDA: PublicKey;
    let activeSellerTokenAccount: PublicKey;

    before(async () => {
      // Create a new sale that's currently active
      const activeSeller = Keypair.generate();
      await provider.connection.requestAirdrop(activeSeller.publicKey, 2 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      activeSellerTokenAccount = await createAccount(provider.connection, activeSeller, tokenMint, activeSeller.publicKey);
      const activeSellerPaymentAccount = await createAccount(provider.connection, activeSeller, paymentMint, activeSeller.publicKey);
      await mintTo(provider.connection, seller, tokenMint, activeSellerTokenAccount, seller, TOKENS_TO_SELL);

      [activeSalePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_sale"), activeSeller.publicKey.toBuffer(), tokenMint.toBuffer()],
        program.programId
      );

      [activeSaleVaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_vault"), activeSalePDA.toBuffer()],
        program.programId
      );

      [activeBuyerAccountPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("buyer"), buyer.publicKey.toBuffer(), activeSalePDA.toBuffer()],
        program.programId
      );

      const currentTime = Math.floor(Date.now() / 1000);

      // Initialize active sale
      await program.methods
        .initializeSale(
          new anchor.BN(PRICE_PER_TOKEN),
          new anchor.BN(TOKENS_TO_SELL),
          new anchor.BN(currentTime - 100), // Started 100 seconds ago
          new anchor.BN(currentTime + 3600), // Ends in 1 hour
          new anchor.BN(MAX_TOKENS_PER_BUYER),
          PLATFORM_FEE_BPS,
          platformFeeRecipient.publicKey
        )
        .accounts({
          seller: activeSeller.publicKey,
          tokenSale: activeSalePDA,
          tokenMint: tokenMint,
          paymentMint: paymentMint,
          sellerTokenAccount: activeSellerTokenAccount,
          tokenVault: activeSaleVaultPDA,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([activeSeller])
        .rpc();

      // Create buyer account for active sale
      await program.methods
        .createBuyerAccount()
        .accounts({
          buyer: buyer.publicKey,
          tokenSale: activeSalePDA,
          buyerAccount: activeBuyerAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
    });

    it("Successfully buys tokens during active sale window", async () => {
      const purchaseAmount = 50 * Math.pow(10, 6); // 50 tokens
      const expectedGrossPayment = purchaseAmount * PRICE_PER_TOKEN / Math.pow(10, 6);
      const expectedPlatformFee = Math.floor(expectedGrossPayment * PLATFORM_FEE_BPS / 10000);
      const expectedSellerPayment = expectedGrossPayment - expectedPlatformFee;

      // Get balances before
      const buyerTokenBalanceBefore = await getAccount(provider.connection, buyerTokenAccount);
      const buyerPaymentBalanceBefore = await getAccount(provider.connection, buyerPaymentAccount);
      const sellerPaymentBalanceBefore = await getAccount(provider.connection, sellerPaymentAccount);
      const platformFeeBalanceBefore = await getAccount(provider.connection, platformFeeAccount);

      const tx = await program.methods
        .buyTokens(new anchor.BN(purchaseAmount))
        .accounts({
          buyer: buyer.publicKey,
          tokenSale: activeSalePDA,
          buyerAccount: activeBuyerAccountPDA,
          buyerPaymentAccount: buyerPaymentAccount,
          sellerPaymentAccount: sellerPaymentAccount,
          platformFeeAccount: platformFeeAccount,
          buyerTokenAccount: buyerTokenAccount,
          tokenVault: activeSaleVaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      console.log("Buy tokens transaction:", tx);

      // Verify balances after purchase
      const buyerTokenBalanceAfter = await getAccount(provider.connection, buyerTokenAccount);
      const buyerPaymentBalanceAfter = await getAccount(provider.connection, buyerPaymentAccount);
      const sellerPaymentBalanceAfter = await getAccount(provider.connection, sellerPaymentAccount);
      const platformFeeBalanceAfter = await getAccount(provider.connection, platformFeeAccount);

      // Buyer should receive tokens
      assert.equal(
        Number(buyerTokenBalanceAfter.amount) - Number(buyerTokenBalanceBefore.amount),
        purchaseAmount
      );

      // Buyer should pay total amount
      assert.equal(
        Number(buyerPaymentBalanceBefore.amount) - Number(buyerPaymentBalanceAfter.amount),
        expectedGrossPayment
      );

      // Seller should receive payment minus platform fee
      assert.equal(
        Number(sellerPaymentBalanceAfter.amount) - Number(sellerPaymentBalanceBefore.amount),
        expectedSellerPayment
      );

      // Platform should receive fee
      assert.equal(
        Number(platformFeeBalanceAfter.amount) - Number(platformFeeBalanceBefore.amount),
        expectedPlatformFee
      );

      // Verify buyer tracking updated
      const buyerAccount = await program.account.buyerAccount.fetch(activeBuyerAccountPDA);
      assert.equal(buyerAccount.tokensPurchased.toNumber(), purchaseAmount);

      // Verify sale state updated
      const saleAccount = await program.account.tokenSale.fetch(activeSalePDA);
      assert.equal(
        saleAccount.tokensAvailable.toNumber(),
        TOKENS_TO_SELL - purchaseAmount
      );
    });

    it("Fails to buy when exceeding per-buyer limit", async () => {
      const excessiveAmount = MAX_TOKENS_PER_BUYER; // Would exceed limit since we already bought 50

      try {
        await program.methods
          .buyTokens(new anchor.BN(excessiveAmount))
          .accounts({
            buyer: buyer.publicKey,
            tokenSale: activeSalePDA,
            buyerAccount: activeBuyerAccountPDA,
            buyerPaymentAccount: buyerPaymentAccount,
            sellerPaymentAccount: sellerPaymentAccount,
            platformFeeAccount: platformFeeAccount,
            buyerTokenAccount: buyerTokenAccount,
            tokenVault: activeSaleVaultPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([buyer])
          .rpc();
        
        assert.fail("Should fail when exceeding purchase limit");
      } catch (error: any) {
        assert(error.message.includes("ExceedsPurchaseLimit"));
      }
    });
  });

  describe("Pause Functionality Tests", () => {
    it("Prevents purchases when sale is paused", async () => {
      // First pause the original sale
      await program.methods
        .togglePause()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();

      try {
        await program.methods
          .buyTokens(new anchor.BN(10 * Math.pow(10, 6)))
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
        
        assert.fail("Should fail when sale is paused");
      } catch (error: any) {
        assert(error.message.includes("SalePaused"));
      }

      // Unpause for cleanup
      await program.methods
        .togglePause()
        .accounts({
          seller: seller.publicKey,
          tokenSale: tokenSalePDA,
        })
        .signers([seller])
        .rpc();
    });
  });

  describe("Sale Cancellation Tests", () => {
    it("Successfully cancels sale and returns tokens", async () => {
      const saleAccountBefore = await program.account.tokenSale.fetch(tokenSalePDA);
      const tokensToReturn = saleAccountBefore.tokensAvailable;

      const sellerTokenBalanceBefore = await getAccount(provider.connection, sellerTokenAccount);
      const vaultBalanceBefore = await getAccount(provider.connection, tokenVaultPDA);

      console.log("Tokens to return:", tokensToReturn.toString());
      console.log("Seller balance before cancel:", sellerTokenBalanceBefore.amount.toString());
      console.log("Vault balance before cancel:", vaultBalanceBefore.amount.toString());

      const tx = await program.methods
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

      console.log("Cancel sale transaction:", tx);

      // Verify tokens returned to seller
      const sellerTokenBalanceAfter = await getAccount(provider.connection, sellerTokenAccount);
      const vaultBalanceAfter = await getAccount(provider.connection, tokenVaultPDA);

      assert.equal(
        Number(sellerTokenBalanceAfter.amount) - Number(sellerTokenBalanceBefore.amount),
        Number(tokensToReturn)
      );

      // Vault should be empty
      assert.equal(Number(vaultBalanceAfter.amount), 0);

      // Verify sale is inactive
      const saleAccount = await program.account.tokenSale.fetch(tokenSalePDA);
      assert.equal(saleAccount.isActive, false);
      assert.equal(saleAccount.tokensAvailable.toString(), "0");
    });

    it("Fails to buy from cancelled sale", async () => {
      try {
        await program.methods
          .buyTokens(new anchor.BN(10 * Math.pow(10, 6)))
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
        
        assert.fail("Should fail when sale is cancelled");
      } catch (error: any) {
        assert(error.message.includes("SaleNotActive"));
      }
    });
  });
});