import fp from "fastify-plugin";
import swagger from "@fastify/swagger";

const swaggerPlugin = fp(async (fastify) => {
  fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "My API",
        description: "API documentation",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development server",
        },
      ],
    },
  });
});
export default swaggerPlugin;
