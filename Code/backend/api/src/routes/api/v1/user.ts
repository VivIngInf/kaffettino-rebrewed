import type { FastifyInstance } from "fastify";
import { Role } from "@/generated/prisma/client";
import {
  walletHandler,
  sendError,
  sendSuccess,
  permissionsHandler,
  userHandler,
  IRequestWalletCreation,
  IGetUser,
  ISetUserData,
  ISetUserRole,
} from "@/utils/handlers";
import { sessionMW, permissionsMW } from "@/middlewares/mws";
import auditLog, { AuditActor } from "@/utils/audit";

const BASE_PATH = "/user";
const ROLES_NEEDED = {
  roleChange: [Role.ADMIN],
  walletRequest: [Role.USER],
};

interface IWalletRequestBody {
  userId: string;
  aulettaId: number;
}

export default async function userRoutes(fastify: FastifyInstance) {
  // GET https://localhost:3000/api/v1/user?includeWallets=true
  fastify.get(
    `${BASE_PATH}`,
    { preHandler: sessionMW },
    async (request, reply) => {
      try {
        const { includeWallets } = request.query as {
          includeWallets?: boolean;
        };
        const session = request.session;

        const user: IGetUser = await userHandler.getUser(
          session.user.id,
          includeWallets
        );

        return sendSuccess(reply, { user: user }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // PUT https://localhost:3000/api/v1/user
  // Content-Type: application/json
  // { birthDate: "2025-01-05T00:00:00.000Z", aulettaId: 19283232 }
  fastify.put(
    `${BASE_PATH}`,
    { preHandler: sessionMW },
    async (request, reply) => {
      try {
        const body: ISetUserData = request.body as ISetUserData;
        const session = request.session;

        const updateUser = await userHandler.setUserData(session.user.id, body);

        await auditLog({
          action: "UPDATE_USER_DATA",
          entity: "User",
          entityId: session.user.id.toString(),
          actorId: session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { user: updateUser },
          },
        });

        return sendSuccess(reply, { user: updateUser }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // PUT https://localhost:3000/api/v1/user/role
  // Content-Type: application/json
  // { role: "ADMIN" } (Accepted: Enum of Role)
  // Roles needed: ADMIN, SUPERUSER
  fastify.put(
    `${BASE_PATH}/role`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.roleChange)],
    },
    async (request, reply) => {
      try {
        const body: ISetUserRole = request.body as ISetUserRole;

        if (!body.role || !body.targetUserId)
          return sendError(reply, {
            code: 400,
            message: "Required param 'role' or 'targetUserId' is missing!",
          });

        /**
         * ROLE HIERARCHY VERIFICATION
         */
        const roleChangeVerification = permissionsHandler.verifyRoleChange(
          request.session,
          body.targetUserId,
          body.role
        );
        if (!roleChangeVerification.success)
          return sendError(reply, {
            code: 403,
            message: roleChangeVerification.message,
          });

        const setRole = await userHandler.setUserRole(
          request.session.user.id,
          body.role
        );

        await auditLog({
          action: "SET_USER_ROLE",
          entity: "User",
          entityId: body.targetUserId.toString(),
          actorId: request.session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { role: body.role },
          },
        });

        return sendSuccess(reply, { user: setRole }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );

  // PUT https://localhost:3000/api/v1/user/request-wallet
  // Content-Type: application/json
  // { aulettaId: 19283232, userId: "uuidv4" }
  fastify.put(
    `${BASE_PATH}/request-wallet`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.walletRequest)],
    },
    async (request, reply) => {
      try {
        const body: IWalletRequestBody =
          (await request.body) as IWalletRequestBody;

        if (!body.userId || !body.aulettaId)
          return sendError(reply, {
            code: 500,
            message: "Mandatory params 'userId' or 'aulettaId' are missing!",
          });

        const newWalletRequest: IRequestWalletCreation =
          await walletHandler.requestWalletCreation(
            body.userId,
            body.aulettaId
          );

        await auditLog({
          action: "REQUEST_WALLET_CREATION",
          entity: "WalletRequest",
          entityId: newWalletRequest.request?.id.toString() || "N/A",
          actorId: request.session.user.id.toString(),
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { walletRequest: newWalletRequest },
          },
        });

        return sendSuccess(
          reply,
          { walletRequest: newWalletRequest },
          { code: 200 }
        );
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
