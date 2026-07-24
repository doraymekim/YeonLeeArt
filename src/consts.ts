export const ROUTES = [
  { href: "/", label: "Art" },
  { href: "/about", label: "About" },
] as const;

// Icons from https://icon-sets.iconify.design
export const SOCIAL = [
  {
    label: "Twitter",
    href: "https://twitter.com/EmaSuriano",
    icon: "mdi:twitter",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/emanuel-suriano/",
    icon: "mdi:linkedin",
  },
  {
    label: "Website",
    href: "https://emasuriano.com",
    icon: "mdi:web",
  },
] as const;

export const PERSONAL_INFO = {
  name: "Yeon Lee",
  title: "Paintings that feel like calm luxury",
  subtitle:
    "A refined collection of contemporary work shaped by atmosphere, texture, and light.",
  role: "Contemporary Painter",
  contact: "mailto:hello@yeonlee.art",
  avatar:
    "https://github.com/user-attachments/assets/a543b428-3c52-421d-a5d5-32bcd97b1e6e",
  about: `Yeon Lee creates paintings that balance quiet intensity with elegant simplicity.
    Each piece is designed to feel timeless, intimate, and deeply atmospheric.`,
} as const;

export const SEO_INFO = [
  {
    name: "description",
    content: "Art portfolio made by Ema Suriano in his free time",
  },
  { name: "keywords", content: "Art portfolio, Digital art, gallery" },
  { name: "author", content: PERSONAL_INFO.name },
];
