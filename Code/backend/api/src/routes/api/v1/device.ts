import { Inventory } from "../../../generated/prisma/client.js";
import { request } from "node:http";
import sessionMW from "../../../middlewares/session.js";
import { RequestStatus, Role } from "../../../generated/prisma/enums.js";
import deviceHandler from "../../../utils/device-handler.js";
import sendError from "../../../utils/error-handler.js";
import { FastifyInstance } from "fastify";
import permissionsMW from "../../../middlewares/permissions.js";
import deviceMW from "../../../middlewares/device.js";
import auletteHandler from "../../../utils/aulette-handler.js";
import inventoryHandler from "../../../utils/inventory-handler.js";
import cardHandler from "../../../utils/card-handler.js";
import walletHandler from "../../../utils/wallet-handler.js";
import cardMW from "../../../middlewares/card.js";
import transactionHandler from "../../../utils/transaction-handler.js";
const BASE_PATH = "/device";
const ROLES_NEEDED = {
  acceptRequests: [Role.ADMIN],
};

export default async function deviceRoutes(fastify: FastifyInstance) {
  /**
   * POST localhost:3000/api/v1/device/register
   * {
   *  deviceId: string,
   *  deviceName: string
   * }
   */
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
      if (
        existingRequest.count.pending > 0 ||
        existingRequest.count.awaitingClient > 0
      )
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

      return { status: "OK", request: newDeviceRequest };
    } catch (error) {
      return sendError(reply, { code: 500, error });
    }
  });

  /**
   * POST localhost:3000/api/v1/device/accept
   * {
   *  deviceId: string,
   *  deviceName: string
   * }
   */
  fastify.post(
    `${BASE_PATH}/accept`,
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

        return {
          status: acceptedRequest.status,
          request: acceptedRequest.request,
        };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * POST localhost:3000/api/v1/device/request-first-key
   * {
   *  deviceId: string,
   *  deviceName: string
   * }
   */
  fastify.post(`${BASE_PATH}/request-first-key`, async (request, reply) => {
    try {
      const body = (await request.body) as {
        deviceId: string;
        deviceName: string;
      };

      const deviceRequest = (
        await deviceHandler.checkRequests({
          deviceId: body.deviceId,
          deviceName: body.deviceName,
          status: [RequestStatus.AWAITING_CLIENT, RequestStatus.APPROVED],
        })
      ).statuses;

      if (!deviceRequest.awaitingClient)
        return sendError(reply, {
          code: 400,
          responseCode: "DEVICE_NO_ACCEPTED_REQUESTS",
        });

      if (!body.deviceId || !body.deviceName)
        return sendError(reply, {
          code: 400,
          message: "Mandatory params 'deviceId' and 'deviceName' are missing!",
        });

      const device = await deviceHandler.generateDeviceAccessKey({
        deviceId: body.deviceId,
        deviceName: body.deviceName,
      });

      if (device)
        await deviceHandler.completeDeviceRequest(
          deviceRequest.awaitingClient[0]?.id
        );

      return { status: "OK", device: device, apiKey: device.apiKey };
    } catch (error) {
      return sendError(reply, { code: 500, error });
    }
  });

  /**
   * PUT localhost:3000/api/v1/device/regenerate-access-key
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   */
  fastify.put(
    `${BASE_PATH}/regenerate-access-key`,
    { preHandler: deviceMW },
    async (request, reply) => {
      try {
        const newDeviceKey = await deviceHandler.generateDeviceAccessKey({
          deviceName: request.device.deviceName,
        });

        return {
          status: "OK",
          device: newDeviceKey,
          apiKey: newDeviceKey.apiKey,
        };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * GET localhost:3000/api/v1/device/aulette
   */
  fastify.get(`${BASE_PATH}/aulette`, async (request, reply) => {
    try {
      const { location } = (await request.query) as { location?: string };

      const aulette = await auletteHandler.getAulette(location);

      return {
        status: "OK",
        aulette: aulette,
      };
    } catch (error) {
      return sendError(reply, { code: 500, error });
    }
  });

  /**
   * GET localhost:3000/api/v1/device/inventory
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   */
  fastify.get(
    `${BASE_PATH}/inventory`,
    { preHandler: deviceMW },
    async (request, reply) => {
      try {
        const device = await deviceHandler.getDevice({
          deviceName: request.device.deviceName,
        });

        if (!device?.aulettaId)
          return sendError(reply, {
            code: 401,
            responseCode: "NO_AULETTA_ASSIGNED_TO_DEVICE",
          });

        const inventories = await inventoryHandler.getInventories(
          device?.aulettaId
        );
        const inventoryIds = inventories.map((inventory) => inventory.id);
        const products = await inventoryHandler.listItems(inventoryIds);

        return {
          status: "OK",
          inventories: inventories,
          products: products,
        };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * GET localhost:3000/api/v1/device/wallets
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   * X-PaymentCard-Id: uuidv4
   */
  fastify.get(
    `${BASE_PATH}/wallets`,
    { preHandler: [deviceMW, cardMW] },
    async (request, reply) => {
      try {
        const wallets = await walletHandler.getWallets({
          userId: [request.card.userId],
        });

        return { status: "OK", wallets: wallets };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * GET localhost:3000/api/v1/device/wallet-auletta
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   * X-PaymentCard-Id: uuidv4
   */
  fastify.get(
    `${BASE_PATH}/wallet-auletta`,
    { preHandler: [deviceMW, cardMW] },
    async (request, reply) => {
      try {
        const walletAuletta = (
          await walletHandler.getWallets({
            userId: [request.card.userId],
            aulettaId: [request.device.aulettaId],
          })
        )[0];

        if (!walletAuletta)
          return sendError(reply, {
            code: 404,
            responseCode: "WALLET_NOT_FOUND",
          });

        return { status: "OK", wallet: walletAuletta };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );

  /**
   * POST localhost:3000/api/v1/device/buy-product
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   * X-PaymentCard-Id: uuidv4
   * {
   *  productId: number,
   *  quantity: number,
   *  discount: number
   * }
   */
  fastify.post(
    `${BASE_PATH}/buy-product`,
    { preHandler: [deviceMW, cardMW] },
    async (request, reply) => {
      try {
        const body = (await request.body) as {
          productId?: number;
          quantity?: number;
          discount?: number;
        };

        if (!body.productId)
          return sendError(reply, {
            code: 400,
            responseCode: "NO_PRODUCT_SELECTED",
          });

        const wallet = (
          await walletHandler.getWallets({
            userId: [request.card.userId],
            aulettaId: [request.device.aulettaId],
          })
        )[0];
        if (!wallet)
          return sendError(reply, {
            code: 404,
            responseCode: "WALLET_NOT_FOUND",
          });

        const product = await inventoryHandler.getInventoryProduct({
          productId: body.productId,
          aulettaId: request.device.aulettaId,
        });
        if (!product)
          return sendError(reply, {
            code: 404,
            responseCode: "PRODUCT_NOT_FOUND",
          });

        // PURCHASE LOGIC
        const quantity = body.quantity ?? 1;
        const baseDiscount = body.discount ?? 0;

        const today = new Date();
        const birthDate = request.card.user.birthDate;
        const birthdayMatch =
          birthDate !== null &&
          birthDate.getUTCDate() === today.getUTCDate() &&
          birthDate.getUTCMonth() === today.getUTCMonth();
        const birthdayDiscount = birthdayMatch ? 1 : 0;

        const totalDiscount = birthdayDiscount + baseDiscount;

        const transaction = await transactionHandler.buyProduct(
          product,
          request.card,
          request.device,
          wallet.id,
          quantity,
          totalDiscount
        );

        return {
          status: "OK",
          transaction: transaction,
          discountApplied: totalDiscount,
        };
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );
}
