# Secure Content Portal

A full-stack secure content portal for organizational training and reference materials.

The application supports two roles:

- **Admin** – upload, edit, and delete content.
- **Viewer** – browse and securely view available content.

Supported content types:

- Video (`MP4`, `WebM`, `OGG`)
- PDF
- HTML

---

## Features

### Authentication

- Google OAuth is the only login method.
- New users are created as Viewer by default.
- Admin access is controlled server-side using configured admin email addresses.
- Authentication uses secure HTTP-only session cookies.
- Authentication tokens are not stored in `localStorage`.

### Admin

Admins can:

- Upload videos, PDFs, and HTML files.
- Add title, description, category, and tag.
- Edit content metadata.
- Delete content.
- View uploaded content.

### Viewer

Viewers can:

- Browse available content.
- Search/view content through the application.
- Watch videos inline.
- Read PDFs using PDF.js.
- View HTML content inside a sandboxed iframe.
- Access content only through authenticated application routes.

Viewers do not have access to upload, edit, or delete controls.

---

## Content Protection

Uploaded files are **not stored as public files in the application**.

The application uses a private Supabase Storage bucket.

The flow is:

```text
User
  |
  v
React Frontend
  |
  | Authenticated request
  v
Express Backend
  |
  | Verify session + permissions
  v
MongoDB
  |
  | Find content metadata
  v
Private Supabase Storage
  |
  | Short-lived signed access
  v
Backend Proxy
  |
  v
Viewer