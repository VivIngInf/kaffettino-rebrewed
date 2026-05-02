import { RequestStatus, Role } from "@/generated/prisma/enums";
import { FastifyInstance } from "fastify";
import { permissionsMW, sessionMW } from "@/middlewares/mws";
import { cardHandler, cardId, sendError, sendSuccess } from "@/utils/handlers";
import auditLog, { AuditActor } from "@/utils/audit";

const BASE_PATH = "/aulette";
const ROLES_NEEDED = {
  updatePin: [Role.USER, Role.TREASURER, Role.ADMIN],
  blockCard: [Role.USER, Role.TREASURER, Role.ADMIN],
  createCard: [Role.ADMIN, Role.TREASURER, Role.ADMIN],
};

export default async function auletteRoutes(fastify: FastifyInstance) {
  /**
   * POST localhost:3000/api/v1/aulette/create
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
}
