# 🔐 PROJECT CREDENTIALS - SAVE THIS INFORMATION

## ⚠️ **CRITICAL: SAVE THESE CREDENTIALS IMMEDIATELY**

This document contains all the essential credentials and information for your deployed escrow project. **BACKUP THIS INFORMATION SECURELY**.

---

## 🌐 **DEPLOYED SMART CONTRACT**

### **Program Information**
- **Program ID (Public Key)**: `HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4`
- **Network**: Solana Devnet
- **RPC URL**: `https://api.devnet.solana.com`
- **Deployment Status**: ✅ LIVE AND FUNCTIONAL

### **Program Keypair (Private Key)**
```json
[143, 180, 95, 223, 82, 22, 191, 108, 218, 162, 178, 140, 142, 138, 61, 149, 12, 78, 7, 66, 137, 111, 5, 2, 111, 181, 40, 71, 200, 242, 229, 158, 245, 29, 38, 237, 34, 24, 48, 72, 119, 196, 54, 192, 83, 156, 185, 138, 91, 47, 0, 190, 162, 105, 33, 174, 10, 190, 185, 84, 76, 47, 13, 37]
```

---

## 👤 **YOUR WALLET CREDENTIALS**

### **Wallet Information**
- **Public Key**: `9yWMwzQb47KGTPKBhCkPYDUcprDBTDQgXvTsc1VTZyPE`
- **Role**: Program Authority & Deployer
- **Network**: Solana Devnet

### **Wallet Private Key**
```json
[2,112,60,123,84,223,137,46,109,52,246,13,2,252,21,107,198,96,135,198,170,107,117,119,213,221,8,229,93,10,4,4,133,87,56,49,113,139,186,39,66,132,40,254,127,89,180,...]
```

---

## 🔧 **PROJECT CONFIGURATION**

### **Anchor Configuration**
- **Anchor Version**: 0.31.0
- **Cluster**: devnet
- **Wallet Path**: `~/.config/solana/id.json`

### **Repository Information**
- **GitHub Repository**: https://github.com/slubbles/custom-escrow
- **Branch**: main
- **Last Commit**: Complete production-ready escrow platform

---

## 🛠️ **HOW TO RESTORE THIS PROJECT**

### **1. Environment Setup**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### **2. Restore Wallet**
```bash
# Create wallet file with your private key
echo '[2,112,60,123,84,223,137,46,109,52,246,13,2,252,21,107,198,96,135,198,170,107,117,119,213,221,8,229,93,10,4,4,133,87,56,49,113,139,186,39,66,132,40,254,127,89,180,...]' > ~/.config/solana/id.json

# Configure Solana CLI
solana config set --url https://api.devnet.solana.com
solana config set --keypair ~/.config/solana/id.json
```

### **3. Restore Program Keypair**
```bash
# Save program keypair
mkdir -p target/deploy/
echo '[143, 180, 95, 223, 82, 22, 191, 108, 218, 162, 178, 140, 142, 138, 61, 149, 12, 78, 7, 66, 137, 111, 5, 2, 111, 181, 40, 71, 200, 242, 229, 158, 245, 29, 38, 237, 34, 24, 48, 72, 119, 196, 54, 192, 83, 156, 185, 138, 91, 47, 0, 190, 162, 105, 33, 174, 10, 190, 185, 84, 76, 47, 13, 37]' > target/deploy/escrow-keypair.json
```

### **4. Clone and Build**
```bash
# Clone repository
git clone https://github.com/slubbles/custom-escrow
cd custom-escrow

# Install dependencies
npm install

# Build program
anchor build
```

---

## 🌍 **VERIFICATION COMMANDS**

### **Check Deployment Status**
```bash
# Verify program is deployed
solana program show HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4

# Check wallet balance
solana balance 9yWMwzQb47KGTPKBhCkPYDUcprDBTDQgXvTsc1VTZyPE

# Run tests
npm test
```

---

## 🔒 **SECURITY NOTES**

⚠️ **IMPORTANT SECURITY WARNINGS**:

1. **Private Keys**: These are your private keys - NEVER share them publicly
2. **Devnet Only**: These credentials are for DEVNET testing only
3. **Production**: Generate NEW keys for mainnet deployment
4. **Backup**: Store this information in multiple secure locations
5. **Access Control**: Only share with trusted team members

---

## 📞 **SUPPORT INFORMATION**

- **Smart Contract**: Production-ready escrow with security features
- **Testing**: Comprehensive test suite included
- **Documentation**: Complete development guide available
- **Status**: Ready for frontend development or mainnet migration

---

**Generated on**: September 14, 2025
**Network**: Solana Devnet
**Status**: ✅ DEPLOYED AND FUNCTIONAL