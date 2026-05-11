/** Minimal ABI for the deposit vault (token + deposit). Full ABI can be added if you decode more events. */
export const depositContractAbi = [
  {
    inputs: [],
    name: "token",
    outputs: [
      { internalType: "contract IERC20", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
