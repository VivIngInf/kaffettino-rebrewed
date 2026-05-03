import { Auletta } from "@/generated/prisma/client";
import { prisma } from "@/plugins/prisma";

export interface ICreateAuletta {
  name: string;
  location: string;
  telegramId: string;
  number: string;
}

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
        location: location ? location : undefined,
      },
    });
    return aulette;
  }

  
  /**
   * Creates a new Auletta entity in the database.
   *
   * @param payload - The data required to create the Auletta.
   * @param payload.name - The name of the Auletta.
   * @param payload.location - The location of the Auletta.
   * @param payload.telegramId - The Telegram ID associated with the Auletta.
   * @param payload.number - The contact number of the Auletta.
   * @returns A promise that resolves to the created Auletta object.
   */
  async createAuletta({ name, location, telegramId, number }: ICreateAuletta): Promise<Auletta> {
    const newAuletta = await this.prisma.auletta.create({
      data: {
        name,
        number,
        location,
        telegramId,
      }
    })
    return newAuletta;
  }
}

const auletteHandler = new AuletteHandler();
export default auletteHandler;
