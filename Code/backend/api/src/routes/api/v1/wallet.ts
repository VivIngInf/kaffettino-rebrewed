import type { FastifyInstance } from "fastify";
import { RequestStatus, Role } from "@/generated/prisma/client";
import { IPagination, IRangeSearch, TAKE_GLOBAL } from "@/utils/search-utils";
import { walletHandler, sendError, sendSuccess } from "@/utils/handlers";
import { sessionMW, permissionsMW } from "@/middlewares/mws";
import auditLog, { AuditActor } from "@/utils/audit";

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
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.getWallets)],
      schema: {
        description: "Get wallets by user ID or auletta ID with pagination",
        tags: ["wallet"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            userId: {
              type: "array",
              items: { type: "string" },
              description: "Filter by user IDs",
            },
            aulettaId: {
              type: "array",
              items: { type: "number" },
              description: "Filter by auletta IDs",
            },
            page: {
              type: "number",
              description: "Page number for pagination",
            },
            limit: {
              type: "number",
              description: "Number of results per page",
            },
          },
        },
        response: {
          200: {
            description: "Wallets retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              wallets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    aulettaId: { type: "number" },
                    balance: { type: "number" },
                  },
                },
              },
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
    },
  );

  // GET https://localhost:3000/api/v1/wallet/topups?userId=[]&walletId=[]&limit=10&page=1&range={max=121&min=232}
  fastify.get(
    `${BASE_PATH}/topup`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.getWallets)],
      schema: {
        description: "Get wallet top-ups with pagination and range filters",
        tags: ["wallet"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            userId: {
              type: "array",
              items: { type: "string" },
              description: "Filter by user IDs",
            },
            walletId: {
              type: "array",
              items: { type: "string" },
              description: "Filter by wallet IDs",
            },
            page: {
              type: "number",
              description: "Page number for pagination",
            },
            limit: {
              type: "number",
              description: "Number of results per page",
            },
            range: {
              type: "object",
              properties: {
                max: { type: "number" },
                min: { type: "number" },
              },
            },
          },
        },
        response: {
          200: {
            description: "Top-ups retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              topUps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    walletId: { type: "string" },
                    amount: { type: "number" },
                    description: { type: "string" },
                  },
                },
              },
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

        await auditLog({
          action: "GET_WALLET_TOPUPS",
          entity: "WalletTopUp",
          entityId: "N/A",
          actorId: request.session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { topUps: topUps },
          },
        });

        return sendSuccess(reply, { topUps: topUps }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );

  // POST https://localhost:3000/api/v1/wallet/topup
  // Content-Type: application/json
  // { walletId: uuidv4, amount: number, description: string }
  fastify.post(
    `${BASE_PATH}/topup`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.topUpWallet)],
      schema: {
        description: "Top up a wallet with specified amount",
        tags: ["wallet"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["walletId", "amount"],
          properties: {
            walletId: {
              type: "string",
              description: "ID of the wallet to top up",
            },
            amount: {
              type: "number",
              description: "Amount to add to the wallet",
            },
            description: {
              type: "string",
              description: "Optional description for the top-up",
            },
          },
        },
        response: {
          200: {
            description: "Wallet topped up successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              topUp: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  walletId: { type: "string" },
                  amount: { type: "number" },
                  description: { type: "string" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing walletId or amount",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          401: {
            description: "Unauthorized - cannot top up own wallet",
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
          (wallet) => wallet.id === body.walletId,
        ).length;

        if (userOwnsWallet)
          return sendError(reply, {
            code: 401,
            message: "You cannot TopUp youself!",
          });

        const topUp = await walletHandler.topUp(
          body.walletId,
          body.amount,
          body.description,
        );

        await auditLog({
          action: "TOP_UP_WALLET",
          entity: "WalletTopUp",
          entityId: topUp.id.toString(),
          actorId: request.session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { topUp: topUp },
          },
        });

        return sendSuccess(reply, { topUp: topUp }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );

  // POST https://localhost:3000/api/v1/wallet/create
  // Content-Type: application/json
  // { aulettaId: 19283232, userId: "uuidv4" }
  fastify.post(
    `${BASE_PATH}/create`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.createWallet)],
      schema: {
        description: "Create a new wallet for a user",
        tags: ["wallet"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "aulettaId"],
          properties: {
            userId: {
              type: "string",
              description: "ID of the user",
            },
            aulettaId: {
              type: "number",
              description: "ID of the auletta",
            },
          },
        },
        response: {
          200: {
            description: "Wallet created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              wallet: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  userId: { type: "string" },
                  aulettaId: { type: "number" },
                  balance: { type: "number" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing userId or aulettaId",
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
        const body: { userId: string; aulettaId: number } =
          (await request.body) as { userId: string; aulettaId: number };

        if (!body.userId || !body.aulettaId)
          return sendError(reply, {
            code: 400,
            message: "Mandatory params 'userId' or 'aulettaId' are missing!",
          });

        const newWallet = await walletHandler.createWallet(
          body.userId,
          body.aulettaId,
        );

        await auditLog({
          action: "CREATE_WALLET",
          entity: "Wallet",
          entityId: newWallet.id,
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { wallet: newWallet },
          },
        });

        return sendSuccess(reply, { wallet: newWallet }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );

  // GET https://localhost:3000/api/v1/wallet/requests?aulettaId=[]&status=[]
  fastify.get(
    `${BASE_PATH}/requests`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.createWallet)],
      schema: {
        description: "Get wallet creation requests by auletta and status",
        tags: ["wallet"],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            aulettaId: {
              type: "array",
              items: { type: "number" },
              description: "Filter by auletta IDs",
            },
            status: {
              type: "array",
              items: { type: "string" },
              description: "Filter by request status",
            },
          },
        },
        response: {
          200: {
            description: "Wallet requests retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              walletRequests: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    aulettaId: { type: "number" },
                    status: { type: "string" },
                  },
                },
              },
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
          { code: 200 },
        );
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    },
  );
}
