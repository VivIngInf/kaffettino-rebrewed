import { User, Wallet, Role } from "@/generated/prisma/client";
import { prisma } from "@/plugins/prisma";
import { LogMethod } from "../decorators/logmethod";

export interface IGetUser extends User {
  wallets?: Wallet[];
}

export interface ISetUserData {
  aulettaId?: number;
  birthDate?: Date;
}

export interface ISetUserRole {
  targetUserId?: string;
  role?: Role;
  requestRole?: Role;
}

class UserHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  /**
   * Retrieves a user by their unique identifier.
   *
   * @param userId - The unique identifier of the user to retrieve.
   * @param includeWallets - Optional flag to include the user's wallets in the result.
   * @returns A promise that resolves to the user object, optionally including wallets.
   * @throws Error if the user is not found.
   */
  async getUser(userId: string, includeWallets?: boolean): Promise<IGetUser> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        wallets: Boolean(includeWallets) ?? false,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  @LogMethod
  /**
   * Updates the specified user's data with the provided fields.
   *
   * Only the fields present in `userData` will be updated. If no updatable fields are provided,
   * an error is thrown.
   *
   * @param userId - The unique identifier of the user to update.
   * @param userData - An object containing the user data fields to update. Supported fields include `aulettaId` and `birthDate`.
   * @returns A promise that resolves to the updated `User` object.
   * @throws {Error} If no user data is provided to update.
   */
  async setUserData(userId: string, userData: ISetUserData): Promise<User> {
    const data: any = {};

    if (userData.aulettaId) data.aulettaId = userData.aulettaId;
    if (userData.birthDate) data.birthDate = userData.birthDate;
    if (Object.keys(data).length === 0)
      throw new Error("No user data provided to update");

    const setData = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });
    return setData;
  }

  /**
   * Updates the role of a user with the specified user ID.
   *
   * @param userId - The unique identifier of the user whose role is to be updated.
   * @param role - The new role to assign to the user.
   * @returns A promise that resolves to the updated User object.
   * @throws If the user with the given ID does not exist or the update fails.
   */
  async setUserRole(targetUserId: string, role: Role): Promise<User> {
    const setRole = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        role: role,
      },
    });

    return setRole;
  }
}

const userHandler = new UserHandler();
export default userHandler;
