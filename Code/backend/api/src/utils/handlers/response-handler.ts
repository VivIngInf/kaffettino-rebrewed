import { success } from "better-auth/*";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";

interface IError {
  code: number;
  responseCode?: string;
  error?: unknown;
  message?: string;
}

export const statusCodes: Record<number, string> = {
  200: "OK - Request successful",
  201: "Created - Resource created successfully",
  400: "Bad Request - Invalid input data",
  401: "Unauthorized - Missing or invalid session token",
  402: "Payment Required - Insufficient wallet balance",
  403: "Forbidden - Insufficient permissions",
  404: "Not Found - Resource not found",
  409: "Conflict - Resource already exists or violates constraints",
  422: "Unprocessable Entity - Validation failed or semantic error",
  429: "Too Many Requests - Rate limit exceeded",
  500: "Internal Server Error - Unexpected server-side failure",
  503: "Service Unavailable - Server temporarily unavailable or under maintenance",
};

export type SupportedLanguages = "en" | "it";

export const responseCodes = (lang: SupportedLanguages) =>
  JSON.parse(fs.readFileSync(`../messages/${lang}on`, "utf-8"));

/**
 * Sends a standardized error response using Fastify's reply object.
 *
 * @param reply - The Fastify reply instance used to send the response.
 * @param param1 - An object containing error details.
 * @param param1.code - The HTTP status code to send.
 * @param param1.response - The error code read by client or used to choose the message automatically.
 * @param param1.error - The error object or message to log and include in the response.
 * @param param1.message - An optional custom error message to include in the response.
 * @returns The Fastify reply instance with the error response sent.
 *
 * HTTP status codes and their standard descriptions used throughout the application.
 *
 * References:
 * - 200: OK - Request successful
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
 * - 201: Created - Resource created successfully
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201
 * - 400: Bad Request - Invalid input data
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
 * - 401: Unauthorized - Missing or invalid session token
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401
 * - 402: Payment Required - Insufficient wallet balance
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402
 * - 403: Forbidden - Insufficient permissions
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403
 * - 404: Not Found - Resource not found
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404
 * - 409: Conflict - Resource already exists or violates constraints
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409
 * - 422: Unprocessable Entity - Validation failed or semantic error
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
 * - 429: Too Many Requests - Rate limit exceeded
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429
 * - 500: Internal Server Error - Unexpected server-side failure
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500
 * - 503: Service Unavailable - Server temporarily unavailable or under maintenance
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503
 */
export function sendError(
  reply: FastifyReply,
  { code, error, responseCode, message }: IError,
  request?: FastifyRequest
): FastifyReply {
  const language = (request?.headers["accept-language"] ??
    "en") as SupportedLanguages;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorObject: IError = {
    code: code,
    ...(responseCode
      ? { response: responseCodes(language)[responseCode] }
      : {}),
  };

  if (error) console.log(errorMessage);
  if (message) errorObject.message = message;
  else errorObject.message = statusCodes[code];

  return reply.status(code).send({
    success: false,
    data: null,
    error: errorObject,
  });
}

export function sendSuccess(
  reply: FastifyReply,
  data: {} | null,
  { code }: { code?: number }
) {
  return reply.status(code ?? 200).send({
    success: true,
    data: data,
    error: null,
  });
}
