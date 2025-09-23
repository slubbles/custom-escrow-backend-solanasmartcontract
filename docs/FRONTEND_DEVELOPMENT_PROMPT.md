# 🎯 COMPREHENSIVE FRONTEND DEVELOPMENT PROMPT
## Multi-Project Token Sale Platform - Complete Implementation Guide

---

## 📋 **PROJECT OVERVIEW**

You are tasked with building a **production-ready frontend** for a **multi-project token sale platform** on Solana. This platform allows entrepreneurs to launch token sales while enabling investors to discover and participate in promising projects.

**Deployed Smart Contracts:**
- **Basic Escrow:** `HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4`
- **Multi-Presale Platform:** `3n4Jusc6GmZXTJapNbDpr4DYKFSsZUhz2XKuJVL6Kmy5`
- **Network:** Solana Devnet
- **Status:** Live, tested, production-ready

---

## 🏗️ **TECHNICAL FOUNDATION**

### **Blockchain Integration**
```typescript
// Core Connection Setup
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

const connection = new Connection("https://api.devnet.solana.com");
const MULTI_PRESALE_PROGRAM_ID = new PublicKey("3n4Jusc6GmZXTJapNbDpr4DYKFSsZUhz2XKuJVL6Kmy5");
const ESCROW_PROGRAM_ID = new PublicKey("HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4");
```

### **Required IDL Integration**
- **Location:** `/target/idl/multi_presale.json` and `/target/idl/escrow.json`
- **Usage:** Import for TypeScript type generation
- **Purpose:** Provides all instruction interfaces, account structures, and error codes

### **Key Account Structures to Implement**
```typescript
// From IDL - implement these interfaces
interface PlatformAccount {
  authority: PublicKey;
  treasury: PublicKey;
  platformFee: number;
  totalProjects: number;
  isPaused: boolean;
  minProjectDuration: number;
  maxProjectDuration: number;
}

interface ProjectAccount {
  id: number;
  creator: PublicKey;
  name: string;
  description: string;
  tokenMint: PublicKey;
  status: ProjectStatus;
  category: ProjectCategory;
  // ... full structure from IDL
}

interface SaleRound {
  projectId: number;
  saleType: SaleType; // Seed, Private, Public
  roundNumber: number;
  tokenPrice: number;
  totalTokens: number;
  tokensSold: number;
  startTime: number;
  endTime: number;
  whitelistRequired: boolean;
  // ... complete structure
}
```

---

## 👥 **USER FLOWS TO IMPLEMENT**

### **🚀 PROJECT CREATOR JOURNEY**

#### **Phase 1: Onboarding & Setup**
**Pages Needed:**
1. **Landing/Homepage**
   - Hero section with platform benefits
   - Success stories and metrics
   - "Launch Your Project" CTA

2. **Wallet Connection**
   - Multi-wallet support (Phantom, Solflare, Backpack)
   - Clear connection status indicator
   - Network validation (ensure devnet)

3. **Project Creation Wizard** (Multi-step form)
   - **Step 1: Basic Info**
     - Project name (max 50 chars)
     - Description (max 500 chars)
     - Category selection (DeFi, Gaming, AI, etc.)
     - Logo upload with preview
   - **Step 2: Token Details**
     - Token mint address input with validation
     - Token symbol and decimals (auto-fetch from mint)
     - Total supply display
   - **Step 3: Team & Links**
     - Website URL
     - Social media links (Twitter, Discord, Telegram)
     - Team member profiles
   - **Step 4: Review & Submit**
     - Preview all information
     - Terms acceptance checkbox
     - Submit for review

#### **Phase 2: Sale Configuration**
4. **Sale Setup Dashboard**
   - **Single Sale Option:**
     - Price per token input
     - Total tokens to sell
     - Sale duration (start/end dates)
     - Purchase limits per wallet
   - **Multi-Round Option:**
     - Round configuration table
     - Drag-and-drop round ordering
     - Pricing progression validation
     - Timing conflict detection

5. **Advanced Settings**
   - Whitelist management interface
   - Platform fee acceptance (2.5% display)
   - Emergency controls setup
   - Treasury configuration

#### **Phase 3: Launch & Management**
6. **Project Dashboard**
   - Real-time sales metrics
   - Revenue tracking with charts
   - Investor analytics
   - Round progression status
   - Token distribution controls

7. **Project Management Tools**
   - Whitelist bulk upload/management
   - Pause/resume sale controls
   - Investor communication tools
   - Fund withdrawal interface

### **💰 INVESTOR/BUYER JOURNEY**

#### **Phase 1: Discovery**
1. **Project Marketplace**
   - Grid/list view toggle
   - Advanced filtering:
     - Category, price range, time remaining
     - Round type, whitelist status
     - Funding progress, creator reputation
   - Sorting options (trending, ending soon, newest)
   - Search with auto-complete

2. **Project Detail Pages**
   - Comprehensive project overview
   - Tokenomics visualization
   - Team information with social verification
   - Progress indicators and metrics
   - Community sentiment indicators

#### **Phase 2: Participation**
3. **Purchase Interface**
   - **Eligibility Check:**
     - Whitelist status verification
     - Purchase limit calculation
     - Wallet balance validation
   - **Purchase Flow:**
     - Token amount input with USD equivalent
     - Slippage tolerance settings
     - Transaction preview with fees
     - Multi-step confirmation process

4. **Transaction Management**
   - Real-time transaction status
   - Error handling with clear messaging
   - Success confirmation with transaction hash
   - Automatic portfolio update

