"use client";
import { Amplify } from "aws-amplify";
import config from "../amplify_config";

Amplify.configure(config as any, { ssr: true });

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}