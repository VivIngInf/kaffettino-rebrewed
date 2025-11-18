import {
  RequestStatus,
  Wallet,
  WalletRequest,
} from "../generated/prisma/client.js";
import { prisma } from "../plugins/prisma.js";
import { LogMethod } from "./decorators/logmethod.js";

interface ICheckWalletRequest {
  userId?: string[];
  aulettaId?: number[];
  status?: RequestStatus[];
}

export interface IRequestWalletCreation {
  status: "OK" | "REJECTED" | "TOO_MANY_REQUESTS";
  message: string;
  request?: WalletRequest;
}

class WalletHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  /**
   * Creates a new wallet for the specified user and auletta.
   *
   * @param userId - The unique identifier of the user for whom the wallet is being created.
   * @param aulettaId - The identifier of the auletta associated with the wallet.
   * @returns A promise that resolves to the newly created `Wallet` object.
   */
  async createWallet(userId: string, aulettaId: number): Promise<Wallet> {
    const newWallet = await this.prisma.wallet.create({
      data: {
        userId: userId,
        aulettaId: aulettaId,
      },
    });

    return newWallet;
  }

  @LogMethod
  /**
   * Retrieves wallet requests from the database based on the provided filter criteria.
   *
   * @param params - An object containing the filter criteria for the wallet requests.
   * @param params.userId - (Optional) The ID of the user to filter wallet requests by.
   * @param params.aulettaId - (Optional) The ID of the auletta to filter wallet requests by.
   * @param params.status - (Optional) The status to filter wallet requests by.
   * @returns A promise that resolves to an array of wallet requests matching the specified criteria.
   */
  async checkWalletRequests({
    userId,
    aulettaId,
    status,
  }: ICheckWalletRequest) {
    const walletRequest = await this.prisma.walletRequest.findMany({
      where: {
        ...(userId ? { userId: { in: userId } } : {}),
        ...(aulettaId ? { aulettaId: { in: aulettaId } } : {}),
        ...(status ? { status: { in: status } } : {}),
      },
    });

    return walletRequest;
  }

  @LogMethod
  /**
   * Handles the creation of a wallet request for a specific user and auletta.
   *
   * This method checks if there are any existing approved or pending wallet requests for the given user and auletta.
   * - If an approved request exists, the operation is rejected.
   * - If a pending request exists, the operation is rejected due to too many requests.
   * - Otherwise, a new wallet request is created and returned.
   *
   * @param userId - The unique identifier of the user requesting the wallet.
   * @param aulettaId - The identifier of the auletta for which the wallet is requested.
   * @returns A promise that resolves to an object indicating the status of the request, a message, and optionally the created request.
   */
  async requestWalletCreation(
    userId: string,
    aulettaId: number
  ): Promise<IRequestWalletCreation> {
    const walletRequests = await this.checkWalletRequests({
      userId: [userId],
      aulettaId: [aulettaId],
      status: [RequestStatus.APPROVED, RequestStatus.PENDING],
    });

    const approvedRequests = walletRequests.filter(
      (req) => req.status === RequestStatus.APPROVED
    );
    const pendingRequests = walletRequests.filter(
      (req) => req.status === RequestStatus.PENDING
    );

    if (approvedRequests.length > 0)
      return {
        status: "REJECTED",
        message: `Your request was rejected, '${userId}' already have a wallet in Auletta '${aulettaId}'`,
      };
    if (pendingRequests.length > 0)
      return {
        status: "TOO_MANY_REQUESTS",
        message: "Too many requests",
      };

    const newWalletRequest = await this.prisma.walletRequest.create({
      data: {
        userId: userId,
        aulettaId: aulettaId,
      },
    });

    return {
      status: "OK",
      message: `Request by ${userId} for wallet in ${aulettaId} was sent!`,
      request: newWalletRequest,
    };
  }
}

const walletHandler = new WalletHandler();
export default walletHandler;
