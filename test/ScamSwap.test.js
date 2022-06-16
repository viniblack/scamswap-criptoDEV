const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Scam Swap contract', function () {
	let owner, account1, account2, accounts, token, scamSwap;

	beforeEach(async () => {
		[owner, account1, account2, ...accounts] = await ethers.getSigners();

		const ScamCoin = await ethers.getContractFactory('ScamCoin');
		token = await ScamCoin.deploy(10000);
		await token.deployed();

		const ScamSwap = await ethers.getContractFactory('ScamSwap');
		scamSwap = await ScamSwap.deploy(token.address);
		await scamSwap.deployed();
	});

	it('The buyer must be able to buy tokens with ethers.', async function () {
		const companyBox = 1000;
		const transferedValue = 10;
		const restock = await scamSwap.restockTokens(companyBox);
		await restock.wait();

		const transactionOne = await scamSwap.connect(account1).purchase(transferedValue, {
			value: ethers.utils.parseEther(String(transferedValue * 2)),
		});

		await transactionOne.wait();

		expect(await token.balanceOf(account1.address)).to.equal(transferedValue);
		expect(await token.balanceOf(scamSwap.address)).to.equal(companyBox - transferedValue);
	});

	it('The seller must be able to sell tokens for ethers.', async function () {
		const companyBox = 1000;
		const transferedValue = 10;
		const restock = await scamSwap.restockTokens(companyBox);
		await restock.wait();

		const purchaseTransaction = await scamSwap.connect(account1).purchase(transferedValue, {
			value: ethers.utils.parseEther(String(transferedValue * 2)),
		});

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

		const restockEthersScamSwap = await scamSwap.restockEthers({
			value: ethers.utils.parseEther(String(companyBox)),
		});
		await restockEthersScamSwap.wait();

		expect(await scamSwap.getBalanceTokens()).to.equal(companyBox);
		expect(await scamSwap.getBalanceEthers()).to.equal(companyBox);
	});

	it('The admin must be able to withdraw the balance in ethers', async function () {
		const companyBox = 100;
		const beforeWithdraw = await scamSwap.getBalanceAddress(owner.address);
		const restock = await scamSwap.restockTokens(1000);
		await restock.wait();

		const purchaseTransaction1 = await scamSwap
			.connect(account1)
			.purchase(companyBox / 2, { value: ethers.utils.parseEther(String(companyBox)) });
		await purchaseTransaction1.wait();

		const purchaseTransaction2 = await scamSwap
			.connect(account2)
			.purchase(companyBox / 2, { value: ethers.utils.parseEther(String(companyBox)) });
		await purchaseTransaction2.wait();

		const purchaseTransaction3 = await scamSwap
			.connect(accounts[0])
			.purchase(companyBox / 2, { value: ethers.utils.parseEther(String(companyBox)) });
		await purchaseTransaction3.wait();

		const withdraw1 = await scamSwap.withdrawEthers(owner.address, 50);
		await withdraw1.wait();

		let currentBalanceOwner = Number(beforeWithdraw) + 50;

		expect(await scamSwap.getBalanceAddress(owner.address)).to.be.equal(currentBalanceOwner);

		const withdraw2 = await scamSwap.withdrawEthers(owner.address, 100);
		await withdraw2.wait();

		currentBalanceOwner = Number(currentBalanceOwner) + 100;

		expect(await scamSwap.getBalanceAddress(owner.address)).to.be.equal(currentBalanceOwner);

		const withdraw3 = await scamSwap.withdrawAllEthers();
		await withdraw3.wait();

		currentBalanceOwner = Number(currentBalanceOwner) + 150;

		expect(await scamSwap.getBalanceAddress(owner.address)).to.be.equal(currentBalanceOwner);
	});

	it('The administrator should be able to reset the value of the tokens for purchase.', async function () {
		const newPrice = 3;
		const previousPurchasePrice = await scamSwap.getPurchasePrice();

		const changeCotation = await scamSwap.setPurchasePrice(newPrice);
		await changeCotation.wait();

		const currentPurchasePrice = await scamSwap.getPurchasePrice();

		expect(currentPurchasePrice).to.be.equal(newPrice);
		expect(currentPurchasePrice != previousPurchasePrice).to.be.equal(true);
	});

	it('The administrator should be able to reset the value of the tokens for sale.', async function () {
		const newPrice = 3;
		const previousSalesPrice = await scamSwap.getSalesPrice();

		const changeCotation = await scamSwap.setSalesPrice(newPrice);
		await changeCotation.wait();

		const currentSalesPrice = await scamSwap.getSalesPrice();

		expect(currentSalesPrice).to.be.equal(newPrice);
		expect(currentSalesPrice != previousSalesPrice).to.be.equal(true);
	});

	it('It should not be possible to buy tokens with zero value.', async function () {
		const transferedValue = 10;
		await expect(
			scamSwap.connect(account1).purchase(transferedValue, {
				value: ethers.utils.parseEther(String(0)),
			})
		).to.revertedWith('The value entered must not be zero!');
	});

	it('It is not possible to buy zero tokens', async function () {
		const transferedValue = 0;
		await expect(
			scamSwap.connect(account1).purchase(transferedValue, {
				value: ethers.utils.parseEther(String(10)),
			})
		).to.revertedWith('The quantity of input tokens must not be zero!');
	});

	it('It should not be possible to sell tokens with zero value.', async function () {
		const transferedValue = 0;
		await expect(scamSwap.connect(account1).sales(transferedValue)).to.revertedWith(
			'The quantity of input tokens must not be zero!'
		);
	});

	it('It should not be possible to replenish the machine with zero-valued tokens.', async function () {
		const companyBox = 0;

    await expect( scamSwap.restockTokens(companyBox)).to.revertedWith("The value entered must not be zero!")
	});

	// Não deve ser possivel reabastecer a maquina com tokens com valor zero.
	// Não deve ser possivel reabastecer a maquina com ethers com valor zero.
});
