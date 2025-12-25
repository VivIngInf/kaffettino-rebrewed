import type { FastifyInstance } from "fastify";
import sessionMW from "../../../middlewares/session.js";
import permissionsMW from "../../../middlewares/permissions.js";
import { RequestStatus, Role } from "../../../generated/prisma/client.js";
import {
  IPagination,
  IRangeSearch,
  TAKE_GLOBAL,
} from "../../../utils/search-utils.js";
import {
  walletHandler,
  sendError,
  sendSuccess,
} from "../../../utils/handlers.js";

const BASE_PATH = "/wallet";
const ROLES_NEEDED = {
  getWallets: [Role.TREASURER, Role.ADMIN],
  createWallet: [Role.TREASURER, Role.ADMIN],
  topUpWallet: [Role.TREASURER, Role.ADMIN],
};

interface IGetWalletQuery {
  userId?: string[];
  aulettaId?: number[];
  page?: number;
  limit?: number;
}

interface IGetTopUpsQuery extends IPagination, IRangeSearch {
  userId?: string[];
  walletId?: string[];
}

interface ITopUpBody {
  walletId?: string;
  amount?: number;
  description?: string;
}

export default async function walletRoutes(fastify: FastifyInstance) {
  // GET https://localhost:3000/api/v1/wallet?userId="uuidv4"&aulettaId=29382893&limit=10&page=1
  fastify.get(
    `${BASE_PATH}`,
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.getWallets)] },
    async (request, reply) => {
      try {
        const { userId, aulettaId, page, limit }: IGetWalletQuery =
          (await request.query) as IGetWalletQuery;

        const take = limit ?? TAKE_GLOBAL;
        const skip = page ? page * take : 0;

        const wallets = await walletHandler.getWallets({
          userId,
          aulettaId,
          take,
          skip,
        });

        return sendSuccess(reply, { wallets: wallets }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // GET https://localhost:3000/api/v1/wallet/topups?userId=[]&walletId=[]&limit=10&page=1&range={max=121&min=232}
  fastify.get(
    `${BASE_PATH}/topup`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.getWallets)],
    },
    async (request, reply) => {
      try {
        const { userId, walletId, page, limit, range }: IGetTopUpsQuery =
          (await request.query) as IGetTopUpsQuery;

        const take = limit ?? TAKE_GLOBAL;
        const skip = page ? page * take : 0;

        const topUps = await walletHandler.getWalletTopUps({
          userId,
          walletId,
          take,
          skip,
          lte: range.max,
          gte: range.min,
        });

        return sendSuccess(reply, { topUps: topUps }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // POST https://localhost:3000/api/v1/wallet/topup
  // Content-Type: application/json
  // { walletId: uuidv4, amount: number, description: string }
  fastify.post(
    `${BASE_PATH}/topup`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.topUpWallet)],
    },
    async (request, reply) => {
      try {
        const body: ITopUpBody = (await request.body) as ITopUpBody;

        if (!body.walletId || !body.amount)
          return sendError(reply, {
            code: 400,
            message: "Mandatory params 'walletId' or 'amount' are missing!",
          });

        const userWallets = await walletHandler.getWallets({
          userId: [request.session.user.id],
        });

        const userOwnsWallet = userWallets.filter(
          (wallet) => wallet.id === body.walletId
        ).length;

        if (userOwnsWallet)
          return sendError(reply, {
            code: 401,
            message: "You cannot TopUp youself!",
          });

        const topUp = await walletHandler.topUp(
          body.walletId,
          body.amount,
          body.description
        );

        return sendSuccess(reply, { topUp: topUp }, { code: 200 });
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
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.createWallet)] },
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

        return sendSuccess(reply, { wallet: newWallet }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // GET https://localhost:3000/api/v1/wallet/requests?aulettaId=[]&status=[]
  fastify.get(
    `${BASE_PATH}/requests`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.createWallet)],
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

        return sendSuccess(
          reply,
          { walletRequests: walletRequests },
          { code: 200 }
        );
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
