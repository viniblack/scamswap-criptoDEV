const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScamCoin contract", function () {
  let owner, account1, account2, account3;
  let CryptoToken, token;

  beforeEach(async () => {
    [owner, account1, account2, account3] = await ethers.getSigners()

    CryptoToken = await ethers.getContractFactory("ScamCoin")
    token = await CryptoToken.deploy(10000)
    await token.deployed()
  })

  it("checking if the total supply is correct and checking if the balance of an address is correct", async function() {
    const expectedValue = 10000

    expect(await token.totalSupply()).to.equal(expectedValue)
    expect(await token.balanceOf(owner.address)).to.equal(expectedValue)
  })

  it("checking if the total supply is incorrect and checking if the balance of an address is incorrect", async function() {

    const expectedValue = 1000

    expect(await token.totalSupply() == expectedValue).to.equal(false)
    expect(await token.balanceOf(owner.address) == expectedValue).to.equal(false)
  })

  it("checking the transfer, if you are subtracting the value of the sent and adding the receiver", async function() {

    const currentBalanceOwner = await token.balanceOf(owner.address)
    const currentBalanceReceiver = await token.balanceOf(account1.address)

    const amountSent = 1000

    const transferTx = await token.transfer(account1.address, amountSent)
    await transferTx.wait()

    const modifiedBalanceOwner = await token.balanceOf(owner.address)
    const modifiedBalanceReceiver = await token.balanceOf(account1.address)

    expect(parseInt(currentBalanceOwner) - amountSent).to.equal(modifiedBalanceOwner)
    expect(parseInt(currentBalanceReceiver) + amountSent).to.equal(modifiedBalanceReceiver)
  })

  it("checking multiple outgoing balance transfers", async function() {
    const currentBalanceOwner = await token.balanceOf(owner.address)

    const amountSent = [1000, 500, 1500]

    const transfers = [
      await token.transfer(account1.address, amountSent[0]),
      await token.transfer(account2.address, amountSent[1]),
      await token.transfer(account3.address, amountSent[2])
    ]

    for(let i = 0; i < transfers.length; i++) {
      let transferTx = transfers[i]
      transferTx.wait()
    }

    const modifiedBalanceOwner = await token.balanceOf(owner.address)

    const totalAmountSent = amountSent.reduce((previousValue, currentValue) => parseInt(previousValue) + parseInt(currentValue))

    expect(parseInt(currentBalanceOwner) - totalAmountSent).to.equal(modifiedBalanceOwner)
  })

  it("checking multiple balance gain transfers", async function() {

    const amountSent = 3000

    const transfersOwner = [
      await token.transfer(account1.address, amountSent),
      await token.transfer(account2.address, amountSent),
      await token.transfer(account3.address, amountSent)
    ]

    for(let i = 0; i < transfersOwner.length; i++) {
      let transferOwner = transfersOwner[i]
      transferOwner.wait() 
    }

    const currentBalanceOwner = await token.balanceOf(owner.address)

    const transfers = [
      await token.connect(account1).transfer(owner.address, amountSent),
      await token.connect(account2).transfer(owner.address, amountSent),
      await token.connect(account3).transfer(owner.address, amountSent)
    ]

    for(let i = 0; i < transfersOwner.length; i++) {
      let transferTx = transfers[i]
      transferTx.wait() 
    }

    const modifiedBalanceOwner = await token.balanceOf(owner.address)

    expect(parseInt(currentBalanceOwner) + (amountSent * 3)).to.equal(modifiedBalanceOwner)
  })

  it("checking a transaction if the tranfer value is more than 0", async function() {

    await expect(token.transferFrom(account1.address, account2.address, 0)).to.be.revertedWith("Tranfer value invalid.")
  
  })

  it("checking a transaction if there is insufficient balance to transfer", async function() {

    amountSent = 100
    amountSentFrom = 101

    await token.transfer(account1.address, amountSent)

    await expect(token.transferFrom(account1.address, account2.address, amountSentFrom)).to.be.revertedWith("Insufficient Balance to Transfer")
  
  })

  it("checking a transaction with insufficient balance", async function() {
    await expect(token.transfer(account1.address, 999999)).to.be.revertedWith('Insufficient Balance to Transfer')
  })

  it("checking if the contract is active", async function() {
    const expectedState = 1

    expect(await token.state()).to.equal(expectedState)
  })

  it("checking if the state is changing", async function() {

    const currentState = await token.state()

    const setState = await token.setState(0)
    await setState.wait()

    const modifiedState = await token.state()

    expect(currentState != modifiedState).to.equal(true)
  })

  it("checking overflows when changing state", async function () {
    await expect(token.setState(2)).to.be.revertedWith("Invalid status")
    await expect(token.setState(1)).to.be.revertedWith("The status is already ACTIVE")

    await token.setState(0)
    await expect(token.setState(0)).to.be.revertedWith("The status is already PAUSED")

  })

  it("checking if you are adding tokens and checking if the owner is getting the mint value", async function () {
    const currentTotalSupply = await token.totalSupply()
    const currentBalanceOwner = await token.balanceOf(owner.address)

    const amount = 1000

    const mint = await token.mint(amount)
    await mint.wait()

    const modifiedTotalSupply = await token.totalSupply()
    const modifiedBalanceOwner = await token.balanceOf(owner.address)

    expect(parseInt(currentTotalSupply) + amount).to.equal(modifiedTotalSupply)
    expect(parseInt(currentBalanceOwner) + amount).to.equal(modifiedBalanceOwner)
  })

  it("checking if the mint value is zero", async function () {

    await expect(token.mint(0)).to.be.revertedWith("Invalid mint value.")
  })

  it("checking if it is burning token the total supply and the owner's address", async function() {
    const currentTotalSupply = await token.totalSupply()
    const currentBalanceOwner = await token.balanceOf(owner.address)

    const amount = 1000

    const burn = await token.burn(amount)
    await burn.wait()

    const modifiedTotalSupply = await token.totalSupply()
    const modifiedBalanceOwner = await token.balanceOf(owner.address)

    expect(parseInt(currentTotalSupply) - amount).to.equal(modifiedTotalSupply)
    expect(parseInt(currentBalanceOwner) - amount).to.equal(modifiedBalanceOwner)
  })

  it("checking if the burning value is zero", async function () {

    await expect(token.burn(0)).to.be.revertedWith("Invalid burn value.")
  })

  // TODO: Perguntar ao JC se é necessario a verificação da carteira do owner ou somente do totalsuply.
  it("checking if the burning value exceeds the total amount", async function () {

    await expect(token.burn(99999)).to.be.revertedWith("The amount exceeds your balance.")
  })

  it("checking if the burning value exceeds the owner's balance", async function () {
    await token.transfer(account1.address, 100)

    let amountBurn = 10000

    await expect(token.burn(amountBurn)).to.be.revertedWith("The value exceeds the owner's available amount")
  })

  it("checking if it's killing the contract", async function() {

    const kill = await token.kill()
    await kill.wait()

    const confirmation = kill.confirmations

    expect(confirmation == 1).to.equal(true)
  })

  it("checking owner permissions", async function() {
    expect(token.connect(account1).mint(1000)).to.be.revertedWith("Sender is not owner!")
    expect(token.connect(account1).burn(1000)).to.be.revertedWith("Sender is not owner!")
    expect(token.connect(account1).kill()).to.be.revertedWith("Sender is not owner!")
    expect(token.connect(account1).setState(1)).to.be.revertedWith("Sender is not owner!",)
  })

  it("checking if status is active", async function () {
    await token.setState(0)

    await expect(token.transfer(account1.address, 1000)).to.be.revertedWith("Contract is not Active!")
    await expect(token.mint(1000)).to.be.revertedWith("Contract is not Active!")
    await expect(token.burn(1000)).to.be.revertedWith("Contract is not Active!")
  })

});