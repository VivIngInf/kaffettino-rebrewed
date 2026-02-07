import type { FastifyInstance } from "fastify";
import { Role } from "@/generated/prisma/client";
import { inventoryHandler, sendError, sendSuccess } from "@/utils/handlers";
import { sessionMW, permissionsMW } from "@/middlewares/mws";
import auditLog, { AuditActor } from "@/utils/audit";

const BASE_PATH = "/inventory";
const ROLES_NEEDED = {
  inventory: [Role.TREASURER, Role.ADMIN],
  productsManagement: [Role.ADMIN],
};

export default async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get(
    `${BASE_PATH}/product`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.inventory)],
      schema: {
        description: "Get a product by ID",
        tags: ["inventory"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: {
              type: "number",
              description: "ID of the product to retrieve",
            },
          },
        },
        response: {
          200: {
            description: "Product retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              product: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                },
              },
            },
          },
          404: {
            description: "Product not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { productId } = request.query as {
          productId: number;
        };

        const product = inventoryHandler.getProduct(productId);
        if (!product)
          return sendError(reply, {
            code: 404,
            responseCode: "PRODUCT_NOT_FOUND",
          });

        return sendSuccess(reply, { product: product }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );

  fastify.post(
    `${BASE_PATH}/product/create`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.productsManagement)],
      schema: {
        description: "Create a new product",
        tags: ["inventory"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Name of the product",
            },
          },
        },
        response: {
          200: {
            description: "Product created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              product: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing name",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as { name?: string };

        if (!body.name && body.name != "")
          return sendError(reply, {
            code: 400,
            message: "Mandatory param 'name' is missing!",
          });

        const newProduct = await inventoryHandler.createProduct(body.name);

        await auditLog({
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: newProduct.id.toString(),
          actorId: request.session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { product: newProduct },
          },
        });

        return sendSuccess(reply, { product: newProduct }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );

  fastify.put(
    `${BASE_PATH}/product/update`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.productsManagement)],
      schema: {
        description: "Update an existing product",
        tags: ["inventory"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["productId", "name"],
          properties: {
            productId: {
              type: "number",
              description: "ID of the product to update",
            },
            name: {
              type: "string",
              description: "New name for the product",
            },
          },
        },
        response: {
          200: {
            description: "Product updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              product: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing productId or name",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          404: {
            description: "Product not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as {
          productId?: number;
          name?: string;
        };

        if (!body.name || !body.productId)
          return sendError(reply, {
            code: 400,
            message: "Mandatory param 'name' or 'productId' are missing!",
          });

        const product = await inventoryHandler.getProduct(body.productId);
        if (!product)
          return sendError(reply, {
            code: 404,
            responseCode: "PRODUCT_NOT_FOUND",
          });

        const updatedProduct = await inventoryHandler.updateProduct(
          body.productId,
          { name: body.name },
        );

        await auditLog({
          action: "UPDATE_PRODUCT",
          entity: "Product",
          entityId: body.productId.toString(),
          actorId: request.session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { product: updatedProduct },
          },
        });

        return sendSuccess(reply, { product: updatedProduct }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );
}
