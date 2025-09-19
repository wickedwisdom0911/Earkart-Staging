import { Suspense } from "react";
import LoginPage from "../login/page";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
