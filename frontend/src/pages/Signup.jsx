import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (form.name.trim().length < 2) return "Name must be at least 2 characters";
    if (form.password.length < 8) return "Password must be at least 8 characters";
    if (form.password !== form.confirm) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Signup failed");
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ff7b7a", "#EF9F27", "#00d4ff", "#4ade80"];

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.orb} />

      <div style={styles.card}>
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

        <h1 style={styles.heading}>Create your account</h1>
        <p style={styles.sub}>Join DeepScan to detect deepfakes with AI precision</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full name</label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Ayush Sharma"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
            />
          </div>

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
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
            />
            {form.password.length > 0 && (
              <div style={{ marginTop: "6px" }}>
                <div style={styles.strengthBar}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      ...styles.strengthSegment,
                      background: i <= strength ? strengthColor[strength] : "rgba(255,255,255,0.08)"
                    }}/>
                  ))}
                </div>
                <span style={{ fontSize: "11px", color: strengthColor[strength], marginTop: "4px", display: "block" }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm password</label>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={{
                ...styles.input,
                borderColor: form.confirm && form.confirm !== form.password
                  ? "rgba(226,75,74,0.5)"
                  : form.confirm && form.confirm === form.password
                  ? "rgba(74,222,128,0.4)"
                  : undefined
              }}
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.terms}>
          By signing up you agree to our{" "}
          <span style={styles.link}>Terms of Service</span> and{" "}
          <span style={styles.link}>Privacy Policy</span>
        </p>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
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
    bottom: "-20%",
    left: "-10%",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
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
    gap: "18px",
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
    width: "100%",
    boxSizing: "border-box",
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
    width: "100%",
    boxSizing: "border-box",
  },
  strengthBar: {
    display: "flex",
    gap: "4px",
  },
  strengthSegment: {
    flex: 1,
    height: "3px",
    borderRadius: "2px",
    transition: "background 0.3s",
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
    transition: "opacity 0.2s",
    marginTop: "4px",
  },
  terms: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    marginTop: "16px",
    lineHeight: "1.6",
  },
  switchText: {
    textAlign: "center",
    fontSize: "14px",
    color: "rgba(255,255,255,0.35)",
    marginTop: "14px",
  },
  link: {
    color: "#00d4ff",
    textDecoration: "none",
    fontWeight: "500",
    cursor: "pointer",
  },
};
