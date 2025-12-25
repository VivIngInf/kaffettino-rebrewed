import { Session } from "../../auth.js";
import { User, Wallet, Role } from "../../generated/prisma/client.js";
import { prisma } from "../../plugins/prisma.js";
import { LogMethod } from "../decorators/logmethod.js";

class PermissionsHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  private roleHierarchy: Record<number, Role> = {
    1: Role.GUEST,
    2: Role.USER,
    3: Role.TREASURER,
    4: Role.ADMIN,
    5: Role.SUPERUSER,
  };

  @LogMethod
  /**
   * Retrieves the current role hierarchy configuration.
   *
   * @returns The role hierarchy as defined in the class instance.
   */
  getRoleHierarchy() {
    return this.roleHierarchy;
  }

  @LogMethod
  /**
   * Returns the hierarchy position of the specified role within the role hierarchy.
   *
   * @param role - The role whose hierarchy position is to be determined.
   * @returns The position of the role in the hierarchy as a string, or 0 if the role is not found.
   */
  getHierarchyPosition(role: Role) {
    return (
      Object.entries(this.roleHierarchy).find(
        ([position, value]) => value == role
      )?.[0] ?? 0
    );
  }

  @LogMethod
  /**
   * Verifies whether a user is allowed to change the role of another user based on role hierarchy and identity.
   *
   * @param requestSession - The current session containing the acting user's information.
   * @param targetUserId - The ID of the user whose role is to be changed.
   * @param targetRole - The new role to assign to the target user.
   * @returns An object indicating whether the operation is valid, along with a message explaining the result.
   *
   * @remarks
   * - The operation is invalid if the acting user's role is not higher in the hierarchy than the target role.
   * - The operation is invalid if the acting user attempts to change their own role.
   */
  verifyRoleChange(
    requestSession: Session,
    targetUserId: string,
    targetRole: Role
  ) {
    const user = requestSession.user;
    const userRole = user.role as Role;
    if (
      this.getHierarchyPosition(userRole) <=
      this.getHierarchyPosition(targetRole)
    )
      return {
        success: false,
        message: "Operation is not valid! Role hierarchy violation.",
      };

    if (user.id == targetUserId)
      return {
        success: false,
        message:
          "Operation is not valid! You can't assign a new role to yourself.",
      };

    return { success: true, message: "Operation is valid!" };
  }
}

const permissionsHandler = new PermissionsHandler();
export default permissionsHandler;
