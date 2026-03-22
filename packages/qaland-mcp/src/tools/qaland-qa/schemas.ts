import { z } from "zod";

export const qalandQaProjectInputSchema = z.object({
  project_name: z
    .string()
    .min(1)
    .describe("Project name used to filter QA knowledge records."),
});

export type QalandQaProjectArgs = z.infer<typeof qalandQaProjectInputSchema>;

export const qalandQaContextInputSchema = z.object({
  project_name: z
    .string()
    .min(1)
    .describe("Project name used to filter QA knowledge records."),
  screen_function_name: z
    .string()
    .min(1)
    .describe("Screen or function name used to retrieve matching SRS content."),
});

export type QalandQaContextArgs = z.infer<typeof qalandQaContextInputSchema>;

export const qalandQaEmptyInputSchema = z.object({});
