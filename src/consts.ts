export const ROUTES = [
  { href: "/", label: "Art" },
  { href: "/about", label: "About" },
] as const;


export const PERSONAL_INFO = {
  name: "Yeon Lee",
  title: "Yeon Joo Lee",
  subtitle:
    "A refined collection of contemporary work shaped by atmosphere, texture, and light.",
  role: "Contemporary Painter",
  contact: "yeonjlart@gmail.com",
  avatar:
    "https://github.com/user-attachments/assets/a543b428-3c52-421d-a5d5-32bcd97b1e6e",
  about: `Yeon Lee creates paintings that balance quiet intensity with elegant simplicity.
    Each piece is designed to feel timeless, intimate, and deeply atmospheric.`,
} as const;

export const SEO_INFO = [
  {
    name: "description",
    content: "Art portfolio made by Yeon Lee",
  },
  { name: "keywords", content: "Art portfolio, Digital art, gallery" },
  { name: "author", content: PERSONAL_INFO.name },
];
