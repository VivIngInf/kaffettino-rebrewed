import { sendError } from "../utils/handlers/response-handler";
import { getSession } from "../utils/session";
import { FastifyReply, FastifyRequest } from "fastify";

/**
 * Fastify middleware to validate and attach the user session to the request.
 *
 * @param request - The incoming Fastify request object.
 * @param reply - The Fastify reply object used to send responses.
 * @returns Resolves when the session is validated and attached, or sends a 401 error if the user is not authenticated.
 *
 * @remarks
 * This middleware retrieves the session using `getSession`. If the session or user is missing,
 * it sends a 401 Unauthorized error using `sendError`. Otherwise, it attaches the session to the request object.
 */
export default async function sessionMW(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const session = await getSession(request);
  if (!session?.user) return sendError(reply, { code: 401 });

  request.session = session;
}
