import sessionMW from "../../../middlewares/session.js";
import { RequestStatus, Role } from "../../../generated/prisma/enums.js";
import sendError from "../../../utils/error-handler.js";
import { FastifyInstance } from "fastify";
import permissionsMW from "../../../middlewares/permissions.js";
import cardHandler, { cardId } from "../../../utils/card-handler.js";
const BASE_PATH = "/card";
const ROLES_NEEDED = {
  updatePin: [Role.USER, Role.TREASURER, Role.ADMIN],
  createCard: [Role.ADMIN, Role.TREASURER, Role.ADMIN],
};

export default async function deviceRoutes(fastify: FastifyInstance) {
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

        return { status: "OK", card: newCard };
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

        return { status: "OK" };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );
}
