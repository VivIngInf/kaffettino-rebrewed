// plugins/request-session.ts
import fp from "fastify-plugin";

/**
 * Fastify plugin that decorates the request object with a `session` property.
 *
 * @param fastify - The Fastify instance to decorate.
 * @remarks
 * This plugin adds a `device` property (initialized as `null`) to every incoming request.
 * Useful for session management or authentication middleware.
 *
 * @example
 * // Accessing session in a route handler:
 * fastify.get('/route', (request, reply) => {
 *   const device = request.device;
 * });
 */
export default fp(async function (fastify) {
  fastify.decorateRequest("card");
});
