import { Card, Device } from "../generated/prisma/client";
import { Session } from "../auth";
import "fastify";
import { IGetCardInformations } from "@/utils/handlers/card-handler";

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
    card: IGetCardInformations;
    device: Device;
  }
}
