import type { FastifyInstance } from "fastify";
import userHandler, { IGetUser } from "../../../utils/user-handler.js";
import sendError from "../../../utils/error-handler.js";
import sessionMW from "../../../middlewares/session.js";
import permissionsMW from "../../../middlewares/permissions.js";
import { RequestStatus, Role } from "../../../generated/prisma/client.js";
import walletHandler from "@/utils/wallet-handler.js";

const BASE_PATH = "/wallet";
const ROLES_NEEDED = [Role.TREASURER, Role.ADMIN];

export default async function walletRoutes(fastify: FastifyInstance) {
  // GET https://localhost:3000/api/v1/wallet
  fastify.get(
    `${BASE_PATH}`,
    { preHandler: sessionMW },
    async (request, reply) => {
      try {
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // POST https://localhost:3000/api/v1/wallet/create
  // Content-Type: application/json
  // { aulettaId: 19283232, userId: "uuidv4" }
  fastify.post(
    `${BASE_PATH}/create`,
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED)] },
    async (request, reply) => {
      try {
        const body: { userId: string; aulettaId: number } =
          (await request.body) as { userId: string; aulettaId: number };

        if (!body.userId || !body.aulettaId)
          return sendError(reply, {
            code: 400,
            message: "Mandatory params 'userId' or 'aulettaId' are missing!",
          });

        const newWallet = await walletHandler.createWallet(
          body.userId,
          body.aulettaId
        );

        return newWallet;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // GET https://localhost:3000/api/v1/wallet/requests?aulettaId=[]&status=[]
  fastify.get(
    `${BASE_PATH}/requests`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED)],
    },
    async (request, reply) => {
      try {
        const { aulettaId, status } = (await request.query) as {
          aulettaId?: number[];
          status?: RequestStatus[];
        };

        const walletRequests = await walletHandler.checkWalletRequests({
          aulettaId,
          status,
        });

        return walletRequests;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
