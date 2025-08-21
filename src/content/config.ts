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
    // Lesgevers data
    lesgevers: z
      .array(
        z.object({
          name: z.string(),
          image: z.string(),
          info: z.array(z.string()),
        })
      )
      .optional(),
  }),
});

export const collections = {
  pages: pages,
};
