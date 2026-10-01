// 部署脚本：npx hardhat run scripts/deploy.js [--network sepolia]
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  const RWAToken = await ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy(
    "DaLingShan Shop Revenue Token",
    "DSRT",
    10_000n * 10n ** 18n,          // maxSupply: 1 万份
    "ipfs://example/asset-report", // assetURI: 换成真实资产档案链接
    deployer.address               // 托管人 = 部署者
  );
  await token.waitForDeployment();
  console.log("RWAToken 部署地址:", await token.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
