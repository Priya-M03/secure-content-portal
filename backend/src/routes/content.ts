import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";
import multer from "multer";
import crypto from "crypto";
import { Readable } from "stream";

import Content from "../models/Content";
import { supabase } from "../supabase";

const router = Router();

const BUCKET_NAME = "content";

// --------------------------------------------------
// Authentication helpers
// --------------------------------------------------

function requireLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  next();
}

function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const user = req.user as any;

  if (user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

// --------------------------------------------------
// Upload configuration
// --------------------------------------------------

const allowedMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "application/pdf",
  "text/html",
];

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only video, PDF and HTML files are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// --------------------------------------------------
// GET CONTENT
// Viewer + Admin
// --------------------------------------------------

router.get(
  "/",
  requireLogin,
  async (_req: Request, res: Response) => {
    try {
      const contents = await Content.find()
        .select(
          "_id title description category tag type originalName mimeType size createdAt updatedAt"
        )
        .sort({ createdAt: -1 });

      return res.json(contents);
    } catch (error) {
      console.error("Get content error:", error);

      return res.status(500).json({
        message: "Unable to load content",
      });
    }
  }
);

// --------------------------------------------------
// SECURE CONTENT VIEWER
// Viewer + Admin
// --------------------------------------------------

router.get(
  "/view/:id",
  requireLogin,
  async (req: Request, res: Response) => {
    try {
      const content = await Content.findById(
        req.params.id
      );

      if (!content) {
        return res.status(404).json({
          message: "Content not found.",
        });
      }

      // ------------------------------------------------
      // SECURITY HEADERS
      // ------------------------------------------------

      res.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0, must-revalidate"
      );

      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      res.setHeader(
        "Cross-Origin-Resource-Policy",
        "cross-origin"
      );

      res.removeHeader("X-Frame-Options");

      res.setHeader(
        "Content-Security-Policy",
        "frame-ancestors http://localhost:5176"
      );

      // ------------------------------------------------
      // Create a short-lived signed URL
      // ------------------------------------------------

      const { data, error } =
        await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(
            content.storedName,
            60
          );

      if (error || !data?.signedUrl) {
        console.error(
          "Supabase signed URL error:",
          error
        );

        return res.status(500).json({
          message: "Unable to access protected content.",
        });
      }

      // ------------------------------------------------
      // Fetch the private file through Supabase
      // ------------------------------------------------

      const fileResponse = await fetch(
        data.signedUrl
      );

      if (!fileResponse.ok) {
        return res.status(404).json({
          message: "Stored file not found.",
        });
      }

      // ------------------------------------------------
      // VIDEO
      // ------------------------------------------------

      if (content.type === "VIDEO") {
        res.setHeader(
          "Content-Type",
          content.mimeType
        );

        res.setHeader(
          "Content-Disposition",
          "inline"
        );

        res.setHeader(
          "Accept-Ranges",
          "bytes"
        );

        if (fileResponse.body) {
          const nodeStream =
            Readable.fromWeb(
              fileResponse.body as any
            );

          return nodeStream.pipe(res);
        }

        return res.status(500).end();
      }

      // ------------------------------------------------
      // PDF
      // ------------------------------------------------

      if (content.type === "PDF") {
        res.setHeader(
          "Content-Type",
          "application/pdf"
        );

        res.setHeader(
          "Content-Disposition",
          "inline"
        );

        const buffer =
          Buffer.from(
            await fileResponse.arrayBuffer()
          );

        res.setHeader(
          "Content-Length",
          buffer.length
        );

        return res.send(buffer);
      }

      // ------------------------------------------------
      // HTML
      // ------------------------------------------------

      if (content.type === "HTML") {
        res.setHeader(
          "Content-Type",
          "text/html; charset=utf-8"
        );

        res.setHeader(
          "Content-Disposition",
          "inline"
        );

        const buffer =
          Buffer.from(
            await fileResponse.arrayBuffer()
          );

        res.setHeader(
          "Content-Length",
          buffer.length
        );

        return res.send(buffer);
      }

      return res.status(400).json({
        message: "Unsupported content type.",
      });
    } catch (error) {
      console.error(
        "Secure content viewer error:",
        error
      );

      return res.status(500).json({
        message: "Unable to open content.",
      });
    }
  }
);

