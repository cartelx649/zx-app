"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { erc20Abi, isAddress, parseUnits } from "viem";
import { depositContractAbi } from "@/lib/contracts/depositAbi";
import type { PackageTier } from "@/lib/types/dashboard";

const bscChainIds: number[] = [bsc.id, bscTestnet.id];

function shortError(e: unknown): string {
  if (e instanceof Error) return e.message.slice(0, 220);
  return "Transaction failed";
}

export function parseDepositAddress(
  raw: string | undefined,
): `0x${string}` | undefined {
  const t = raw?.trim();
  return t && isAddress(t) ? t : undefined;
}

export function useUsdtDeposit(
  depositAddress: `0x${string}` | undefined,
  selectedPackage: PackageTier | null,
) {
  const { address, isConnected, chainId } = useAccount();
  const isCorrectChain =
    chainId !== undefined && bscChainIds.includes(chainId);

  const [confirmHash, setConfirmHash] = useState<`0x${string}` | undefined>();
  const [pendingKind, setPendingKind] = useState<"approve" | "deposit" | null>(
    null,
  );
  const [lastDepositTxHash, setLastDepositTxHash] = useState<
    `0x${string}` | null
  >(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const readsEnabled = Boolean(
    depositAddress && isConnected && isCorrectChain,
  );

  const { data: tokenAddress } = useReadContract({
    address: depositAddress,
    abi: depositContractAbi,
    functionName: "token",
    query: { enabled: readsEnabled },
  });

  const tokenAddr =
    tokenAddress && isAddress(tokenAddress)
      ? (tokenAddress as `0x${string}`)
      : undefined;

  const { data: decimals } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: Boolean(tokenAddr && readsEnabled) },
  });

  const amount = useMemo(() => {
    if (selectedPackage == null || decimals === undefined) return undefined;
    return parseUnits(String(selectedPackage), decimals);
  }, [selectedPackage, decimals]);

  const {
    data: allowance,
    refetch: refetchAllowance,
    isFetching: isAllowanceFetching,
  } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && depositAddress
        ? ([address, depositAddress] as const)
        : undefined,
    query: {
      enabled: Boolean(tokenAddr && depositAddress && address && readsEnabled),
    },
  });

  const {
    data: balance,
    refetch: refetchBalance,
    isFetching: isBalanceFetching,
  } = useReadContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(tokenAddr && address && readsEnabled),
    },
  });

  const needsApprove = Boolean(
    amount !== undefined &&
      allowance !== undefined &&
      allowance < amount,
  );

  const hasEnoughAllowance = Boolean(
    amount !== undefined &&
      allowance !== undefined &&
      allowance >= amount,
  );

  const hasEnoughBalance = Boolean(
    amount !== undefined &&
      balance !== undefined &&
      balance >= amount,
  );

  const {
    data: approveSimulation,
    error: approveSimError,
    isFetching: isApproveSimFetching,
  } = useSimulateContract({
    address: tokenAddr,
    abi: erc20Abi,
    functionName: "approve",
    args:
      depositAddress && amount
        ? ([depositAddress, amount] as const)
        : undefined,
    query: {
      enabled: Boolean(
        readsEnabled &&
          address &&
          tokenAddr &&
          depositAddress &&
          amount !== undefined &&
          needsApprove,
      ),
    },
  });

  const {
    data: depositSimulation,
    error: depositSimError,
    isFetching: isDepositSimFetching,
  } = useSimulateContract({
    address: depositAddress,
    abi: depositContractAbi,
    functionName: "deposit",
    args: amount !== undefined ? [amount] : undefined,
    query: {
      enabled: Boolean(
        readsEnabled &&
          address &&
          depositAddress &&
          tokenAddr &&
          amount !== undefined &&
          hasEnoughAllowance &&
          hasEnoughBalance,
      ),
    },
  });

  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: confirmHash,
      query: { enabled: Boolean(confirmHash) },
    });

  useEffect(() => {
    if (isConfirmed && confirmHash) {
      if (pendingKind === "deposit") {
        setLastDepositTxHash(confirmHash);
      }
      void refetchAllowance();
      void refetchBalance();
      setConfirmHash(undefined);
      setPendingKind(null);
    }
  }, [
    isConfirmed,
    confirmHash,
    pendingKind,
    refetchAllowance,
    refetchBalance,
  ]);

  const isBusy = isWritePending || isConfirming;

  const statusText = isWritePending
    ? "Confirm in your wallet…"
    : isConfirming
      ? "Confirming on-chain…"
      : "";

  const handleApprove = useCallback(async () => {
    setLocalError(null);
    if (!approveSimulation?.request) {
      setLocalError(
        "Approve is not ready. Stay on BSC, pick a package, and wait for the simulation to finish.",
      );
      return;
    }
    try {
      const hash = await writeContractAsync(approveSimulation.request);
      setPendingKind("approve");
      setConfirmHash(hash);
    } catch (e) {
      setLocalError(shortError(e));
    }
  }, [approveSimulation?.request, writeContractAsync]);

  const handleDeposit = useCallback(async () => {
    setLocalError(null);
    if (!depositSimulation?.request) {
      setLocalError(
        "Deposit is not ready. Approve the exact amount first and ensure you have enough USDT.",
      );
      return;
    }
    try {
      const hash = await writeContractAsync(depositSimulation.request);
      setLastDepositTxHash(null);
      setPendingKind("deposit");
      setConfirmHash(hash);
    } catch (e) {
      setLocalError(shortError(e));
    }
  }, [depositSimulation?.request, writeContractAsync]);

  const resetLastDepositTxHash = useCallback(() => {
    setLastDepositTxHash(null);
  }, []);

  const combinedError =
    localError ??
    approveSimError?.message ??
    depositSimError?.message ??
    null;

  const approveDisabled =
    isBusy ||
    !needsApprove ||
    !approveSimulation?.request ||
    isAllowanceFetching ||
    isApproveSimFetching ||
    !selectedPackage;

  const depositDisabled =
    isBusy ||
    !hasEnoughAllowance ||
    !hasEnoughBalance ||
    !depositSimulation?.request ||
    isAllowanceFetching ||
    isBalanceFetching ||
    isDepositSimFetching ||
    !selectedPackage;

  return {
    isConfigured: Boolean(depositAddress),
    isCorrectChain,
    isConnected,
    tokenAddr,
    decimals,
    amount,
    allowance,
    balance,
    needsApprove,
    hasEnoughAllowance,
    hasEnoughBalance,
    isBusy,
    statusText,
    error: combinedError,
    approveDisabled,
    depositDisabled,
    isReadsLoading: isAllowanceFetching || isBalanceFetching,
    handleApprove,
    handleDeposit,
    lastDepositTxHash,
    resetLastDepositTxHash,
  };
}
