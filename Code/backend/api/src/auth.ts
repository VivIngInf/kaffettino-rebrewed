import { betterAuth, getEnvVar } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./plugins/prisma";
import { Role } from "./generated/prisma/client";

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // Deve coincidere con l'indirizzo del BACKEND (Fastify), non del frontend (Next.js)
  baseURL: "https://localhost:3000", // togliere in prod
  // baseURL: process.env.API_BASE_URL || "http://213.210.20.137:6969", metter questo

  advanced: {
    useSecureCookies: false, // temporaneo, togliere in prod
  },

  // Devi includere chi fa la chiamata (Next.js) e l'IP del server stesso
  trustedOrigins: [
    "http://localhost:3000", // Sviluppo locale Next.js
    "http://213.210.20.137:3000",
    "http://213.210.20.137:6969", // Il backend
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: Role.GUEST,
      },
      birthDate: {
        type: "date",
        input: true,
      },
      aulettaId: {
        type: "number",
      },
      courseId: {
        type: "string",
        input: true,
      },
    },
  },
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;

export default auth;
export type Auth = typeof auth;
