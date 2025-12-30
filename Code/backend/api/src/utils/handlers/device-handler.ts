import { Device, DeviceRegistration } from "@/generated/prisma/client";
import { RequestStatus } from "@/generated/prisma/enums";
import { prisma } from "@/plugins/prisma";
import { LogMethod } from "../decorators/logmethod";
import { hash } from "crypto";

interface ICheckRequestsParams {
  deviceId?: string;
  status?: RequestStatus[];
  aulettaId?: number;
  deviceName?: string;
}

interface ICheckRequests {
  requests: DeviceRegistration[];
  count: {
    pending: number;
    approved: number;
    rejected: number;
    awaitingClient: number;
    total: number;
  };
  statuses: {
    pending: DeviceRegistration[];
    approved: DeviceRegistration[];
    rejected: DeviceRegistration[];
    awaitingClient: DeviceRegistration[];
  };
}

interface IDeviceIdentifiers {
  deviceId?: string;
  deviceName?: string;
}

class DeviceHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Generates a new API access key for a device and updates the device record in the database.
   *
   * This method creates a new UUID, combines it with a secret key from the environment variables,
   * hashes the combination to generate a new access key, and updates the specified device's `apiKey`.
   *
   * @param params - An object containing the device ID.
   * @param params.deviceId - The unique identifier of the device to update.
   * @returns A promise that resolves to the updated `Device` object with the new access key.
   */
  async generateDeviceAccessKey({
    deviceId,
    deviceName,
  }: IDeviceIdentifiers): Promise<Device> {
    const newUUID = crypto.randomUUID();
    const apiSecret = process.env.API_KEY_SECRET ?? "supersecretkey";
    const newAccessKey = hash("sha256", `${newUUID}_${apiSecret}_${newUUID}`);

    const updatedDevice = await this.prisma.device.update({
      where: { id: deviceId, deviceName: deviceName },
      data: {
        apiKey: newAccessKey,
      },
    });

    return updatedDevice;
  }

  /**
   * Authorizes a device by verifying its API key.
   *
   * @param apiKey - The API key to validate against the device.
   * @param params - An object containing the device's identifier and name.
   * @param params.deviceId - The unique identifier of the device.
   * @param params.deviceName - The name of the device.
   * @returns A promise that resolves to `true` if the device is authorized, or `false` otherwise.
   */
  async authorizeDevice(
    apiKey: string,
    { deviceId, deviceName }: IDeviceIdentifiers
  ): Promise<{ status: boolean; device?: Device }> {
    const device = await this.getDevice({ deviceId, deviceName }, false);
    if (device?.apiKey === apiKey) return { status: true, device: device };
    return { status: false };
  }

  @LogMethod
  /**
   * Retrieves a device record from the database using the provided API key.
   *
   * @param apiKey - The API key associated with the device to retrieve.
   * @returns A promise that resolves to the device object if found, or `null` if no device matches the API key.
   */
  async getDeviceFromKey(apiKey: string) {
    const device = await this.prisma.device.findUnique({
      where: { apiKey: apiKey },
    });

    return device;
  }

  @LogMethod
  /**
   * Retrieves a device from the database using either its ID or name.
   *
   * @param identifiers - An object containing deviceId and/or deviceName to identify the device.
   * @param omitKey - If true, omits the `apiKey` field from the returned device object. Defaults to true.
   * @returns A promise that resolves to the found Device object or null if no device matches the criteria.
   */
  async getDevice(
    { deviceId, deviceName }: IDeviceIdentifiers,
    omitKey: boolean = true
  ): Promise<Device | null> {
    const device = await this.prisma.device.findFirst({
      where: {
        ...(deviceId ? { id: deviceId } : {}),
        ...(deviceName ? { deviceName: deviceName } : {}),
      },
      omit: {
        apiKey: omitKey,
      },
    });

    return device;
  }

  @LogMethod
  /**
   * Retrieves the API key for a device based on its identifiers.
   *
   * @param {IDeviceIdentifiers} param0 - An object containing the device's unique identifiers.
   * @param {string} param0.deviceId - The unique ID of the device.
   * @param {string} param0.deviceName - The name of the device.
   * @returns {Promise<string | undefined>} The API key associated with the device, or `undefined` if not found.
   */
  async getDeviceKey({ deviceId, deviceName }: IDeviceIdentifiers) {
    const device = await this.getDevice({ deviceId, deviceName }, false);
    const key = device?.apiKey;

    return key;
  }

  @LogMethod
  /**
   * Retrieves device registration requests based on provided filter parameters and returns
   * the requests along with their categorized statuses and counts.
   *
   * @param params - The parameters to filter device registration requests.
   * @param params.deviceId - (Optional) The ID of the device to filter requests by.
   * @param params.status - (Optional) The status to filter requests by.
   * @param params.aulettaId - (Optional) The auletta ID to filter requests by.
   * @returns An object containing:
   * - `requests`: The list of matching device registration requests.
   * - `statuses`: An object categorizing requests by their status (`pending`, `approved`, `rejected`, `sentToClient`).
   * - `count`: An object with the total count and counts for each status category.
   */
  async checkRequests({
    deviceId,
    status,
    aulettaId,
    deviceName,
  }: ICheckRequestsParams): Promise<ICheckRequests> {
    const requests = await this.prisma.deviceRegistration.findMany({
      where: {
        ...(deviceId ? { deviceId: deviceId } : {}),
        ...(status ? { status: { in: status } } : {}),
        ...(aulettaId
          ? {
              device: {
                aulettaId: aulettaId,
                deviceName: deviceName,
              },
            }
          : {}),
      },
      orderBy: [{ updatedAt: "asc" }],
    });

    const statuses = {
      pending: requests.filter((req) => req.status == RequestStatus.PENDING),
      approved: requests.filter((req) => req.status == RequestStatus.APPROVED),
      rejected: requests.filter((req) => req.status == RequestStatus.REJECTED),
      awaitingClient: requests.filter(
        (req) => req.status == RequestStatus.AWAITING_CLIENT
      ),
    };

    return {
      requests: requests,
      statuses,
      count: {
        total: requests.length,
        pending: statuses.pending.length,
        approved: statuses.approved.length,
        rejected: statuses.rejected.length,
        awaitingClient: statuses.awaitingClient.length,
      },
    };
  }

  @LogMethod
  /**
   * Creates a new device registration request for a given device name and auletta ID.
   *
   * If a device with the specified name already exists, it uses the existing device.
   * Otherwise, it creates a new device with the provided name and auletta ID.
   * Then, it creates a new device registration entry linked to the device.
   *
   * @param deviceName - The name of the device to register or create.
   * @param aulettaId - The ID of the auletta (location/room) associated with the device.
   * @returns A promise that resolves to the created DeviceRegistration object.
   */
  async createDeviceRequest(
    deviceName: string,
    aulettaId: number
  ): Promise<DeviceRegistration> {
    const device = await this.getDevice({ deviceName: deviceName });
    const newUnverifiedDevice = device
      ? device
      : await this.prisma.device.create({
          data: {
            deviceName: deviceName,
            aulettaId: aulettaId,
          },
        });

    const createNewRequest = await this.prisma.deviceRegistration.create({
      data: {
        deviceId: newUnverifiedDevice.id,
      },
    });

    return createNewRequest;
  }

  @LogMethod
  /**
   * Accepts a pending device registration request for the specified device identifiers.
   *
   * This method checks for pending registration requests matching the given `deviceId` and `deviceName`.
   * If a pending request is found, it updates the status of the most recent pending request to `APPROVED`.
   * After approval, it deletes all other pending requests for the same device.
   *
   * @param {IDeviceIdentifiers} params - The identifiers of the device, including `deviceId` and `deviceName`.
   * @returns {Promise<{ status: "OK" | "NOT_FOUND"; request?: DeviceRegistration }>}
   * Returns an object with a status indicating whether a pending request was found and accepted.
   * If accepted, the approved `DeviceRegistration` request is included in the response.
   */
  async acceptDeviceRequest({
    deviceId,
    deviceName,
  }: IDeviceIdentifiers): Promise<{
    status: "OK" | "NOT_FOUND";
    request?: DeviceRegistration;
  }> {
    const requests = await this.checkRequests({
      deviceId,
      deviceName,
    });
    const lastPendingRequest = requests.statuses.pending[0];
    const pendingRequestIds = requests.statuses.pending.map(
      (request) => request.id
    );

    if (!lastPendingRequest) return { status: "NOT_FOUND" };

    const acceptedRequest = await this.prisma.deviceRegistration.update({
      where: {
        id: lastPendingRequest.id,
      },
      data: {
        status: RequestStatus.AWAITING_CLIENT,
      },
    });

    if (acceptedRequest)
      await this.prisma.deviceRegistration.deleteMany({
        where: {
          id: { in: pendingRequestIds },
        },
      });

    return { status: "OK", request: acceptedRequest };
  }

  /**
   * Marks a device registration request as approved by updating its status.
   *
   * @param requestId - The unique identifier of the device registration request to complete.
   * @returns A promise that resolves to the updated device registration record.
   */
  async completeDeviceRequest(requestId?: number) {
    const completed = await this.prisma.deviceRegistration.update({
      where: {
        id: requestId,
      },
      data: {
        status: RequestStatus.APPROVED,
      },
    });

    return completed;
  }
}

const deviceHandler = new DeviceHandler();
export default deviceHandler;
