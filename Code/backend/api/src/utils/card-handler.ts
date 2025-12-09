import { Card, User } from "../generated/prisma/client.js";
import { prisma } from "../plugins/prisma.js";

export interface IGetCardInformations extends Card {
  user: User;
}

class CardHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  async createCard(userId: string) {}

  /**
   * Retrieves detailed information about a card by its ID.
   *
   * @param cardId - The unique identifier of the card to fetch.
   * @returns A promise that resolves to the card information object (including user details) if found,
   *          or `false` if no card with the given ID exists.
   */
  async getCardInformations(
    cardId: string
  ): Promise<IGetCardInformations | boolean> {
    const card = await this.prisma.card.findFirst({
      where: {
        id: cardId,
      },
      include: {
        user: true,
      },
    });

    return card ?? false;
  }
}

const cardHandler = new CardHandler();
export default cardHandler;
