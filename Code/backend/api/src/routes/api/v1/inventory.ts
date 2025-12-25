import type { FastifyInstance } from "fastify";
import { getSession } from "../../../utils/session.js";
import userHandler, {
  IGetUser,
  ISetUserData,
} from "../../../utils/handlers/user-handler.js";
import { sendError } from "../../../utils/response-handler.js";
import sessionMW from "../../../middlewares/session.js";
import permissionsMW from "../../../middlewares/permissions.js";
import { Role } from "../../../generated/prisma/client.js";
import inventoryHandler from "../../../utils/handlers/inventory-handler.js";

const BASE_PATH = "/inventory";
const ROLES_NEEDED = {
  inventory: [Role.TREASURER, Role.ADMIN],
  productsManagement: [Role.ADMIN],
};

export default async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get(
    `${BASE_PATH}/product`,
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.inventory)] },
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

        return { status: "OK", product: product };
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  fastify.post(
    `${BASE_PATH}/product/create`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.productsManagement)],
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

        return { status: "OK", product: newProduct };
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  fastify.put(
    `${BASE_PATH}/product/update`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.productsManagement)],
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
          { name: body.name }
        );

        return { status: "OK", product: updatedProduct };
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