#### **Phase 3: Portfolio Management**
5. **Investor Dashboard**
   - Portfolio overview with total value
   - Individual project cards with P&L
   - Purchase history with filters
   - Upcoming token claims calendar
   - Performance analytics

6. **Project Tracking**
   - Watchlist functionality
   - Price alerts and notifications
   - Project update feed
   - Community discussion integration

### **🏛️ ADMIN INTERFACE**

1. **Admin Dashboard**
   - Platform metrics overview
   - Revenue and fee tracking
   - User growth analytics
   - System health monitoring

2. **Project Review Queue**
   - Pending projects list with priorities
   - Detailed review interface
   - Approval/rejection workflow
   - Communication with creators

3. **Platform Management**
   - Fee configuration interface
   - Platform settings controls
   - Emergency pause mechanisms
   - User management tools

---

## 🎨 **UI/UX SPECIFICATIONS**

### **Design System Requirements**

#### **Color Palette**
```css
/* Primary Colors */
--primary-purple: #6366f1;
--primary-blue: #3b82f6;
--primary-green: #10b981;

/* Status Colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #06b6d4;

/* Neutral Colors */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f8fafc;
--text-secondary: #cbd5e1;
--border: #334155;
```

#### **Typography Scale**
```css
/* Headings */
--h1: 2.5rem/1.2 'Inter', sans-serif;
--h2: 2rem/1.3 'Inter', sans-serif;
--h3: 1.5rem/1.4 'Inter', sans-serif;

/* Body Text */
--body-lg: 1.125rem/1.6 'Inter', sans-serif;
--body: 1rem/1.5 'Inter', sans-serif;
--body-sm: 0.875rem/1.4 'Inter', sans-serif;

/* Code/Monospace */
--code: 0.875rem/1.4 'JetBrains Mono', monospace;
```

#### **Component Library Requirements**
- **Buttons:** Primary, secondary, destructive, ghost variants
- **Forms:** Input fields with validation states, dropdowns, file uploads
- **Cards:** Project cards, stat cards, dashboard widgets
- **Navigation:** Top nav, sidebar, breadcrumbs, pagination
- **Modals:** Confirmation dialogs, detail overlays, transaction flows
- **Tables:** Sortable, filterable data tables with actions
- **Charts:** Line charts, progress bars, pie charts for analytics

### **Responsive Design Requirements**
- **Mobile First:** 320px minimum width
- **Breakpoints:** 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Touch Targets:** Minimum 44px for interactive elements
- **Accessibility:** WCAG 2.1 AA compliance

---

## 🔧 **TECHNICAL IMPLEMENTATION GUIDE**

### **Recommended Tech Stack**
```json
{
  "framework": "Next.js 14 (App Router)",
  "styling": "Tailwind CSS + shadcn/ui",
  "state": "Zustand + React Query",
  "wallet": "@solana/wallet-adapter-react",
  "blockchain": "@coral-xyz/anchor + @solana/web3.js",
  "charts": "recharts",
  "forms": "react-hook-form + zod",
  "testing": "Jest + React Testing Library",
  "deployment": "Vercel",
  "notifications": "react-hot-toast",
  "icons": "lucide-react",
  "dates": "date-fns",
  "clipboard": "react-copy-to-clipboard",
  "animations": "framer-motion"
}
```

### **Essential Dependencies**
```bash
# Core Solana packages
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets
npm install @solana/web3.js @coral-xyz/anchor
npm install @solana/spl-token @solana/spl-token-registry

# UI and styling
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select

# State and data fetching
npm install zustand @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install clsx tailwind-merge lucide-react
npm install date-fns react-hot-toast
npm install recharts framer-motion
```

### **Project Structure**
```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Auth-protected routes
│   ├── projects/          # Project-related pages
│   ├── dashboard/         # User dashboards
│   └── admin/             # Admin interface
├── components/            # Reusable UI components
│   ├── ui/               # Base components (shadcn/ui)
│   ├── forms/            # Form components
│   ├── charts/           # Chart components
│   └── wallet/           # Wallet connection components
├── hooks/                # Custom React hooks
│   ├── useProgram.ts     # Anchor program hook
│   ├── useWalletBalance.ts
│   └── useProjectData.ts
├── lib/                  # Utility libraries
│   ├── anchor/           # Anchor program setup
│   ├── constants.ts      # Program IDs, endpoints
│   └── utils.ts         # Helper functions
├── stores/               # Zustand stores
│   ├── useAuthStore.ts
│   ├── useProjectStore.ts
│   └── useUIStore.ts
└── types/               # TypeScript definitions
    ├── anchor.ts        # Generated from IDL
    └── index.ts         # Application types
```

### **Core Blockchain Integration Examples**

#### **Wallet Connection Setup**
```typescript
// components/wallet/WalletProvider.tsx
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new BackpackWalletAdapter(),
];

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

#### **Smart Contract Integration**
```typescript
// lib/anchor/setup.ts
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { MultiPresale } from '../types/anchor'; // Generated from IDL

export const useProgram = () => {
  const wallet = useWallet();
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
  
  if (!wallet.publicKey) return null;
  
  const provider = new AnchorProvider(connection, wallet as any, {});
  const program = new Program(
    require('../idl/multi_presale.json'),
    new PublicKey('3n4Jusc6GmZXTJapNbDpr4DYKFSsZUhz2XKuJVL6Kmy5'),
    provider
  ) as Program<MultiPresale>;
  
  return { program, provider, connection };
};

