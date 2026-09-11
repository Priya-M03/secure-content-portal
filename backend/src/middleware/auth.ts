import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ message: "Authentication required" });

  const user = await User.findById(userId);
  if (!user) return res.status(401).json({ message: "User session is invalid" });

  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
