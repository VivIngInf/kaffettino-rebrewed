// src/routes/user.ts
import type { FastifyInstance } from "fastify";
import { getSession } from "@/utils/session";

export default async function protectedRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/protected",
    {
      schema: {
        description: "Protected endpoint requiring authentication",
        tags: ["system"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "User session data",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - invalid or missing session",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const session = await getSession(request);
      if (!session?.user)
        return reply.code(401).send({ error: "Unauthorized" });
      return { user: session.user };
    },
  );
}
