import { randomUUID, UUID } from "node:crypto";
import { Card, User } from "../../generated/prisma/client.js";
import { prisma } from "../../plugins/prisma.js";
import { LogMethod } from "../decorators/logmethod.js";

export interface IGetCardInformations extends Card {
  user: User;
}

export type cardId = `CARD:${UUID}`;

class CardHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  /**
   * Creates a new card associated with the specified user.
   *
   * Generates a unique card ID, persists the card in the database,
   * and returns the created card object.
   *
   * @param userId - The unique identifier of the user to associate with the new card.
   * @returns A promise that resolves to the newly created card object.
   */
  async createCard(userId: string) {
    const cardId = `CARD:${randomUUID()}`;

    const newCard = await this.prisma.card.create({
      data: {
        userId: userId,
        cardId: cardId,
      },
    });

    return newCard;
  }

  @LogMethod
  /**
   * Updates the PIN of a card with the specified card ID.
   *
   * @param cardId - The unique identifier of the card whose PIN is to be set.
   * @param pin - The new PIN number to assign to the card.
   * @returns A promise that resolves to `true` if the PIN was successfully updated, or `false` otherwise.
   */
  async setCardPin(cardId: cardId, pin: number | null): Promise<Boolean> {
    const newPin = await this.prisma.card.update({
      where: {
        cardId: cardId,
      },
      data: {
        pin: pin,
      },
      select: {
        pin: true,
      },
    });

    return newPin ? true : false;
  }

  @LogMethod
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

  @LogMethod
  /**
   * Sets the blocked status of a card.
   *
   * @param cardId - The unique identifier of the card to update.
   * @param set - Optional. If true, the card will be blocked; if false or omitted, the card will be unblocked.
   * @returns A promise that resolves to the updated Card object.
   */
  async setBlock(cardId: cardId, set?: boolean): Promise<Card> {
    const blockedCard = await this.prisma.card.update({
      where: {
        cardId: cardId,
      },
      data: {
        blocked: set ? true : false,
      },
    });

    return blockedCard;
  }
}

const cardHandler = new CardHandler();
export default cardHandler;
