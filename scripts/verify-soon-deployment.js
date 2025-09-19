#!/usr/bin/env node

const { Connection, PublicKey } = require('@solana/web3.js');

const SOON_MAINNET_RPC = 'https://rpc.mainnet.soo.network/rpc';
const PROGRAM_ID = 'ESCRoWyoytVG1npUfYMgGjBHLnb2LRjJx3eJyB2u8UQB'; // Replace with your actual program ID

async function verifyDeployment() {
    console.log('🔍 Verifying SOON mainnet deployment...\n');
    
    try {
        const connection = new Connection(SOON_MAINNET_RPC, 'confirmed');
        
        // Check connection
        const version = await connection.getVersion();
        console.log('✅ Connected to SOON mainnet');
        console.log(`   Solana version: ${version['solana-core']}`);
        console.log(`   Feature set: ${version['feature-set']}\n`);
        
        // Check program deployment
        const programId = new PublicKey(PROGRAM_ID);
        const accountInfo = await connection.getAccountInfo(programId);
        
        if (accountInfo) {
            console.log('✅ Program deployed successfully!');
            console.log(`   Program ID: ${PROGRAM_ID}`);
            console.log(`   Owner: ${accountInfo.owner.toString()}`);
            console.log(`   Data length: ${accountInfo.data.length} bytes`);
            console.log(`   Executable: ${accountInfo.executable}`);
            console.log(`   Rent epoch: ${accountInfo.rentEpoch}\n`);
            
            console.log('🌐 Explorer links:');
            console.log(`   SOON Explorer: https://explorer.soo.network/address/${PROGRAM_ID}`);
            console.log(`   SOON Bridge: https://bridge.mainnet.soo.network/`);
        } else {
            console.log('❌ Program not found on SOON mainnet');
            console.log('   Make sure the deployment was successful and the program ID is correct');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

if (require.main === module) {
    verifyDeployment();
}

module.exports = { verifyDeployment };