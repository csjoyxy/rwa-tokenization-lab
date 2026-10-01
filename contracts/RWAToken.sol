// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAToken
 * @notice 把一份"现实世界资产收益权"代币化的教学实验合约。
 *
 * 现实映射（RWA 的核心就是"链下资产 ↔ 链上凭证"的一一对应）:
 *  - 1 token = 对应资产的 1 份收益权，具体是哪份资产看 assetURI（评估报告/托管证明）
 *  - 托管人 (owner) 在链下真实持有资产，按托管规模增发 token，总量有 maxSupply 硬顶
 *  - 白名单模拟合规:现实中证券类代币只能在合格投资人之间流转，这里用 allowlist 演示
 *  - 赎回:持有人销毁 token，托管人在链下按份结算（合约只记账，钱在链下）
 *
 * 这是实验合约，不要拿它发真资产、不要收真钱。
 */
contract RWAToken is ERC20, Ownable {
    /// @notice 代币总量硬顶（对应托管资产可拆出的最大份数）
    uint256 public immutable maxSupply;

    /// @notice 链下资产档案链接（评估报告、托管证明、审计文件……）
    string public assetURI;

    /// @notice KYC 白名单（演示合规流转用）
    mapping(address => bool) public allowlisted;

    /// @notice 为 true 时只有白名单地址能收/转 token；false 则退化为普通 ERC20
    bool public transfersRestricted = true;

    event AssetURIUpdated(string newURI);
    event Redeemed(address indexed holder, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory assetURI_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        require(maxSupply_ > 0, "maxSupply must be > 0");
        maxSupply = maxSupply_;
        assetURI = assetURI_;
        // 托管人自己默认进白名单，方便起步
        allowlisted[owner_] = true;
    }

    // ---- 托管人（链下资产方）操作 ----

    /// @notice 增发：链下每多托管一份资产，才能多 mint 一份 token
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "exceeds maxSupply");
        _mint(to, amount);
    }

    /// @notice 维护白名单（模拟 KYC 准入/清退）
    function setAllowlisted(address account, bool allowed) external onlyOwner {
        allowlisted[account] = allowed;
    }

    /// @notice 开关合规流转限制
    function setTransfersRestricted(bool restricted) external onlyOwner {
        transfersRestricted = restricted;
    }

    /// @notice 更新链下资产档案链接
    function updateAssetURI(string calldata newURI) external onlyOwner {
        assetURI = newURI;
        emit AssetURIUpdated(newURI);
    }

    // ---- 持有人操作 ----

    /// @notice 赎回：销毁 token，触发链下结算（示例：托管人按份回购）
    function redeem(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Redeemed(msg.sender, amount);
    }

    // ---- 合规钩子：转账时检查白名单 ----
    function _update(address from, address to, uint256 value) internal override {
        if (transfersRestricted) {
            // mint（from == 0）和 burn（to == 0）不受白名单限制
            if (from != address(0) && to != address(0)) {
                require(allowlisted[from] && allowlisted[to], "not allowlisted");
            }
        }
        super._update(from, to, value);
    }
}
