"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { clearToken, getToken, setToken, apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<User | null>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const res = await apiFetch("/api/users/me");
      if (!res.ok) {
        clearToken();
        setUser(null);
        return null;
      }
      const data: User = await res.json();
      setUser(data);
      return data;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (token: string): Promise<User | null> => {
    setToken(token);
    setIsLoading(true);
    return fetchUser();
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
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
