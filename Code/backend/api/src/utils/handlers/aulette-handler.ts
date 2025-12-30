import { Auletta } from "@/generated/prisma/client";
import { prisma } from "@/plugins/prisma";

class AuletteHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Retrieves a list of Auletta entities from the database, optionally filtered by location.
   *
   * @param location - (Optional) The location to filter Auletta entities by. If not provided, all entities are returned.
   * @returns A promise that resolves to an array of Auletta objects.
   */
  async getAulette(location?: string): Promise<Auletta[]> {
    const aulette = await this.prisma.auletta.findMany({
      where: {
        location: location,
      },
    });
    return aulette;
  }
}

const auletteHandler = new AuletteHandler();
export default auletteHandler;
