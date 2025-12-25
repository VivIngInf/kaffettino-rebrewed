import deviceHandler from "../utils/handlers/device-handler.js";
import { sendError } from "../utils/response-handler.js";

import { FastifyReply, FastifyRequest } from "fastify";

export default async function deviceMW(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization?.split(" ")[1]?.split("-");
  if (authHeader?.length != 2)
    return sendError(reply, {
      code: 401,
      responseCode: "INVALID_DEVICE_API_KEY",
    });

  const deviceName = authHeader[0];
  const accessKey = authHeader[1];

  if (!deviceName || !accessKey)
    return sendError(reply, {
      code: 401,
      responseCode: "INVALID_DEVICE_API_KEY",
    });

  const authorization = await deviceHandler.authorizeDevice(accessKey, {
    deviceName,
  });

  if (!authorization.status || !authorization.device)
    return sendError(reply, { code: 401 });

  request.device = authorization.device;
}
