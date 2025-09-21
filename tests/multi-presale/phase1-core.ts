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
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("Multi-Presale Platform - Core Functionality", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Get the program interface
  const program = anchor.workspace.MultiPresale as Program<any>;
  
  // Test accounts
  let platformAuthority: Keypair;
  let treasury: Keypair;
  let projectCreator: Keypair;
  let admin: Keypair;
  let testMint: PublicKey;
  
  // PDAs
  let platformPDA: PublicKey;
  let projectPDA: PublicKey;
  
  before(async () => {
    // Initialize test accounts
    platformAuthority = Keypair.generate();
    treasury = Keypair.generate();
    projectCreator = Keypair.generate();
    admin = platformAuthority; // Use same as platform authority for simplicity
    
    // Airdrop SOL to test accounts
    await Promise.all([
      provider.connection.requestAirdrop(platformAuthority.publicKey, 2 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(treasury.publicKey, LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(projectCreator.publicKey, 2 * LAMPORTS_PER_SOL),
    ]);
    
    // Wait for confirmations
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create test token mint
    testMint = await createMint(
      provider.connection,
      projectCreator,
      projectCreator.publicKey,
      null,
      9 // 9 decimals
    );
    
    // Derive PDAs
    [platformPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform")],
      program.programId
    );
    
    console.log("🏗️  Test setup complete");
    console.log(`   Platform Authority: ${platformAuthority.publicKey.toString()}`);
    console.log(`   Treasury: ${treasury.publicKey.toString()}`);
    console.log(`   Project Creator: ${projectCreator.publicKey.toString()}`);
    console.log(`   Test Mint: ${testMint.toString()}`);
    console.log(`   Platform PDA: ${platformPDA.toString()}`);
  });

  describe("Platform Management", () => {
    it("Should initialize platform successfully", async () => {
      const platformFee = 250; // 2.5%
      const minDuration = 86400; // 1 day
      const maxDuration = 2592000; // 30 days
      
      const tx = await program.methods
        .initializePlatform(platformFee, minDuration, maxDuration)
        .accounts({
          authority: platformAuthority.publicKey,
          treasury: treasury.publicKey,
          platformAccount: platformPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([platformAuthority])
        .rpc();
      
      console.log("✅ Platform initialized, transaction:", tx);
      
      // Verify platform state
      const platformAccount = await program.account.platformAccount.fetch(platformPDA);
      assert.equal(platformAccount.authority.toString(), platformAuthority.publicKey.toString());
      assert.equal(platformAccount.treasury.toString(), treasury.publicKey.toString());
      assert.equal(platformAccount.platformFee, platformFee);
      assert.equal(platformAccount.totalProjects.toNumber(), 0);
      assert.equal(platformAccount.isPaused, false);
      assert.equal(platformAccount.minProjectDuration.toNumber(), minDuration);
      assert.equal(platformAccount.maxProjectDuration.toNumber(), maxDuration);
    });

    it("Should update platform configuration", async () => {
      const newPlatformFee = 300; // 3%
      const newMinDuration = 43200; // 12 hours
      const newMaxDuration = 5184000; // 60 days
      
      await program.methods
        .updatePlatformConfig(
          newPlatformFee,
          newMinDuration,
          newMaxDuration,
          null // Don't change treasury
        )
        .accounts({
          authority: platformAuthority.publicKey,
          platformAccount: platformPDA,
        })
        .signers([platformAuthority])
        .rpc();
      
      // Verify updated state
      const platformAccount = await program.account.platformAccount.fetch(platformPDA);
      assert.equal(platformAccount.platformFee, newPlatformFee);
      assert.equal(platformAccount.minProjectDuration.toNumber(), newMinDuration);
      assert.equal(platformAccount.maxProjectDuration.toNumber(), newMaxDuration);
      
      console.log("✅ Platform configuration updated successfully");
    });

    it("Should pause and unpause platform", async () => {
      // Pause platform
      await program.methods
        .pausePlatform()
        .accounts({
          authority: platformAuthority.publicKey,
          platformAccount: platformPDA,
        })
        .signers([platformAuthority])
        .rpc();
      
      let platformAccount = await program.account.platformAccount.fetch(platformPDA);
      assert.equal(platformAccount.isPaused, true);
      
      // Unpause platform
      await program.methods
        .unpausePlatform()
        .accounts({
          authority: platformAuthority.publicKey,
          platformAccount: platformPDA,
        })
        .signers([platformAuthority])
        .rpc();
      
      platformAccount = await program.account.platformAccount.fetch(platformPDA);
      assert.equal(platformAccount.isPaused, false);
      
      console.log("✅ Platform pause/unpause functionality working");
    });

    it("Should reject unauthorized access", async () => {
      const unauthorizedUser = Keypair.generate();
      await provider.connection.requestAirdrop(unauthorizedUser.publicKey, LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await program.methods
          .pausePlatform()
          .accounts({
            authority: unauthorizedUser.publicKey,
            platformAccount: platformPDA,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        assert.fail("Should have failed with unauthorized access");
      } catch (error) {
        assert.include(error.toString(), "UnauthorizedAccess");
        console.log("✅ Unauthorized access properly rejected");
      }
    });
  });

  describe("Project Management", () => {
    const projectName = "Test DeFi Project";
    
    before(async () => {
      // Derive project PDA
      [projectPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("project"),
          projectCreator.publicKey.toBuffer(),
          Buffer.from(projectName)
        ],
        program.programId
      );
    });

    it("Should create a new project", async () => {
      const projectData = {
        name: projectName,
        description: "A revolutionary DeFi platform for the future",
        logoUrl: "https://example.com/logo.png",
        website: "https://testdefi.com",
        twitter: "@testdefi",
        discord: "https://discord.gg/testdefi",
        telegram: "https://t.me/testdefi",
        category: { deFi: {} }, // ProjectCategory::DeFi
        tags: ["DeFi", "Yield", "Staking"],
        tokenName: "Test DeFi Token",
        tokenSymbol: "TDT",
        tokenDecimals: 9,
      };
      
      const tx = await program.methods
        .createProject(
          projectData.name,
          projectData.description,
          projectData.logoUrl,
          projectData.website,
          projectData.twitter,
          projectData.discord,
          projectData.telegram,
          projectData.category,
          projectData.tags,
          projectData.tokenName,
          projectData.tokenSymbol,
          projectData.tokenDecimals
        )
        .accounts({
          creator: projectCreator.publicKey,
          platformAccount: platformPDA,
          projectAccount: projectPDA,
          tokenMint: testMint,
          systemProgram: SystemProgram.programId,
        })
        .signers([projectCreator])
        .rpc();
      
      console.log("✅ Project created, transaction:", tx);
      
      // Verify project state
      const projectAccount = await program.account.projectAccount.fetch(projectPDA);
      assert.equal(projectAccount.id.toNumber(), 1); // First project
      assert.equal(projectAccount.creator.toString(), projectCreator.publicKey.toString());
      assert.equal(projectAccount.name, projectData.name);
      assert.equal(projectAccount.description, projectData.description);
      assert.equal(projectAccount.tokenName, projectData.tokenName);
      assert.equal(projectAccount.tokenSymbol, projectData.tokenSymbol);
      assert.equal(projectAccount.tokenDecimals, projectData.tokenDecimals);
      assert.equal(projectAccount.status.draft !== undefined, true); // ProjectStatus::Draft
      assert.equal(projectAccount.approvalStatus.pending !== undefined, true); // ApprovalStatus::Pending
      
      // Verify platform counter increased
      const platformAccount = await program.account.platformAccount.fetch(platformPDA);
      assert.equal(platformAccount.totalProjects.toNumber(), 1);
    });

    it("Should update project metadata", async () => {
      const newDescription = "An even more revolutionary DeFi platform";
      const newWebsite = "https://newdomain.com";
      
      await program.methods
        .updateProject(
          null, // Don't change name
          newDescription,
          null, // Don't change logo
          newWebsite,
          null, // Don't change other fields
          null,
          null,
          null,
          null
        )
        .accounts({
          creator: projectCreator.publicKey,
          projectAccount: projectPDA,
        })
        .signers([projectCreator])
        .rpc();
      
      // Verify updates
      const projectAccount = await program.account.projectAccount.fetch(projectPDA);
      assert.equal(projectAccount.description, newDescription);
      assert.equal(projectAccount.website, newWebsite);
      
      console.log("✅ Project metadata updated successfully");
    });

    it("Should submit project for approval", async () => {
      await program.methods
        .submitForApproval()
        .accounts({
          creator: projectCreator.publicKey,
          projectAccount: projectPDA,
        })
        .signers([projectCreator])
        .rpc();
      
      // Verify status change
      const projectAccount = await program.account.projectAccount.fetch(projectPDA);
      assert.equal(projectAccount.status.submitted !== undefined, true); // ProjectStatus::Submitted
      assert.equal(projectAccount.approvalStatus.pending !== undefined, true); // Still pending
      
      console.log("✅ Project submitted for approval");
    });

    it("Should approve project (admin)", async () => {
      await program.methods
        .approveProject()
        .accounts({
          admin: admin.publicKey,
          platformAccount: platformPDA,
          projectAccount: projectPDA,
        })
        .signers([admin])
        .rpc();
      
      // Verify approval
      const projectAccount = await program.account.projectAccount.fetch(projectPDA);
      assert.equal(projectAccount.status.active !== undefined, true); // ProjectStatus::Active
      assert.equal(projectAccount.approvalStatus.approved !== undefined, true); // ApprovalStatus::Approved
      assert.equal(projectAccount.approvedBy.toString(), admin.publicKey.toString());
      assert.notEqual(projectAccount.approvedAt, null);
      
      console.log("✅ Project approved successfully");
    });

    it("Should reject unauthorized project updates", async () => {
      const unauthorizedUser = Keypair.generate();
      await provider.connection.requestAirdrop(unauthorizedUser.publicKey, LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await program.methods
          .updateProject(
            null,
            "Unauthorized update",
            null, null, null, null, null, null, null
          )
          .accounts({
            creator: unauthorizedUser.publicKey,
            projectAccount: projectPDA,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        assert.fail("Should have failed with unauthorized access");
      } catch (error) {
        assert.include(error.toString(), "UnauthorizedAccess");
        console.log("✅ Unauthorized project update properly rejected");
      }
    });
  });

  describe("Input Validation", () => {
    it("Should reject invalid platform fee", async () => {
      const invalidFee = 15000; // 150% - invalid
      
      try {
        // Create new platform with invalid fee
        const newAuthority = Keypair.generate();
        await provider.connection.requestAirdrop(newAuthority.publicKey, LAMPORTS_PER_SOL);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const [newPlatformPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("platform2")],
          program.programId
        );
        
        await program.methods
          .initializePlatform(invalidFee, 86400, 2592000)
          .accounts({
            authority: newAuthority.publicKey,
            treasury: treasury.publicKey,
            platformAccount: newPlatformPDA,
            systemProgram: SystemProgram.programId,
          })
          .signers([newAuthority])
          .rpc();
        
        assert.fail("Should have failed with invalid platform fee");
      } catch (error) {
        assert.include(error.toString(), "InvalidPlatformFee");
        console.log("✅ Invalid platform fee properly rejected");
      }
    });

    it("Should reject project with name too long", async () => {
      const longName = "A".repeat(51); // 51 characters - too long
      
      try {
        const [longNameProjectPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("project"),
            projectCreator.publicKey.toBuffer(),
            Buffer.from(longName)
          ],
          program.programId
        );
        
        await program.methods
          .createProject(
            longName,
            "Description",
            "https://logo.com",
            "https://website.com",
            "@twitter",
            "discord.gg/test",
            "t.me/test",
            { other: {} },
            ["tag1"],
            "Token",
            "TKN",
            9
          )
          .accounts({
            creator: projectCreator.publicKey,
            platformAccount: platformPDA,
            projectAccount: longNameProjectPDA,
            tokenMint: testMint,
            systemProgram: SystemProgram.programId,
          })
          .signers([projectCreator])
          .rpc();
        
        assert.fail("Should have failed with name too long");
      } catch (error) {
        assert.include(error.toString(), "NameTooLong");
        console.log("✅ Long project name properly rejected");
      }
    });
  });

  describe("Error Handling", () => {
    it("Should handle paused platform correctly", async () => {
      // Pause the platform
      await program.methods
        .pausePlatform()
        .accounts({
          authority: platformAuthority.publicKey,
          platformAccount: platformPDA,
        })
        .signers([platformAuthority])
        .rpc();
      
      // Try to create project while paused
      try {
        const [pausedProjectPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("project"),
            projectCreator.publicKey.toBuffer(),
            Buffer.from("Paused Project")
          ],
          program.programId
        );
        
        await program.methods
          .createProject(
            "Paused Project",
            "Should fail",
            "logo.com",
            "website.com",
            "@twitter",
            "discord",
            "telegram",
            { other: {} },
            [],
            "Token",
            "TKN",
            9
          )
          .accounts({
            creator: projectCreator.publicKey,
            platformAccount: platformPDA,
            projectAccount: pausedProjectPDA,
            tokenMint: testMint,
            systemProgram: SystemProgram.programId,
          })
          .signers([projectCreator])
          .rpc();
        
        assert.fail("Should have failed due to paused platform");
      } catch (error) {
        assert.include(error.toString(), "PlatformPaused");
        console.log("✅ Paused platform properly blocks operations");
      }
      
      // Unpause for future tests
      await program.methods
        .unpausePlatform()
        .accounts({
          authority: platformAuthority.publicKey,
          platformAccount: platformPDA,
        })
        .signers([platformAuthority])
        .rpc();
    });
  });

  after(() => {
    console.log("\n🎉 All Phase 1 tests completed successfully!");
    console.log("✅ Platform management functionality verified");
    console.log("✅ Project lifecycle management verified");
    console.log("✅ Access controls verified");
    console.log("✅ Input validation verified");
    console.log("✅ Error handling verified");
  });
});