// --------------------------------------------------
// UPLOAD CONTENT
// ADMIN ONLY
// --------------------------------------------------

router.post(
  "/",
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please select a file.",
        });
      }

      const {
        title,
        description,
        category,
        tag,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Title is required.",
        });
      }

      let type:
        | "VIDEO"
        | "PDF"
        | "HTML";

      if (
        req.file.mimetype.startsWith("video/")
      ) {
        type = "VIDEO";
      } else if (
        req.file.mimetype === "application/pdf"
      ) {
        type = "PDF";
      } else if (
        req.file.mimetype === "text/html"
      ) {
        type = "HTML";
      } else {
        return res.status(400).json({
          message: "Unsupported file type.",
        });
      }

      // ------------------------------------------------
      // Generate random storage name
      // ------------------------------------------------

      const extension =
        req.file.originalname.includes(".")
          ? "." +
            req.file.originalname
              .split(".")
              .pop()
          : "";

      const storedName =
        `${crypto.randomUUID()}${extension}`;

      // ------------------------------------------------
      // Upload to private Supabase bucket
      // ------------------------------------------------

      const { error: uploadError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(
            storedName,
            req.file.buffer,
            {
              contentType:
                req.file.mimetype,

              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "Supabase upload error:",
          uploadError
        );

        return res.status(500).json({
          message:
            "Unable to upload file to storage.",
        });
      }

      const user = req.user as any;

      // ------------------------------------------------
      // Save metadata in MongoDB
      // ------------------------------------------------

      const content =
        await Content.create({
          title: title.trim(),

          description:
            description?.trim() || "",

          category:
            category?.trim() || "",

          tag:
            tag?.trim() || "",

          type,

          originalName:
            req.file.originalname,

          storedName,

          mimeType:
            req.file.mimetype,

          size:
            req.file.size,

          uploadedBy:
            user._id,
        });

      return res.status(201).json(content);
    } catch (error) {
      console.error(
        "Upload content error:",
        error
      );

      return res.status(500).json({
        message: "Unable to upload content",
      });
    }
  }
);

// --------------------------------------------------
// EDIT CONTENT
// ADMIN ONLY
// --------------------------------------------------

router.put(
  "/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        category,
        tag,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Title is required.",
        });
      }

      const content =
        await Content.findByIdAndUpdate(
          req.params.id,
          {
            title: title.trim(),

            description:
              description?.trim() || "",

            category:
              category?.trim() || "",

            tag:
              tag?.trim() || "",
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!content) {
        return res.status(404).json({
          message: "Content not found.",
        });
      }

      return res.json(content);
    } catch (error) {
      console.error(
        "Edit content error:",
        error
      );

      return res.status(500).json({
        message: "Unable to update content",
      });
    }
  }
);

// --------------------------------------------------
// DELETE CONTENT
// ADMIN ONLY
// --------------------------------------------------

router.delete(
  "/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const content =
        await Content.findById(
          req.params.id
        );

      if (!content) {
        return res.status(404).json({
          message: "Content not found.",
        });
      }

      // ------------------------------------------------
      // Delete file from Supabase Storage
      // ------------------------------------------------

      const { error: deleteError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([
            content.storedName,
          ]);

      if (deleteError) {
        console.error(
          "Supabase delete error:",
          deleteError
        );
      }

      // ------------------------------------------------
      // Delete metadata from MongoDB
      // ------------------------------------------------

      await Content.findByIdAndDelete(
        req.params.id
      );

      return res.json({
        message:
          "Content deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete content error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to delete content",
      });
    }
  }
);

export default router;