# Secure Content Portal

A full-stack content portal for organizational training/reference content with ADMIN and VIEWER roles.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- Authentication: Google OAuth / secure cookie session
- Storage: cloud object storage (production adapter to be configured)
- PDF: PDF.js/react-pdf
- Video: protected streaming endpoint

## Core requirements
- Google OAuth only
- New users default to VIEWER
- ADMIN access enforced server-side
- Admin upload/edit/delete for VIDEO/PDF/HTML
- Viewer read-only experience
- No permanent public file URLs
- Input/file validation
- Responsive UI
- Free-tier deployment ready
- No secrets committed

## Development
See `frontend/.env.example` and `backend/.env.example`.

> This starter intentionally keeps cloud credentials out of source control. Configure a real storage provider before production deployment.

## Security trade-offs
Content displayed in a browser cannot be made impossible to screenshot or capture. The application focuses on preventing trivial access to permanent raw-file URLs using authenticated, short-lived access and protected server routes.
