import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const isAdmin = user?.role === "admin";

  async function loadContent() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/content");

      setContents(response.data);
    } catch (err) {
      console.error(err);
      setError("Unable to load content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    setUploadError("");

    if (!title.trim()) {
      setUploadError("Please enter a title.");
      return;
    }

    if (!file) {
      setUploadError("Please select a file.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("tag", tag);
      formData.append("file", file);

      await api.post("/content", formData);

      setTitle("");
      setDescription("");
      setCategory("");
      setTag("");
      setFile(null);

      setShowUpload(false);

      await loadContent();
    } catch (err: any) {
      console.error(err);

      setUploadError(
        err?.response?.data?.message ||
          "Unable to upload content."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this content?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/content/${id}`);

      await loadContent();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          "Unable to delete content."
      );
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getIcon(type: Content["type"]) {
    if (type === "VIDEO") return "▶";
    if (type === "PDF") return "▤";
    return "◇";
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
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
              PRIVATE CONTENT PLATFORM
            </div>
          </div>
        </div>

        <div className="dashboard-actions">
          <div className="dashboard-user">
            <span className="dashboard-user-name">
              {user?.name || "User"}
            </span>

            <span
              className={`dashboard-role ${
                isAdmin ? "admin" : "viewer"
              }`}
            >
              {isAdmin ? "ADMIN" : "VIEWER"}
            </span>
          </div>

          <button
            className="dashboard-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}

      <main className="dashboard-content">

        <div className="dashboard-heading-row">

          <div>
            <div className="dashboard-eyebrow">
              SECURE CONTENT LIBRARY
            </div>

            <h1>
              {isAdmin
                ? "Content workspace."
                : "Your content library."}
            </h1>

            <p>
              {isAdmin
                ? "Manage protected digital content securely."
                : "Browse and access available content securely."}
            </p>
          </div>

          {isAdmin && (
            <button
              className="admin-upload-button"
              onClick={() => setShowUpload(!showUpload)}
            >
              + Upload content
            </button>
          )}

        </div>

        {/* ADMIN UPLOAD */}

        {isAdmin && showUpload && (
          <section className="upload-panel">

            <div className="upload-panel-header">

              <div>
                <span className="dashboard-eyebrow">
                  ADMIN CONTROL
                </span>

                <h2>Upload new content</h2>

                <p>
                  Add protected video, PDF or HTML content.
                </p>
              </div>

              <button
                className="upload-close"
                onClick={() => setShowUpload(false)}
              >
                ×
              </button>

            </div>

            <form
              className="upload-form"
              onSubmit={handleUpload}
            >

              <div className="form-field">
                <label>Title</label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Enter content title"
                />
              </div>

              <div className="form-field">
                <label>Description</label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe this content"
                  rows={4}
                />
              </div>

              <div className="form-row">

                <div className="form-field">
                  <label>Category</label>

                  <input
                    type="text"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                    placeholder="Training"
                  />
                </div>

                <div className="form-field">
                  <label>Tag</label>

                  <input
                    type="text"
                    value={tag}
                    onChange={(e) =>
                      setTag(e.target.value)
                    }
                    placeholder="Security"
                  />
                </div>

              </div>

              <div className="form-field">
                <label>Content file</label>

                <input
                  type="file"
                  accept=".mp4,.webm,.ogg,.pdf,.html"
                  onChange={(e) =>
                    setFile(
                      e.target.files?.[0] || null
                    )
                  }
                />

                <small>
                  Allowed: Video, PDF and HTML • Maximum 100 MB
                </small>
              </div>

              {uploadError && (
                <div className="upload-error">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                className="upload-submit"
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "Upload securely"}
              </button>

            </form>
          </section>
        )}

        {/* CONTENT */}

        <section className="content-section">

          <div className="content-section-header">

            <div>
              <span className="dashboard-eyebrow">
                AVAILABLE CONTENT
              </span>

              <h2>Content library</h2>
            </div>

            <div className="content-count">
              {contents.length}{" "}
              {contents.length === 1 ? "ITEM" : "ITEMS"}
            </div>

          </div>

          {loading && (
            <div className="dashboard-state">
              Loading protected content...
            </div>
          )}

          {!loading && error && (
            <div className="dashboard-state dashboard-error">
              <h3>Unable to load content</h3>

              <p>{error}</p>

              <button onClick={loadContent}>
                Try again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            contents.length === 0 && (
              <div className="dashboard-empty">

                <div className="dashboard-empty-icon">
                  ◇
                </div>

                <h3>No content available</h3>

                <p>
                  {isAdmin
                    ? "Upload your first protected content item."
                    : "No content has been shared yet."}
                </p>

              </div>
            )}

          {!loading &&
            !error &&
            contents.length > 0 && (
              <div className="dashboard-content-grid">

                {contents.map((item) => (
                  <article
                    className="dashboard-content-card"
                    key={item._id}
                  >

                    <div className="content-card-top">

                      <div className="content-card-icon">
                        {getIcon(item.type)}
                      </div>

                      <span className="content-type">
                        {item.type}
                      </span>

                    </div>

                    <h3>{item.title}</h3>

                    {item.description && (
                      <p className="content-description">
                        {item.description}
                      </p>
                    )}

                    <div className="content-meta">

                      {item.category && (
                        <span>
                          {item.category}
                        </span>
                      )}

                      {item.tag && (
                        <span>
                          #{item.tag}
                        </span>
                      )}

                    </div>

                    <div className="content-card-footer">

                      <span>
                        {formatSize(item.size)}
                      </span>

                      <span>
                        {new Date(
                          item.createdAt
                        ).toLocaleDateString()}
                      </span>

                    </div>

                    <div className="content-card-actions">

                      {/* UPDATED VIEW BUTTON */}

                      <button
                        className="open-content"
                        onClick={() =>
                          navigate(
                            `/content/${item._id}`
                          )
                        }
                      >
                        View content →
                      </button>

                      {isAdmin && (
                        <button
                          className="delete-content"
                          onClick={() =>
                            handleDelete(item._id)
                          }
                        >
                          Delete
                        </button>
                      )}

                    </div>

                  </article>
                ))}

              </div>
            )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;