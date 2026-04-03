import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Animated grid background */}
      <div style={styles.grid} />
      {/* Glow orb */}
      <div style={styles.orb} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#00d4ff" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="4" fill="#00d4ff" opacity="0.8"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={styles.logoText}>DEEPSCAN</span>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your account to continue scanning</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.field}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label style={styles.label}>Password</label>
              <span style={styles.forgot}>Forgot password?</span>
            </div>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...styles.btn, opacity: 0.6 } : styles.btn}
          >
            {loading ? (
              <span style={styles.spinner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.3)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#000" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>Create one</Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gridMove { from { transform: translateY(0); } to { transform: translateY(40px); } }
        @keyframes pulse { 0%,100%{opacity:0.35} 50%{opacity:0.55} }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#030712",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    animation: "gridMove 8s linear infinite",
    pointerEvents: "none",
  },
  orb: {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
    animation: "pulse 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: "20px",
    padding: "44px 40px",
    width: "100%",
    maxWidth: "420px",
    backdropFilter: "blur(20px)",
    animation: "fadeIn 0.5s ease forwards",
    boxShadow: "0 0 60px rgba(0,212,255,0.04), 0 24px 60px rgba(0,0,0,0.5)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "28px",
  },
  logoIcon: {
    width: "38px",
    height: "38px",
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.2)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "15px",
    fontWeight: "700",
    color: "#00d4ff",
    letterSpacing: "3px",
  },
  heading: {
    fontSize: "26px",
    fontWeight: "500",
    color: "#f0f6ff",
    margin: "0 0 8px",
    letterSpacing: "-0.3px",
  },
  sub: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.4)",
    margin: "0 0 32px",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "13px 16px",
    fontSize: "15px",
    color: "#f0f6ff",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  inputFocus: {
    background: "rgba(0,212,255,0.04)",
    border: "1px solid rgba(0,212,255,0.4)",
    borderRadius: "10px",
    padding: "13px 16px",
    fontSize: "15px",
    color: "#f0f6ff",
    outline: "none",
    boxShadow: "0 0 0 3px rgba(0,212,255,0.07)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  forgot: {
    fontSize: "12px",
    color: "rgba(0,212,255,0.6)",
    cursor: "pointer",
  },
  error: {
    background: "rgba(226,75,74,0.1)",
    border: "1px solid rgba(226,75,74,0.3)",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "13px",
    color: "#ff7b7a",
  },
  btn: {
    background: "#00d4ff",
    color: "#030712",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.2px",
    transition: "opacity 0.2s, transform 0.1s",
    marginTop: "4px",
  },
  spinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  switchText: {
    textAlign: "center",
    fontSize: "14px",
    color: "rgba(255,255,255,0.35)",
    marginTop: "24px",
  },
  link: {
    color: "#00d4ff",
    textDecoration: "none",
    fontWeight: "500",
  },
};
