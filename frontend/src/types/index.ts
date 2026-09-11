export type Role = "ADMIN" | "VIEWER";
export type ContentType = "VIDEO" | "PDF" | "HTML";

export interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: Role;
}

export interface Content {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: ContentType;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
