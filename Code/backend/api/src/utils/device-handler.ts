import { request } from "node:http";
import { Device, DeviceRegistration } from "../generated/prisma/client.js";
import { RequestStatus } from "../generated/prisma/enums.js";
import { prisma } from "../plugins/prisma.js";
import { LogMethod } from "./decorators/logmethod.js";

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
    sentToClient: number;
    total: number;
  };
  statuses: {
    pending: DeviceRegistration[];
    approved: DeviceRegistration[];
    rejected: DeviceRegistration[];
    sentToClient: DeviceRegistration[];
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

  async generateDeviceAccessKey() {}

  @LogMethod
  /**
   * Retrieves a device from the database by its ID or name.
   *
   * @param params - An object containing optional `deviceId` and `deviceName` properties to filter the device.
   * @param params.deviceId - The unique identifier of the device (optional).
   * @param params.deviceName - The name of the device (optional).
   * @returns A promise that resolves to the found `Device` object, or `null` if no device matches the criteria.
   */
  async getDevice({
    deviceId,
    deviceName,
  }: IDeviceIdentifiers): Promise<Device | null> {
    const device = await this.prisma.device.findFirst({
      where: {
        ...(deviceId ? { id: deviceId } : {}),
        ...(deviceName ? { deviceName: deviceName } : {}),
      },
    });

    return device;
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
      sentToClient: requests.filter(
        (req) => req.status == RequestStatus.SENT_TO_CLIENT
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
        sentToClient: statuses.sentToClient.length,
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
        status: RequestStatus.APPROVED,
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
}

const deviceHandler = new DeviceHandler();
export default deviceHandler;
