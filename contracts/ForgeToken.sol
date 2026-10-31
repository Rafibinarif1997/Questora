// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ForgeToken
/// @notice Minimal fixed-supply ERC-20 deployed by RhoodFactory.
contract ForgeToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public immutable factory;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();
    error OnlyFactory();

    constructor(string memory name_, string memory symbol_, address factory_, uint256 supply_) {
        if (factory_ == address(0)) revert ZeroAddress();
        name = name_;
        symbol = symbol_;
        factory = factory_;
        totalSupply = supply_;
        balanceOf[factory_] = supply_;
        emit Transfer(address(0), factory_, supply_);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance();
            unchecked { allowance[from][msg.sender] = allowed - amount; }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        _transfer(from, to, amount);
        return true;
    }

    function factoryTransfer(address to, uint256 amount) external {
        if (msg.sender != factory) revert OnlyFactory();
        _transfer(factory, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}
