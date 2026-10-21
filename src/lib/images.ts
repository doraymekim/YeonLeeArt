import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

// ---------------------------------------------------------------------------
// Central artwork image manifest.
//
// Masters live in src/assets/ (moved out of public/, where Astro copied them
// to the site verbatim at full size). Every consumer renders resized
// derivatives generated at build time by Astro's image service:
//
//   grid   ~800w  WebP q80  — gallery cards & stacked slideshow slides
//   modal  ~1600w WebP q85  — lightbox main view & modal thumbnails
//   full   ~2560w WebP q90  — fullscreen view (presentation-quality tier)
//
// Labels are derived from the master filenames exactly as the old public/
// scan derived them, so src/data/artworks.ts metadata stays keyed the
// same way.
// ---------------------------------------------------------------------------

export interface ArtworkImage {
  /** Filename without extension, e.g. "Balloon Trail Blue" */
  label: string;
  /** Original filename, e.g. "Balloon Trail Blue.jpg" */
  fileName: string;
  /** ~800w derivative for grids/cards */
  grid: string;
  /** ~1600w derivative for the lightbox main view & thumbnails */
  modal: string;
  /** ~2560w derivative for the fullscreen view */
  full: string;
  /** Intrinsic dimensions of the grid derivative */
  width: number;
  height: number;
}

const GRID_OPTS = { width: 800, format: 'webp', quality: 80 } as const;
const MODAL_OPTS = { width: 1600, format: 'webp', quality: 85 } as const;
const FULL_OPTS = { width: 2560, format: 'webp', quality: 90 } as const;

const labelOf = (filePath: string) =>
  (filePath.split('/').pop() || '').replace(/\.[^.]+$/, '');

async function buildEntries(
  modules: Record<string, ImageMetadata>,
): Promise<ArtworkImage[]> {
  const entries = await Promise.all(
    Object.entries(modules).map(async ([filePath, meta]) => {
      const [grid, modal, full] = await Promise.all([
        getImage({ src: meta, ...GRID_OPTS }),
        getImage({ src: meta, ...MODAL_OPTS }),
        getImage({ src: meta, ...FULL_OPTS }),
      ]);
      return {
        label: labelOf(filePath),
        fileName: filePath.split('/').pop() || '',
        grid: grid.src,
        modal: modal.src,
        full: full.src,
        width: grid.attributes.width,
        height: grid.attributes.height,
      } satisfies ArtworkImage;
    }),
  );
  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

const artworkModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/artwork/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { eager: true },
);
const bioModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/bio/*.{jpg,jpeg,png,JPG,JPEG,PNG}',
  { eager: true },
);

const toMetaMap = (mods: Record<string, { default: ImageMetadata }>) =>
  Object.fromEntries(Object.entries(mods).map(([p, m]) => [p, m.default]));

/** All gallery paintings (excludes bio/portrait assets), sorted by label. */
export const ARTWORK_IMAGES: ArtworkImage[] = await buildEntries(
  toMetaMap(artworkModules),
);

/** Artist/about photos (mom series + headshots), sorted by label. */
export const BIO_IMAGES: ArtworkImage[] = await buildEntries(toMetaMap(bioModules));

const ALL_IMAGES = [...ARTWORK_IMAGES, ...BIO_IMAGES];

export function findArtwork(label: string): ArtworkImage | undefined {
  const wanted = label.toLowerCase();
  return ALL_IMAGES.find((img) => img.label.toLowerCase() === wanted);
}

export function findArtworks(labels: string[]): ArtworkImage[] {
  return labels
    .map((label) => findArtwork(label))
    .filter((img): img is ArtworkImage => Boolean(img));
}
