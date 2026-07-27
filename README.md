# ZX App

ZX App is the Cronix web client. It connects a BNB Smart Chain wallet, authenticates the wallet against `zx-backend`, lets users deposit USDT through the deposit contract, and displays ROI, referral income, cycle progress, withdrawals, and admin controls.

This README documents the current implementation from setup through production operation.

## Table of contents

1. [System overview](#system-overview)
2. [Technology stack](#technology-stack)
3. [Project structure](#project-structure)
4. [Application routes](#application-routes)
5. [Provider and state architecture](#provider-and-state-architecture)
6. [Wallet authentication](#wallet-authentication)
7. [Deposit flow](#deposit-flow)
8. [Dashboard and income](#dashboard-and-income)
9. [Withdrawal flow](#withdrawal-flow)
10. [Admin flow](#admin-flow)
11. [API integration](#api-integration)
12. [Environment variables](#environment-variables)
13. [Local development](#local-development)
14. [Build and deployment](#build-and-deployment)
15. [Security and operational notes](#security-and-operational-notes)
16. [Known limitations](#known-limitations)

## System overview

```text
User wallet
    |
    | Reown AppKit + wagmi + viem
    v
ZX App (Next.js)
    |
    | HTTPS JSON API + JWT
    v
ZX Backend (Express)
    |
    +--> MongoDB
    |
    +--> BNB Smart Chain RPC
            |
            +--> USDT token
            +--> Deposit contract
```

The frontend does not calculate authoritative balances or income. It submits blockchain transactions and renders data returned by the backend. MongoDB and verified blockchain events remain the accounting sources used by the backend.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 3 |
| Wallet UI | Reown AppKit |
| Web3 state | wagmi 2 |
| Blockchain types/calls | viem 2 |
| Async cache | TanStack React Query 5 |
| Networks | BSC mainnet and BSC testnet |

## Project structure

```text
zx-app/
|-- src/
|   |-- app/
|   |   |-- layout.tsx                  # Root fonts and Web3 provider
|   |   |-- page.tsx                    # Public landing page
|   |   |-- admin/page.tsx              # Admin control center
|   |   `-- dashboard/
|   |       |-- layout.tsx              # Authenticated dashboard shell
|   |       |-- page.tsx                # Dashboard overview
|   |       |-- deposit/page.tsx        # Deposit screen
|   |       |-- team/page.tsx           # Team preview/mock screen
|   |       `-- withdrawals/page.tsx    # Claims and withdrawal history
|   |-- components/
|   |   |-- dashboard/
|   |   |   |-- DashboardContent.tsx    # Main dashboard composition
|   |   |   |-- DepositActions.tsx      # Deposit action controls
|   |   |   |-- DepositForm.tsx         # Primary approve/deposit flow
|   |   |   |-- DepositModal.tsx        # Alternate modal deposit UI
|   |   |   |-- IncomeSection.tsx       # Income summary
|   |   |   |-- InvestmentsSection.tsx  # Investment/ROI summary
|   |   |   |-- LedgerPanel.tsx         # Filtered withdrawal history
|   |   |   |-- RoiWithdrawCard.tsx     # ROI claim flow
|   |   |   `-- WithdrawableIncomeCard.tsx
|   |   |-- hud/
|   |   |   |-- WalletBar.tsx           # Connect, disconnect, chain switch
|   |   |   `-- Hud*.tsx                # Reusable visual primitives
|   |   `-- providers/
|   |       |-- Web3Provider.tsx         # Provider composition
|   |       `-- TrustWalletRecovery.tsx  # Trust Wallet reconnect recovery
|   |-- hooks/
|   |   |-- useAuth.tsx                  # Nonce/signature/JWT lifecycle
|   |   |-- useCurrentUser.ts            # GET /users/me
|   |   |-- useDashboard.ts              # API-to-view-model adapter
|   |   |-- useUsdtDeposit.ts            # ERC20 approve + contract deposit
|   |   `-- useWithdrawalHistory.ts       # Paginated withdrawal history
|   |-- lib/
|   |   |-- api.ts                       # Typed API client
|   |   |-- appkit.ts                    # Reown modal initialization
|   |   |-- wagmi.ts                     # Chains, transports, config
|   |   |-- withdrawals.ts               # Withdrawal helpers
|   |   |-- contracts/depositAbi.ts       # Minimal deposit contract ABI
|   |   |-- mock-dashboard.ts             # Legacy/demo data
|   |   `-- types/dashboard.ts            # Dashboard view types
|   `-- middleware.ts                     # No-cache response headers
|-- next.config.ts
|-- tailwind.config.ts
|-- tsconfig.json
`-- package.json
```

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing page and wallet entry point |
| `/dashboard` | Investment, ROI, income, cycle, referral, and status overview |
| `/dashboard/deposit` | Sponsor selection, USDT approval, contract deposit, backend verification |
| `/dashboard/withdrawals` | ROI/direct/override claims and withdrawal history |
| `/dashboard/team` | Current team preview; not an authoritative live team tree |
| `/admin` | Admin KPIs, controls, cycle progress, and test login |

`src/middleware.ts` disables browser/proxy caching for the public page, admin page, and dashboard routes. It does not perform authentication or authorization.

## Provider and state architecture

The root provider hierarchy is:

```text
RootLayout
`-- Web3Provider
    |-- WagmiProvider
    |-- QueryClientProvider
    |-- AuthProvider
    `-- TrustWalletRecovery
```

Responsibilities:

- `WagmiProvider` owns connected account, connector, chain, reads, simulations, and writes.
- `QueryClientProvider` caches asynchronous wallet and API state.
- `AuthProvider` owns the backend JWT for the currently connected wallet.
- `TrustWalletRecovery` invalidates or refreshes connector state when Trust Wallet reconnects unreliably.
- `useDashboard` normalizes backend responses into the model consumed by dashboard components.

## Wallet authentication

Authentication proves wallet ownership without a user password.

```text
1. User connects a wallet.
2. App calls POST /auth/nonce with walletAddress.
3. Backend returns a short-lived nonce.
4. Wallet signs: "ZX Login Nonce: <nonce>".
5. App calls POST /auth/login with wallet, signature, and optional sponsor.
6. Backend verifies the signer and returns a JWT.
7. App stores the JWT against the connected wallet address.
```

Important behavior:

- Tokens use the local storage keys `zx.auth.token` and `zx.auth.address`.
- A token is reused only if its stored wallet matches the connected wallet.
- Sponsor addresses are captured from `?sponsor=<address>` or `?ref=<address>`.
- The sponsor is stored locally as `zx.sponsorWalletAddress`.
- Sign-in starts automatically after both the account and connector client are ready.
- Connector hydration failures are retried with backoff.
- A rejected/stale JWT is cleared so wallet authentication can run again.

## Deposit flow

The primary implementation is `DepositForm.tsx` plus `useUsdtDeposit.ts`.

```text
1. User connects a wallet on BSC.
2. App reads token() from the configured deposit contract.
3. App reads token decimals, wallet balance, and allowance.
4. User chooses an amount/package and sponsor.
5. App simulates ERC20 approve().
6. User approves the exact amount if allowance is insufficient.
7. App simulates depositContract.deposit(amount).
8. User confirms the deposit transaction.
9. App waits for the transaction receipt.
10. App sends txHash, amount, and sponsor to POST /deposits/verify.
11. Backend verifies the USDT Transfer event and records the cycle/deposit.
```

The displayed package tiers are UI guidance. The backend configuration is authoritative for package slab validation and ROI rates.

An on-chain success is not the final accounting step. The backend verification request must also succeed so the deposit, cycle, sponsor commission, and dashboard state are recorded.

## Dashboard and income

The dashboard loads `GET /users/dashboard` and renders:

- Total invested value
- ROI earned to date
- Claimed and remaining ROI
- Direct income
- Level/override income
- Total earned and claimable income
- Active cycle package
- 2x ROI progress
- 3x total cap progress
- Account/re-top-up status
- Referral wallet and link
- Withdrawal window and pause controls

Additional endpoints provide:

- Monthly ROI: `GET /users/income/monthly-roi`
- Monthly direct/override income: `GET /users/income/withdrawable`
- Withdrawal history: `GET /withdrawals/history`

The frontend renders backend values. It must not be treated as an independent accounting engine.

## Withdrawal flow

There are separate user flows for ROI and working income.

### ROI

1. Load ROI for the selected month.
2. Submit `POST /withdrawals/contract` with `type: "roi"`.
3. Backend checks controls and executes the contract payout.
4. Refresh dashboard and history.

### Direct and override income

1. Load withdrawable entries for the selected month.
2. Select `direct` or `override`.
3. Submit `POST /withdrawals/contract`.
4. Backend records the withdrawal and executes the payout.

Each write request includes an idempotency key generated in the browser. Withdrawal history supports status/type filters and offset pagination.

## Admin flow

The live admin view requires:

- A valid wallet JWT
- Backend user role `admin`
- The connected wallet to match the backend admin configuration

Admin capabilities exposed by the frontend include:

- Platform KPIs
- Current-month ROI/direct/level totals
- Global ROI and income withdrawal pause switches
- ROI slab and override configuration reads
- Cycle progress and cap status
- Marking approved withdrawals as paid

The admin page also has a password-based backend login path used for test/operations workflows. It should not replace wallet-role authorization for normal production administration.

## API integration

`src/lib/api.ts` implements:

- A normalized base URL
- JSON request/response handling
- `Authorization: Bearer <token>`
- Idempotency headers
- Request timeouts
- Typed response models
- Structured `ApiError` instances

Main calls:

| Method | Endpoint | Frontend use |
| --- | --- | --- |
| POST | `/auth/nonce` | Request wallet nonce |
| POST | `/auth/login` | Signature login |
| POST | `/auth/backend-login` | Operations/test login |
| GET | `/users/me` | Current user and role |
| GET | `/users/dashboard` | Main dashboard |
| GET | `/users/income/monthly-roi` | ROI for month |
| GET | `/users/income/withdrawable` | Direct/override availability |
| POST | `/deposits/verify` | Confirm on-chain deposit |
| POST | `/withdrawals/contract` | Contract payout |
| GET | `/withdrawals/history` | User withdrawal ledger |
| POST | `/withdrawals/:id/pay` | Admin payout completion |
| GET | `/admin/kpis` | Admin totals |
| GET/PATCH | `/admin/config` | Platform controls |
| GET | `/admin/current-month-income` | Current income breakdown |
| GET | `/admin/cycles/progress` | Cycle status list |
| GET | `/health` | Backend availability |

## Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com/api/v1
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_DEPOSIT_CONTRACT=0xYourDepositContract
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xYourAdminWallet

# Optional RPC overrides
NEXT_PUBLIC_BSC_RPC_URL=https://your-bsc-mainnet-rpc
NEXT_PUBLIC_BSC_TESTNET_RPC_URL=https://your-bsc-testnet-rpc
```

Notes:

- All `NEXT_PUBLIC_*` values are included in the browser bundle. Never put private keys, database credentials, backend passwords, or secrets in them.
- Set `NEXT_PUBLIC_API_BASE_URL` in production. The source fallback may point to an obsolete deployment.
- The frontend and backend must use the same deposit contract and network.
- Rebuild/redeploy after changing public environment variables.

## Local development

Requirements:

- Node.js 20 or newer
- npm
- A running `zx-backend`
- A BSC-compatible browser wallet
- Test BNB/USDT when using testnet

Install and run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Available scripts:

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Build and deployment

Production build:

```bash
npm run build
npm start
```

Deployment checklist:

1. Configure every required `NEXT_PUBLIC_*` variable.
2. Confirm the backend `/api/v1/health` endpoint responds.
3. Confirm the deposit contract and USDT token are on the selected BSC network.
4. Build successfully.
5. Deploy the generated Next.js application.
6. Test wallet connect, nonce signing, dashboard load, and a controlled deposit.
7. Test the custom domain and HTTPS.

The repository has been used with Railway and contains Vercel project metadata. Either platform can run the app, but its service and billing must remain active.

## Security and operational notes

- JWTs are stored in local storage and are therefore exposed if an XSS vulnerability is introduced.
- Client-side role checks are presentation only; the backend must enforce admin authorization.
- Never infer a successful accounting deposit solely from a wallet receipt.
- Never expose payout keys, MongoDB URIs, admin passwords, or backend JWT secrets in frontend variables.
- Sponsor addresses should be validated by both viem and the backend.
- BSC mainnet/testnet mismatches can produce valid-looking but unusable transactions.
- Trust Wallet recovery may refresh/reload the page when connector state becomes stale.
- Idempotency reduces accidental duplicate writes but backend enforcement remains authoritative.

## Known limitations

- `/dashboard/team` is currently a preview/mock experience rather than a complete live team graph.
- `mock-dashboard.ts` and deprecated dashboard mock types remain for compatibility/demo use.
- Deposit tiers displayed in the UI can drift from backend admin configuration if not maintained together.
- The source API fallback is not a reliable production configuration.
- Backend/database downtime prevents sign-in and dashboard accounting even if wallet connection still works.
