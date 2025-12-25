import type { FastifyInstance } from "fastify";
import userHandler, {
  IGetUser,
  ISetUserData,
  ISetUserRole,
} from "../../../utils/handlers/user-handler.js";
import { sendError } from "../../../utils/response-handler.js";
import sessionMW from "../../../middlewares/session.js";
import permissionsMW from "../../../middlewares/permissions.js";
import { Role } from "../../../generated/prisma/client.js";
import permissionsHandler from "../../../utils/handlers/permissions-handler.js";
import walletHandler, {
  IRequestWalletCreation,
} from "../../../utils/handlers/wallet-handler.js";

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

        return user;
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

        return updateUser;
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

        return setRole;
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

        return newWalletRequest;
      } catch (error) {
        return sendError(reply, { code: 500, error: error });
      }
    }
  );
}
