const { expect } = require('chai');
const { ethers } = require('hardhat');

// O administrador deve ser capaz de reabastecer a maquina com tokens e ethers.
// O adminsitrador deve ser capaz de sacar o saldo em ethers
// O administrador deve ser capaz de redefinir o valor dos tokens para compra.
// O administrador deve ser capaz de redefinir o valor dos tokens para venda.
// Não deve ser possivel comprar tokens com valor zero.
// Não deve ser possivel vender tokens com valor zero.
// Não deve ser possivel reabastecer a maquina com tokens com valor zero.
// Não deve ser possivel reabastecer a maquina com ethers com valor zero.

describe('Scam Swap contract', function () {
	let owner, account1, account2, accounts, token, scamSwap;

	beforeEach(async () => {
		[owner, account1, account2, ...accounts] = await ethers.getSigners();

		const ScamCoin = await ethers.getContractFactory('ScamCoin');
		token = await ScamCoin.deploy(10000);
		await token.deployed();

		const ScamSwap = await ethers.getContractFactory('ScamSwap');
		scamSwap = await ScamSwap.deploy(token.address)
		await scamSwap.deployed();

    
	});

	it('The buyer must be able to buy tokens with ethers.', async function () {
		const companyBox = 1000;
		const transferedValue = 10;
		const restock = await scamSwap.restockTokens(companyBox);
		await restock.wait();

		const transactionOne = await scamSwap.connect(account1).purchase(transferedValue, {value: ethers.utils.parseEther(String(transferedValue * 2))});
     
		await transactionOne.wait();

		expect(await token.balanceOf(account1.address)).to.equal(transferedValue);
		expect(await token.balanceOf(scamSwap.address)).to.equal(companyBox - transferedValue);

	});

  it('The seller must be able to sell tokens for ethers.', async function () {
		const companyBox = 1000;
		const transferedValue = 10;
		const restock = await scamSwap.restockTokens(companyBox);
		await restock.wait();

		const purchaseTransaction = await scamSwap.connect(account1).purchase(transferedValue, {value: ethers.utils.parseEther(String(transferedValue * 2))});
     
		await purchaseTransaction.wait();

    
    expect(await token.balanceOf(account1.address)).to.equal(transferedValue);

    const salesTransaction = await scamSwap.connect(account1).sales(transferedValue);
    salesTransaction.wait();

    expect(await token.balanceOf(account1.address)).to.equal(0);

	});

  it('The administrator must be able to replenish the machine with tokens and ethers.', async function () {
		const companyBox = 100;
    
		const restockTokensScamSwap = await scamSwap.restockTokens(companyBox);
		await restockTokensScamSwap.wait();


    const restockEthersScamSwap = await scamSwap.restockEthers({value: ethers.utils.parseEther(String(companyBox))});
		await restockEthersScamSwap.wait();


    expect(await scamSwap.getBalanceTokens()).to.equal(companyBox);
		expect(await scamSwap.getBalanceEthers()).to.equal(companyBox);
	});

	// it("checking if the total supply is incorrect and checking if the balance of an address is incorrect", async function() {

	//   const expectedValue = 1000

	//   expect(await token.totalSupply() == expectedValue).to.equal(false)
	//   expect(await token.balanceOf(owner.address) == expectedValue).to.equal(false)
	// })

	// it("checking the transfer, if you are subtracting the value of the sent and adding the receiver", async function() {

	//   const currentBalanceOwner = await token.balanceOf(owner.address)
	//   const currentBalanceReceiver = await token.balanceOf(account1.address)

	//   const amountSent = 1000

	//   const transferTx = await token.transfer(account1.address, amountSent)
	//   await transferTx.wait()

	//   const modifiedBalanceOwner = await token.balanceOf(owner.address)
	//   const modifiedBalanceReceiver = await token.balanceOf(account1.address)

	//   expect(parseInt(currentBalanceOwner) - amountSent).to.equal(modifiedBalanceOwner)
	//   expect(parseInt(currentBalanceReceiver) + amountSent).to.equal(modifiedBalanceReceiver)
	// })

	// it("checking multiple outgoing balance transfers", async function() {
	//   const currentBalanceOwner = await token.balanceOf(owner.address)

	//   const amountSent = [1000, 500, 1500]

	//   const transfers = [
	//     await token.transfer(account1.address, amountSent[0]),
	//     await token.transfer(account2.address, amountSent[1]),
	//     await token.transfer(account3.address, amountSent[2])
	//   ]

	//   for(let i = 0; i < transfers.length; i++) {
	//     let transferTx = transfers[i]
	//     transferTx.wait()
	//   }

	//   const modifiedBalanceOwner = await token.balanceOf(owner.address)

	//   const totalAmountSent = amountSent.reduce((soma, i) => parseInt(soma) + parseInt(i))

	//   expect(parseInt(currentBalanceOwner) - totalAmountSent).to.equal(modifiedBalanceOwner)
	// })

	// it("checking multiple balance gain transfers", async function() {

	//   const amountSent = 3000

	//   const transfersOwner = [
	//     await token.transfer(account1.address, amountSent),
	//     await token.transfer(account2.address, amountSent),
	//     await token.transfer(account3.address, amountSent)
	//   ]

	//   for(let i = 0; i < transfersOwner.length; i++) {
	//     let transferOwner = transfersOwner[i]
	//     transferOwner.wait()
	//   }

	//   const currentBalanceOwner = await token.balanceOf(owner.address)

	//   const transfers = [
	//     await token.connect(account1).transfer(owner.address, amountSent),
	//     await token.connect(account2).transfer(owner.address, amountSent),
	//     await token.connect(account3).transfer(owner.address, amountSent)
	//   ]

	//   for(let i = 0; i < transfersOwner.length; i++) {
	//     let transferTx = transfers[i]
	//     transferTx.wait()
	//   }

	//   const modifiedBalanceOwner = await token.balanceOf(owner.address)

	//   expect(parseInt(currentBalanceOwner) + (amountSent * 3)).to.equal(modifiedBalanceOwner)
	// })

	// it("checking a transaction with insufficient balance", async function() {
	//   await expect(token.transfer(account1.address, 21000001)).to.be.revertedWith('Insufficient Balance to Transfer')
	// })

	// it("checking the current state", async function() {
	//   const expectedState = 1

	//   expect(await token.state()).to.equal(expectedState)
	// })

	// it("checking if the state is changing", async function() {

	//   const currentState = await token.state()

	//   const setState = await token.setState(0)
	//   await setState.wait()

	//   const modifiedState = await token.state()

	//   expect(currentState != modifiedState).to.equal(true)
	// })

	// it("checking overflows when changing state", async function () {
	//   await expect(token.setState(3)).to.be.revertedWith("Invalid status")
	//   await expect(token.setState(1)).to.be.revertedWith("The status is already ACTIVE")

	//   await token.setState(0)
	//   await expect(token.setState(0)).to.be.revertedWith("The status is already PAUSED")

	// })

	// it("checking if you are adding tokens and checking if the owner is getting the mint value", async function () {
	//   const currentTotalSupply = await token.totalSupply()
	//   const currentBalanceOwner = await token.balanceOf(owner.address)

	//   const amount = 1000

	//   const mint = await token.mint(amount)
	//   await mint.wait()

	//   const modifiedTotalSupply = await token.totalSupply()
	//   const modifiedBalanceOwner = await token.balanceOf(owner.address)

	//   expect(parseInt(currentTotalSupply) + amount).to.equal(modifiedTotalSupply)
	//   expect(parseInt(currentBalanceOwner) + amount).to.equal(modifiedBalanceOwner)
	// })

	// it("checking if it is burning token the total supply and the owner's address", async function() {
	//   const currentTotalSupply = await token.totalSupply()
	//   const currentBalanceOwner = await token.balanceOf(owner.address)

	//   const amount = 1000

	//   const burn = await token.burn(amount)
	//   await burn.wait()

	//   const modifiedTotalSupply = await token.totalSupply()
	//   const modifiedBalanceOwner = await token.balanceOf(owner.address)

	//   expect(parseInt(currentTotalSupply) - amount).to.equal(modifiedTotalSupply)
	//   expect(parseInt(currentBalanceOwner) - amount).to.equal(modifiedBalanceOwner)
	// })

	// it("checking if it's killing the contract", async function() {

	//   const kill = await token.kill()
	//   await kill.wait()

	//   const confirmation = kill.confirmations

	//   expect(confirmation == 1).to.equal(true)
	// })

	// it("checking owner permissions", async function() {
	//   expect(token.connect(account1).mint(1000)).to.be.revertedWith("Sender is not owner!")
	//   expect(token.connect(account1).burn(1000)).to.be.revertedWith("Sender is not owner!")
	//   expect(token.connect(account1).kill()).to.be.revertedWith("Sender is not owner!")
	//   expect(token.connect(account1).setState(2)).to.be.revertedWith("Sender is not owner!")
	// })

	// it("checking if status is active", async function () {
	//   await token.setState(0)

	//   await expect(token.transfer(account1.address, 1000)).to.be.revertedWith("Contract is not Active!")
	//   await expect(token.mint(1000)).to.be.revertedWith("Contract is not Active!")
	//   await expect(token.burn(1000)).to.be.revertedWith("Contract is not Active!")

	// })
});
