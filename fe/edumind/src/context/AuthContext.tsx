import React, { createContext, useContext, useState, useEffect } from "react";
import authApi from "../api/auth.api";
import type { UserResponse } from "../interfaces/auth";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (userData: UserResponse) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  
  // Use localStorage as a hint to avoid flickering on public pages
  const [loading, setLoading] = useState(() => {
    return localStorage.getItem("is_logged_in") === "true";
  });

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem("is_logged_in", "true");
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
      localStorage.removeItem("is_logged_in");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
    if (isLoggedIn) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData: UserResponse) => {
    setUser(userData);
    localStorage.setItem("is_logged_in", "true");
    setLoading(false);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("is_logged_in");
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
