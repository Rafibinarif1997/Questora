// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RhoodFactory} from "../contracts/RhoodFactory.sol";

interface VmDeploy {
    function envUint(string calldata key) external returns (uint256);
    function envAddress(string calldata key) external returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

/// @notice Testnet-only deployment script. Never commit a private key or .env file.
contract DeployRhoodFactory {
    VmDeploy private constant vm =
        VmDeploy(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (RhoodFactory factory) {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address treasury = vm.envAddress("TREASURY");
        uint256 graduationThreshold = vm.envUint("GRADUATION_THRESHOLD_WEI");

        vm.startBroadcast(privateKey);
        factory = new RhoodFactory(treasury, graduationThreshold);
        vm.stopBroadcast();
    }
}
