#!/usr/bin/env node

/**
 * Reproducible section PNG pipeline.
 * Usage: node scripts/process-section-assets.mjs <config.json> [--dry-run]
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { optimise as oxipngOptimise } from '@jsquash/oxipng';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const configArg = args.find((arg) => !arg.startsWith('--'));

if (!configArg) {
  console.error('Usage: node scripts/process-section-assets.mjs <config.json> [--dry-run]');
  process.exit(1);
}

const configPath = isAbsolute(configArg) ? configArg : resolve(PROJECT_ROOT, configArg);
const projectPath = (path) => (isAbsolute(path) ? path : resolve(PROJECT_ROOT, path));

function assertPositive(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than 0`);
}

function assertNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be 0 or greater`);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function cropPixels(crop = {}, sourceDensity) {
  const multiplier = crop.unit === 'logical' ? sourceDensity : 1;
  const values = {};
  for (const side of ['left', 'right', 'top', 'bottom']) {
    const value = crop[side] ?? 0;
    assertNonNegative(value, `crop.${side}`);
    values[side] = Math.round(value * multiplier);
  }
  return values;
}

async function losslessPng(image) {
  const sharpBuffer = await image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  try {
    const input = sharpBuffer.buffer.slice(
      sharpBuffer.byteOffset,
      sharpBuffer.byteOffset + sharpBuffer.byteLength,
    );
    const optimized = Buffer.from(await oxipngOptimise(input, { level: 6, optimiseAlpha: true }));
    return optimized.length < sharpBuffer.length ? optimized : sharpBuffer;
  } catch {
    return sharpBuffer;
  }
}

async function compareRgba(reference, candidate) {
  const [a, b] = await Promise.all([
    sharp(reference).ensureAlpha().raw().toBuffer(),
    sharp(candidate).ensureAlpha().raw().toBuffer(),
  ]);
  if (a.length !== b.length) return { mean: Infinity, max: Infinity, alphaMax: Infinity };
  let sum = 0;
  let max = 0;
  let alphaMax = 0;
  for (let i = 0; i < a.length; i += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const diff = Math.abs(a[i + channel] - b[i + channel]);
      sum += diff;
      max = Math.max(max, diff);
    }
    alphaMax = Math.max(alphaMax, Math.abs(a[i + 3] - b[i + 3]));
  }
  return { mean: sum / ((a.length / 4) * 3), max, alphaMax };
}

async function compressPng(image, compression) {
  const lossless = await losslessPng(image.clone());
  if (compression.mode === 'lossless') return { buffer: lossless, method: 'lossless' };
  if (compression.mode !== 'auto') throw new Error('compression.mode must be "auto" or "lossless"');

  const palette = await image.clone().png({
    palette: true,
    colours: compression.colors,
    quality: 100,
    dither: 0,
    compressionLevel: 9,
    effort: 10,
  }).toBuffer();
  const difference = await compareRgba(lossless, palette);
  const enoughSavings = palette.length <= lossless.length * (1 - compression.minSavings);
  const withinTolerance =
    difference.mean <= compression.maxMeanDifference &&
    difference.max <= compression.maxChannelDifference &&
    difference.alphaMax === 0;
  return enoughSavings && withinTolerance
    ? { buffer: palette, method: 'palette', difference }
    : { buffer: lossless, method: 'lossless', difference };
}

function normalizeConfig(raw) {
  const canvas = raw.canvas ?? { width: 1440, height: 810 };
  const density = raw.density ?? 2;
  assertPositive(canvas.width, 'canvas.width');
  assertPositive(canvas.height, 'canvas.height');
  assertPositive(density, 'density');
  if (!raw.outputDir) throw new Error('outputDir is required');
  if (!Array.isArray(raw.assets) || raw.assets.length === 0) {
    throw new Error('assets must contain at least one item');
  }
  return {
    canvas,
    density,
    outputDir: raw.outputDir,
    layoutFile: raw.layoutFile ?? 'layout.json',
    compression: {
      mode: raw.compression?.mode ?? 'auto',
      colors: raw.compression?.colors ?? 256,
      minSavings: raw.compression?.minSavings ?? 0.08,
      maxMeanDifference: raw.compression?.maxMeanDifference ?? 1,
      maxChannelDifference: raw.compression?.maxChannelDifference ?? 8,
    },
    assets: raw.assets,
  };
}

async function prepareAsset(asset, config) {
  if (!asset.input || !asset.output) throw new Error('Every asset needs input and output');
  if (extname(asset.output).toLowerCase() !== '.png') {
    throw new Error(`${asset.output}: output must be a .png file`);
  }
  const inputPath = projectPath(asset.input);
  const metadata = await sharp(inputPath).metadata();
  if (metadata.format !== 'png' || !metadata.width || !metadata.height) {
    throw new Error(`${asset.input}: input must be a readable PNG`);
  }

  const density = asset.density ?? config.density;
  const sourceDensity = asset.sourceDensity ?? density;
  const mode = asset.mode ?? 'canvas';
  const crop = cropPixels(asset.crop, sourceDensity);
  const extractWidth = metadata.width - crop.left - crop.right;
  const extractHeight = metadata.height - crop.top - crop.bottom;
  assertPositive(extractWidth, `${asset.output} cropped width`);
  assertPositive(extractHeight, `${asset.output} cropped height`);

  let image = sharp(inputPath);
  const hasCrop = crop.left > 0 || crop.right > 0 || crop.top > 0 || crop.bottom > 0;
  // Materialize geometric stages so Sharp cannot reorder extract/trim/resize.
  if (hasCrop) {
    image = sharp(await image.extract({
      left: crop.left,
      top: crop.top,
      width: extractWidth,
      height: extractHeight,
    }).png().toBuffer());
  }
  let logicalRect;

  if (mode === 'element') {
    if (asset.trimAlpha !== false) {
      image = sharp(await image.trim({ background: '#00000000' }).png().toBuffer());
    }
    if (!asset.bbox) throw new Error(`${asset.output}: element mode requires bbox`);
    for (const key of ['x', 'y', 'width', 'height']) {
      if (!Number.isFinite(asset.bbox[key])) throw new Error(`${asset.output}: bbox.${key} is required`);
    }
    assertPositive(asset.bbox.width, `${asset.output} bbox.width`);
    assertPositive(asset.bbox.height, `${asset.output} bbox.height`);
    logicalRect = { ...asset.bbox };
  } else if (mode === 'canvas') {
    logicalRect = asset.bbox ?? { x: 0, y: 0, width: config.canvas.width, height: config.canvas.height };
  } else {
    throw new Error(`${asset.output}: mode must be "canvas" or "element"`);
  }

  const targetWidth = Math.round(logicalRect.width * density);
  const targetHeight = Math.round(logicalRect.height * density);
  assertPositive(targetWidth, `${asset.output} target width`);
  assertPositive(targetHeight, `${asset.output} target height`);
  image = image.resize(targetWidth, targetHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 });

  const result = await compressPng(image, { ...config.compression, ...asset.compression });
  return {
    outputPath: join(projectPath(config.outputDir), asset.output),
    buffer: result.buffer,
    report: {
      name: asset.name ?? asset.output.replace(/\.png$/i, ''),
      file: asset.output,
      mode,
      bbox: logicalRect,
      density,
      pixelSize: { width: targetWidth, height: targetHeight },
      sourceSize: { width: metadata.width, height: metadata.height },
      crop,
      compression: result.method,
      bytes: result.buffer.length,
      ...(result.difference ? { quantizationDifference: result.difference } : {}),
    },
  };
}

async function main() {
  const config = normalizeConfig(JSON.parse(await readFile(configPath, 'utf8')));
  const outputDir = projectPath(config.outputDir);
  const prepared = [];
  for (const asset of config.assets) prepared.push(await prepareAsset(asset, config));

  const layout = {
    coordinateSystem: { ...config.canvas, unit: 'logical-px' },
    defaultDensity: config.density,
    assets: prepared.map((item) => {
      const { bytes, quantizationDifference, ...layoutItem } = item.report;
      return layoutItem;
    }),
  };

  if (!dryRun) {
    await mkdir(outputDir, { recursive: true });
    for (const item of prepared) {
      await mkdir(dirname(item.outputPath), { recursive: true });
      await writeFile(item.outputPath, item.buffer);
    }
    await writeFile(join(outputDir, config.layoutFile), `${JSON.stringify(layout, null, 2)}\n`);
  }

  console.log(dryRun ? 'DRY RUN — no files written\n' : `Output: ${relative(PROJECT_ROOT, outputDir)}\n`);
  for (const item of prepared) {
    const r = item.report;
    const diff = r.quantizationDifference;
    console.log(
      `${r.file}: ${r.pixelSize.width}x${r.pixelSize.height}, ${formatBytes(r.bytes)}, ${r.compression}` +
        (diff ? ` (mean Δ ${diff.mean.toFixed(3)}, max Δ ${diff.max}, alpha Δ ${diff.alphaMax})` : ''),
    );
  }
}

main().catch((error) => {
  console.error(`Asset processing failed: ${error.message}`);
  process.exit(1);
});
