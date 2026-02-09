// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import type { Auth } from "../../../../shared/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969";

export const authClient = createAuthClient({
  baseURL: API_URL + "/api/auth",
});

// Hooks
export const { signIn, signOut, useSession, signUp } = authClient;
