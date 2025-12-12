import {
  Card,
  Device,
  Transaction,
  TransactionType,
} from "./../generated/prisma/client.js";
import { prisma } from "../plugins/prisma.js";
import { LogMethod } from "./decorators/logmethod.js";
import walletHandler from "./wallet-handler.js";
import { Product, Product_Inventory } from "../generated/prisma/browser.js";

interface ITransactionIdentifiers {
  productId: number;
  walletId: string;
  userId: string;
}

interface ITransactionProps {
  type: TransactionType;
  totalPrice: number;
  quantity: number;
  card: Card;
  walletId: string;
  discount: number;
  device: Device;
}

class TransactionHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  public transactionDescriptions = {
    buy: "Article buyed",
    topUp: "Top Up",
  };

  @LogMethod
  /**
   * Processes the purchase of a product by updating the wallet balance and registering the transaction.
   *
   * @param product - The product inventory item being purchased.
   * @param card - The card used for the transaction.
   * @param device - The device from which the purchase is made.
   * @param walletId - The ID of the wallet to be charged.
   * @param quantity - The number of product units to purchase.
   * @param discount - The discount to apply (as a decimal, e.g., 0.1 for 10%).
   * @returns A promise that resolves to the registered Transaction object.
   * @throws Will throw an error if the wallet balance update or transaction registration fails.
   */
  async buyProduct(
    product: Product_Inventory,
    card: Card,
    device: Device,
    walletId: string,
    quantity: number,
    discount: number = 0
  ): Promise<Transaction> {
    const amount = product.price * quantity;
    const discountedAmount = amount - amount * discount;

    const transaction = await Promise.all([
      walletHandler.updateBalance(walletId, "decrease", discountedAmount),
      this.registerTransaction({
        type: TransactionType.PURCHASE,
        totalPrice: amount,
        quantity: quantity,
        discount: discount,
        card: card,
        device: device,
        walletId: walletId,
      }),
    ]);

    return transaction[1];
  }

  @LogMethod
  /**
   * Registers a new transaction in the database.
   *
   * @param params - The transaction properties.
   * @param params.type - The type of the transaction.
   * @param params.totalPrice - The total price of the transaction.
   * @param params.quantity - The quantity involved in the transaction.
   * @param params.card - The card used for the transaction.
   * @param params.walletId - The ID of the wallet associated with the transaction.
   * @param params.discount - The discount applied to the transaction, if any.
   * @param params.device - The device from which the transaction was made.
   * @returns A promise that resolves to the created {@link Transaction}.
   */
  async registerTransaction({
    type,
    totalPrice,
    quantity,
    card,
    walletId,
    discount,
    device,
  }: ITransactionProps): Promise<Transaction> {
    const transaction = await this.prisma.transaction.create({
      data: {
        totalPrice: totalPrice,
        quantity: quantity,
        cardId: card.id,
        userId: card.userId,
        deviceId: device.id,
        aulettaId: device.aulettaId,
        discount: discount,
        walletId: walletId,
        type: type,
      },
    });

    return transaction;
  }
}

const transactionHandler = new TransactionHandler();
export default transactionHandler;
