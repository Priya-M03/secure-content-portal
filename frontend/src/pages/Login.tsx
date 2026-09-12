import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Crown,
  Eye,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Sparkles,
  Fingerprint,
} from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();

  // Admin is selected by default
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "viewer"
  >("admin");

  const [wordIndex, setWordIndex] = useState(0);

  const words = [
    "secure.",
    "private.",
    "controlled.",
    "protected.",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(
        (current) => (current + 1) % words.length
      );
    }, 2300);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="login-loading">
        <div className="loading-ring">
          <div></div>
        </div>

        <span>
          Establishing secure session...
        </span>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  /*
    Google OAuth

    IMPORTANT:
    Backend route is:
    /api/auth/google

    So we use the complete URL directly.
  */
 const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
};

  return (
    <main className="premium-login">

      {/* =========================================
          BACKGROUND GRAPHICS
      ========================================= */}

      <div className="background-grid"></div>

      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <div className="floating-node node-one"></div>
      <div className="floating-node node-two"></div>
      <div className="floating-node node-three"></div>

      {/* =========================================
          LEFT SIDE
      ========================================= */}

      <section className="brand-panel">

        {/* BRAND */}

        <header className="brand-header">

          <div className="brand-mark">
            <ShieldCheck
              size={23}
              strokeWidth={2}
            />
          </div>

          <div className="brand-name">
            <strong>SECURE</strong>
            <span>CONTENT PORTAL</span>
          </div>

        </header>

        {/* HERO */}

        <div className="brand-content">

          <div className="eyebrow">
            <span className="pulse-dot"></span>
            PRIVATE CONTENT PLATFORM
          </div>

          <h1>
            Your content.
            <br />

            <span
              className="changing-word"
              key={wordIndex}
            >
              {words[wordIndex]}
            </span>
          </h1>

          <p className="brand-description">
            A private workspace designed to securely
            manage, access and view digital content.
          </p>

          {/* FEATURE PILLS */}

          <div className="feature-pills">

            <div className="feature-pill">
              <ShieldCheck size={15} />
              <span>Protected</span>
            </div>

            <div className="feature-pill">
              <Fingerprint size={15} />
              <span>Authenticated</span>
            </div>

            <div className="feature-pill">
              <LockKeyhole size={15} />
              <span>Private</span>
            </div>

          </div>

        </div>

        {/* =========================================
            SECURITY GRAPHIC
        ========================================= */}

        <div className="security-visual">

          <div className="visual-line visual-line-one"></div>
          <div className="visual-line visual-line-two"></div>

          <div className="visual-ring ring-one"></div>
          <div className="visual-ring ring-two"></div>
          <div className="visual-ring ring-three"></div>

          <div className="security-core">

            <ShieldCheck
              size={36}
              strokeWidth={1.5}
            />

            <div className="core-scan"></div>

          </div>

          <div className="visual-label label-one">
            <span></span>
            ENCRYPTED
          </div>

          <div className="visual-label label-two">
            <span></span>
            VERIFIED
          </div>

        </div>

        {/* FOOTER */}

        <div className="security-status">

          <LockKeyhole size={14} />

          <span>
            Protected workspace
          </span>

          <i></i>

          <span>
            Secure session
          </span>

        </div>

      </section>

      {/* =========================================
          RIGHT SIDE
      ========================================= */}

      <section className="login-panel">

        <div className="login-container">

          {/* TOP */}

          <div className="login-top">

            <span className="section-number">
              01
            </span>

            <div className="top-line"></div>

            <div className="secure-label">
              <span></span>
              SECURE LOGIN
            </div>

          </div>

          {/* HEADING */}

          <div className="login-heading">

            <span className="heading-eyebrow">
              WELCOME BACK
            </span>

            <h2>
              Choose your
              <br />
              <strong>workspace.</strong>
            </h2>

            <p>
              Select your access level to continue
              securely.
            </p>

          </div>

          {/* =========================================
              WORKSPACE CARDS
          ========================================= */}

          <div className="workspace-list">

            {/* ADMIN */}

            <button
              type="button"
              className={`workspace-option ${
                selectedRole === "admin"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setSelectedRole("admin")
              }
            >

              <div className="workspace-icon">
                <Crown
                  size={22}
                  strokeWidth={1.8}
                />
              </div>

              <div className="workspace-info">

                <span>
                  WORKSPACE
                </span>

                <strong>
                  Admin
                </strong>

                <p>
                  Manage and organize content
                </p>

              </div>

              <div className="workspace-action">

                {selectedRole === "admin" ? (
                  <Check size={17} />
                ) : (
                  <ArrowUpRight size={18} />
                )}

              </div>

              {selectedRole === "admin" && (
                <div className="selected-line"></div>
              )}

            </button>

            {/* VIEWER */}

            <button
              type="button"
              className={`workspace-option ${
                selectedRole === "viewer"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setSelectedRole("viewer")
              }
            >

              <div className="workspace-icon">

                <Eye
                  size={22}
                  strokeWidth={1.8}
                />

              </div>

              <div className="workspace-info">

                <span>
                  WORKSPACE
                </span>

                <strong>
                  Viewer
                </strong>

                <p>
                  Browse and access content
                </p>

              </div>

              <div className="workspace-action">

                {selectedRole === "viewer" ? (
                  <Check size={17} />
                ) : (
                  <ArrowUpRight size={18} />
                )}

              </div>

              {selectedRole === "viewer" && (
                <div className="selected-line"></div>
              )}

            </button>

          </div>

          {/* =========================================
              GOOGLE LOGIN
          ========================================= */}

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
          >

            <div className="google-icon">

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
              >

                <path
                  fill="#4285F4"
                  d="M21.35 12.27c0-.72-.06-1.41-.18-2.07H12v3.92h5.23a4.47 4.47 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.92-4.18 2.92-7.22Z"
                />

                <path
                  fill="#34A853"
                  d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.75 9.75 0 0 0 12 21.5Z"
                />

                <path
                  fill="#FBBC05"
                  d="M6.54 13.6A5.86 5.86 0 0 1 6.23 12c0-.56.11-1.1.31-1.6V7.88H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.12l3.24-2.52Z"
                />

                <path
                  fill="#EA4335"
                  d="M12 6.37c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.47 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.7 5.38l3.24 2.52c1.01-2.01 3.16-3.73 5.7-3.73Z"
                />

              </svg>

            </div>

            <span>
              Continue with Google
            </span>

            <ArrowUpRight
              size={18}
              className="google-arrow"
            />

          </button>

          {/* STATUS */}

          <div className="selected-message">

            <span></span>

            {selectedRole === "admin"
              ? "Admin workspace selected"
              : "Viewer workspace selected"}

          </div>

          {/* SECURITY INFO */}

          <div className="security-info">

            <div>
              <Sparkles size={13} />
              <span>Google OAuth</span>
            </div>

            <i></i>

            <div>
              <LockKeyhole size={13} />
              <span>HttpOnly session</span>
            </div>

            <i></i>

            <div>
              <ShieldCheck size={13} />
              <span>Protected access</span>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}