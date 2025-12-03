import { Device, DeviceRegistration } from "../generated/prisma/client.js";
import { RequestStatus } from "../generated/prisma/enums.js";
import { prisma } from "../plugins/prisma.js";

interface ICheckRequestsParams {
  deviceId?: string;
  status?: RequestStatus[];
  aulettaId?: number;
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

class DeviceHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  async generateDeviceAccessKey() {}

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
  }: {
    deviceId?: string;
    deviceName?: string;
  }): Promise<Device | null> {
    const device = await this.prisma.device.findFirst({
      where: {
        ...(deviceId ? { id: deviceId } : {}),
        ...(deviceName ? { deviceName: deviceName } : {}),
      },
    });

    return device;
  }

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
  }: ICheckRequestsParams): Promise<ICheckRequests> {
    const requests = await this.prisma.deviceRegistration.findMany({
      where: {
        ...(deviceId ? { deviceId: deviceId } : {}),
        ...(status ? { status: { in: status } } : {}),
        ...(aulettaId
          ? {
              device: {
                aulettaId: aulettaId,
              },
            }
          : {}),
      },
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
}

const deviceHandler = new DeviceHandler();
export default deviceHandler;
