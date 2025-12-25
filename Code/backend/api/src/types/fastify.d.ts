import { Card, Device } from "../generated/prisma/client.js";
import { Session } from "../auth.js";
import "fastify";
import { IGetCardInformations } from "@/utils/handlers/card-handler.js";

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
    card: IGetCardInformations;
    device: Device;
  }
}
