import { RequestStatus, Role } from "@/generated/prisma/enums";
import { FastifyInstance } from "fastify";
import { permissionsMW, sessionMW } from "@/middlewares/mws";
import { cardHandler, auletteHandler, cardId, sendError, sendSuccess, ICreateAuletta } from "@/utils/handlers";
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
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as ICreateAuletta;

        if (!body.location || !body.name || !body.telegramId || !body.number)
          return sendError(reply, {
            code: 400,
            message: "Missing mandatory param 'location', 'name', 'telegramId' or 'number'.",
          });

        const newAuletta = await auletteHandler.createAuletta({
          name: body.name,
          location: body.location,
          telegramId: body.telegramId,
          number: body.number
        });

        await auditLog({
          action: "CREATE_AULETTA",
          entity: "Aulette",
          entityId: newAuletta.id.toString(),
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { card: newAuletta },
          },
        });

        return sendSuccess(reply, { card: newAuletta }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  fastify.get(
    `${BASE_PATH}/list`,
    async (request, reply) => {
      try {
        const { location } = request.query as { location?: string };

        const aulette = await auletteHandler.getAulette(location);

        return sendSuccess(reply, { aulette }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );
}
