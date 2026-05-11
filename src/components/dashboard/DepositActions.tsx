"use client";

import { useState } from "react";
import { HudButton } from "@/components/hud/HudButton";
import { DepositModal } from "@/components/dashboard/DepositModal";
import type { PackageTier } from "@/lib/types/dashboard";

type Props = {
  depositAddress: `0x${string}`;
  selectedPackage: PackageTier | null;
};

export function DepositActions({ depositAddress, selectedPackage }: Props) {
  const [open, setOpen] = useState(false);

  const label = selectedPackage
    ? `Continue to deposit · ${selectedPackage} USDT`
    : "Select a package above";

  return (
    <div className="mt-4">
      <HudButton
        disabled={!selectedPackage}
        onClick={() => setOpen(true)}
      >
        {label}
      </HudButton>
      {open && selectedPackage ? (
        <DepositModal
          depositAddress={depositAddress}
          selectedPackage={selectedPackage}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
