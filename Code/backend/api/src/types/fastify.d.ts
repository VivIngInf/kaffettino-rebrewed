import { Session } from "../auth.js";
import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    session: Session;
    deviceName?: string;
  }
}