// Example: Create Project Transaction
export const createProject = async (
  program: Program<MultiPresale>,
  projectData: {
    name: string;
    description: string;
    category: ProjectCategory;
    website: string;
    tokenMint: PublicKey;
  }
) => {
  const [projectPda] = await PublicKey.findProgramAddress(
    [Buffer.from("project"), new BN(projectData.id).toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  
  return await program.methods
    .createProject(
      projectData.name,
      projectData.description,
      projectData.category,
      projectData.website,
      projectData.tokenMint
    )
    .accounts({
      project: projectPda,
      creator: program.provider.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
};
```

#### **Transaction Status Handling**
```typescript
// hooks/useTransaction.ts
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

export interface TransactionState {
  status: 'idle' | 'pending' | 'success' | 'error';
  signature?: string;
  error?: string;
}

export const useTransaction = () => {
  const [state, setState] = useState<TransactionState>({ status: 'idle' });
  
  const execute = useCallback(async (
    transactionFn: () => Promise<string>,
    options?: {
      onSuccess?: (signature: string) => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    setState({ status: 'pending' });
    
    try {
      const signature = await transactionFn();
      setState({ status: 'success', signature });
      
      toast.success(options?.successMessage || 'Transaction successful!');
      options?.onSuccess?.(signature);
      
      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setState({ status: 'error', error: errorMessage });
      
      toast.error(options?.errorMessage || errorMessage);
      options?.onError?.(error as Error);
      
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);
  
  return { state, execute, reset };
};
```

#### **Event Listening & Real-time Updates**
```typescript
// hooks/useEventListener.ts
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '../lib/anchor/setup';

export const useProjectEvents = (projectId?: number) => {
  const [events, setEvents] = useState<any[]>([]);
  const programData = useProgram();
  
  useEffect(() => {
    if (!programData?.program || !projectId) return;
    
    const { program, connection } = programData;
    
    // Listen to ProjectCreated events
    const listener = program.addEventListener('ProjectCreated', (event, slot) => {
      if (event.projectId === projectId) {
        setEvents(prev => [...prev, { type: 'ProjectCreated', event, slot }]);
      }
    });
    
    // Listen to TokensPurchased events
    const purchaseListener = program.addEventListener('TokensPurchased', (event, slot) => {
      if (event.projectId === projectId) {
        setEvents(prev => [...prev, { type: 'TokensPurchased', event, slot }]);
      }
    });
    
    return () => {
      program.removeEventListener(listener);
      program.removeEventListener(purchaseListener);
    };
  }, [programData, projectId]);
  
  return events;
};

// Real-time data fetching with polling
export const useRealtimeProjectData = (projectId: number, interval = 10000) => {
  const [data, setData] = useState(null);
  const programData = useProgram();
  
  useEffect(() => {
    if (!programData?.program) return;
    
    const fetchData = async () => {
      try {
        const [projectPda] = await PublicKey.findProgramAddress(
          [Buffer.from("project"), new BN(projectId).toArrayLike(Buffer, "le", 8)],
          programData.program.programId
        );
        
        const projectAccount = await programData.program.account.projectAccount.fetch(projectPda);
        setData(projectAccount);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
      }
    };
    
    fetchData();
    const intervalId = setInterval(fetchData, interval);
    
    return () => clearInterval(intervalId);
  }, [programData, projectId, interval]);
  
  return data;
};
```

### **Error Handling & User Feedback**

#### **Smart Contract Error Mapping**
```typescript
// lib/errors.ts
export const ERROR_MESSAGES: Record<string, string> = {
  // From smart contract error codes
  'ProjectNotFound': 'Project not found. Please check the project ID.',
  'Unauthorized': 'You are not authorized to perform this action.',
  'ProjectNotActive': 'This project is not currently active for sales.',
  'InsufficientTokens': 'Not enough tokens available for purchase.',
  'ExceedsPurchaseLimit': 'Purchase amount exceeds your limit.',
  'NotWhitelisted': 'You are not whitelisted for this sale round.',
  'SaleNotStarted': 'Sale has not started yet.',
  'SaleEnded': 'Sale has already ended.',
  'InsufficientFunds': 'Insufficient SOL balance to complete purchase.',
  'InvalidTokenAmount': 'Invalid token purchase amount.',
  
  // Wallet errors
  'WalletNotConnected': 'Please connect your wallet to continue.',
  'WalletDisconnected': 'Wallet was disconnected. Please reconnect.',
  'TransactionRejected': 'Transaction was rejected by user.',
  'NetworkError': 'Network error. Please check your connection.',
  
  // Generic errors
  'UnknownError': 'An unexpected error occurred. Please try again.',
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }
  
  if (error?.message) {
    // Extract anchor error codes
    const anchorError = error.message.match(/Error Code: (\w+)/);
    if (anchorError?.[1]) {
      return ERROR_MESSAGES[anchorError[1]] || error.message;
    }
    
    // Extract wallet errors
    if (error.message.includes('User rejected')) {
      return ERROR_MESSAGES.TransactionRejected;
    }
    
    return error.message;
  }
  
  return ERROR_MESSAGES.UnknownError;
};
```

#### **Network Status & Offline Handling**
```typescript
// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [rpcStatus, setRpcStatus] = useState<'connected' | 'disconnected' | 'slow'>('connected');
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
    
    const checkRpcStatus = async () => {
      const startTime = Date.now();
      try {
        await connection.getSlot();
        const responseTime = Date.now() - startTime;
        setRpcStatus(responseTime > 5000 ? 'slow' : 'connected');
      } catch {
        setRpcStatus('disconnected');
      }
    };
    
    checkRpcStatus();
    const interval = setInterval(checkRpcStatus, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return { isOnline, rpcStatus };
};
```

### **Token Metadata & SPL Token Integration**
```typescript
// lib/token.ts
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  totalSupply?: number;
}

export const getTokenMetadata = async (
  connection: Connection,
  mintAddress: PublicKey
): Promise<TokenMetadata> => {
  try {
    // Get mint info from blockchain
    const mintInfo = await getMint(connection, mintAddress);
    
    // Try to get metadata from token registry or metaplex
    // This is a simplified version - in production you'd integrate with:
    // - @solana/spl-token-registry
    // - @metaplex-foundation/mpl-token-metadata
    
    return {
      name: 'Unknown Token',
      symbol: 'UNK',
      decimals: mintInfo.decimals,
      totalSupply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
    };
  } catch (error) {
    throw new Error(`Failed to fetch token metadata: ${error}`);
  }
};

export const getTokenBalance = async (
  connection: Connection,
  owner: PublicKey,
  mintAddress: PublicKey
): Promise<number> => {
  try {
    const tokenAccount = await getAssociatedTokenAddress(mintAddress, owner);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return balance.value.uiAmount || 0;
  } catch {
    return 0; // Account doesn't exist or no balance
  }
};
```

### **Mobile Wallet Integration & PWA Setup**

#### **Mobile Wallet Detection**
```typescript
// hooks/useMobileWallet.ts
import { useEffect, useState } from 'react';

export const useMobileWallet = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [walletApp, setWalletApp] = useState<'phantom' | 'solflare' | 'backpack' | null>(null);
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      setIsMobile(mobile);
      
      // Detect specific wallet apps
      if (userAgent.includes('phantom')) setWalletApp('phantom');
      else if (userAgent.includes('solflare')) setWalletApp('solflare');
      else if (userAgent.includes('backpack')) setWalletApp('backpack');
    };
    
    checkMobile();
  }, []);
  
  const openWalletApp = (walletName: string) => {
    const deepLinks = {
      phantom: 'phantom://browse/',
      solflare: 'solflare://browse/',
      backpack: 'backpack://browse/',
    };
    
    const currentUrl = window.location.href;
    const deepLink = deepLinks[walletName as keyof typeof deepLinks];
    
    if (deepLink && isMobile) {
      window.location.href = `${deepLink}${encodeURIComponent(currentUrl)}`;
    }
  };
  
  return { isMobile, walletApp, openWalletApp };
};
```

#### **PWA Configuration**
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
});

// public/manifest.json
{
  "name": "Token Sale Platform",
  "short_name": "TokenSale",
  "description": "Multi-project token sale platform on Solana",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### **SEO & Social Sharing**
```typescript
// components/SEO.tsx
import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
  const siteTitle = 'Token Sale Platform';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultImage = '/images/og-default.png';
  
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      {url && <meta property="og:url" content={url} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
      
      {/* Additional meta tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />
    </Head>
  );
}

// Usage in project pages
export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  
  return {
    title: project.name,
    description: project.description,
    openGraph: {
      title: `${project.name} Token Sale`,
      description: project.description,
      images: [project.logoUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.name} Token Sale`,
      description: project.description,
      images: [project.logoUrl],
    },
  };
}
```

### **Testing Utilities & Mock Data**

#### **Mock Data for Development**
```typescript
// lib/mocks.ts
export const mockProjects: ProjectAccount[] = [
  {
    id: 1,
    creator: new PublicKey('11111111111111111111111111111111'),
    name: 'DeFi Protocol X',
    description: 'Revolutionary DeFi protocol with automated yield farming',
    category: { defi: {} },
    website: 'https://defiprotocolx.com',
    tokenMint: new PublicKey('22222222222222222222222222222222'),
    status: { active: {} },
    createdAt: Date.now() / 1000,
    totalRaised: 150000,
    targetAmount: 500000,
    // ... complete structure
  },
  // Add more mock projects
];

export const mockSaleRounds: SaleRound[] = [
  {
    projectId: 1,
    saleType: { seed: {} },
    roundNumber: 1,
    tokenPrice: 0.05,
    totalTokens: 1000000,
    tokensSold: 300000,
    startTime: Date.now() / 1000 - 86400, // Started yesterday
    endTime: Date.now() / 1000 + 604800, // Ends in a week
    whitelistRequired: true,
    // ... complete structure
  },
];
```

#### **Test Utilities**
```typescript
// __tests__/utils/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppWalletProvider } from '@/components/wallet/WalletProvider';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export function renderWithProviders(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={testQueryClient}>
      <AppWalletProvider>
        {ui}
      </AppWalletProvider>
    </QueryClientProvider>
  );
}

// Mock wallet for testing
export const mockWallet = {
  publicKey: new PublicKey('11111111111111111111111111111111'),
  connected: true,
  connecting: false,
  disconnecting: false,
  signTransaction: jest.fn(),
  signAllTransactions: jest.fn(),
};
```

### **Performance Optimization**

#### **Bundle Analysis & Code Splitting**
```typescript
// next.config.js additions
module.exports = {
  // ... existing config
  experimental: {
    optimizePackageImports: ['@solana/web3.js', '@coral-xyz/anchor'],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Analyze bundle size
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          solana: {
            test: /[\\/]node_modules[\\/](@solana|@coral-xyz)[\\/]/,
            name: 'solana',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

// Lazy loading for heavy components
const ProjectAnalytics = lazy(() => import('@/components/ProjectAnalytics'));
const ChartComponent = lazy(() => import('@/components/Charts'));

// Usage with Suspense
<Suspense fallback={<ChartSkeleton />}>
  <ChartComponent data={projectData} />
</Suspense>
```

#### **Data Caching Strategy**
```typescript
// lib/cache.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Cache keys for consistent invalidation
export const CACHE_KEYS = {
  projects: ['projects'],
  project: (id: number) => ['project', id],
  userPortfolio: (wallet: string) => ['portfolio', wallet],
  saleRounds: (projectId: number) => ['sale-rounds', projectId],
  platformStats: ['platform-stats'],
} as const;
```

### **Internationalization Setup**
```typescript
// lib/i18n.ts
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'zh', 'ja'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export const translations = {
  en: {
    common: {
      connect_wallet: 'Connect Wallet',
      disconnect: 'Disconnect',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    project: {
      create_project: 'Create Project',
      project_details: 'Project Details',
      buy_tokens: 'Buy Tokens',
      // ... more translations
    },
  },
  // Add other languages
};

export const useTranslation = (locale: Locale = 'en') => {
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };
  
  return { t };
};
```

---

## 📱 **DETAILED PAGE SPECIFICATIONS**

### **1. Homepage (`/`)**
**Purpose:** Convert visitors to platform users
**Layout:**
- Hero section with value proposition
- Featured projects carousel
- Platform statistics (total raised, projects launched)
- How it works section (3-step process)
- Creator/investor CTA sections
- Footer with links and social proof

**Key Metrics to Display:**
- Total funds raised: `$X.XM`
- Active projects: `XX`
- Successful launches: `XX`
- Average ROI: `XX%`

### **2. Project Marketplace (`/projects`)**
**Purpose:** Help investors discover projects
**Features:**
- Header with search and filters
- Project grid with pagination
- Filter sidebar:
  - Categories (DeFi, Gaming, AI, etc.)
  - Price range slider
  - Time remaining
  - Round type (Seed/Private/Public)
  - Funding status
- Sort dropdown (Trending, Ending Soon, Newest, Price)
- Project cards showing:
  - Project logo and name
  - Current price and round
  - Progress bar (funds raised/target)
  - Time remaining
  - Creator badge
  - Tags (category, verified, etc.)

### **3. Project Detail Page (`/projects/[id]`)**
**Purpose:** Provide comprehensive project information
**Sections:**
- **Header:** Logo, name, tagline, social links
- **Key Metrics:** Current price, raised amount, time remaining
- **Description:** Detailed project overview
- **Tokenomics:** Supply, distribution, vesting schedules
- **Roadmap:** Development milestones
- **Team:** Member profiles with verification
- **Sale Rounds:** Round breakdown with pricing
- **Purchase Interface:** Prominent buy widget
- **Community:** Discussion/comments section

### **4. Purchase Flow (`/projects/[id]/buy`)**
**Purpose:** Facilitate token purchases
**Steps:**
1. **Eligibility Check**
   - Wallet connection status
   - Whitelist verification
   - Purchase limit calculation
2. **Amount Selection**
   - Token amount input
   - USD equivalent display
   - Available balance check
   - Purchase limit warning
3. **Transaction Preview**
   - Order summary
   - Fee breakdown
   - Slippage tolerance
   - Terms acceptance
4. **Confirmation**
   - Transaction signing
   - Status updates
   - Success/failure handling

### **5. Creator Dashboard (`/dashboard/creator`)**
**Purpose:** Project management for creators
**Sections:**
- **Overview:** Key metrics and recent activity
- **My Projects:** List with quick actions
- **Analytics:** Revenue, investor, and performance charts
- **Project Settings:** Configuration and management tools
- **Notifications:** Updates and alerts

### **6. Investor Dashboard (`/dashboard/investor`)**
**Purpose:** Portfolio management for investors
**Sections:**
- **Portfolio Overview:** Total value and performance
- **My Investments:** List of purchased tokens
- **Watchlist:** Tracked projects
- **Transaction History:** Purchase records
- **Upcoming Claims:** Token release schedule

### **7. Admin Panel (`/admin`)**
**Purpose:** Platform administration
**Features:**
- **Dashboard:** Platform metrics and health
- **Project Review:** Approval queue with detailed review
- **User Management:** User roles and permissions
- **Platform Settings:** Configuration and controls
- **Analytics:** Revenue and usage reports

---

## 🔐 **SECURITY & VALIDATION**

### **Input Validation Requirements**
```typescript
// Project creation validation
const projectSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters'),
  description: z.string().min(10).max(500),
  category: z.enum(['DeFi', 'Gaming', 'AI', 'NFT', 'Infrastructure', 'Other']),
  website: z.string().url().optional().or(z.literal('')),
  tokenMint: z.string().refine(isValidPublicKey, 'Invalid token mint address'),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal('')),
    discord: z.string().url().optional().or(z.literal('')),
    telegram: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

// Purchase validation with comprehensive checks
const purchaseSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large')
    .refine(value => value >= 0.001, 'Minimum purchase is 0.001 tokens'),
  projectId: z.number().positive(),
  maxPrice: z.number().positive(), // slippage protection
  slippageTolerance: z.number().min(0).max(50), // 0-50%
});

// Whitelist validation
const whitelistSchema = z.object({
  addresses: z.array(z.string().refine(isValidPublicKey))
    .min(1, 'At least one address required')
    .max(10000, 'Maximum 10,000 addresses per batch'),
  projectId: z.number().positive(),
});

// Utility function for PublicKey validation
export const isValidPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};
```

### **Enhanced Security Measures**
```typescript
// lib/security.ts
export class SecurityManager {
  // Rate limiting for actions
  private static actionTimestamps = new Map<string, number[]>();
  
  static checkRateLimit(action: string, wallet: string, maxRequests = 5, windowMs = 60000): boolean {
    const key = `${action}:${wallet}`;
    const now = Date.now();
    const timestamps = this.actionTimestamps.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validTimestamps.push(now);
    this.actionTimestamps.set(key, validTimestamps);
    return true;
  }
  
  // Transaction parameter validation
  static validateTransactionParams(params: any): boolean {
    // Check for suspicious parameters
    if (params.amount && (params.amount < 0 || params.amount > 1e18)) {
      return false;
    }
    
    // Validate addresses are legitimate
    if (params.recipient && !isValidPublicKey(params.recipient)) {
      return false;
    }
    
    return true;
  }
  
  // Content Security Policy helpers
  static sanitizeUserInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

// CSP middleware for Next.js
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Solana wallet adapters
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.devnet.solana.com https://api.mainnet-beta.solana.com",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### **Compliance & Legal Considerations**
```typescript
// lib/compliance.ts
export interface ComplianceCheck {
  region: string;
  isAccredited: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_required';
  investmentLimits: {
    dailyLimit: number;
    monthlyLimit: number;
    totalLimit: number;
  };
}

export const checkInvestmentCompliance = (
  user: ComplianceCheck,
  purchaseAmount: number,
  projectType: string
): { allowed: boolean; reason?: string } => {
  // Check regional restrictions
  if (['US', 'CN', 'KP'].includes(user.region) && projectType === 'utility_token') {
    return { allowed: false, reason: 'Not available in your region' };
  }
  
  // Check accreditation requirements for large purchases
  if (purchaseAmount > 10000 && !user.isAccredited) {
    return { allowed: false, reason: 'Accredited investor status required for large purchases' };
  }
  
  // Check KYC requirements
  if (purchaseAmount > 1000 && user.kycStatus !== 'approved') {
    return { allowed: false, reason: 'KYC verification required for purchases over $1,000' };
  }
  
  // Check investment limits
  if (purchaseAmount > user.investmentLimits.dailyLimit) {
    return { allowed: false, reason: 'Exceeds daily investment limit' };
  }
  
  return { allowed: true };
};

// Terms of Service and Privacy Policy integration
export const LEGAL_DOCUMENTS = {
  terms: '/legal/terms-of-service',
  privacy: '/legal/privacy-policy',
  riskDisclosure: '/legal/risk-disclosure',
  cookiePolicy: '/legal/cookie-policy',
};

// Required acknowledgments before purchases
export const REQUIRED_ACKNOWLEDGMENTS = [
  'I understand the risks associated with token purchases',
  'I have read and agree to the Terms of Service',
  'I confirm I am legally allowed to participate in token sales in my jurisdiction',
  'I understand that this is a speculative investment',
];
```

### **Advanced Error Recovery**
```typescript
// hooks/useErrorRecovery.ts
export const useErrorRecovery = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const recoverFromError = useCallback(async (
    error: Error,
    recoverFn: () => Promise<void>
  ) => {
    setIsRecovering(true);
    
    try {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      await recoverFn();
      setRetryCount(0); // Reset on success
    } catch (retryError) {
      setRetryCount(prev => prev + 1);
      
      if (retryCount >= 3) {
        // Max retries reached, escalate to user
        toast.error('Unable to recover. Please refresh and try again.');
        throw retryError;
      } else {
        // Automatic retry
        setTimeout(() => recoverFromError(error, recoverFn), 2000);
      }
    } finally {
      setIsRecovering(false);
    }
  }, [retryCount]);
  
  return { recoverFromError, isRecovering, retryCount };
};

// Global error boundary with recovery options
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    console.error('Application error:', error, errorInfo);
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Analytics.track('application_error', { error: error.message, stack: error.stack });
    }
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We're sorry for the inconvenience. Please try again.</p>
            <button
              onClick={this.handleRetry}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## 📊 **ANALYTICS & MONITORING**

### **User Analytics to Track**
- **Creator Metrics:**
  - Project creation completion rate
  - Time to launch after creation
  - Average funds raised per project
  - Creator retention rate
- **Investor Metrics:**
  - Portfolio value over time
  - Average investment amount
  - Project discovery sources
  - Return rates and satisfaction
- **Platform Metrics:**
  - Total transaction volume
  - Platform fee revenue
  - User growth rate
  - Project success rate

### **Technical Monitoring**
- **Blockchain Monitoring:**
  - Transaction success rates
  - RPC endpoint health
  - Block confirmation times
  - Gas fee tracking
- **Application Monitoring:**
  - Page load times
  - Error rates
  - User session duration
  - Conversion funnels

---

## 🚀 **DEPLOYMENT & INFRASTRUCTURE**

### **Environment Configuration**
```typescript
// lib/constants.ts
export const CONFIG = {
  SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  RPC_ENDPOINT: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  MULTI_PRESALE_PROGRAM_ID: '3n4Jusc6GmZXTJapNbDpr4DYKFSsZUhz2XKuJVL6Kmy5',
  ESCROW_PROGRAM_ID: 'HVpfkkSxd5aiCALZ8CETUxrWBfUwWCtJSxxtUsZhFrt4',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
};
```

### **Performance Requirements**
- **Core Web Vitals:** LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Time to Interactive:** < 3 seconds
- **Bundle Size:** < 1MB total JavaScript
- **Accessibility:** WCAG 2.1 AA compliance
- **SEO:** Meta tags, structured data, sitemap

### **Testing Strategy**
```typescript
// Component testing example
describe('ProjectCard', () => {
  it('displays project information correctly', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText(mockProject.name)).toBeInTheDocument();
    expect(screen.getByText(mockProject.description)).toBeInTheDocument();
  });

  it('handles purchase button click', () => {
    const onPurchase = jest.fn();
    render(<ProjectCard project={mockProject} onPurchase={onPurchase} />);
    fireEvent.click(screen.getByText('Buy Tokens'));
    expect(onPurchase).toHaveBeenCalledWith(mockProject.id);
  });
});
```

---

## 🎯 **SUCCESS METRICS & KPIs**

### **Business Metrics**
- **Revenue:** Total platform fees collected
- **Volume:** Total transaction volume processed
- **Growth:** Monthly active users (MAU) growth rate
- **Retention:** Creator and investor return rates
- **Conversion:** Visitor to user conversion rate

### **Technical Metrics**
- **Performance:** Page load times under 3 seconds
- **Reliability:** 99.9% uptime requirement
- **Security:** Zero security incidents
- **Scalability:** Handle 10,000+ concurrent users
- **User Experience:** NPS score > 8/10

---

## 📋 **DEVELOPMENT PHASES**

### **Phase 1: MVP (4-6 weeks)**
- Basic project creation and marketplace
- Simple purchase flow
- Wallet integration
- Admin approval system

### **Phase 2: Enhanced Features (3-4 weeks)**
- Multi-round sale support
- Advanced analytics
- Improved UX/UI
- Mobile optimization

### **Phase 3: Production Ready (2-3 weeks)**
- Security audit and fixes
- Performance optimization
- Comprehensive testing
- Documentation completion

### **Phase 4: Launch & Scale (Ongoing)**
- User onboarding
- Community building
- Feature iterations
- Scaling infrastructure

---

## 🎊 **FINAL DELIVERABLES**

### **Code Deliverables**
- **Frontend Application:** Complete Next.js application
- **Component Library:** Reusable UI components
- **Integration Layer:** Smart contract integration
- **Testing Suite:** Unit and integration tests
- **Documentation:** API docs and user guides

### **Design Deliverables**
- **Design System:** Colors, typography, components
- **Wireframes:** All page layouts and flows
- **Prototypes:** Interactive user flows
- **Assets:** Icons, illustrations, logos

### **Technical Documentation**
- **Architecture Guide:** System design and decisions
- **API Documentation:** All endpoints and responses
- **Deployment Guide:** Setup and configuration
- **Maintenance Guide:** Monitoring and updates

---

## 🚀 **SUCCESS CRITERIA**

**The frontend is considered complete when:**
1. ✅ All user flows work end-to-end without errors
2. ✅ Smart contract integration is fully functional with proper error handling
3. ✅ Performance meets specified requirements (LCP < 2.5s, Bundle < 1MB)
4. ✅ Security audit passes with no critical issues
5. ✅ User testing shows satisfaction scores > 8/10
6. ✅ Admin tools enable effective platform management
7. ✅ Analytics provide actionable business insights
8. ✅ Documentation enables easy maintenance and extension
9. ✅ Mobile responsiveness works flawlessly across all devices
10. ✅ PWA functionality provides native app-like experience
11. ✅ SEO optimization drives organic discovery
12. ✅ Accessibility compliance meets WCAG 2.1 AA standards

---

## 🎯 **PRODUCTION READINESS CHECKLIST**

### **Code Quality & Testing**
- [ ] 90%+ test coverage for critical user flows
- [ ] E2E tests for complete purchase journey
- [ ] Performance tests under load (1000+ concurrent users)
- [ ] Security penetration testing completed
- [ ] Accessibility audit with screen readers
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS Safari, Android Chrome)

### **Performance & Monitoring**
- [ ] Core Web Vitals meet Google standards
- [ ] Bundle analysis and optimization complete
- [ ] Error tracking and monitoring setup (Sentry/LogRocket)
- [ ] Analytics implementation with conversion funnels
- [ ] Performance monitoring with alerts
- [ ] CDN setup for global performance
- [ ] Database query optimization

### **Security & Compliance**
- [ ] Security headers properly configured
- [ ] Input validation on all user inputs
- [ ] Rate limiting implemented
- [ ] GDPR compliance for EU users
- [ ] Privacy policy and terms of service
- [ ] Cookie consent management
- [ ] Data encryption for sensitive information

### **Business & User Experience**
- [ ] User onboarding flow optimized
- [ ] Help documentation and FAQs
- [ ] Customer support integration
- [ ] A/B testing framework setup
- [ ] Feature flags for controlled rollouts
- [ ] Backup and disaster recovery plan
- [ ] Multi-language support (if applicable)

### **Technical Infrastructure**
- [ ] CI/CD pipeline with automated testing
- [ ] Staging environment for pre-production testing
- [ ] Database backup and recovery procedures
- [ ] SSL certificates and security configs
- [ ] Environment variable management
- [ ] Logging and monitoring setup
- [ ] Scalability planning for user growth

---

## 🔧 **ADDITIONAL IMPLEMENTATION NOTES**

### **Smart Contract Interaction Patterns**
```typescript
// Pattern: Optimistic Updates with Rollback
const useOptimisticTransaction = () => {
  const [optimisticState, setOptimisticState] = useState(null);
  
  const executeWithOptimism = async (
    optimisticUpdate: () => void,
    transactionFn: () => Promise<string>,
    rollbackFn: () => void
  ) => {
    // Apply optimistic update immediately
    optimisticUpdate();
    
    try {
      const signature = await transactionFn();
      // Transaction confirmed, optimistic update was correct
      return signature;
    } catch (error) {
      // Transaction failed, rollback optimistic update
      rollbackFn();
      throw error;
    }
  };
  
  return { executeWithOptimism };
};

// Pattern: Transaction Queuing for Multiple Operations
class TransactionQueue {
  private queue: Array<() => Promise<string>> = [];
  private processing = false;
  
  async add(transactionFn: () => Promise<string>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await transactionFn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const transaction = this.queue.shift()!;
      try {
        await transaction();
        // Wait between transactions to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Transaction failed:', error);
        // Continue processing other transactions
      }
    }
    
    this.processing = false;
  }
}
```

### **Advanced State Management Patterns**
```typescript
// stores/useAdvancedProjectStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AdvancedProjectStore {
  // Normalized state for better performance
  projects: Record<number, ProjectAccount>;
  projectIds: number[];
  
  // Derived state selectors
  activeProjects: ProjectAccount[];
  userProjects: ProjectAccount[];
  
  // Optimistic updates tracking
  optimisticUpdates: Record<string, any>;
  
  // Actions with optimistic updates
  createProjectOptimistic: (project: CreateProjectData) => Promise<void>;
  updateProjectOptimistic: (id: number, updates: Partial<ProjectAccount>) => Promise<void>;
}

export const useAdvancedProjectStore = create<AdvancedProjectStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      projects: {},
      projectIds: [],
      optimisticUpdates: {},
      
      get activeProjects() {
        const { projects, projectIds } = get();
        return projectIds
          .map(id => projects[id])
          .filter(project => project?.status === 'active');
      },
      
      createProjectOptimistic: async (projectData) => {
        const tempId = `temp_${Date.now()}`;
        
        // Optimistic update
        set(state => {
          state.optimisticUpdates[tempId] = projectData;
        });
        
        try {
          const result = await createProject(projectData);
          
          // Remove optimistic update and add real data
          set(state => {
            delete state.optimisticUpdates[tempId];
            state.projects[result.id] = result;
            state.projectIds.push(result.id);
          });
        } catch (error) {
          // Remove failed optimistic update
          set(state => {
            delete state.optimisticUpdates[tempId];
          });
          throw error;
        }
      },
      
      // ... other actions
    }))
  )
);

// Selector hooks for performance optimization
export const useActiveProjects = () => useAdvancedProjectStore(state => state.activeProjects);
export const useProject = (id: number) => useAdvancedProjectStore(state => state.projects[id]);
```

### **Advanced Error Handling Strategies**
```typescript
// lib/errorHandling.ts
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export const ERROR_RECOVERY_STRATEGIES = {
  NetworkError: async () => {
    // Wait and retry with exponential backoff
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'retry';
  },
  
  WalletError: async () => {
    // Prompt user to reconnect wallet
    return 'reconnect_wallet';
  },
  
  TransactionError: async (error: Error) => {
    if (error.message.includes('insufficient funds')) {
      return 'show_funding_options';
    }
    if (error.message.includes('slippage')) {
      return 'adjust_slippage';
    }
    return 'retry';
  },
  
  ValidationError: async () => {
    // Show form errors and let user correct
    return 'show_validation_errors';
  },
};

export const handleErrorWithStrategy = async (error: Error): Promise<string> => {
  const errorType = determineErrorType(error);
  const strategy = ERROR_RECOVERY_STRATEGIES[errorType];
  
  if (strategy) {
    return await strategy(error);
  }
  
  // Default fallback
  return 'show_generic_error';
};
```

---

## 📚 **ADDITIONAL RESOURCES & REFERENCES**

### **Essential Documentation Links**
- **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/
- **Anchor Framework:** https://coral-xyz.github.io/anchor/
- **Wallet Adapter:** https://github.com/solana-labs/wallet-adapter
- **SPL Token:** https://spl.solana.com/token
- **Next.js 14:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/

### **Development Tools**
- **Solana Explorer:** https://explorer.solana.com/?cluster=devnet
- **Anchor IDL to TypeScript:** `anchor build && anchor idl typescript`
- **Bundle Analyzer:** `npm install @next/bundle-analyzer`
- **Lighthouse CI:** For automated performance testing
- **Chromatic:** For visual regression testing

### **Community & Support**
- **Solana Discord:** https://discord.gg/solana
- **Anchor Discord:** https://discord.gg/anchor
- **Stack Overflow:** Tag questions with `solana`, `anchor-framework`

**Ready to build the future of token sales! 🎯**

---

*This comprehensive prompt contains everything needed to build a production-ready, secure, and scalable token sale platform frontend. Use it as your development bible and reference guide throughout the implementation process.*