// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

interface IERC20 {

    function totalSupply() external view returns(uint256);
    function balanceOf(address account) external view returns(uint256);
    function transfer(address recipient, uint256 amount) external returns(bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    //Implementado
    event Transfer(address from, address to, uint256 value);

    //Não está implementado (ainda)
    //event Approval(address owner, address spender, uint256 value);

}

contract ScamCoin is IERC20 {

     // Enum
    enum Status { PAUSED, ACTIVE, CANCELLED }

    //Properties
    address private owner;
    string public constant name = "ScamCoin";
    string public constant symbol = "SCN";
    uint8 public constant decimals = 18;  //Default dos exemplos é sempre 18
    uint256 private totalsupply;
    Status contractState;
    uint256 valorToken;

    mapping(address => uint256) private addressToBalance;

    // Modifiers
    modifier isOwner() {
        require(msg.sender == owner , "Sender is not owner!");
        _;
    }

    modifier isActive() {
        require(contractState == Status.ACTIVE, "Contract is not Active!");
        _;
    }

    // Events
    event Burn(address owner, uint256 value, uint256 supply);
    event Mint(address owner, uint256 BalanceOwner, uint256 amount, uint256 supply);

 
    //Constructor
    constructor(uint256 total) {
        owner = msg.sender;
        totalsupply = total;
        addressToBalance[msg.sender] = totalsupply;
        contractState = Status.ACTIVE;
    }

    //Public Functions
    function totalSupply() public override view returns(uint256) {
        return totalsupply;
    }

    function balanceOf(address tokenOwner) public override view returns(uint256) {
        return addressToBalance[tokenOwner];
    }

    function transfer(address receiver, uint256 quantity) public isActive override returns(bool) {
        require(quantity <= addressToBalance[msg.sender], "Insufficient Balance to Transfer");
        addressToBalance[msg.sender] -= quantity;
        addressToBalance[receiver] += quantity;
        emit Transfer(msg.sender, receiver, quantity);
        return true;
    }

    function transferFrom(address from, address to, uint amount)public override returns(bool) { 
        //allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(tokens);
        //require(amount <= balances[owner]);
        //require(amount <= allowed[owner][msg.sender]);
        //allowed[owner][msg.sender] = allowed[owner][msg.sender]-numTokens;
        addressToBalance[from] -= amount;
        addressToBalance[to] += amount;
        //Transfer(_from, _to, tokens);
        return true;
    }

    function state() public view returns(Status) {
        return contractState;
    }

    function setState(uint8 status) public isOwner {
        require(status <= 1, "Invalid status");
        if(status == 1){
            require(contractState != Status.ACTIVE, "The status is already ACTIVE");
            contractState = Status.ACTIVE;
        }else {
            require(contractState != Status.PAUSED, "The status is already PAUSED");
            contractState = Status.PAUSED;
        }
   
    }

    function mint(uint256 amount) public isActive isOwner {

        require(amount > 0, "Invalid mint value.");
        
        totalsupply += amount;
        addressToBalance[owner] += amount;
        
        emit Mint(owner,addressToBalance[owner], amount, totalSupply());       
    }


    function burn(uint256 amount) public isActive isOwner {
        require(amount > 0, "Invalid burn value.");
        require(totalSupply() >= amount, "The amount exceeds your balance.");
        totalsupply -= amount;
        addressToBalance[owner] -= amount;

        emit Burn(owner, amount, totalSupply());
    }

    // Kill
    function kill() public isOwner {
        contractState = Status.CANCELLED;
        selfdestruct(payable(owner));
    } 
}