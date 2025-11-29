import { defineCollection, z } from "astro:content";

const pages = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
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
          })
        )
        .optional(),
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
          })
        )
        .optional(),
      facebookLink: z.string().url().optional(),
    }),
});

export const collections = {
  pages: pages,
};
