import { z } from "zod";

export const PipelineStepSchema = z.object({
  id: z.string(),
  commandId: z.string(),
  args: z.array(z.string()),
  flags: z.array(z.string()),
  continueOnError: z.boolean(),
  label: z.string().optional(),
});

export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(PipelineStepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
