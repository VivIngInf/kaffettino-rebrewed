import { sendError } from "@/utils/handlers/response-handler";
import { Role } from "@/generated/prisma/enums";
import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Middleware to check if the current user's role is included in the accepted roles.
 *
 * @param request - The Fastify request object, expected to have a session with a user role.
 * @param reply - The Fastify reply object used to send responses.
 * @param rolesAccepted - An array of roles that are allowed to access the route.
 * @returns Sends a 403 error response if the user's role is not accepted.
 */
export default function permissionsMW(rolesAccepted: Role[]) {
  return async function middleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const userRole = request.session?.user.role as Role;
    if (
      !rolesAccepted.includes(userRole ?? Role.GUEST) &&
      userRole != Role.SUPERUSER //SUPER USER HAS COMPLETE BYPASS
    )
      return sendError(reply, { code: 403 });
  };
}
