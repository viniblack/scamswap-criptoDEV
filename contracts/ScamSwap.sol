import "./Scamcoin.sol";
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract ScamSwap{
    address payable private admin;
    uint256 private salesPrice =  1 ether;
    uint256 private purchasePrice = 2 ether; 
    address public tokenAddress;
    uint private hashKill;

    constructor(address token){
        admin = payable(msg.sender);
        tokenAddress = token;
        setHashKill();
    }

    event Received(address, uint);
    event ethersReceived(uint256);

    modifier isAdmin() {
        require(msg.sender == admin , "Sender is not admin!");
        _;
    }

    function getBalanceTokens() public view returns (uint256) {
        return Scamcoin(tokenAddress).balanceOf(address(this));
    }

    function getBalanceTokensForAddress(address _address) public view returns (uint256) {
        return Scamcoin(tokenAddress).balanceOf(_address);
    }

    function getBalanceEthers() public view returns (uint256) {
         return address(this).balance / 1 ether;
    }

     function getSalesPrice() public view returns (uint256) {
        return salesPrice / 1 ether;
    }

     function getPurchasePrice() public view returns (uint256) {
        return purchasePrice / 1 ether;
    }

    function getBalanceAddress(address _address) public view returns (uint256) {
        return address(_address).balance / 1 ether;
    }
    
    function setSalesPrice(uint256 _salesPrice) public isAdmin{
        salesPrice = _salesPrice * 1 ether;
    }

    function setPurchasePrice(uint256 _purchasePrice ) public isAdmin{
        purchasePrice  = _purchasePrice * 1 ether;
    }
    
    function restockEthers() public isAdmin payable{
        require(msg.value > 0 , "The value entered must not be zero!");
        emit ethersReceived(msg.value);
        //todo colocar evento
    }
   
    function restockTokens(uint256 amountTokens) public isAdmin{
        require(amountTokens > 0 , "The value entered must not be zero!"); 
        require(getBalanceTokensForAddress(msg.sender) >= amountTokens , "You don't have enough tokens to restock ScamSwap!");  
        Scamcoin(tokenAddress).transferFrom(msg.sender, address(this), amountTokens);
    }

    function sell(uint256 amountTokens) public payable{
        require(amountTokens > 0 , "The quantity of input tokens must not be zero!");
        require(getBalanceTokensForAddress(msg.sender) > 0, "User wallet has no tokens!");
        require(getBalanceTokensForAddress(msg.sender) >= amountTokens, "There are not enough tokens in the wallet for the sale!");
        require(address(this).balance >= amountTokens * salesPrice, "Insufficient ethers balance at ScamSwap");     
        Scamcoin(tokenAddress).transferFrom(msg.sender, address(this), amountTokens);
        payable(msg.sender).transfer(amountTokens * salesPrice);
        //todo colocar evento
    } 
       
    function buy(uint256 amountTokens) public payable{
        require(amountTokens > 0 , "The quantity of input tokens must not be zero!");
        
        require(getBalanceTokensForAddress(address(this)) >= amountTokens, "Not enough tokens on ScamSwap to buy!");
        require(msg.value >= amountTokens * purchasePrice, "Amount sent insufficient to purchase tokens");
        Scamcoin(tokenAddress).transfer( msg.sender, amountTokens);
        //Devolve o troco se o usuário, se enviou um valor maior do que deveria seer pago!
        if(msg.value > (amountTokens * purchasePrice)){
           uint256  payback = msg.value - (amountTokens * purchasePrice);
           payable(msg.sender).transfer(payback);
        }    
         //todo colocar evento
    } 

    function withdrawEthers(address addressReceive, uint256 amountEthers) public isAdmin payable{
        require(amountEthers > 0 , "You cannot withdraw zero value!");
        require(address(this).balance > 0, "The ScamSwap's wallet has no ethers!");
        require(address(this).balance >= amountEthers * 1 ether, "The ScamSwap wallet does not have the required amount of ethers for withdrawal!");
        payable(addressReceive).transfer(amountEthers * 1 ether);
        //todo colocar evento
    }

    function withdrawAllEthers() public isAdmin payable{
        require(address(this).balance > 0, "The ScamSwap wallet has no ethers!");
        payable(msg.sender).transfer(address(this).balance);
        //todo colocar evento
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function setHashKill() public isAdmin{
        hashKill = uint(keccak256(abi.encodePacked(admin, block.timestamp)));
    }

    function getHashKill() public view isAdmin returns (uint) {
        return hashKill;
    }

    function kill(uint _hashKill) public isAdmin {
        require(hashKill == _hashKill, "O hashKill esta errado, por favor gere um novo!");
        withdrawAllEthers();
        selfdestruct(payable(admin));
    } 
}


