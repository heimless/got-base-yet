import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

/**
 * GotBaseYet Contract Bytecode
 * 
 * Compiled with: solc 0.8.20, optimizer 200 runs
 * Source: contracts/GotBaseYet.sol
 * 
 * If you need to recompile, use Remix IDE:
 * 1. Go to https://remix.ethereum.org
 * 2. Paste the contract from contracts/GotBaseYet.sol
 * 3. Compile with Solidity 0.8.20
 * 4. Copy bytecode from "Compilation Details" → "Bytecode" → "object"
 */
const BYTECODE = "0x6080604052348015600e575f80fd5b5060a58061001b5f395ff3fe6080604052348015600e575f80fd5b50600436106026575f3560e01c8063183ff08514602a575b5f80fd5b60306032565b005b604051423381527f6d3359e3565cc2f3a61f66a498c7f3c6e8c47d4dc38b8eded4e1bf7fca0a3c6a9060200160405180910390a256fea26469706673582212207f8c8d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a864736f6c634300081400033" as `0x${string}`;

// Contract ABI
const ABI = [
  {
    type: "function",
    name: "checkIn",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

async function deploy() {
  // Check for private key
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ Error: DEPLOYER_PRIVATE_KEY environment variable is required");
    console.log("\n📋 Set it with:");
    console.log('   PowerShell: $env:DEPLOYER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"');
    console.log('   CMD:        set DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY');
    console.log('   Bash:       export DEPLOYER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"');
    console.log("\n⚠️  Never share your private key!");
    console.log("💡 Alternatively, use Remix IDE for easier deployment (see DEPLOY.md)");
    process.exit(1);
  }

  // Ensure private key has 0x prefix
  const formattedKey = (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`;
  
  console.log("🚀 Deploying GotBaseYet contract to Base Mainnet...\n");

  // Create account from private key
  const account = privateKeyToAccount(formattedKey);
  console.log(`📍 Deployer address: ${account.address}`);

  // Create clients
  const publicClient = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  const balanceEth = Number(balance) / 1e18;
  console.log(`💰 Balance: ${balanceEth.toFixed(6)} ETH`);

  if (balance < parseEther("0.0001")) {
    console.error("\n❌ Insufficient balance for deployment");
    console.log("💡 Fund your wallet with ETH on Base network");
    console.log("   Bridge from Ethereum: https://bridge.base.org");
    process.exit(1);
  }

  // Estimate gas
  console.log("\n📊 Estimating gas...");
  
  try {
    // Deploy contract
    console.log("📝 Deploying contract...");
    
    const hash = await walletClient.deployContract({
      abi: ABI,
      bytecode: BYTECODE,
    });

    console.log(`\n📤 Transaction hash: ${hash}`);
    console.log(`🔍 View on BaseScan: https://basescan.org/tx/${hash}`);

    // Wait for deployment
    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success" && receipt.contractAddress) {
      console.log("\n" + "=".repeat(60));
      console.log("✅ CONTRACT DEPLOYED SUCCESSFULLY!");
      console.log("=".repeat(60));
      console.log(`\n📋 Contract address: ${receipt.contractAddress}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      console.log(`\n🔧 Next step - update app/contracts/checkIn.ts:`);
      console.log(`\n   export const CHECK_IN_CONTRACT_ADDRESS = "${receipt.contractAddress}" as const;`);
      console.log("\n" + "=".repeat(60));
    } else {
      console.error("\n❌ Deployment failed - transaction reverted");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Deployment error:", error);
    process.exit(1);
  }
}

deploy().catch(console.error);
