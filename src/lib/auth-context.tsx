"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

type User = {
  _id: Id<"users">;
  name: string;
  email: string;
  role: "admin" | "client";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("dashboard_user");
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("dashboard_user");
      }
    }
    setLoading(false);
  }, []);

  const setUser = (userData: User) => {
    setUserState(userData);
    localStorage.setItem("dashboard_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem("dashboard_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
