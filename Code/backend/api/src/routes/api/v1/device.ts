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
      const body = request.body as { deviceName: string; info: string };
      // Check if device already has a pending request
      const device = await deviceHandler.getDevice({
        deviceName: body.deviceName,
      });

      const existingRequest = await deviceHandler.checkRequests({
        deviceId: device?.id,
      });

      if (existingRequest.count.approved) {
      }
      if (existingRequest.count.pending > 0) {
      }
    } catch (error) {
      sendError(reply, { code: 500, error });
    }
  });
}
