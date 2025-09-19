# Quick Optimization Example: Boolean Flag Packing

## Current Implementation (181 bytes)
```rust
pub struct TokenSale {
    // ... other fields ...
    pub is_active: bool,    // 1 byte
    pub is_paused: bool,    // 1 byte  
    pub bump: u8,          // 1 byte
}
```

## Optimized Implementation (180 bytes - saves 1 byte)
```rust
pub struct TokenSale {
    // ... other fields ...
    pub flags: u8,         // 1 byte for all flags
    pub bump: u8,          // 1 byte
}

impl TokenSale {
    const ACTIVE_FLAG: u8 = 1 << 0;  // 0000_0001
    const PAUSED_FLAG: u8 = 1 << 1;  // 0000_0010
    
    pub fn is_active(&self) -> bool {
        self.flags & Self::ACTIVE_FLAG != 0
    }
    
    pub fn is_paused(&self) -> bool {
        self.flags & Self::PAUSED_FLAG != 0
    }
    
    pub fn set_active(&mut self, active: bool) {
        if active {
            self.flags |= Self::ACTIVE_FLAG;
        } else {
            self.flags &= !Self::ACTIVE_FLAG;
        }
    }
    
    pub fn set_paused(&mut self, paused: bool) {
        if paused {
            self.flags |= Self::PAUSED_FLAG;
        } else {
            self.flags &= !Self::PAUSED_FLAG;
        }
    }
}
```

## Usage Changes
```rust
// Before
require!(sale.is_active, ErrorCode::SaleNotActive);
require!(!sale.is_paused, ErrorCode::SalePaused);
sale.is_active = false;

// After  
require!(sale.is_active(), ErrorCode::SaleNotActive);
require!(!sale.is_paused(), ErrorCode::SalePaused);
sale.set_active(false);
```

This optimization saves 1 byte per TokenSale account and demonstrates bit manipulation techniques for further optimizations.