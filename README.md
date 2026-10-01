[中文](README_CN.md) | English

# RWA Tokenization Lab (RWAToken)

A minimal experiment in bringing a real-world asset's revenue rights on-chain:
**one ERC-20 contract + full test suite + testnet deployment script**.

## Real-World Mapping (What RWA Actually Solves)

| Real world | On-chain counterpart |
|---|---|
| A shop / a batch of equipment / a receivable | The asset dossier behind `assetURI` (valuation report, custody proof) |
| Asset split into N revenue shares | `maxSupply` = N, 1 token = 1 share |
| Custodian holding the physical asset | `owner` (the custodian) — only it can `mint` |
| Only qualified investors may trade | `allowlisted` allowlist + `transfersRestricted` switch |
| Investor exits and gets paid | `redeem()` burns tokens, settlement happens off-chain |

In one sentence: **the contract is the ledger, the asset lives off-chain, and the custodian is the trust anchor connecting the two** — the unavoidable trio of every RWA project.

## Contract Overview (contracts/RWAToken.sol)

- Built on OpenZeppelin ERC-20 + Ownable, Solidity 0.8.20
- `mint(to, amount)`: custodian-only, requires `totalSupply + amount <= maxSupply`
- Allowlist compliance: the `_update` hook blocks transfers between non-allowlisted addresses (mint/burn exempt)
- `setTransfersRestricted(false)`: degrades to a plain ERC-20 when restrictions are off
- `redeem(amount)`: holder burns tokens and emits a `Redeemed` event; the custodian settles off-chain

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test        # 5 tests covering mint cap / allowlist / redemption
```

## Deploy to Sepolia Testnet

1. Copy `.env.example` to `.env` and fill in:
   - `SEPOLIA_RPC_URL`: a Sepolia endpoint from Alchemy / Infura (free)
   - `DEPLOYER_PRIVATE_KEY`: **a fresh test-wallet key holding only testnet ETH**
2. Get test ETH: [sepoliafaucet.com](https://sepoliafaucet.com)
3. Deploy: `npx hardhat run scripts/deploy.js --network sepolia`

## Security Ground Rules

- This is an **educational experiment** — do not use it to tokenize real assets or accept real money.
- Private keys go only into `.env` (already in `.gitignore`) — **never commit them, never paste them into chat**.
- A professional audit is mandatory before any mainnet deployment — this repo makes no security claims.

## Ideas to Explore Next

- Point `assetURI` at a real IPFS asset dossier for an "on-chain dossier" demo
- Build a minimal frontend (ethers.js): connect wallet → check balance → one-click redeem
- Study ERC-3643 (the compliant security-token standard) and compare with this allowlist design
- Write an off-chain "custodian service" that listens for `Redeemed` events and auto-reconciles

## License

MIT
