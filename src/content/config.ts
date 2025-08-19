import { defineCollection, z } from "astro:content";

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(["info", "lesgevers"]).default("info"),
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    order: z.number().optional(), // fallback order
    navOrder: z.array(z.string()).optional(), // explicit ordering (root & folders)
  }),
});

export const collections = {
  pages: pages,
};
