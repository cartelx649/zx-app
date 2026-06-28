"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useCurrentUser() {
  const { token, isAuthenticated, clearTokenForReauth } = useAuth();

  const query = useQuery({
    queryKey: ["current-user", Boolean(token)],
    enabled: Boolean(isAuthenticated && token),
    queryFn: () => api.getMe(token!),
    staleTime: 30_000,
  });

  const lastBad401TokenRef = useRef<string | null>(null);
  const queryError = query.error;
  const isStale401 =
    queryError instanceof ApiError &&
    queryError.status === 401 &&
    Boolean(token) &&
    lastBad401TokenRef.current !== token;

  useEffect(() => {
    if (!isStale401) return;
    lastBad401TokenRef.current = token;
    clearTokenForReauth();
  }, [clearTokenForReauth, isStale401, token]);

  useEffect(() => {
    if (query.isSuccess) {
      lastBad401TokenRef.current = null;
    }
  }, [query.isSuccess]);

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error:
      queryError instanceof ApiError && queryError.status === 401
        ? null
        : queryError instanceof Error
          ? queryError.message
          : null,
    isAdmin: query.data?.role === "admin",
    refetch: query.refetch,
  };
}
