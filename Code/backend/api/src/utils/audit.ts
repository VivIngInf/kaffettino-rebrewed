import { prisma } from "../plugins/prisma.js";
import { AuditActorType } from "../generated/prisma/enums.js";

export enum AuditActor {
  USER = "USER",
  DEVICE = "DEVICE",
  SYSTEM = "SYSTEM",
  SERVICE = "SERVICE",
}

export interface AuditLogParams {
  // Evento di dominio (vocabolario controllato)
  action: string;

  // Risorsa colpita
  entity: string;
  entityId: string;

  // Chi compie l’azione
  actorId?: string;
  actorType?: AuditActorType;

  version?: number;

  metadata?: {
    ip?: string;
    origin?: "web" | "mobile" | "api" | "cron";
    userAgent?: string;

    changedFields?: string[];

    old?: Record<string, unknown>;
    new?: Record<string, unknown>;

    // spazio controllato per estensioni future
    [key: string]: unknown;
  };
}

export default async function auditLog(params: AuditLogParams) {
  const audit = await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,

      actorId: params.actorId,
      actorType: params.actorType,

      version: params.version,
      metadata: JSON.stringify(params.metadata),
    },
  });

  return audit;
}
