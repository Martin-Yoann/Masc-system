"use client";

import AdminLayout from "@/app/components/AdminLayout";
import type { ReactNode } from "react";

export default function AdminSegmentLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
