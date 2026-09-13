import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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

  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const viewerUrl =
  `${import.meta.env.VITE_API_URL}/content/view/${id}`;

  /*
   * PDF.js viewer
   */
  useEffect(() => {
    if (!content || content.type !== "PDF") {
      return;
    }

    let cancelled = false;

    async function renderPdf() {
      try {
        setPdfLoading(true);
        setPdfError("");

        const response = await fetch(viewerUrl, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unable to load protected PDF.");
        }

        const pdfData = await response.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
          data: pdfData,
        }).promise;

        if (cancelled) {
          return;
        }

        setPageCount(pdf.numPages);

        const pageNumber = Math.min(
          currentPage,
          pdf.numPages
        );

        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: 1.5,
        });

        const canvas = canvasRef.current;

        if (!canvas) {
          return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Unable to create PDF canvas."
          );
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;
      } catch (err: any) {
        if (cancelled) {
          return;
        }

        console.error("PDF.js error:", err);

        setPdfError(
          err?.message || "Unable to render PDF."
        );
      } finally {
        if (!cancelled) {
          setPdfLoading(false);
        }
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [content, currentPage, viewerUrl]);

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

            <button
              onClick={() => navigate("/dashboard")}
            >
              Back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

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

        {/* CONTENT */}

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
                border:
                  "1px solid rgba(255,255,255,0.08)",
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

          {/* PDF.js */}

          {content.type === "PDF" && (
            <>
              <div
                style={{
                  width: "100%",
                  minHeight: "75vh",
                  maxHeight: "75vh",
                  overflow: "auto",
                  borderRadius: "16px",
                  border:
                    "1px solid rgba(255,255,255,0.08)",
                  background: "#171717",
                  padding: "24px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}
                onContextMenu={(e) =>
                  e.preventDefault()
                }
              >
                {pdfLoading && (
                  <div
                    style={{
                      padding: "40px",
                      opacity: 0.7,
                    }}
                  >
                    Rendering protected PDF...
                  </div>
                )}

                {pdfError && (
                  <div className="dashboard-state dashboard-error">
                    <h3>
                      Unable to render PDF
                    </h3>

                    <p>{pdfError}</p>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  style={{
                    display:
                      pdfLoading || pdfError
                        ? "none"
                        : "block",
                    maxWidth: "100%",
                    height: "auto",
                    boxShadow:
                      "0 10px 40px rgba(0,0,0,0.35)",
                    background: "#fff",
                  }}
                />
              </div>

              {/* PDF CONTROLS */}

              {pageCount > 0 && !pdfError && (
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <button
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <span
                    style={{
                      opacity: 0.75,
                      fontSize: "14px",
                    }}
                  >
                    Page {currentPage} of {pageCount}
                  </span>

                  <button
                    disabled={
                      currentPage >= pageCount
                    }
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          pageCount,
                          page + 1
                        )
                      )
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* HTML */}

          {content.type === "HTML" && (
            <div
              style={{
                width: "100%",
                height: "75vh",
                borderRadius: "16px",
                overflow: "hidden",
                border:
                  "1px solid rgba(255,255,255,0.08)",
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