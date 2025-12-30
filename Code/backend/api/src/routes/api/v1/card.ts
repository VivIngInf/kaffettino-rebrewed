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
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.blockCard)] },
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
    { preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.blockCard)] },
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
