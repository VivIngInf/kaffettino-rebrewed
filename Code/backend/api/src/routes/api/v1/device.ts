import { RequestStatus, Role } from "@/generated/prisma/enums";
import { FastifyInstance } from "fastify";
import { cardMW, sessionMW, permissionsMW, deviceMW } from "@/middlewares/mws";
import {
  transactionHandler,
  cardHandler,
  inventoryHandler,
  auletteHandler,
  deviceHandler,
  walletHandler,
  sendError,
  sendSuccess,
} from "@/utils/handlers";
import auditLog, { AuditActor } from "@/utils/audit";
import {
  deviceRegistrationSchema,
  deviceValidateId,
  IDeviceRegistrationSchema,
  IDeviceValidateId,
} from "@/zod/schema/device.schema";

const BASE_PATH = "/device";
const ROLES_NEEDED = {
  acceptRequests: [Role.ADMIN],
  registrationRequests: [Role.ADMIN],
};

export default async function deviceRoutes(fastify: FastifyInstance) {
  /**
   * POST localhost:3000/api/v1/device/register
   * {
   *  deviceId: string,
   *  deviceName: string
   * }
   */
  fastify.post(
    `${BASE_PATH}/register`,
    {
      schema: {
        description: "Register a new device and create a registration request",
        tags: ["device"],
        body: {
          type: "object",
          required: ["deviceName", "aulettaId"],
          properties: {
            deviceName: {
              type: "string",
              description: "Name of the device to register",
            },
            aulettaId: {
              type: "number",
              description: "ID of the auletta where device is located",
            },
          },
        },
        response: {
          200: {
            description: "Device registration request created",
            type: "object",
            properties: {
              success: { type: "boolean" },
              request: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  deviceName: { type: "string" },
                  aulettaId: { type: "number" },
                  status: { type: "string" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing deviceName or aulettaId",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          409: {
            description:
              "Conflict - device already registered or request pending",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as IDeviceRegistrationSchema;

        if (!deviceRegistrationSchema.safeParse(body).success)
          return sendError(reply, {
            code: 400,
            message:
              "Mandatory params 'deviceName' or 'aulettaId' are missing!",
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
            request,
          );

        const existingRequest = await deviceHandler.checkRequests({
          deviceId: device?.id,
          aulettaId: body.aulettaId,
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
            request,
          );

        const newDeviceRequest = await deviceHandler.createDeviceRequest(
          body.deviceName,
          body.aulettaId,
        );

        await auditLog({
          action: "REGISTER_DEVICE_REQUEST",
          entity: "Device",
          entityId: newDeviceRequest.id.toString(),
          actorId: undefined,
          actorType: AuditActor.DEVICE,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        return sendSuccess(reply, { request: newDeviceRequest }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

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
      schema: {
        description: "Accept a device registration request (ADMIN only)",
        tags: ["device"],
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["deviceId"],
          properties: {
            deviceId: {
              type: "string",
              description: "ID of the device to accept",
            },
          },
        },
        response: {
          200: {
            description: "Device request accepted",
            type: "object",
            properties: {
              success: { type: "boolean" },
              status: { type: "string" },
              request: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  status: { type: "string" },
                },
              },
            },
          },
          400: {
            description: "Bad request - missing deviceId",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
          404: {
            description: "Device request not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as IDeviceValidateId;

        if (!deviceValidateId.safeParse(body).success)
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

        await auditLog({
          action: "ACCEPT_DEVICE_REQUEST",
          entity: "Device",
          entityId: acceptedRequest.request?.id.toString() || "",
          actorId: request.session.user.id,
          actorType: AuditActor.USER,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            new: { status: acceptedRequest.status },
          },
        });

        return sendSuccess(
          reply,
          { status: acceptedRequest.status, request: acceptedRequest.request },
          { code: 200 },
        );
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  /**
   * POST localhost:3000/api/v1/device/request-first-key
   * {
   *  deviceId: string,
   *  deviceName: string
   * }
   */
  fastify.post(
    `${BASE_PATH}/request-first-key`,
    {
      schema: {
        description: "Request the first API key for a newly accepted device",
        tags: ["device"],
        body: {
          type: "object",
          required: ["deviceId", "deviceName"],
          properties: {
            deviceId: {
              type: "string",
              description: "ID of the device",
            },
            deviceName: {
              type: "string",
              description: "Name of the device",
            },
          },
        },
        response: {
          200: {
            description: "API key generated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              status: { type: "string" },
              device: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  deviceName: { type: "string" },
                },
              },
              apiKey: { type: "string" },
            },
          },
          400: {
            description: "Bad request - missing params or no accepted request",
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = (await request.body) as {
          deviceId?: string;
          deviceName?: string;
        };

        const deviceRequest = (
          await deviceHandler.checkRequests({
            deviceId: body.deviceId,
            deviceName: body.deviceName,
            status: [RequestStatus.AWAITING_CLIENT, RequestStatus.APPROVED],
          })
        ).statuses;

        if (!deviceRequest.awaitingClient.length)
          return sendError(reply, {
            code: 400,
            responseCode: "DEVICE_NO_ACCEPTED_REQUESTS",
          });

        if (!body.deviceId || !body.deviceName)
          return sendError(reply, {
            code: 400,
            message:
              "Mandatory params 'deviceId' and 'deviceName' are missing!",
          });

        const device = await deviceHandler.generateDeviceAccessKey({
          deviceId: body.deviceId,
          deviceName: body.deviceName,
        });

        if (device)
          await deviceHandler.completeDeviceRequest(
            deviceRequest.awaitingClient[0]?.id,
          );

        await auditLog({
          action: "REQUEST_DEVICE_API_KEY",
          entity: "Device",
          entityId: device.id,
          actorId: undefined,
          actorType: AuditActor.DEVICE,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        return sendSuccess(
          reply,
          { status: "OK", device: device, apiKey: device.apiKey },
          { code: 200 },
        );
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  /**
   * PUT localhost:3000/api/v1/device/regenerate-access-key
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   */
  fastify.put(
    `${BASE_PATH}/regenerate-access-key`,
    {
      preHandler: deviceMW,
      schema: {
        description: "Regenerate API access key for an authenticated device",
        tags: ["device"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "New API key generated successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              device: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  deviceName: { type: "string" },
                },
              },
              apiKey: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const newDeviceKey = await deviceHandler.generateDeviceAccessKey({
          deviceName: request.device.deviceName,
        });

        await auditLog({
          action: "REGENERATE_DEVICE_API_KEY",
          entity: "Device",
          entityId: newDeviceKey.id,
          actorId: undefined,
          actorType: AuditActor.DEVICE,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        return sendSuccess(
          reply,
          { device: newDeviceKey, apiKey: newDeviceKey.apiKey },
          { code: 200 },
        );
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  /**
   * GET localhost:3000/api/v1/device/aulette
   */
  fastify.get(
    `${BASE_PATH}/aulette`,
    {
      schema: {
        description: "Get list of available aulette (locations)",
        tags: ["device"],
        querystring: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "Optional filter by location",
            },
          },
        },
        response: {
          200: {
            description: "Aulette retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              aulette: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    location: { type: "string" },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { location } = (await request.query) as { location?: string };

        const aulette = await auletteHandler.getAulette(location);

        return sendSuccess(reply, { aulette: aulette }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  /**
   * GET localhost:3000/api/v1/device/inventory
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   */
  fastify.get(
    `${BASE_PATH}/inventory`,
    {
      preHandler: deviceMW,
      schema: {
        description: "Get inventory and products for device's auletta",
        tags: ["device"],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: "Inventory retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              inventories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    aulettaId: { type: "number" },
                  },
                },
              },
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    price: { type: "number" },
                  },
                },
              },
            },
          },
          401: {
            description: "No auletta assigned to device",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
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
          device?.aulettaId,
        );
        const inventoryIds = inventories.map((inventory) => inventory.id);
        const products = await inventoryHandler.listItems(inventoryIds);

        return sendSuccess(reply, { inventories, products }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  /**
   * GET localhost:3000/api/v1/device/wallets
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   * X-PaymentCard-Id: uuidv4
   */
  fastify.get(
    `${BASE_PATH}/wallets`,
    {
      preHandler: [deviceMW, cardMW],
      schema: {
        description:
          "Get all wallets for the user associated with the payment card",
        tags: ["device"],
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          required: ["x-paymentcard-id"],
          properties: {
            "x-paymentcard-id": {
              type: "string",
              description: "NFC card ID",
            },
          },
        },
        response: {
          200: {
            description: "Wallets retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              wallets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    aulettaId: { type: "number" },
                    balance: { type: "number" },
                  },
                },
              },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const wallets = await walletHandler.getWallets({
          userId: [request.card.userId],
        });

        return sendSuccess(reply, { wallets: wallets }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  /**
   * GET localhost:3000/api/v1/device/wallet-auletta
   * Authorization: Bearer {DEVICENAME}-{ACCESSKEY}
   * X-PaymentCard-Id: uuidv4
   */
  fastify.get(
    `${BASE_PATH}/wallet-auletta`,
    {
      preHandler: [deviceMW, cardMW],
      schema: {
        description: "Get the wallet for the user at the device's auletta",
        tags: ["device"],
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          required: ["x-paymentcard-id"],
          properties: {
            "x-paymentcard-id": {
              type: "string",
              description: "NFC card ID",
            },
          },
        },
        response: {
          200: {
            description: "Wallet retrieved successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              wallet: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  userId: { type: "string" },
                  aulettaId: { type: "number" },
                  balance: { type: "number" },
                },
              },
            },
          },
          404: {
            description: "Wallet not found for this auletta",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
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

        return sendSuccess(reply, { wallet: walletAuletta }, { code: 200 });
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
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
    {
      preHandler: [deviceMW, cardMW],
      schema: {
        description: "Purchase a product using the NFC card and wallet",
        tags: ["device"],
        security: [{ bearerAuth: [] }],
        headers: {
          type: "object",
          required: ["x-paymentcard-id"],
          properties: {
            "x-paymentcard-id": {
              type: "string",
              description: "NFC card ID",
            },
          },
        },
        body: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: {
              type: "number",
              description: "ID of the product to purchase",
            },
            quantity: {
              type: "number",
              description: "Quantity to purchase (default: 1)",
              default: 1,
            },
            discount: {
              type: "number",
              description: "Base discount to apply (default: 0)",
              default: 0,
            },
          },
        },
        response: {
          200: {
            description: "Product purchased successfully",
            type: "object",
            properties: {
              success: { type: "boolean" },
              status: { type: "string" },
              transaction: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  productId: { type: "number" },
                  quantity: { type: "number" },
                  totalPrice: { type: "number" },
                },
              },
              discountApplied: { type: "number" },
            },
          },
          400: {
            description: "Bad request - no product selected",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          404: {
            description: "Wallet or product not found",
            type: "object",
            properties: {
              success: { type: "boolean" },
              responseCode: { type: "string" },
            },
          },
          500: {
            description: "Internal server error",
            type: "object",
            properties: {
              success: { type: "boolean" },
              error: { type: "object" },
            },
          },
        },
      },
    },
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
          totalDiscount,
        );

        await auditLog({
          action: "BUY_PRODUCT",
          entity: "Transaction",
          entityId: transaction.id.toString(),
          actorId: request.device.id.toString(),
          actorType: AuditActor.DEVICE,
          metadata: {
            ip: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        return sendSuccess(
          reply,
          {
            status: "OK",
            transaction: transaction,
            discountApplied: totalDiscount,
          },
          { code: 200 },
        );
      } catch (error) {
        return sendError(reply, { code: 500, error });
      }
    },
  );

  fastify.get(
    `${BASE_PATH}/registration-requests`, 
    { 
      preHandler: [ sessionMW, permissionsMW(ROLES_NEEDED.registrationRequests) ] 
    },
    async (request, reply) => {
      try {
        
      } catch(error) {
        return sendError(reply, { code: 500, error });
      }
    }
  );
}
