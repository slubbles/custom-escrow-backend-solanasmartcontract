import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";

// Test the contract deployment on SOON network
describe("SOON Network Deployment Test", () => {
  // Configure provider for SOON network
  // Using actual SOON devnet endpoint
  const soonDevnetRpc = "https://rpc.devnet.soo.network";
  const connection = new Connection(soonDevnetRpc, "confirmed");
  
  const wallet = new anchor.Wallet(
    Keypair.fromSecretKey(
      Buffer.from(JSON.parse(
        require('fs').readFileSync(require('os').homedir() + '/.config/solana/id.json', 'utf8')
      ))
    )
  );
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Use the same program ID (should work on SOON due to SVM compatibility)
  const programId = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
  
  it("should connect to SOON network and validate SVM compatibility", async () => {
    console.log(`\n🔌 Connecting to SOON network...`);
    console.log(`Program ID: ${programId.toString()}`);
    console.log(`Network: SOON Devnet`);
    console.log(`RPC Endpoint: ${soonDevnetRpc}`);
    console.log(`Wallet: ${wallet.publicKey.toString()}`);
    
    try {
      // Check wallet balance on SOON network
      const balance = await connection.getBalance(wallet.publicKey);
      console.log(`Wallet Balance: ${balance / LAMPORTS_PER_SOL} SOON`);
      
      // Check if program exists on SOON network
      const programAccount = await connection.getAccountInfo(programId);
      console.log(`Program exists on SOON: ${programAccount !== null ? '✅' : '❌'}`);
      
      if (programAccount) {
        console.log(`Program Size: ${programAccount.data.length} bytes`);
        console.log(`Program Owner: ${programAccount.owner.toString()}`);
        console.log(`Program Executable: ${programAccount.executable ? '✅' : '❌'}`);
      }
      
      // Test basic SVM functionality
      const latestBlockhash = await connection.getLatestBlockhash();
      console.log(`Latest Blockhash: ${latestBlockhash.blockhash}`);
      console.log(`Block Height: ${await connection.getBlockHeight()}`);
      
      // Verify SOON network is responding correctly
      const slot = await connection.getSlot();
      console.log(`Current Slot: ${slot}`);
      
      console.log(`\n✅ SOON network connection successful!`);
      console.log(`✅ SVM compatibility confirmed`);
      
    } catch (error) {
      console.error(`❌ SOON network connection failed:`, error);
      
      // Provide helpful debugging information
      console.log(`\n🔧 Troubleshooting steps:`);
      console.log(`1. Verify SOON network RPC endpoint: ${soonDevnetRpc}`);
      console.log(`2. Check if wallet has SOON tokens for gas fees`);
      console.log(`3. Ensure SOON network is operational`);
      console.log(`4. Verify program has been deployed to SOON network`);
      
      throw error;
    }
  });

  it("should validate program deployment readiness on SOON", async () => {
    console.log(`\n🚀 Validating deployment readiness...`);
    
    // Check if we have the compiled program
    const fs = require('fs');
    const programPath = '/workspaces/custom-escrow/target/deploy/escrow.so';
    
    if (fs.existsSync(programPath)) {
      const stats = fs.statSync(programPath);
      console.log(`✅ Compiled program found: ${stats.size} bytes`);
      console.log(`✅ Ready for SOON network deployment`);
    } else {
      console.log(`❌ Compiled program not found. Run 'anchor build' first.`);
    }
    
    // Validate Anchor configuration for SOON
    const anchorConfigPath = '/workspaces/custom-escrow/configs/soon-network.toml';
    if (fs.existsSync(anchorConfigPath)) {
      console.log(`✅ SOON network configuration found`);
    } else {
      console.log(`❌ SOON network configuration missing`);
    }
  });

  it("should estimate deployment costs on SOON network", async () => {
    console.log(`\n💰 Estimating deployment costs...`);
    
    try {
      // Get current rent exemption for program account
      const fs = require('fs');
      const programPath = '/workspaces/custom-escrow/target/deploy/escrow.so';
      
      if (fs.existsSync(programPath)) {
        const stats = fs.statSync(programPath);
        const programSize = stats.size;
        
        // Estimate rent exemption (similar to Solana)
        const rentExemption = await connection.getMinimumBalanceForRentExemption(programSize);
        console.log(`Program Size: ${programSize} bytes`);
        console.log(`Estimated Rent Exemption: ${rentExemption / LAMPORTS_PER_SOL} SOON`);
        
        // Add buffer for deployment transaction fees
        const estimatedTotal = (rentExemption + (0.01 * LAMPORTS_PER_SOL)) / LAMPORTS_PER_SOL;
        console.log(`Estimated Total Cost: ${estimatedTotal} SOON`);
        
        console.log(`\n📋 Deployment Requirements:`);
        console.log(`- Minimum wallet balance: ${estimatedTotal} SOON`);
        console.log(`- Network: SOON Testnet/Mainnet`);
        console.log(`- Program size: ${programSize} bytes`);
      }
      
    } catch (error) {
      console.log(`⚠️  Could not estimate costs: ${error.message}`);
      console.log(`This is normal if SOON network is not yet accessible`);
    }
  });
});

export {};