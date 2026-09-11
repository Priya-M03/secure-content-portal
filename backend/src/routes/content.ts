import {
  Router,
  Request,
  Response,
  NextFunction,
} from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import Content from "../models/Content";

const router = Router();

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

const uploadDirectory = path.join(
  process.cwd(),
  "uploads"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const uniqueName =
      crypto.randomUUID() +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const allowedMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "application/pdf",
  "text/html",
];

const upload = multer({
  storage,

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

      // Resolve the stored file safely
      const filePath = path.resolve(
        uploadDirectory,
        content.storedName
      );

      const safeDirectory =
        path.resolve(uploadDirectory) + path.sep;

      // Prevent path traversal
      if (!filePath.startsWith(safeDirectory)) {
        return res.status(403).json({
          message: "Invalid content path.",
        });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Stored file not found.",
        });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;

      // ------------------------------------------------
      // SECURITY HEADERS
      // ------------------------------------------------

      // Do not cache protected files
      res.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0, must-revalidate"
      );

      // Prevent MIME sniffing
      res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
      );

      // Allow authenticated resources to be embedded
      // by the frontend running on localhost:5176.
      res.setHeader(
        "Cross-Origin-Resource-Policy",
        "cross-origin"
      );

      // Helmet can otherwise send SAMEORIGIN,
      // which blocks our PDF/HTML iframe because
      // frontend and backend use different ports.
      res.removeHeader("X-Frame-Options");

      // Allow this protected resource to be framed
      // by our frontend.
      res.setHeader(
        "Content-Security-Policy",
        "frame-ancestors http://localhost:5176"
      );

      // ------------------------------------------------
      // VIDEO
      // HTTP Range support
      // ------------------------------------------------

      if (content.type === "VIDEO") {
        const range = req.headers.range;

        res.setHeader(
          "Content-Type",
          content.mimeType
        );

        res.setHeader(
          "Accept-Ranges",
          "bytes"
        );

        res.setHeader(
          "Content-Disposition",
          "inline"
        );

        // Browser requests the complete file
        if (!range) {
          res.setHeader(
            "Content-Length",
            fileSize
          );

          return fs
            .createReadStream(filePath)
            .pipe(res);
        }

        // Example:
        // bytes=0-1023
        // bytes=1000-
        const match =
          /bytes=(\d*)-(\d*)/.exec(range);

        if (!match) {
          res.setHeader(
            "Content-Range",
            `bytes */${fileSize}`
          );

          return res.status(416).end();
        }

        let start = match[1]
          ? Number(match[1])
          : 0;

        let end = match[2]
          ? Number(match[2])
          : fileSize - 1;

        // Support suffix ranges:
        // bytes=-500
        if (!match[1] && match[2]) {
          const suffixLength = Number(match[2]);

          if (
            suffixLength <= 0 ||
            suffixLength > fileSize
          ) {
            res.setHeader(
              "Content-Range",
              `bytes */${fileSize}`
            );

            return res.status(416).end();
          }

          start = fileSize - suffixLength;
          end = fileSize - 1;
        }

        end = Math.min(
          end,
          fileSize - 1
        );

        if (
          start < 0 ||
          start >= fileSize ||
          start > end
        ) {
          res.setHeader(
            "Content-Range",
            `bytes */${fileSize}`
          );

          return res.status(416).end();
        }

        const chunkSize =
          end - start + 1;

        res.status(206);

        res.setHeader(
          "Content-Range",
          `bytes ${start}-${end}/${fileSize}`
        );

        res.setHeader(
          "Content-Length",
          chunkSize
        );

        return fs
          .createReadStream(filePath, {
            start,
            end,
          })
          .pipe(res);
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

        res.setHeader(
          "Content-Length",
          fileSize
        );

        return fs
          .createReadStream(filePath)
          .pipe(res);
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

        res.setHeader(
          "Content-Length",
          fileSize
        );

        return fs
          .createReadStream(filePath)
          .pipe(res);
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
        fs.unlinkSync(req.file.path);

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
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Unsupported file type.",
        });
      }

      const user = req.user as any;

      const content = await Content.create({
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

        storedName:
          req.file.filename,

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

      if (
        req.file &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

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

      const filePath = path.join(
        uploadDirectory,
        content.storedName
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

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