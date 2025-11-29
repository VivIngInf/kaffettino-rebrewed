import type { FastifyInstance } from "fastify";
import { getSession } from "../../../utils/session.js";
import userHandler, {
  IGetUser,
  ISetUserData,
} from "../../../utils/user-handler.js";
import sendError from "../../../utils/error-handler.js";
import sessionMW from "../../../middlewares/session.js";
import permissionsMW from "../../../middlewares/permissions.js";
import { Role } from "../../../generated/prisma/client.js";
import inventoryHandler from "@/utils/inventory-handler.js";

const BASE_PATH = "/inventory";
const ROLES_NEEDED = {
  inventory: [Role.TREASURER, Role.ADMIN],
  productsManagement: [Role.ADMIN],
};

export default async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get(
    `${BASE_PATH}`,
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.inventory)] },
    async (request, reply) => {
      try {
        const { aulettaId, productId } = request.query as {
          aulettaId?: number;
          productId: number;
        };

        return "";
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  fastify.post(
    `${BASE_PATH}/products`,
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

        return newProduct;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  fastify.put(
    `${BASE_PATH}/products`,
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

        const newProduct = await inventoryHandler.updateProduct(
          body.productId,
          { name: body.name }
        );

        return newProduct;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
