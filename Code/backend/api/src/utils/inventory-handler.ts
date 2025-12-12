import { BatchPayload } from "../generated/prisma/internal/prismaNamespace.js";
import { Inventory, Product } from "../generated/prisma/client.js";
import { prisma } from "../plugins/prisma.js";
import { LogMethod } from "./decorators/logmethod.js";

export interface InventoryItems {
  inventoryId: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
    name?: string;
  }[];
}

interface IAddNewProduct {
  id: number;
  quantity: number;
  price: number;
}

class InventoryHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  /**
   * Creates a new inventory record associated with the specified auletta.
   *
   * @param aulettaId - The ID of the auletta to associate with the inventory.
   * @param name - The name of the inventory to create.
   * @returns A promise that resolves to the newly created {@link Inventory} object.
   */
  async createInventory(aulettaId: number, name: string): Promise<Inventory> {
    const newInventory = await this.prisma.inventory.create({
      data: {
        name: name,
        aulettaId: aulettaId,
      },
    });

    return newInventory;
  }

  @LogMethod
  async getInventories(aulettaId: number): Promise<Inventory[]> {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        aulettaId: aulettaId,
      },
    });

    return inventories;
  }

  @LogMethod
  /**
   * Adds or updates products in the specified inventory.
   *
   * For each product in the `products` array:
   * - If the product already exists in the inventory, its quantity is updated.
   * - If the product does not exist, it is created with the provided quantity and price.
   *
   * @param inventoryId - The ID of the inventory to update.
   * @param products - An array of products to add or update, each containing an `id`, `quantity`, and `price`.
   * @returns A promise that resolves to the updated list of inventory items.
   */
  async addItems(
    inventoryId: number,
    products: IAddNewProduct[]
  ): Promise<InventoryItems["items"]> {
    const productIds = products.map((product) => product.id);
    const existingItems = await this.checkInventoryItems(
      inventoryId,
      productIds
    );
    const existingItemsIds = existingItems.map((item) => item.productId);
    const nonExistingItems = products.filter(
      (product) => !existingItemsIds.includes(product.id)
    );

    const itemsUpdated: InventoryItems["items"] = await Promise.all([
      ...existingItems.map((item) =>
        this.prisma.product_Inventory.update({
          where: {
            productId_inventoryId: {
              productId: item.productId,
              inventoryId: inventoryId,
            },
          },
          data: {
            quantity:
              products.find((product) => product.id === item.productId)
                ?.quantity ?? item.quantity,
          },
        })
      ),
      ...nonExistingItems.map((item) =>
        this.prisma.product_Inventory.create({
          data: {
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            inventoryId: inventoryId,
          },
        })
      ),
    ]);

    return itemsUpdated;
  }

  @LogMethod
  /**
   * Removes specified products from an inventory.
   *
   * Checks if the given product IDs exist in the specified inventory,
   * then deletes those products from the inventory.
   *
   * @param inventoryId - The ID of the inventory to remove items from.
   * @param productIds - An array of product IDs to be removed from the inventory.
   * @returns A promise that resolves to a BatchPayload indicating the number of records deleted.
   */
  async removeItems(
    inventoryId: number,
    productIds: number[]
  ): Promise<BatchPayload> {
    const existingProductIds = (
      await this.checkInventoryItems(inventoryId, productIds)
    ).map((item) => item.productId);

    const removed = await this.prisma.product_Inventory.deleteMany({
      where: {
        productId: { in: existingProductIds },
      },
    });

    return removed;
  }

  @LogMethod
  /**
   * Checks and retrieves items from a specific inventory that match the provided product IDs.
   *
   * @param inventoryId - The ID of the inventory to search within.
   * @param productIds - An array of product IDs to filter the inventory items.
   * @returns A promise that resolves to an array of inventory items matching the given product IDs.
   */
  async checkInventoryItems(
    inventoryId: number,
    productIds: number[]
  ): Promise<InventoryItems["items"]> {
    const inventoryItems = (await this.listItems([inventoryId])).find(
      (inventory) => inventory.inventoryId == inventoryId
    );
    const filteredItems = inventoryItems?.items.filter((item) =>
      productIds.includes(item.productId)
    );

    return filteredItems ?? [];
  }

  @LogMethod
  /**
   * Retrieves and groups inventory items by their inventory IDs.
   *
   * Given an array of inventory IDs, this method queries the database for matching
   * product inventory records, including product names. The results are grouped by
   * inventory ID, with each group containing its associated items.
   *
   * @param inventoryIds - Array of inventory IDs to fetch items for.
   * @returns A promise that resolves to an array of grouped inventory items, where each group
   *          contains the inventory ID and its corresponding items.
   */
  async listItems(inventoryIds: number[]): Promise<InventoryItems[]> {
    const items = await this.prisma.product_Inventory.findMany({
      where: {
        inventoryId: { in: inventoryIds },
      },
      select: {
        inventoryId: true,
        productId: true,
        quantity: true,
        price: true,
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    const inventories = new Set(items.map((item) => item.inventoryId));
    const groupedItems: InventoryItems[] = Array.from(inventories, (inv) => ({
      inventoryId: inv,
      items: items
        .filter((item) => item.inventoryId === inv)
        .map((item) => ({
          price: item.price,
          productId: item.productId,
          quantity: item.quantity,
          name: item.product.name,
        })),
    }));

    return groupedItems;
  }

  @LogMethod
  /**
   * Retrieves a specific product from the inventory based on the provided product and inventory IDs.
   *
   * @param productId - The unique identifier of the product to retrieve.
   * @param inventoryId - The unique identifier of the inventory to search within.
   * @returns A promise that resolves to the matching product inventory record, or `null` if not found.
   */
  async getInventoryProduct({
    productId,
    inventoryId,
    aulettaId,
  }: {
    productId: number;
    inventoryId?: number;
    aulettaId?: number;
  }) {
    const product = await this.prisma.product_Inventory.findFirst({
      where: {
        productId: productId,
        inventory: {
          id: inventoryId,
          aulettaId: aulettaId,
        },
      },
    });

    return product;
  }

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
