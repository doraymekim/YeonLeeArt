import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Artwork image manifest.
//
// Masters in src/assets/ are never rewritten. Astro's image service builds
// derivatives at build time:
//
//   grid   WebP q80 at 480 / 640 / 800 / 1200 / 1600 — cards, hero, slideshows
//   modal  WebP q85 at min(1600, native width) — lightbox detail view
//   full   WebP q90 at min(2560, native width) — fullscreen view
//
// Widths stop at the painting's real pixel size so a smaller master is not
// stretched. AVIF was measured for these paintings: at settings that held
// the same detail as WebP q80 it came out larger, so page images stay WebP.
// ---------------------------------------------------------------------------

export interface ArtworkImage {
  /** Filename without extension, e.g. "Balloon Trail Blue" */
  label: string;
  /** Original filename, e.g. "Balloon Trail Blue.jpg" */
  fileName: string;
  /** Mid-size WebP used as the src fallback (around 800px, or native if smaller) */
  grid: string;
  /** Responsive WebP candidates for grids and page images */
  gridSrcSet: string;
  /**
   * Higher-quality responsive WebP (q85, up to 1600) for large page photos.
   * Present on bio images, which are shown big on the about page.
   */
  pageSrc?: string | undefined;
  pageSrcSet?: string | undefined;
  /** ~1600w (or native) WebP for the lightbox detail view */
  modal: string;
  /** ~2560w (or native) WebP for the fullscreen view */
  full: string;
  /** Intrinsic dimensions of the master, for aspect ratio */
  width: number;
  height: number;
  /** Tiny inline WebP shown as a blur while the real image loads */
  placeholder: string;
}

const GRID_WIDTHS = [480, 640, 800, 1200, 1600];
const GRID_QUALITY = 80;
const PAGE_WIDTHS = [640, 960, 1280, 1600];
const PAGE_QUALITY = 85;
const MODAL_WIDTH = 1600;
const MODAL_QUALITY = 85;
const FULL_WIDTH = 2560;
const FULL_QUALITY = 90;

const labelOf = (filePath: string) =>
  (filePath.split('/').pop() || '').replace(/\.[^.]+$/, '');

// Astro's image object marks a master as "used by the page" when code reads
// its width, height, or src. Those files would then be uploaded at full size
// even though no page links to them. Read the path only, and measure the
// pixels with sharp. The file in src/assets/ is never written.
function masterFilePath(meta: ImageMetadata): string {
  const filePath = (meta as ImageMetadata & { fsPath?: string }).fsPath;
  if (!filePath) {
    throw new Error('Artwork master is missing its file path.');
  }
  return filePath;
}

function orientedSize(width: number, height: number, orientation?: number) {
  const swap = (orientation || 0) >= 5;
  return swap ? { width: height, height: width } : { width, height };
}

async function readMaster(meta: ImageMetadata): Promise<{
  width: number;
  height: number;
  placeholder: string;
}> {
  const filePath = masterFilePath(meta);
  const probed = await sharp(filePath).metadata();
  const size = orientedSize(probed.width ?? 0, probed.height ?? 0, probed.orientation);
  if (!size.width || !size.height) {
    throw new Error(`Could not read the size of ${filePath}`);
  }
  const buf = await sharp(filePath)
    .rotate()
    .resize({ width: 20, withoutEnlargement: true })
    .webp({ quality: 30 })
    .toBuffer();
  return {
    width: size.width,
    height: size.height,
    placeholder: `data:image/webp;base64,${buf.toString('base64')}`,
  };
}

function fallbackWidth(descriptor: string): number {
  const parsed = Number.parseInt(descriptor, 10);
  return Number.isFinite(parsed) ? parsed : 800;
}

async function makeSrcSet(
  meta: ImageMetadata,
  widths: number[],
  quality: number,
  fallbackDescriptor: string,
  nativeWidth: number,
): Promise<{ src: string; srcset: string }> {
  // Pass an explicit width. Without one, Astro also emits a full-size
  // WebP of the master, and that file would be deployed even though no
  // page asks for it.
  const generated = await getImage({
    src: meta,
    width: Math.min(fallbackWidth(fallbackDescriptor), nativeWidth),
    widths,
    format: 'webp',
    quality,
  });
  const values = generated.srcSet?.values ?? [];
  const fallback =
    values.find((value) => value.descriptor === fallbackDescriptor) ??
    values[values.length - 1];
  return {
    src: fallback?.url ?? generated.src,
    srcset: generated.srcSet?.attribute ?? '',
  };
}

async function singleWebp(
  meta: ImageMetadata,
  width: number,
  quality: number,
  nativeWidth: number,
): Promise<string> {
  const generated = await getImage({
    src: meta,
    width: Math.min(width, nativeWidth),
    format: 'webp',
    quality,
  });
  return generated.src;
}

async function buildEntries(
  modules: Record<string, ImageMetadata>,
  options: { page?: boolean } = {},
): Promise<ArtworkImage[]> {
  const entries = await Promise.all(
    Object.entries(modules).map(async ([filePath, meta]) => {
      const master = await readMaster(meta);
      const [grid, page, modal, full] = await Promise.all([
        makeSrcSet(meta, GRID_WIDTHS, GRID_QUALITY, '800w', master.width),
        options.page
          ? makeSrcSet(meta, PAGE_WIDTHS, PAGE_QUALITY, '1600w', master.width)
          : Promise.resolve(null),
        singleWebp(meta, MODAL_WIDTH, MODAL_QUALITY, master.width),
        singleWebp(meta, FULL_WIDTH, FULL_QUALITY, master.width),
      ]);
      return {
        label: labelOf(filePath),
        fileName: filePath.split('/').pop() || '',
        grid: grid.src,
        gridSrcSet: grid.srcset,
        pageSrc: page?.src,
        pageSrcSet: page?.srcset,
        modal,
        full,
        width: master.width,
        height: master.height,
        placeholder: master.placeholder,
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
export const BIO_IMAGES: ArtworkImage[] = await buildEntries(toMetaMap(bioModules), {
  page: true,
});

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
