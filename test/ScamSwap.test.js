const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Scam Swap contract', function () {
	let owner, account1, account2, accounts, token, scamSwap, adminMessage;

	beforeEach(async () => {
		[owner, account1, account2, ...accounts] = await ethers.getSigners();

		adminMessage = 'Sender is not admin!';

		const Scamcoin = await ethers.getContractFactory('Scamcoin');
		token = await Scamcoin.deploy(10000);
		await token.deployed();

		const ScamSwap = await ethers.getContractFactory('ScamSwap');
		scamSwap = await ScamSwap.deploy(token.address);
		await scamSwap.deployed();
	});

	describe('Purchase | checks', async function () {
		it('The buyer must be able to buy tokens with ethers.', async function () {
			const companyBox = 1000;
			const transferedValue = 10;
			const allowed = await token.approve(scamSwap.address, companyBox);
			await allowed.wait();

			const restock = await scamSwap.restockTokens(companyBox);
			await restock.wait();

			const transactionOne = await scamSwap.connect(account1).purchase(transferedValue, {
				value: ethers.utils.parseEther(String(transferedValue * 2)),
			});

			await transactionOne.wait();

			expect(await token.balanceOf(account1.address)).to.equal(transferedValue);
			expect(await token.balanceOf(scamSwap.address)).to.equal(companyBox - transferedValue);
		});

		it('It should not be possible to buy tokens with zero value.', async function () {
			const transferedValue = 10;
			await expect(
				scamSwap.connect(account1).purchase(transferedValue, {
					value: ethers.utils.parseEther(String(0)),
				})
			).to.revertedWith('Not enough tokens on ScamSwap to buy!');
		});

		it('It is not possible to buy zero tokens', async function () {
			const transferedValue = 0;
			await expect(
				scamSwap.connect(account1).purchase(transferedValue, {
					value: ethers.utils.parseEther(String(10)),
				})
			).to.revertedWith('The quantity of input tokens must not be zero!');
		});
	});

	describe('Sales | checks', async function () {
		it('The seller must be able to sell tokens for ethers.', async function () {
			const companyBox = 1000;
			const transferedValue = 10;
			const allowed = await token.approve(scamSwap.address, companyBox);
			await allowed.wait();

			const restock = await scamSwap.restockTokens(companyBox);
			await restock.wait();

			const purchaseTransaction = await scamSwap.connect(account1).purchase(transferedValue, {
				value: ethers.utils.parseEther(String(transferedValue * 2)),
			});

			await purchaseTransaction.wait();

			expect(await token.balanceOf(account1.address)).to.equal(transferedValue);

			const allowedOne = await token
				.connect(account1)
				.approve(scamSwap.address, transferedValue);
			await allowedOne.wait();

			const salesTransaction = await scamSwap.connect(account1).sell(transferedValue);
			salesTransaction.wait();

			expect(await token.balanceOf(account1.address)).to.equal(0);
		});

		it('It should not be possible to sell tokens with zero value.', async function () {
			const transferedValue = 0;
			await expect(scamSwap.connect(account1).sell(transferedValue)).to.revertedWith(
				'The quantity of input tokens must not be zero!'
			);
		});
	});

	describe('Restock | checks', async function () {
		it('The administrator must be able to replenish the machine with tokens and ethers.', async function () {
			const companyBox = 100;

			const allowed = await token.approve(scamSwap.address, companyBox);
			await allowed.wait();

			const restockTokensScamSwap = await scamSwap.restockTokens(companyBox);
			await restockTokensScamSwap.wait();

			const restockEthersScamSwap = await scamSwap.restockEthers({
				value: ethers.utils.parseEther(String(companyBox)),
			});
			await restockEthersScamSwap.wait();

			expect(await scamSwap.getBalanceTokens()).to.equal(companyBox);
			expect(await scamSwap.getBalanceEthers()).to.equal(companyBox);
		});

		it('It should not be possible to replenish the machine with zero-valued tokens.', async function () {
			const companyBox = 0;

			await expect(scamSwap.restockTokens(companyBox)).to.revertedWith(
				'The value entered must not be zero!'
			);
		});

		it('It should not be possible to refill the machine with ethers with a zero value.', async function () {
			const companyBox = 0;

			await expect(
				scamSwap.restockEthers({ value: ethers.utils.parseEther(String(companyBox)) })
			).to.revertedWith('The value entered must not be zero!');
		});

		it('When successfully restocking ethers, you should check if the etherReceived event was issued. ', async function () {
			const companyBox = 100;

			const restockEthersScamSwap = await scamSwap.restockEthers({
				value: ethers.utils.parseEther(String(companyBox)),
			});

			const infos = await restockEthersScamSwap.wait();

			const data = infos.logs[0].data;

			const [value] = ethers.utils.defaultAbiCoder.decode(['uint256'], data);

			const emittedValue = parseInt(ethers.utils.formatEther(String(value)));

			expect(emittedValue).to.be.equal(companyBox);
		});
	});

	describe('Withdraw functions', async function () {
		it('The admin must be able to withdraw the balance in ethers', async function () {
			const companyBox = 100;
			const beforeWithdraw = await scamSwap.getBalanceAddress(owner.address);

			const allowed = await token.approve(scamSwap.address, 1000);
			await allowed.wait();
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

			expect(await scamSwap.getBalanceAddress(owner.address)).to.be.equal(
				currentBalanceOwner
			);

			const withdraw2 = await scamSwap.withdrawEthers(owner.address, 100);
			await withdraw2.wait();

			currentBalanceOwner = Number(currentBalanceOwner) + 100;

			expect(await scamSwap.getBalanceAddress(owner.address)).to.be.equal(
				currentBalanceOwner
			);

			const withdraw3 = await scamSwap.withdrawAllEthers();
			await withdraw3.wait();

			currentBalanceOwner = Number(currentBalanceOwner) + 150;

			expect(await scamSwap.getBalanceAddress(owner.address)).to.be.equal(
				currentBalanceOwner
			);
		});
	});

	describe('PurchasePrice | checks', async function () {
		it('The administrator should be able to reset the value of the tokens for purchase.', async function () {
			const newPrice = 3;
			const previousPurchasePrice = await scamSwap.getPurchasePrice();

			const changeCotation = await scamSwap.setPurchasePrice(newPrice);
			await changeCotation.wait();

			const currentPurchasePrice = await scamSwap.getPurchasePrice();

			expect(currentPurchasePrice).to.be.equal(newPrice);
			expect(currentPurchasePrice != previousPurchasePrice).to.be.equal(true);
		});
	});

	describe('SalesPrice | checks', async function () {
		it('The administrator should be able to reset the value of the tokens for sale.', async function () {
			const newPrice = 3;
			const previousSalesPrice = await scamSwap.getSalesPrice();

			const changeCotation = await scamSwap.setSalesPrice(newPrice);
			await changeCotation.wait();

			const currentSalesPrice = await scamSwap.getSalesPrice();

			expect(currentSalesPrice).to.be.equal(newPrice);
			expect(currentSalesPrice != previousSalesPrice).to.be.equal(true);
		});
	});

	describe('Kill and HashKill | checks', async function () {
		it('You should not be able to kill with an invalid hashKill.', async function () {
			const firstHK = await scamSwap.setHashKill();
			await firstHK.wait();

			const hashKill1 = await scamSwap.getHashKill();

			const secondHK = await scamSwap.setHashKill();
			await secondHK.wait();

			const hashKill2 = await scamSwap.getHashKill();

			const lastHK = await scamSwap.setHashKill();
			await lastHK.wait();

			expect(await scamSwap.getHashKill()).not.be.equal(hashKill1);
			expect(await scamSwap.getHashKill()).not.be.equal(hashKill2);
			expect(await scamSwap.getHashKill()).not.be.equal(0);
		});
	});

	describe('IsAdmin | checks', async function () {
		it('Only admin can change the sales price.', async function () {
			await expect(scamSwap.connect(account1).setSalesPrice(10)).to.be.revertedWith(
				adminMessage
			);

			await expect(scamSwap.connect(account2).setSalesPrice(10)).to.be.revertedWith(
				adminMessage
			);

			await expect(scamSwap.connect(accounts[0]).setSalesPrice(10)).to.be.revertedWith(
				adminMessage
			);
		});

		it('Only admin can change the purchase price.', async function () {
			await expect(scamSwap.connect(account1).setPurchasePrice(10)).to.be.revertedWith(
				adminMessage
			);

			await expect(scamSwap.connect(account2).setPurchasePrice(10)).to.be.revertedWith(
				adminMessage
			);

			await expect(scamSwap.connect(accounts[0]).setPurchasePrice(10)).to.be.revertedWith(
				adminMessage
			);
		});

		it('Only admin can change the purchase price.', async function () {
			await expect(scamSwap.connect(account1).setPurchasePrice(10)).to.be.revertedWith(
				adminMessage
			);

			await expect(scamSwap.connect(account2).setPurchasePrice(10)).to.be.revertedWith(
				adminMessage
			);

			await expect(scamSwap.connect(accounts[0]).setPurchasePrice(10)).to.be.revertedWith(
				adminMessage
			);
		});
		it('Only admin can refill ScamSwap with ethers', async function () {
			await expect(
				scamSwap.connect(account1).restockEthers({ value: ethers.utils.parseEther('1') })
			).to.be.revertedWith(adminMessage);
	
			await expect(
				scamSwap.connect(account2).restockEthers({ value: ethers.utils.parseEther('1') })
			).to.be.revertedWith(adminMessage);
	
			await expect(
				scamSwap.connect(accounts[0]).restockEthers({ value: ethers.utils.parseEther('1') })
			).to.be.revertedWith(adminMessage);
		});
	
		it('Only admin can refill ScamSwap with tokens', async function () {
			await expect(scamSwap.connect(account1).restockTokens(10)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(account2).restockTokens(10)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(accounts[0]).restockTokens(10)).to.be.revertedWith(adminMessage);
		});
	
		it('Only admin can withdraw funds from ScamSwap', async function () {
			await expect(scamSwap.connect(account1).withdrawEthers(account1.address,10)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(account2).withdrawEthers(account2.address,10)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(accounts[0]).withdrawEthers(accounts[0].address,10)).to.be.revertedWith(adminMessage);

			await expect(scamSwap.connect(accounts[0]).withdrawAllEthers()).to.be.revertedWith(adminMessage);
		});

		it('Only admin can withdraw funds from ScamSwap', async function () {
			await expect(scamSwap.connect(account1).withdrawEthers(account1.address,10)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(account2).withdrawEthers(account2.address,10)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(accounts[0]).withdrawEthers(accounts[0].address,10)).to.be.revertedWith(adminMessage);

			await expect(scamSwap.connect(accounts[0]).withdrawAllEthers()).to.be.revertedWith(adminMessage);
		});

		it('Only admin can generate a hashKill', async function () {
			await expect(scamSwap.connect(account1).setHashKill()).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(account2).setHashKill()).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(accounts[0]).setHashKill()).to.be.revertedWith(adminMessage);

		});

		it('Only admin can kill the contract', async function () {

			await expect(scamSwap.connect(account1).kill(1)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(account2).kill(1)).to.be.revertedWith(adminMessage);
	
			await expect(scamSwap.connect(accounts[0]).kill(1)).to.be.revertedWith(adminMessage);

		});
	});
});
