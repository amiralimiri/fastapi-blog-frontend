"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { backend } from "@/lib/backend";
import type { BackendAdapter, NormalizedUser } from "@/lib/backend/types";
import type { User } from "@/lib/types";

export type AuthUser = NormalizedUser;

interface AuthContextType {
  user: NormalizedUser | null;
  isLoading: boolean;
  login: (token: string) => Promise<NormalizedUser | null>;
  logout: () => void;
  updateUser: (user: NormalizedUser | User) => void;
  refreshUser: () => Promise<NormalizedUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  adapter = backend,
}: {
  children: React.ReactNode;
  adapter?: BackendAdapter;
}) {
  const router = useRouter();
  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to the adapter's onUnauthorized seam at initialization
  useEffect(() => {
    const unsubscribe = adapter.onUnauthorized(() => {
      setUser(null);
      router.replace("/login");
    });
    return () => {
      unsubscribe();
    };
  }, [adapter, router]);

  const fetchUser = useCallback(async (): Promise<NormalizedUser | null> => {
    const token = adapter.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const data = await adapter.users.getCurrentUser();
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [adapter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
  }, [fetchUser]);

  const login = async (token: string): Promise<NormalizedUser | null> => {
    adapter.setToken(token);
    setIsLoading(true);
    return fetchUser();
  };

  const logout = () => {
    adapter.clearToken();
    setUser(null);
  };

  const updateUser = (updated: NormalizedUser | User) => {
    const avatar = updated.avatarUrl || updated.image_path || "/default.jpg";
    setUser({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      avatarUrl: avatar,
      image_path: avatar,
    });
  };

  const refreshUser = async () => {
    return fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
