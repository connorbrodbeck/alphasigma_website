import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiUrl } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("as_token");
    const storedUser = localStorage.getItem("as_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("as_token");
        localStorage.removeItem("as_user");
      }
    }
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("as_token", data.token);
    localStorage.setItem("as_user", JSON.stringify(data.user));
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_user");
  }

  async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(apiUrl("/api/auth/change-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Password change failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("as_token", data.token);
    localStorage.setItem("as_user", JSON.stringify(data.user));
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
