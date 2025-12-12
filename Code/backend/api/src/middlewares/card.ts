import cardHandler, { IGetCardInformations } from "../utils/card-handler.js";
import sendError from "../utils/error-handler.js";
import { FastifyReply, FastifyRequest } from "fastify";

export default async function cardMW(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const cardHeader = request.headers["x-paymentcard-id"] as string;
  if (!cardHeader)
    return sendError(reply, { code: 401, responseCode: "CARD_ID_MISSING" });

  const card = await cardHandler.getCardInformations(cardHeader);
  if (!card)
    return sendError(reply, { code: 404, responseCode: "CARD_NOT_FOUND" });

  request.card = card as IGetCardInformations;
}
