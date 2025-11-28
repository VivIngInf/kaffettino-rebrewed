import { Product } from "../generated/prisma/client";
import { prisma } from "../plugins/prisma";
import { LogMethod } from "./decorators/logmethod";

class InventoryHandler {
  private prisma: typeof prisma;

  constructor() {
    this.prisma = prisma;
  }

  @LogMethod
  async addItems(aulettaId: number, productIds: number[]) {}
  async removeItems(aulettaId: number, productIds: number[]) {}
  async listItems(aulettaId: number) {}

  async createProduct(name: string) {}
  async updateProduct(productId: number, { name }: Product) {}
  async deleteProduct(productId: number) {}
}

const inventoryHandler = new InventoryHandler();
export default inventoryHandler;
