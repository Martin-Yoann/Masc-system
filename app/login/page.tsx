import AuthPage from "@/app/components/AuthPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}