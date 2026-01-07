// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6969";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

// Esporta gli hook pronti all'uso per maggiore comodità
export const { signIn, signOut, useSession, signUp } = authClient;
