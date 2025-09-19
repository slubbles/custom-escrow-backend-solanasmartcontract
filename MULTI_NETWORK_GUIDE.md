# Multi-Network Deployment Guide

**Deploy Custom Escrow on Both Solana and SOON Networks**

This repository now supports deployment on both **Solana** and **SOON Network** with a unified codebase and configuration system.

## 🌐 Network Support

| Network | Status | Program ID | Features |
|---------|--------|------------|----------|
| **Solana Devnet** | ✅ Deployed | `HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4` | Production-ready |
| **Solana Mainnet** | 🔄 Ready | TBD | Ready for deployment |
| **SOON Testnet** | 🔄 Ready | TBD | SVM compatible |
| **SOON Mainnet** | 🔄 Ready | TBD | Enhanced performance |

## 🚀 Quick Start

### Switch Networks
```bash
# Deploy on Solana
npm run switch:solana
npm run deploy:solana:devnet

# Deploy on SOON Network  
npm run switch:soon
npm run deploy:soon:testnet
```

### Test Across Networks
```bash
# Test on specific network
npm run test:solana
npm run test:soon

# Test all networks
npm run test:all-networks
```

## 📁 Repository Structure

```
custom-escrow/
├── configs/                    # Network-specific configurations
│   ├── solana-devnet.toml     # Solana devnet settings
│   ├── solana-mainnet.toml    # Solana mainnet settings
│   └── soon-network.toml      # SOON network settings
├── deployments/               # Network-specific artifacts
│   ├── solana/               # Solana deployment files
│   └── soon/                 # SOON deployment files
├── tests/
│   ├── solana/               # Solana-specific tests
│   ├── soon/                 # SOON-specific tests
│   └── shared/               # Cross-network tests
├── programs/escrow/          # Smart contract (unchanged)
└── docs/
    ├── SOON_DEPLOYMENT.md    # SOON deployment guide
    └── SOLANA_DEPLOYMENT.md  # Solana deployment guide
```

## 🔧 Configuration Management

### Network Switching
The repository uses configuration files to manage different networks:

```bash
# Available configurations
ls configs/
# solana-devnet.toml  solana-mainnet.toml  soon-network.toml

# Switch to SOON network
npm run switch:soon
# This copies configs/soon-network.toml to Anchor.toml

# Switch back to Solana
npm run switch:solana  
# This copies configs/solana-devnet.toml to Anchor.toml
```

### Custom Network Settings
Each network has specific configurations:

**Solana Devnet** (`configs/solana-devnet.toml`):
```toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[programs.devnet] 
escrow = "HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4"
```

**SOON Network** (`configs/soon-network.toml`):
```toml
[provider]
cluster = "soon-testnet"
wallet = "~/.config/solana/id.json"

[soon]
testnet_rpc = "https://rpc.testnet.soo.network"
mainnet_rpc = "https://rpc.mainnet.soo.network"
svm_version = "v1.18"
solana_compatibility = true
```

## 📊 Network Comparison

### Performance Benefits

| Metric | Solana | SOON Network | Improvement |
|--------|--------|--------------|-------------|
| **Transaction Fees** | ~0.005 SOL | ~0.002 SOON | 60% reduction |
| **Block Time** | 400ms | ~200ms | 50% faster |
| **Finality** | 1-2s | <1s | 2x faster |
| **Throughput** | 65,000 TPS | 100,000+ TPS | 50%+ higher |

### Why Deploy on SOON?

✅ **Lower Costs** - Reduced transaction fees for token buyers  
✅ **Faster Settlement** - Quicker transaction finality  
✅ **SVM Compatible** - Your Solana code works without changes  
✅ **Hybrid Access** - Reach both Ethereum and Solana ecosystems  
✅ **Enhanced Performance** - Higher throughput for concurrent sales  

## 🧪 Testing Strategy

### Cross-Network Compatibility
```bash
# Verify contract works identically on both networks
npm run test:all-networks

# Test specific compatibility aspects
yarn ts-mocha tests/shared/cross-network-compatibility.ts
```

### Network-Specific Testing
```bash
# Test Solana-specific functionality
yarn ts-mocha tests/solana/devnet-deployment-test.ts

# Test SOON-specific functionality  
yarn ts-mocha tests/soon/soon-deployment-test.ts
```

