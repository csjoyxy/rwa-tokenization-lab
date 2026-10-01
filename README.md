[English](README_EN.md) | 中文

# RWA 代币化实验项目（RWAToken）

把一份"现实世界资产收益权"搬上链的最小实验：**一份 ERC-20 合约 + 全套测试 + 测试网部署脚本**。

## 现实映射（RWA 到底在解决什么）

| 现实世界 | 合约里的对应物 |
|---|---|
| 一间商铺 / 一批设备 / 一笔应收账款 | `assetURI` 指向的资产档案（评估报告、托管证明） |
| 资产拆成 N 份收益权 | `maxSupply` = N，1 token = 1 份 |
| 托管机构持有实物资产 | `owner`（托管人），只有它能 `mint` |
| 合格投资人才能买卖 | `allowlisted` 白名单 + `transfersRestricted` 开关 |
| 投资人退出、拿回钱 | `redeem()` 销毁 token，链下结算 |

一句话：**合约是账本，资产在链下，托管人是连接两者的信任锚**。这也是所有 RWA 项目绕不开的三件套。

## 合约速览（contracts/RWAToken.sol）

- 基于 OpenZeppelin ERC-20 + Ownable，Solidity 0.8.20
- `mint(to, amount)`：仅托管人可调用，且 `totalSupply + amount <= maxSupply`
- 白名单合规：在 `_update` 钩子中拦截非白名单地址之间的转账（mint/burn 不受限）
- `setTransfersRestricted(false)`：关闭限制后退化为普通 ERC-20
- `redeem(amount)`：持有人销毁 token 并触发 `Redeemed` 事件，托管人链下结算

## 快速开始

```bash
npm install
npx hardhat compile
npx hardhat test        # 5 个测试，覆盖增发上限 / 白名单 / 赎回
```

## 部署到 Sepolia 测试网

1. 复制 `.env.example` 为 `.env`，填入：
   - `SEPOLIA_RPC_URL`：Alchemy / Infura 的 Sepolia endpoint（免费）
   - `DEPLOYER_PRIVATE_KEY`：**专门新建的测试钱包私钥，里面只放测试币**
2. 领测试 ETH：[sepoliafaucet.com](https://sepoliafaucet.com)
3. 部署：`npx hardhat run scripts/deploy.js --network sepolia`

## 安全红线

- 这是**教学实验合约**，不要用它发真实资产、不要收真钱。
- 私钥只进 `.env`（已在 `.gitignore`），**绝不提交到仓库、绝不发到聊天里**。
- 主网部署前必须经过专业审计——本仓库不做任何安全承诺。

## 下一步可以玩的方向

- 把 `assetURI` 换成真实的 IPFS 资产档案，做"档案上链"演示
- 加一个极简前端（ethers.js）：连接钱包 → 查余额 → 一键赎回
- 研究 ERC-3643（合规证券代币标准），对比本合约的白名单方案
- 写一个链下"托管人服务"脚本：监听 `Redeemed` 事件，自动记账

## License

MIT
