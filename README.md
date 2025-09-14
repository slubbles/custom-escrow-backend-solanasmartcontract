# Custom Escrow - Production-Grade Token Sale Platform

A decentralized token sale platform built on Solana with enterprise security features for trustless SPL token sales through smart contract escrow.

## Overview

This platform enables secure token sales through automated escrow smart contracts. Token creators can launch sales with time controls, purchase limits, and platform fees while ensuring complete trustlessness for buyers.

**Live on Solana Devnet**: `HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4`

## Key Features

### Core Functionality
- **Trustless Escrow**: Smart contracts guarantee secure token-for-USDC exchanges
- **SPL Token Support**: Compatible with any SPL token standard
- **Atomic Transactions**: Either complete success or complete failure, no partial states
- **PDA Security**: Program Derived Addresses for maximum security

### Production Security
- **Time-Based Controls**: Start/end timestamps for sale windows
- **Purchase Limits**: Configurable per-buyer maximum purchases
- **Platform Fees**: Basis point fee system for platform sustainability
- **Emergency Controls**: Pause/resume functionality for crisis management
- **Overflow Protection**: Safe arithmetic prevents integer overflow attacks
- **Comprehensive Validation**: 14 custom error types with detailed error handling

### Enterprise Features
- **Multi-Sale Support**: Deploy multiple concurrent token sales
- **Buyer Tracking**: Individual purchase history and limit enforcement
- **Flexible Configuration**: Customizable parameters for different use cases
- **Production Deployment**: Battle-tested on Solana devnet

## Architecture

### Smart Contract (533 lines of Rust)
- **6 Instructions**: initialize_sale, buy_tokens, create_buyer_account, pause_sale, emergency_withdraw, cancel_sale
- **2 Account Types**: TokenSale (181 bytes), BuyerAccount (73 bytes)
- **14 Error Codes**: Comprehensive error handling and validation
- **318,472 bytes**: Production-ready program size

### Security Model
- Program Derived Addresses (PDAs) for trustless escrow
- Time-based access controls
- Purchase limit enforcement
- Platform fee collection
- Emergency pause mechanisms

## Technology Stack

- **Smart Contracts**: Rust + Anchor Framework 0.31.0
- **Blockchain**: Solana (devnet deployed, mainnet ready)
- **Testing**: TypeScript + Mocha/Chai
- **Build System**: Anchor + Solana CLI 2.1.6

## Getting Started

### Prerequisites
- Rust 1.89.0+
- Solana CLI 2.1.6+ (Anza/Agave)
- Anchor Framework 0.31.0+
- Node.js 18+

### Installation
```bash
# Clone repository
git clone https://github.com/slubbles/custom-escrow
cd custom-escrow

# Install dependencies
npm install

# Build smart contract
anchor build

# Run tests
anchor test
```

### Deployment
```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show <PROGRAM_ID> --url devnet
```

## Testing

### Test Suites
- **Contract Validation**: Program structure and interface validation
- **Deployment Validation**: Live devnet connectivity and functionality
- **Integration Tests**: Complete transaction flows
- **Security Tests**: Edge cases and error handling

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:validation
npm run test:devnet
npm run test:integration
```

## Documentation

- [`COMPLETE_DEVELOPMENT_GUIDE.md`](./COMPLETE_DEVELOPMENT_GUIDE.md) - Complete development process documentation
- [`LEARNING_ROADMAP.md`](./LEARNING_ROADMAP.md) - Step-by-step learning guide for understanding the codebase

## Project Status

✅ **Smart Contract**: Production-ready with enterprise security features  
✅ **Testing**: Comprehensive test suite with 100% core path coverage  
✅ **Deployment**: Successfully deployed and validated on Solana devnet  
🔄 **Frontend**: Ready for development  
� **Security Audit**: Ready for professional review  

## Contributing

This project demonstrates production-grade Solana development practices. Contributions welcome for:
- Frontend development
- Additional security features
- Performance optimizations
- Documentation improvements

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the Solana ecosystem**

*Building the future of token sales on Solana.*