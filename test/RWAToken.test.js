const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RWAToken", function () {
  const MAX = 10_000n * 10n ** 18n; // 1 万份（18 位精度）

  async function deploy() {
    const [custodian, alice, bob] = await ethers.getSigners();
    const RWAToken = await ethers.getContractFactory("RWAToken");
    const token = await RWAToken.deploy(
      "DaLingShan Shop Revenue Token", // name
      "DSRT",                          // symbol
      MAX,                             // maxSupply
      "ipfs://example/asset-report",   // assetURI
      custodian.address                // owner = 托管人
    );
    return { token, custodian, alice, bob };
  }

  it("部署参数正确", async function () {
    const { token, custodian } = await deploy();
    expect(await token.name()).to.equal("DaLingShan Shop Revenue Token");
    expect(await token.symbol()).to.equal("DSRT");
    expect(await token.maxSupply()).to.equal(MAX);
    expect(await token.owner()).to.equal(custodian.address);
  });

  it("托管人可以增发，但不能超过 maxSupply", async function () {
    const { token, alice } = await deploy();
    await token.mint(alice.address, MAX);
    expect(await token.totalSupply()).to.equal(MAX);
    await expect(token.mint(alice.address, 1n)).to.be.revertedWith("exceeds maxSupply");
    // 非托管人不能 mint
    await expect(token.connect(alice).mint(alice.address, 1n)).to.be.reverted;
  });

  it("白名单限制转账：非白名单地址收不到币", async function () {
    const { token, custodian, alice, bob } = await deploy();
    await token.mint(custodian.address, 100n);
    // alice 不在白名单，转账失败
    await expect(token.transfer(alice.address, 10n)).to.be.revertedWith("not allowlisted");
    // 加白名单后可以转；alice 收到后转给 bob（bob 不在白名单）仍然失败
    await token.setAllowlisted(alice.address, true);
    await token.transfer(alice.address, 10n);
    expect(await token.balanceOf(alice.address)).to.equal(10n);
    await expect(token.connect(alice).transfer(bob.address, 1n)).to.be.revertedWith("not allowlisted");
  });

  it("关闭限制后退化为普通 ERC20", async function () {
    const { token, custodian, alice, bob } = await deploy();
    await token.setTransfersRestricted(false);
    await token.mint(custodian.address, 100n);
    await token.transfer(alice.address, 10n);
    await token.connect(alice).transfer(bob.address, 5n);
    expect(await token.balanceOf(bob.address)).to.equal(5n);
  });

  it("赎回会销毁 token 并触发事件", async function () {
    const { token, alice } = await deploy();
    await token.setAllowlisted(alice.address, true);
    await token.mint(alice.address, 100n);
    await expect(token.connect(alice).redeem(40n))
      .to.emit(token, "Redeemed")
      .withArgs(alice.address, 40n);
    expect(await token.balanceOf(alice.address)).to.equal(60n);
    expect(await token.totalSupply()).to.equal(60n);
  });
});
