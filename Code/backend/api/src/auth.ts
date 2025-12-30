import { betterAuth, getEnvVar } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./plugins/prisma";
import { Role } from "./generated/prisma/client";

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: ["http://localhost:3000"],
  emailAndPassword: { enabled: true },
  baseURL: "http://localhost:3000",
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: Role.GUEST,
      },
      birthDate: {
        type: "date",
      },
      aulettaId: {
        type: "number",
      },
    },
  },
});

export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session;

export default auth;
