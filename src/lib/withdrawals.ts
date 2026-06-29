import { ApiError } from "@/lib/api";

/** Tailwind classes for a withdrawal status pill, keyed off the status text. */
export function statusPillClass(status: string) {
  if (/complete|approved|paid/i.test(status))
    return "bg-emerald-400/15 text-emerald-300 border-emerald-400/30";
  if (/pending|process/i.test(status))
    return "bg-amber-400/15 text-amber-300 border-amber-400/30";
  if (/reject|fail|cancel/i.test(status))
    return "bg-red-500/15 text-red-300 border-red-400/30";
  return "bg-white/5 text-white/65 border-white/10";
}

/** Backend withdrawal error codes → user-facing messages. */
export const WITHDRAW_ERROR_MESSAGES: Record<string, string> = {
  USER_INACTIVE: "Your account is not active.",
  INVALID_INCOME_TYPE: "Invalid withdrawal type.",
  WALLET_MISMATCH: "Wallet address does not match your account.",
  NO_ACTIVE_CYCLE: "You have no active cycle.",
  ROI_MONTH_ALREADY_WITHDRAWN: "ROI for this month is already withdrawn.",
  NO_ROI_FOR_MONTH: "No ROI available for this month.",
  AMOUNT_EXCEEDS_ROI: "Amount exceeds your available ROI.",
  CAP_REACHED: "Income cap reached. Please re-topup.",
  ROI_WITHDRAW_PAUSED: "ROI withdrawal is paused by admin.",
  INCOME_WITHDRAW_PAUSED: "Income withdrawal is paused by admin.",
  DUPLICATE_REQUEST: "Request already in progress. Please wait.",
};

/** Maps a thrown withdrawal error to a user-facing message. */
export function withdrawErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "Session expired. Please log in again.";
    return (
      (e.code && WITHDRAW_ERROR_MESSAGES[e.code]) ||
      e.message ||
      "Withdrawal failed. Try again."
    );
  }
  return e instanceof Error ? e.message : "Withdrawal failed. Try again.";
}

/** Formats a USDT amount with up to 6 decimal places. */
export function formatUsdt(amount: number) {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
