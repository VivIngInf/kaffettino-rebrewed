import {
  RequestStatus,
  TopUp,
  Wallet,
  WalletRequest,
} from "../generated/prisma/client.js";
import { prisma } from "../plugins/prisma.js";
import { LogMethod } from "./decorators/logmethod.js";
import { ISearchParams } from "./search-utils.js";

interface ICheckWalletRequest {
  userId?: string[];
  aulettaId?: number[];
  status?: RequestStatus[];
}

interface IGetWallets extends ISearchParams {
  userId?: string[];
  aulettaId?: number[];
}

interface IGetTopUps extends ISearchParams {
  userId?: string[];
  walletId?: string[];
}

export interface IRequestWalletCreation {
  status: "OK" | "REJECTED" | "TOO_MANY_REQUESTS";
  message: string;
  request?: WalletRequest;
}

export class WalletHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  /**
   * Retrieves a list of wallets based on the provided filter criteria.
   *
   * @param params - The filter and pagination options.
   * @param params.userId - An array of user IDs to filter wallets by.
   * @param params.aulettaId - An array of auletta IDs to filter wallets by.
   * @param params.take - The maximum number of wallets to retrieve.
   * @param params.skip - The number of wallets to skip before starting to collect the result set.
   * @returns A promise that resolves to an array of `Wallet` objects matching the criteria.
   */
  async getWallets({
    userId,
    aulettaId,
    take,
    skip,
  }: IGetWallets): Promise<Wallet[]> {
    const wallets = await this.prisma.wallet.findMany({
      where: {
        userId: { in: userId },
        aulettaId: { in: aulettaId },
      },
      skip: skip,
      take: take,
    });

    return wallets;
  }

  @LogMethod
  /**
   * Retrieves a wallet for a specific user and auletta.
   *
   * @param params - The parameters for retrieving the wallet.
   * @param params.userId - The ID of the user whose wallet is to be retrieved.
   * @param params.aulettaId - The ID of the auletta associated with the wallet.
   * @param params.walletId - The ID of the wallet (currently unused).
   * @returns A promise that resolves to the wallet object if found, or `false` if no wallet exists for the given user and auletta.
   */
  async getWallet({
    userId,
    aulettaId,
  }: {
    userId: string;
    aulettaId: number;
    walletId: string;
  }): Promise<Wallet | boolean> {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        userId: userId,
        aulettaId: aulettaId,
      },
    });

    if (!wallet) return false;

    return wallet;
  }

  @LogMethod
  /**
   * Retrieves a list of wallet top-up transactions based on the provided filters.
   *
   * @param {IGetTopUps} params - The parameters for fetching wallet top-ups.
   * @param {string[]} params.userId - An array of user IDs to filter the top-ups.
   * @param {string[]} params.walletId - An array of wallet IDs to filter the top-ups.
   * @param {number} params.take - The number of records to retrieve.
   * @param {number} params.skip - The number of records to skip (for pagination).
   * @param {number} params.gte - The minimum amount (inclusive) for filtering top-ups.
   * @param {number} params.lte - The maximum amount (inclusive) for filtering top-ups.
   * @returns {Promise<TopUp[]>} A promise that resolves to an array of top-up records.
   */
  async getWalletTopUps({
    userId,
    walletId,
    take,
    skip,
    gte,
    lte,
  }: IGetTopUps): Promise<TopUp[]> {
    const walletTopUps = await this.prisma.topUp.findMany({
      where: {
        ...(userId ? { userId: { in: userId } } : {}),
        ...(walletId ? { walletId: { in: walletId } } : {}),
        ...(gte || lte
          ? { amount: { lte: (lte as number) ?? 0, gte: (gte as number) ?? 0 } }
          : {}),
      },
      skip: skip,
      take: take,
    });

    return walletTopUps;
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
   * Adds funds to a wallet and records the top-up transaction.
   *
   * @param walletId - The unique identifier of the wallet to top up.
   * @param amount - The amount to add to the wallet balance.
   * @param description - An optional description for the top-up transaction.
   * @returns A promise that resolves to the created TopUp record.
   */
  async topUp(
    walletId: string,
    amount: number,
    description?: string
  ): Promise<TopUp> {
    const createdTopUp = await this.prisma.topUp.create({
      data: {
        amount: amount,
        walletId: walletId,
        description: description,
      },
    });

    if (createdTopUp.amount)
      await this.prisma.wallet.update({
        where: {
          id: walletId,
        },
        data: {
          balance: { increment: createdTopUp.amount },
        },
      });

    return createdTopUp;
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

  @LogMethod
  /**
   * Updates the balance of a wallet by either increasing or decreasing it by a specified amount.
   *
   * @param walletId - The unique identifier of the wallet to update.
   * @param action - The action to perform on the balance: "increase" to add to the balance, "decrease" to subtract from it.
   * @param amount - The amount by which to increase or decrease the wallet's balance.
   * @returns A promise that resolves to the updated wallet object.
   */
  async updateBalance(
    walletId: string,
    action: "increase" | "decrease",
    amount: number
  ) {
    const newBalance = await this.prisma.wallet.update({
      where: {
        id: walletId,
      },
      data: {
        balance: {
          ...(action == "increase"
            ? { increment: amount }
            : { decrement: amount }),
        },
      },
    });

    return newBalance;
  }
}

const walletHandler = new WalletHandler();
export default walletHandler;
