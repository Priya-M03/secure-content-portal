import { Router, Request, Response } from "express";
import passport from "../config/passport";
import { env } from "../config/env";

const router = Router();

/*
  Start Google OAuth
*/
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

/*
  Google OAuth callback
*/
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/login-failed",
  }),
  (_req: Request, res: Response) => {
    const clientUrl = env.clientUrl;

    res.redirect(clientUrl);
  }
);

/*
  Current logged-in user
*/
router.get("/me", (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  return res.json(req.user);
});

/*
  Login failure
*/
router.get("/login-failed", (_req: Request, res: Response) => {
  res.status(401).json({
    message: "Google login failed",
  });
});

/*
  Logout
*/
router.post("/logout", (req: Request, res: Response) => {
  req.logout((error) => {
    if (error) {
      return res.status(500).json({
        message: "Logout failed",
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return res.status(500).json({
          message: "Session could not be destroyed",
        });
      }

      res.clearCookie("connect.sid");

      return res.json({
        message: "Logged out successfully",
      });
    });
  });
});

export default router;