import fp from "fastify-plugin";
import cors from "@fastify/cors";

const corsPlugin = fp(async (fastify) => {
  fastify.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        process.env.CLIENT_ORIGIN || "http://localhost:6969",
        "http://localhost:3000",
      ];

      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowd by CORS"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400,
  });
});

export default corsPlugin;
