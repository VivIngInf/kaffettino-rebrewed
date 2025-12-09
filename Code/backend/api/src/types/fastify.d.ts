import { Card } from "../generated/prisma/client.js";
import { Session } from "../auth.js";
import "fastify";
import { IGetCardInformations } from "@/utils/card-handler.js";

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
    deviceName: string;
    card: IGetCardInformations;
  }
}
