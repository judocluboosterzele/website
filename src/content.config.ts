import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z
      .enum(["info", "lesgevers", "verslagen", "facebook-posts"])
      .default("info"),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    order: z.number().optional(),
    navOrder: z.array(z.string()).optional(),
    date: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    lesgevers: z
      .array(
        z.object({
          name: z.string(),
          image: z.string(),
          info: z.array(z.string()),
        }),
      )
      .optional(),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
        }),
      )
      .optional(),
    facebookLink: z.url().optional(),
  }),
});

export const collections = {
  pages: pages,
};
