import { RequestStatus } from "../../../generated/prisma/enums.js";
import deviceHandler from "../../../utils/device-handler.js";
import sendError from "../../../utils/error-handler.js";
import { FastifyInstance } from "fastify";
const BASE_PATH = "/device";

export default async function deviceRoutes(fastify: FastifyInstance) {
  // DEVICE REGISTRATION
  /*
    FLOW:
     - Device send registration request
     - Request is saved as DeviceRegistration record
     - Device send access request -> if status is APPROVED -> device apiKey is sent to device (hash sha256)
  */
  // DEVICE LIST
  // DEVICE LOCATIONS

  fastify.post(`${BASE_PATH}/register`, async (request, reply) => {
    try {
      const body = request.body as { deviceName?: string; aulettaId?: number };
      if (!body.deviceName || !body.aulettaId)
        return sendError(reply, {
          code: 400,
          message: "Mandatory params 'walletId' or 'amount' are missing!",
        });

      const device = await deviceHandler.getDevice({
        deviceName: body.deviceName,
      });

      // Check if device is already verified
      if (device?.verified && device.apiKey)
        return sendError(
          reply,
          {
            code: 409,
            responseCode: "DEVICE_ALREADY_REGISTERED",
          },
          request
        );

      const existingRequest = await deviceHandler.checkRequests({
        deviceId: device?.id,
      });

      // Check if device already has a pending request
      if (existingRequest.count.pending > 0)
        return sendError(
          reply,
          {
            code: 409,
            responseCode: "DEVICE_REQUEST_PENDING",
          },
          request
        );

      const newDeviceRequest = await deviceHandler.createDeviceRequest(
        body.deviceName,
        body.aulettaId
      );

      return newDeviceRequest;
    } catch (error) {
      return sendError(reply, { code: 500, error });
    }
  });
}
