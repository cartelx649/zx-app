"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const LIMIT = 20;

export type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export type TypeFilter = "all" | "roi" | "direct" | "override";

export function useWithdrawalHistory() {
  const { token, isAuthenticated } = useAuth();

  const [offset, setOffset] = useState(0);
  const [status, setStatusState] = useState<StatusFilter>("all");
  const [type, setTypeState] = useState<TypeFilter>("all");

  const query = useQuery({
    queryKey: ["withdrawal-history", offset, status, type, Boolean(token)],
    enabled: Boolean(isAuthenticated && token),
    queryFn: () =>
      api.getWithdrawalHistory(token!, {
        limit: LIMIT,
        offset,
        status: status === "all" ? undefined : status,
        type: type === "all" ? undefined : type,
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  // Changing a filter restarts paging from the first page.
  function setStatus(next: StatusFilter) {
    setStatusState(next);
    setOffset(0);
  }

  function setType(next: TypeFilter) {
    setTypeState(next);
    setOffset(0);
  }

  function nextPage() {
    if (query.data?.pagination.hasMore) setOffset((o) => o + LIMIT);
  }

  function prevPage() {
    setOffset((o) => Math.max(0, o - LIMIT));
  }

  const queryError = query.error;
  // 401 re-auth is handled globally by useDashboard on the same page; surface
  // only non-401 errors here.
  const error =
    queryError instanceof ApiError && queryError.status === 401
      ? null
      : queryError instanceof Error
        ? queryError.message
        : null;

  return {
    items: query.data?.items ?? [],
    summary: query.data?.summary ?? null,
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
    status,
    type,
    setStatus,
    setType,
    limit: LIMIT,
    offset,
    nextPage,
    prevPage,
  };
}
