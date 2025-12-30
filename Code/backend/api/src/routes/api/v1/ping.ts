// src/routes/user.ts
import type { FastifyInstance } from "fastify";
import { getSession } from "@/utils/session";

export default async function pingRoutes(fastify: FastifyInstance) {
  fastify.get("/ping", async (request, reply) => {
    //const session = await getSession(request);
    //if (!session?.user) return reply.code(401).send({ error: "Unauthorized" });
    //return { user: session.user };

    return { hello: "world!" };
  });
}
