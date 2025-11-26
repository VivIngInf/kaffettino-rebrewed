import type { FastifyInstance } from "fastify";
import userHandler, { IGetUser } from "../../../utils/user-handler.js";
import sendError from "../../../utils/error-handler.js";
import sessionMW from "../../../middlewares/session.js";
import permissionsMW from "../../../middlewares/permissions.js";
import { RequestStatus, Role } from "../../../generated/prisma/client.js";
import walletHandler from "@/utils/wallet-handler.js";
import { send } from "node:process";
import {
  IPagination,
  IRangeSearch,
  TAKE_GLOBAL,
} from "../../../utils/search-utils.js";
import { request } from "node:http";

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

        return wallets;
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

        return topUps;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // POST https://localhost:3000/api/v1/wallet/topup
  // Content-Type: application/json
  // { walletId: uuidv4, amount: number }
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

        return topUp;
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

        return walletRequests;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
