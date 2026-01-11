import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

const swaggerPlugin = fp(async (fastify) => {
  fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "Vivere Services API",
        description:
          "API documentation for Vivere Services - Kaffettino Rebrewed",
        version: "0.1.0",
        contact: {
          name: "API Support",
          url: "https://github.com/kaffettino-rebrewed",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: "http://localhost:6969",
          description: "Development server",
        },
        {
          url: "https://api.vivere-services.com",
          description: "Production server",
        },
      ],
      tags: [
        { name: "user", description: "User management and profile operations" },
        { name: "wallet", description: "Wallet and balance management" },
        {
          name: "transaction",
          description: "Transaction history and operations",
        },
        { name: "device", description: "Device registration and management" },
        { name: "card", description: "NFC card management operations" },
        { name: "inventory", description: "Product inventory management" },
        { name: "aulette", description: "Auletta (location) management" },
        { name: "auth", description: "Authentication endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token obtained from Better Auth authentication",
          },
          deviceAuth: {
            type: "http",
            scheme: "bearer",
            description: "Device API key in format: {deviceName}-{accessKey}",
          },
        },
      },
      externalDocs: {
        url: "https://github.com/kaffettino-rebrewed",
        description: "Project documentation on GitHub",
      },
    },
  });

  fastify.register(swaggerUI, {
    routePrefix: "/docs",
  });
});

export default swaggerPlugin;
