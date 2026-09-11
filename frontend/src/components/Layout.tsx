import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return <div className="app">
    <header className="nav">
      <Link to="/dashboard" className="brand">Secure Content Portal</Link>
      <nav>
        <Link to="/dashboard">Content</Link>
        {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}
        <button onClick={async () => { await logout(); navigate("/login"); }}>Logout</button>
      </nav>
    </header>
    <main>{children}</main>
  </div>;
}
