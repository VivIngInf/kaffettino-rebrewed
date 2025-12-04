import sessionMW from "../../../middlewares/session.js";
import { RequestStatus, Role } from "../../../generated/prisma/enums.js";
import deviceHandler from "../../../utils/device-handler.js";
import sendError from "../../../utils/error-handler.js";
import { FastifyInstance } from "fastify";
import permissionsMW from "../../../middlewares/permissions.js";
const BASE_PATH = "/device";
const ROLES_NEEDED = {
  acceptRequests: [Role.ADMIN],
};

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
      const body = (await request.body) as {
        deviceName?: string;
        aulettaId?: number;
      };
      if (!body.deviceName || !body.aulettaId)
        return sendError(reply, {
          code: 400,
          message: "Mandatory params 'deviceName' or 'aulettaId' are missing!",
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

  fastify.put(
    `${BASE_PATH}`,
    {
      preHandler: [sessionMW, permissionsMW(ROLES_NEEDED.acceptRequests)],
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as {
          deviceName?: string;
          deviceId?: string;
        };

        if (!body.deviceId)
          return sendError(reply, {
            code: 400,
            message: "Mandatory param 'deviceId' is missing!",
          });

        const acceptedRequest = await deviceHandler.acceptDeviceRequest({
          deviceId: body.deviceId,
        });

        if (acceptedRequest.status == "NOT_FOUND")
          return sendError(reply, {
            code: 404,
            responseCode: "DEVICE_REQUEST_NOT_FOUND",
          });

        return acceptedRequest.request;
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  // MISSING: Accept device registration
}
