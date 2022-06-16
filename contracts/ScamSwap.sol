import "./ScamCoin.sol";
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract ScamSwap{
    address payable public admin;
    uint256 private salesPrice =  1 ether;
    uint256 private purchasePrice = 2 ether; 
    address public tokenAddress;

    constructor(address token){
        admin = payable(msg.sender);
        tokenAddress = token;
    }

    event Received(address, uint);

    modifier isAdmin() {
        require(msg.sender == admin , "Sender is not admin!");
        _;
    }

    function getBalanceTokens() public view returns (uint256) {
        return ScamCoin(tokenAddress).balanceOf(address(this));
    }

    function getBalanceTokensForAddress(address _address) public view returns (uint256) {
        return ScamCoin(tokenAddress).balanceOf(_address);
    }

    function getBalanceEthers() public view returns (uint256) {
        return address(this).balance;
    }

     function getSalesPrice() public view returns (uint256) {
        return salesPrice;
    }

     function getPurchasePrice() public view returns (uint256) {
        return purchasePrice;
    }

    function getBanlanceAddress(address _address) public view returns (uint256) {
        return address(_address).balance ;
    }
    
    function setSalesPrice(uint256 _salesPrice) public isAdmin{
        salesPrice = _salesPrice * 1 ether;
    }

    function setPurchasePrice(uint256 _purchasePrice ) public isAdmin{
        purchasePrice  = _purchasePrice * 1 ether;
    }
    
    function restockEthers() public isAdmin payable{
        require(msg.value > 0 , "The value entered must not be zero!");
        //Não seria importante verificar se os usuários não enviam mais dinheiro do que têm porque o protocolo trata disso.
        //https://ethereum-stackexchange-com.translate.goog/questions/91416/best-way-to-check-balance-msg-sender-balance-vs-balancesmsg-sender?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt-BR&_x_tr_pto=sc
        //chamada ao balance não funciona, retorna valor errado - require(getBanlanceAddress(msg.sender) > 0 , "Not Balance!");
        //chamada ao balance não funciona, retorna valor errado - require(getBanlanceAddress(msg.sender)  >= msg.value, "Valor na carteira menor do que o valor enviado!");
        //todo colocar evento
    }
   
    function restockTokens(uint256 amountTokens) public isAdmin{
        require(amountTokens > 0 , "The value entered must not be zero!"); 
        require(getBalanceTokensForAddress(msg.sender) >= amountTokens , "Nao tem tokens suficiente!");  
        require(ScamCoin(tokenAddress).transferFrom(msg.sender, address(this), amountTokens), "Tranferencia de tokens falhou!");
    }

    function sales(uint256 amountTokens) public payable{
        require(amountTokens > 0 , "The value entered must not be zero!");
        require(getBalanceTokensForAddress(msg.sender) > 0, "User wallet has no tokens!");
        require(getBalanceTokensForAddress(msg.sender) >= amountTokens, "There are not enough tokens in the wallet for the sale!");
        require(address(this).balance >= amountTokens * salesPrice, "Insuficiente saldo de ethers na Vending Machine");     
        require(ScamCoin(tokenAddress).transferFrom(msg.sender, address(this), amountTokens), "Tranferencia de tokens falhou!");
        payable(msg.sender).transfer(amountTokens * salesPrice);
        //todo colocar evento
    } 
       
    function purchase(uint256 amountTokens) public payable{
        require(amountTokens > 0 , "The value entered must not be zero!");
        require(getBalanceTokensForAddress(address(this)) >= amountTokens, "Insuficiente quantidade de tokens na Vendi Machine para a compra!");
        //chamada ao balance não funciona, retorna valor errado - require(address(msg.sender).balance >= amountTokens * purchasePrice, "Insuficiente quantidade de ethers na sua carteira para a compra!");
        require(msg.value >= amountTokens * purchasePrice, "Valor enviado insuficiente para a compra");
        require(ScamCoin(tokenAddress).transferFrom(address(this), msg.sender, amountTokens), "Tranferencia de tokens falhou!");
        //Devolve o troco se o usuário, se enviou um valor maior do que deveria seer pago!
        if(msg.value > (amountTokens * purchasePrice)){
           uint256  payback = msg.value - (amountTokens * purchasePrice);
           payable(msg.sender).transfer(payback);
        }    
         //todo colocar evento
    } 

    function withdrawEthers(address addressReceive, uint256 amountEthers) public isAdmin payable{
        require(amountEthers > 0 , "O valor de Ethers para sacar nao pode ser zero!");
        require(address(this).balance > 0, "A carteira da Vending Machine nao possui Ethers!");
        require(address(this).balance >= amountEthers * 1 ether, "A carteira da Vending Machine nao possui a quantidade de Ethers solicitados para o saque!");
        payable(addressReceive).transfer(amountEthers * 1 ether);
    }

    function withdrawAllEthers() public isAdmin payable{
        require(address(this).balance > 0, "A carteira da Vending Machine nao possui Ethers!");
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    //todo - fazer função kill
}




