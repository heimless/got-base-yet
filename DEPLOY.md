# Deploying GotBaseYet Contract

Two options to deploy the smart contract to Base network.

## Option 1: Using Remix IDE (Recommended for beginners)

1. **Open Remix IDE**
   - Go to [https://remix.ethereum.org](https://remix.ethereum.org)

2. **Create contract file**
   - In File Explorer, create new file: `GotBaseYet.sol`
   - Copy content from `contracts/GotBaseYet.sol`

3. **Compile**
   - Go to "Solidity Compiler" tab (left sidebar)
   - Select compiler version: `0.8.20`
   - Click "Compile GotBaseYet.sol"

4. **Deploy**
   - Go to "Deploy & Run Transactions" tab
   - Environment: Select "Injected Provider - MetaMask"
   - Make sure MetaMask is connected to **Base Mainnet**
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Copy contract address**
   - After deployment, copy the contract address
   - Update `app/contracts/checkIn.ts`:
   ```typescript
   export const CHECK_IN_CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS" as const;
   ```

## Option 2: Using Deploy Script

### Prerequisites
- Node.js installed
- Wallet with ETH on Base network (for gas)

### Steps

1. **Set your private key** (never share this!)

   PowerShell:
   ```powershell
   $env:DEPLOYER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
   ```

   CMD:
   ```cmd
   set DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ```

   Bash/Linux/Mac:
   ```bash
   export DEPLOYER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
   ```

2. **Run deployment**
   ```bash
   npm run deploy:contract
   ```

3. **Update contract address**
   - Copy the deployed contract address from output
   - Update `app/contracts/checkIn.ts`

## Getting ETH on Base

If you need ETH on Base network:

1. **Bridge from Ethereum**
   - [https://bridge.base.org](https://bridge.base.org)

2. **Buy directly**
   - Use Coinbase Wallet or exchanges that support Base

## Verifying Contract on BaseScan (Optional)

1. Go to [https://basescan.org](https://basescan.org)
2. Find your contract address
3. Click "Verify and Publish"
4. Select:
   - Compiler: `0.8.20`
   - Optimization: `Yes` with `200` runs
   - License: `MIT`
5. Paste source code from `contracts/GotBaseYet.sol`

## Contract Details

- **Function**: `checkIn()` - Emits event, no storage writes
- **Gas cost**: ~25,000 gas (~$0.001 at typical Base gas prices)
- **Event**: `CheckedIn(address indexed user, uint256 timestamp)`
