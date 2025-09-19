# 🚀 SOON MAINNET DEPLOYMENT GUIDE
# Ready-to-Execute Commands

## STEP 1: Bridge SOL to SOON Network
1. Visit: https://bridge.mainnet.soo.network/
2. Connect your Solana wallet (same keypair we're using)
3. Bridge 2-3 SOL from Solana mainnet to SOON mainnet
4. Wait for bridge confirmation

## STEP 2: Configure Environment
```bash
# Add Solana CLI to PATH
export PATH="/home/codespace/.local/share/solana/install/active_release/bin:$PATH"

# Configure for SOON mainnet
solana config set --url https://rpc.mainnet.soo.network/rpc

# Verify configuration
solana config get
```

## STEP 3: Verify Balance
```bash
# Check SOL balance on SOON mainnet
solana balance

# Should show 2+ SOL for safe deployment
```

## STEP 4: Deploy to SOON Mainnet
```bash
# Deploy the escrow contract
anchor deploy --provider.cluster "https://rpc.mainnet.soo.network/rpc" --provider.wallet ~/.config/solana/id.json

# Alternative method
anchor deploy
```

## STEP 5: Verify Deployment
```bash
# Check deployment on SOON explorer
echo "🌐 Check deployment at: https://explorer.soo.network/"
echo "🔍 Search for program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

# Verify program exists
solana program show Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

## DEPLOYMENT COST BREAKDOWN
- Program deployment: ~0.5-1.5 SOL
- Transaction fees: ~0.001 SOL
- Buffer for safety: ~0.5 SOL
- **TOTAL RECOMMENDED: 2-3 SOL**

## YOUR WALLET ADDRESS
- Address: 9yWMwzQb47KGTPKBhCkPYDUcprDBTDQgXvTsc1VTZyPE
- Use this address when bridging SOL to SOON

## BRIDGE INSTRUCTIONS
1. Go to: https://bridge.mainnet.soo.network/
2. Select: Solana → SOON Network
3. Asset: SOL
4. Amount: 2-3 SOL
5. Destination: 9yWMwzQb47KGTPKBhCkPYDUcprDBTDQgXvTsc1VTZyPE

## SUCCESS INDICATORS
✅ Balance shows 2+ SOL on SOON
✅ Deployment completes without errors
✅ Program appears on SOON explorer
✅ Program ID verified on-chain

## TROUBLESHOOTING
- If bridge fails: Wait and retry (network congestion)
- If deployment fails: Check SOL balance and retry
- If low balance: Bridge more SOL from Solana mainnet

---
🎊 YOUR CUSTOM ESCROW WILL BE LIVE ON SOON MAINNET! 🎊