### Integration Testing
```bash
# Full sale lifecycle on Solana
yarn ts-mocha tests/shared/escrow-integration.ts

# Performance comparison
yarn ts-mocha tests/soon/soon-integration-test.ts
```

## 🚀 Deployment Commands

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run switch:solana` | Switch to Solana configuration |
| `npm run switch:soon` | Switch to SOON configuration |
| `npm run deploy:solana:devnet` | Deploy to Solana devnet |
| `npm run deploy:solana:mainnet` | Deploy to Solana mainnet |
| `npm run deploy:soon:testnet` | Deploy to SOON testnet |
| `npm run deploy:soon:mainnet` | Deploy to SOON mainnet |
| `npm run test:solana` | Run Solana-specific tests |
| `npm run test:soon` | Run SOON-specific tests |
| `npm run test:all-networks` | Test both networks |

### Multi-Network Deployment
```bash
# Deploy to both networks sequentially
#!/bin/bash
echo "🚀 Multi-Network Deployment"

# Build once
anchor build

# Deploy to Solana devnet
npm run deploy:solana:devnet
echo "✅ Deployed to Solana devnet"

# Deploy to SOON testnet  
npm run deploy:soon:testnet
echo "✅ Deployed to SOON testnet"

echo "🎉 Multi-network deployment complete!"
```

## 🔒 Security Considerations

### Cross-Network Security
- ✅ **Identical Code** - Same smart contract on both networks
- ✅ **Consistent PDAs** - Program Derived Addresses work identically  
- ✅ **Unified Testing** - Cross-network compatibility tests
- ✅ **Shared Validation** - Same security checks and error handling

### Network-Specific Considerations
- **Solana**: Established network with proven security
- **SOON**: Enhanced SVM with additional security features
- **Both**: Use identical account structures and validation logic

## 📚 Documentation

### Network-Specific Guides
- **[SOON_DEPLOYMENT.md](./SOON_DEPLOYMENT.md)** - Complete SOON deployment guide
- **[README.md](./README.md)** - Original Solana-focused documentation
- **[COMPLETE_DEVELOPMENT_GUIDE.md](./COMPLETE_DEVELOPMENT_GUIDE.md)** - Development process

### API Documentation
- **[FRONTEND_DEVELOPMENT_GUIDE.md](./FRONTEND_DEVELOPMENT_GUIDE.md)** - Frontend integration
- **Generated Types**: Available in `deployments/[network]/types/`

## 🎯 Recommended Strategy

### Development Phase
1. **Start with Solana** - Proven, stable network for development
2. **Test on SOON** - Validate compatibility and performance
3. **Compare Performance** - Measure improvements on SOON

### Production Phase
1. **Multi-Network Launch** - Deploy on both networks
2. **User Choice** - Let users select their preferred network
3. **Cost Optimization** - Route cost-sensitive operations to SOON
4. **Performance Routing** - Use SOON for high-frequency operations

### Migration Strategy
1. **Gradual Migration** - Move traffic progressively to SOON
2. **Feature Parity** - Ensure identical functionality
3. **User Education** - Inform users about benefits
4. **Fallback Support** - Maintain Solana as backup

## 🔮 Future Enhancements

### Planned Features
- **Cross-Network Bridge** - Move tokens between networks
- **Unified Frontend** - Single interface for both networks
- **Performance Dashboard** - Real-time network comparison
- **Smart Routing** - Automatic network selection based on conditions

### Community Contributions
- **Network Adapters** - Support for additional SVM networks
- **Performance Benchmarks** - Detailed comparison studies
- **Best Practices** - Multi-network development patterns

---

## 🤝 Contributing

### Multi-Network Development
When contributing to this multi-network setup:

1. **Test on Both Networks** - Ensure changes work everywhere
2. **Update Configurations** - Keep network configs in sync
3. **Document Changes** - Update network-specific documentation
4. **Performance Impact** - Consider effects on both networks

### Getting Started
```bash
# Clone and setup
git clone https://github.com/slubbles/custom-escrow
cd custom-escrow
npm install

# Build for all networks
anchor build

# Test compatibility
npm run test:all-networks
```

---

**Ready for multi-network deployment? Your escrow contract is now positioned to leverage the best of both Solana and SOON networks!** 🚀

*Building the future of cross-network token sales.*