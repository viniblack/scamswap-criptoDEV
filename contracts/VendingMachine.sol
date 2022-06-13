//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract VendingMachine{
    address public owner;
    mapping(address => uint) public tokensBalances;
    mapping(address => uint) public ethersBalances;
    uint256 private salesPrice =  0.8 ether;
    uint256 private purchasePrice = 1 ether;  

    constructor(){
        owner = msg.sender;
        tokensBalances[address(this)] = 100;
        
    }

    modifier isAdmin() {
        require(msg.sender == owner , "Sender is not admin!");
        _;
    }

    /*modifier isZero() {
        require(msg.value > 0 , "The value entered must not be zero!");
        _;
    }*/

    function getBalance() public view returns (uint) {
        return tokensBalances[address(this)];
    }
    
    function newSalesPrive(uint256 _salesPrice) public isAdmin payable {
        salesPrice = _salesPrice * 0.1 ether;
    }

    function newPurchasePrice(uint256 _purchasePrice ) public isAdmin payable {
        purchasePrice  = _purchasePrice * 0.1 ether;
    }
    
    function restockEthers(uint amount) public isAdmin payable{
        require(amount > 0 , "The value entered must not be zero!");
        ethersBalances[address(this)]+= amount;
    }

     function restockTokens(uint256 amount) public isAdmin{
        require(amount > 0 , "The value entered must not be zero!");  
        tokensBalances[address(this)]+= amount;
    }

    function purchase(uint256 amount) public payable{
        require(amount > 0 , "The value entered must not be zero!");
        require(tokensBalances[address(this)] >= amount, "Not enough tokens for this value!");
        ethersBalances[address(this)] += amount * 1 ether;
        tokensBalances[address(this)] -= amount;
        tokensBalances[address(msg.sender)] += amount;
    }
}