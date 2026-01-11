import { RequestStatus, Role } from "@/generated/prisma/enums";
import { FastifyInstance } from "fastify";
import { permissionsMW, sessionMW } from "@/middlewares/mws";
import { cardHandler, cardId, sendError, sendSuccess } from "@/utils/handlers";
import auditLog, { AuditActor } from "@/utils/audit";

const BASE_PATH = "/card";
const ROLES_NEEDED = {
  updatePin: [Role.USER, Role.TREASURER, Role.ADMIN],
  blockCard: [Role.USER, Role.TREASURER, Role.ADMIN],
  createCard: [Role.ADMIN, Role.TREASURER, Role.ADMIN],
};

export default async function cardRoutes(fastify: FastifyInstance) {
  /**
   * POST localhost:3000/api/v1/card/create
   * {
   *  userId: string,
   * }
   */
  fastify.post(
    `${BASE_PATH}/create`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.createCard)],
      schema: {
        description: "Create a new NFC card for a user",
        tags: ["card"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: {
              type: "string",
              description: "ID of the user to assign the card to",
            },
          },
        },
        response: {
          200: {
            description: "Card created successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              card: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  userId: { type: "string" },
                  blocked: { type: "boolean" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing userId",
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
        const body = (await request.body) as { userId: string };

        if (!body.userId)
          return sendError(reply, {
            code: 400,
            message: "Missing mandatory param 'userId'.",
          });

        const newCard = await cardHandler.createCard(body.userId);

        await auditLog({
          action: "CREATE_CARD",
          entity: "Card",
          entityId: newCard.id,
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { card: newCard },
          },
        });

        return sendSuccess(reply, { card: newCard }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * PUT localhost:3000/api/v1/card/pin
   * {
   *  cardId: cardId,
   *  pin: number
   * }
   */
  fastify.put(
    `${BASE_PATH}/pin`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.updatePin)],
      schema: {
        description: "Update or remove PIN for a card",
        tags: ["card"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cardId"],
          properties: {
            cardId: {
              type: "string",
              description: "ID of the card to update PIN",
            },
            pin: {
              type: "number",
              description: "PIN number (4-6 digits) or null to remove PIN",
              nullable: true,
              minimum: 4,
              maximum: 6,
            },
          },
        },
        response: {
          200: {
            description: "PIN updated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
            },
          },
          400: {
            description:
              "Bad request - missing cardId or invalid PIN requirements",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
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
        const body = (await request.body) as { cardId: cardId; pin: number };

        if (!body.cardId)
          return sendError(reply, {
            code: 400,
            message: "Missing mandatory param 'cardId'.",
          });

        if (body.pin < 4 || body.pin > 6)
          return sendError(reply, {
            code: 400,
            responseCode: "CARD_PIN_REQUIREMENTS",
          });

        const pin = body.pin ? body.pin : null;

        const setPin = await cardHandler.setCardPin(body.cardId, pin);

        await auditLog({
          action: "UPDATE_PIN",
          entity: "Card",
          entityId: body.cardId,
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        return sendSuccess(reply, null, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * PUT localhost:3000/api/v1/card/block
   * {
   *  cardId: cardId,
   * }
   */
  fastify.put(
    `${BASE_PATH}/block`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.blockCard)],
      schema: {
        description: "Block a card to prevent its usage",
        tags: ["card"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cardId"],
          properties: {
            cardId: {
              type: "string",
              description: "ID of the card to block",
            },
          },
        },
        response: {
          200: {
            description: "Card blocked successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              card: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  blocked: { type: "boolean" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing cardId",
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
        const body = (await request.body) as { cardId?: cardId };

        if (!body.cardId)
          return sendError(reply, {
            code: 400,
            message: "Mandatory param 'cardId' is missing!",
          });

        const block = await cardHandler.setBlock(body.cardId, true);

        await auditLog({
          action: "BLOCK_CARD",
          entity: "Card",
          entityId: body.cardId,
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { blocked: true },
          },
        });

        return sendSuccess(reply, { card: block }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * PUT localhost:3000/api/v1/card/unblock
   * {
   *  cardId: cardId,
   * }
   */
  fastify.put(
    `${BASE_PATH}/unblock`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.blockCard)],
      schema: {
        description: "Unblock a previously blocked card",
        tags: ["card"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["cardId"],
          properties: {
            cardId: {
              type: "string",
              description: "ID of the card to unblock",
            },
          },
        },
        response: {
          200: {
            description: "Card unblocked successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              card: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  blocked: { type: "boolean" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing cardId",
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
        const body = (await request.body) as { cardId?: cardId };

        if (!body.cardId)
          return sendError(reply, {
            code: 400,
            message: "Mandatory param 'cardId' is missing!",
          });

        const block = await cardHandler.setBlock(body.cardId, false);

        await auditLog({
          action: "UNBLOCK_CARD",
          entity: "Card",
          entityId: body.cardId,
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { blocked: false },
          },
        });

        return sendSuccess(reply, { card: block }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );
}
