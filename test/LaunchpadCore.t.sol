// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RhoodFactory} from "../contracts/RhoodFactory.sol";
import {ForgeToken} from "../contracts/ForgeToken.sol";
import {BondingCurve} from "../contracts/BondingCurve.sol";

interface Vm {
    function deal(address account, uint256 newBalance) external;
    function prank(address sender) external;
}

contract LaunchpadCoreTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address private constant ALICE = address(0xA11CE);
    address private constant TEAM = address(0xBEEF);
    address private constant AIRDROP = address(0xCAFE);

    receive() external payable {}

    RhoodFactory private factory;
    ForgeToken private token;
    BondingCurve private curve;

    function setUp() public {
        vm.deal(address(this), 20 ether);
        vm.deal(ALICE, 20 ether);
        factory = new RhoodFactory(address(this), 100 ether);
        (address tokenAddress, address curveAddress) =
            factory.launchToken("Forge Test", "FGT", TEAM, AIRDROP);
        token = ForgeToken(tokenAddress);
        curve = BondingCurve(payable(curveAddress));
    }

    function testFixedSupplyAndAllocation() public view {
        require(token.totalSupply() == 500_000_000 ether, "wrong supply");
        require(token.balanceOf(address(curve)) == 400_000_000 ether, "wrong curve allocation");
        require(token.balanceOf(TEAM) == 50_000_000 ether, "wrong team allocation");
        require(token.balanceOf(AIRDROP) == 50_000_000 ether, "wrong airdrop allocation");
    }

    function testBuyAndSellRoundTrip() public {
        vm.prank(ALICE);
        uint256 bought = curve.buy{value: 1 ether}(1);
        require(bought > 0, "no tokens bought");
        require(token.balanceOf(ALICE) == bought, "buyer balance mismatch");
        require(curve.realEthReserve() > 0, "reserve not updated");

        vm.prank(ALICE);
        token.approve(address(curve), bought);
        vm.prank(ALICE);
        uint256 ethOut = curve.sell(bought / 2, 1);
        require(ethOut > 0, "no ETH returned");
        require(token.balanceOf(ALICE) == bought - (bought / 2), "sell token balance mismatch");
    }

    function testBuyQuoteMatchesExecution() public {
        (uint256 expected,) = curve.quoteBuy(0.25 ether);
        vm.prank(ALICE);
        uint256 actual = curve.buy{value: 0.25 ether}(expected);
        require(actual == expected, "quote mismatch");
    }

    function testFactoryTracksLaunch() public view {
        require(factory.launchCount() == 1, "launch count mismatch");
        require(factory.curveForToken(address(token)) == address(curve), "curve mapping mismatch");
        require(factory.creatorForToken(address(token)) == address(this), "creator mapping mismatch");
    }
}
