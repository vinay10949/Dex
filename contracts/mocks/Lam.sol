// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Lam is ERC20{
   
    constructor() ERC20("LAM","LAM") public{     
    }
  
    function faucet(address to, uint amount) external {
    _mint(to, 10000 * amount);
  }
}