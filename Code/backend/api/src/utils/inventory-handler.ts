import { Product } from "../generated/prisma/client";
import { prisma } from "../plugins/prisma";
import { LogMethod } from "./decorators/logmethod";

class InventoryHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  async createInventory(aulettaId: number, name: string) {
    const newInventory = await this.prisma.inventory.create({
      data: {
        name: name,
        aulettaId: aulettaId
      }
    });
  }

  @LogMethod
  async addItems(inventoryId: number, productIds: number[]) {
    
  }
  async removeItems(inventoryId: number, productIds: number[]) {}

  async checkInventoryItems(inventoryId: number, productIds: number[])
  async listItems(aulettaId: number) {}

  @LogMethod
  /**
   * Creates a new product with the specified name in the database.
   *
   * @param name - The name of the product to be created.
   * @returns A promise that resolves to the newly created `Product` object.
   */
  async createProduct(name: string): Promise<Product> {
    const newProduct = await this.prisma.product.create({
      data: {
        name: name,
      },
    });

    return newProduct;
  }

  @LogMethod
  /**
   * Updates the name of a product with the specified product ID.
   *
   * @param productId - The unique identifier of the product to update.
   * @param product - An object containing the new product properties. Only the `name` property is currently supported for update.
   * @returns A promise that resolves to the updated product.
   */
  async updateProduct(productId: number, { name }: { name: string }) {
    const updatedProduct = await this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        ...(name ? { name: name } : {}),
      },
    });

    return updatedProduct;
  }

  @LogMethod
  /**
   * Deletes multiple products from the database based on the provided array of product IDs.
   *
   * @param productIds - An array of product IDs to be deleted.
   * @returns A promise that resolves to the result of the delete operation, including the count of deleted records.
   */
  async deleteProduct(productIds: number[]) {
    const updatedProduct = await this.prisma.product.deleteMany({
      where: {
        id: { in: productIds },
      },
    });

    return updatedProduct;
  }
}

const inventoryHandler = new InventoryHandler();
export default inventoryHandler;
