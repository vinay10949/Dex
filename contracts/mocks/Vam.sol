// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;


import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Vam is ERC20{
   
    constructor() ERC20("VAM","VAM") public{     
    }
    
    function faucet(address to, uint amount) external {
    _mint(to, 10000 * amount);
  }
  
}