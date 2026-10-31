// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Curve {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title BondingCurve
/// @notice ETH/token constant-product virtual-reserve curve. Not a v4 migration implementation.
contract BondingCurve {
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_FEE_BPS = 500;
    uint256 public immutable feeBps;
    uint256 public immutable graduationThreshold;
    address public immutable factory;
    address public immutable creator;
    address public immutable treasury;
    IERC20Curve public immutable token;

    uint256 public virtualEthReserve;
    uint256 public virtualTokenReserve;
    uint256 public realEthReserve;
    bool public graduationReady;
    uint256 private unlocked = 1;

    event Bought(address indexed buyer, uint256 ethIn, uint256 tokensOut, uint256 fee);
    event Sold(address indexed seller, uint256 tokensIn, uint256 ethOut, uint256 fee);
    event GraduationThresholdReached(uint256 ethReserve, uint256 blockNumber);

    error InvalidConfiguration();
    error InvalidAmount();
    error SlippageExceeded();
    error CurveInventoryExceeded();
    error InsufficientLiquidity();
    error TransferFailed();
    error TradingPaused();

    modifier nonReentrant() {
        require(unlocked == 1, "REENTRANCY");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(
        address token_,
        address creator_,
        address treasury_,
        uint256 feeBps_,
        uint256 curveTokenAllocation_,
        uint256 graduationThreshold_
    ) {
        if (
            token_ == address(0) || creator_ == address(0) || treasury_ == address(0) ||
            curveTokenAllocation_ == 0 || graduationThreshold_ == 0 || feeBps_ > MAX_FEE_BPS
        ) revert InvalidConfiguration();
        token = IERC20Curve(token_);
        creator = creator_;
        treasury = treasury_;
        feeBps = feeBps_;
        graduationThreshold = graduationThreshold_;
        factory = msg.sender;
        // Initial virtual ETH reserve is 100 ETH. The opening marginal price is
        // 100 ETH / curveTokenAllocation; these parameters require economic simulation.
        virtualEthReserve = 100 ether;
        virtualTokenReserve = curveTokenAllocation_;
    }

    function quoteBuy(uint256 ethIn) public view returns (uint256 tokensOut, uint256 fee) {
        if (ethIn == 0) return (0, 0);
        fee = (ethIn * feeBps) / BPS;
        uint256 netIn = ethIn - fee;
        uint256 k = virtualEthReserve * virtualTokenReserve;
        uint256 nextTokenReserve = k / (virtualEthReserve + netIn);
        tokensOut = virtualTokenReserve - nextTokenReserve;
    }

    function quoteSell(uint256 tokensIn) public view returns (uint256 ethOut, uint256 fee) {
        if (tokensIn == 0) return (0, 0);
        uint256 k = virtualEthReserve * virtualTokenReserve;
        uint256 nextTokenReserve = virtualTokenReserve + tokensIn;
        uint256 grossOut = virtualEthReserve - (k / nextTokenReserve);
        fee = (grossOut * feeBps) / BPS;
        ethOut = grossOut - fee;
    }

    function buy(uint256 minTokensOut) external payable nonReentrant returns (uint256 tokensOut) {
        if (graduationReady) revert TradingPaused();
        if (msg.value == 0) revert InvalidAmount();
        uint256 fee;
        (tokensOut, fee) = quoteBuy(msg.value);
        if (tokensOut == 0 || tokensOut < minTokensOut) revert SlippageExceeded();
        if (tokensOut > token.balanceOf(address(this))) revert CurveInventoryExceeded();

        uint256 netIn = msg.value - fee;
        virtualEthReserve += netIn;
        virtualTokenReserve -= tokensOut;
        realEthReserve += netIn;

        _sendFee(fee);
        if (!token.transfer(msg.sender, tokensOut)) revert TransferFailed();
        emit Bought(msg.sender, msg.value, tokensOut, fee);

        if (realEthReserve >= graduationThreshold) {
            graduationReady = true;
            emit GraduationThresholdReached(realEthReserve, block.number);
        }
    }

    function sell(uint256 tokensIn, uint256 minEthOut) external nonReentrant returns (uint256 ethOut) {
        if (tokensIn == 0) revert InvalidAmount();
        uint256 fee;
        (ethOut, fee) = quoteSell(tokensIn);
        if (ethOut < minEthOut) revert SlippageExceeded();
        uint256 grossOut = ethOut + fee;
        if (grossOut > realEthReserve || grossOut > address(this).balance) revert InsufficientLiquidity();

        uint256 k = virtualEthReserve * virtualTokenReserve;
        virtualTokenReserve += tokensIn;
        uint256 nextEthReserve = k / virtualTokenReserve;
        virtualEthReserve = nextEthReserve;
        realEthReserve -= grossOut;

        if (!token.transferFrom(msg.sender, address(this), tokensIn)) revert TransferFailed();
        _sendFee(fee);
        (bool ok,) = payable(msg.sender).call{value: ethOut}("");
        if (!ok) revert TransferFailed();
        emit Sold(msg.sender, tokensIn, ethOut, fee);
    }

    function _sendFee(uint256 fee) internal {
        if (fee == 0) return;
        (bool ok,) = payable(treasury).call{value: fee}("");
        if (!ok) revert TransferFailed();
    }

    function curveState() external view returns (bool ready, uint256 ethReserve, uint256 tokenReserve) {
        return (graduationReady, realEthReserve, token.balanceOf(address(this)));
    }
}
