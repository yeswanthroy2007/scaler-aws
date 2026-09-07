"use client";

import { useRouter } from "next/navigation";
import { useKeySequence } from "@/hooks/useKeyboardShortcut";

export function GlobalShortcuts() {
  const router = useRouter();

  useKeySequence(["g", "h"], () => router.push("/route53/hosted-zones"));
  useKeySequence(["g", "o"], () => router.push("/route53"));

  return null;
}
