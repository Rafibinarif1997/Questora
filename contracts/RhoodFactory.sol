// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ForgeToken} from "./ForgeToken.sol";
import {BondingCurve} from "./BondingCurve.sol";

/// @title RhoodFactory
/// @notice Permissionless token factory with the agreed 80/10/10 allocation.
contract RhoodFactory {
    uint256 public constant TOKEN_SUPPLY = 500_000_000 ether;
    uint256 public constant CURVE_ALLOCATION = 400_000_000 ether;
    uint256 public constant TEAM_ALLOCATION = 50_000_000 ether;
    uint256 public constant AIRDROP_ALLOCATION = 50_000_000 ether;
    uint256 public constant DEFAULT_FEE_BPS = 100;

    address public owner;
    address public treasury;
    uint256 public graduationThreshold;
    address[] public launches;
    mapping(address => address) public curveForToken;
    mapping(address => address) public creatorForToken;

    event TokenLaunched(
        address indexed token,
        address indexed curve,
        address indexed creator,
        string name,
        string symbol,
        address teamRecipient,
        address airdropRecipient
    );
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event GraduationThresholdUpdated(uint256 previousThreshold, uint256 newThreshold);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error Unauthorized();
    error ZeroAddress();
    error InvalidLaunch();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address treasury_, uint256 graduationThreshold_) {
        if (treasury_ == address(0) || graduationThreshold_ == 0) revert ZeroAddress();
        owner = msg.sender;
        treasury = treasury_;
        graduationThreshold = graduationThreshold_;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function launchToken(
        string calldata name_,
        string calldata symbol_,
        address teamRecipient,
        address airdropRecipient
    ) external returns (address tokenAddress, address curveAddress) {
        if (
            bytes(name_).length == 0 || bytes(name_).length > 32 ||
            bytes(symbol_).length == 0 || bytes(symbol_).length > 10 ||
            teamRecipient == address(0) || airdropRecipient == address(0)
        ) revert InvalidLaunch();

        ForgeToken token = new ForgeToken(name_, symbol_, address(this), TOKEN_SUPPLY);
        BondingCurve curve = new BondingCurve(
            address(token),
            msg.sender,
            treasury,
            DEFAULT_FEE_BPS,
            CURVE_ALLOCATION,
            graduationThreshold
        );

        token.factoryTransfer(address(curve), CURVE_ALLOCATION);
        token.factoryTransfer(teamRecipient, TEAM_ALLOCATION);
        token.factoryTransfer(airdropRecipient, AIRDROP_ALLOCATION);

        tokenAddress = address(token);
        curveAddress = address(curve);
        curveForToken[tokenAddress] = curveAddress;
        creatorForToken[tokenAddress] = msg.sender;
        launches.push(tokenAddress);

        emit TokenLaunched(
            tokenAddress, curveAddress, msg.sender, name_, symbol_, teamRecipient, airdropRecipient
        );
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, treasury_);
        treasury = treasury_;
    }

    function setGraduationThreshold(uint256 threshold_) external onlyOwner {
        if (threshold_ == 0) revert InvalidLaunch();
        emit GraduationThresholdUpdated(graduationThreshold, threshold_);
        graduationThreshold = threshold_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function launchCount() external view returns (uint256) {
        return launches.length;
    }

    function launchAt(uint256 index) external view returns (address) {
        return launches[index];
    }
}
