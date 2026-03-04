import { z } from "zod";

export const deviceRegistrationSchema = z.object({
  aulettaId: z.number(),
  deviceName: z.string(),
});
export type IDeviceRegistrationSchema = z.infer<
  typeof deviceRegistrationSchema
>;

export const deviceValidateId = z.object({
  deviceId: z.uuid(),
});

export type IDeviceValidateId = z.infer<typeof deviceValidateId>;

export const deviceValidateName = z.object({
  deviceName: z.string(),
});

export type IDeviceValidateName = z.infer<typeof deviceValidateName>;

export const deviceValidateNameAndId = z.intersection(
  deviceValidateId,
  deviceValidateName,
);

export type IDeviceValidateNameAndId = z.infer<typeof deviceValidateNameAndId>;
