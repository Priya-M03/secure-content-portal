import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

type Content = {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  tag?: string;
  type: "VIDEO" | "PDF" | "HTML";
  originalName: string;
  size: number;
  createdAt: string;
};

function ContentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContent() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/content");

        const found = response.data.find(
          (item: Content) => item._id === id
        );

        if (!found) {
          throw new Error("Content not found.");
        }

        setContent(found);
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load content."
        );
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [id]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-content">
          <div className="dashboard-state">
            Opening protected content...
          </div>
        </main>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-content">
          <div className="dashboard-state dashboard-error">
            <h3>Unable to open content</h3>

            <p>
              {error || "Content not found."}
            </p>

            <button onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const viewerUrl =
    `http://localhost:5000/api/content/view/${content._id}`;

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}

      <header className="dashboard-nav">

        <div className="dashboard-brand">

          <div className="dashboard-brand-mark">
            ◇
          </div>

          <div>
            <div className="dashboard-brand-name">
              SECURE CONTENT PORTAL
            </div>

            <div className="dashboard-brand-subtitle">
              PROTECTED CONTENT VIEWER
            </div>
          </div>

        </div>

        <div className="dashboard-actions">

          <button
            className="dashboard-logout"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="dashboard-content">

        <div className="dashboard-heading-row">

          <div>

            <div className="dashboard-eyebrow">
              PROTECTED CONTENT
            </div>

            <h1>{content.title}</h1>

            {content.description && (
              <p>{content.description}</p>
            )}

          </div>

          <div className="dashboard-role viewer">
            SECURE SESSION
          </div>

        </div>

        {/* CONTENT INFORMATION */}

        <section className="content-section">

          <div className="content-section-header">

            <div>
              <span className="dashboard-eyebrow">
                CONTENT DETAILS
              </span>

              <h2>
                {content.type} viewer
              </h2>
            </div>

            <div className="content-count">
              PROTECTED
            </div>

          </div>

          {/* VIDEO */}

          {content.type === "VIDEO" && (
            <div
              style={{
                width: "100%",
                background: "#000",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <video
                controls
                controlsList="nodownload"
                disablePictureInPicture
                playsInline
                preload="metadata"
                src={viewerUrl}
                style={{
                  width: "100%",
                  maxHeight: "70vh",
                  display: "block",
                }}
                onContextMenu={(e) =>
                  e.preventDefault()
                }
              />
            </div>
          )}

          {/* PDF */}

          {content.type === "PDF" && (
            <div
              style={{
                width: "100%",
                height: "75vh",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#111",
              }}
            >
              <iframe
                src={`${viewerUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                title={content.title}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          )}

          {/* HTML */}

          {content.type === "HTML" && (
            <div
              style={{
                width: "100%",
                height: "75vh",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "#fff",
              }}
            >
              <iframe
                src={viewerUrl}
                title={content.title}
                sandbox="allow-scripts"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          )}

          {/* SECURITY NOTE */}

          <div
            style={{
              marginTop: "18px",
              padding: "16px 18px",
              borderRadius: "12px",
              border:
                "1px solid rgba(255,255,255,0.08)",
              background:
                "rgba(255,255,255,0.025)",
            }}
          >
            <strong>
              ◇ Protected content
            </strong>

            <p
              style={{
                margin: "6px 0 0",
                opacity: 0.7,
              }}
            >
              This content is delivered through an
              authenticated protected endpoint.
              Original files are not exposed through
              a public static URL.
            </p>
          </div>

        </section>

      </main>

    </div>
  );
}

export default ContentViewer;