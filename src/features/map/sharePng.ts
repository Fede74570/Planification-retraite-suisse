import markUrl from '@/assets/logo-mark.svg';
import { REGIME_LABEL } from '@/data/countries';
import type { CountrySheet } from '@/data/countrySheet';

/**
 * Renders the country sheet as a PNG (canvas 2D, same-origin fonts and logo — no network)
 * and shares it (Web Share with files) or downloads it.
 */
export async function shareSheetPng(data: CountrySheet, flag: string): Promise<void> {
  const W = 1080,
    H = 1350,
    pad = 72;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  await document.fonts.ready;
  ctx.fillStyle = '#FCFBF8';
  ctx.fillRect(0, 0, W, H);
  const logo = await loadImage(markUrl);
  if (logo) ctx.drawImage(logo, pad, pad, 120, 120);
  ctx.fillStyle = '#1A2A49';
  ctx.font = '600 34px "Literata Variable", Georgia, serif';
  ctx.fillText('Ma retraite Franco-Suisse', pad + 150, pad + 70);
  ctx.font = '600 72px "Literata Variable", Georgia, serif';
  ctx.fillText(`${flag} ${data.country.nameFr}`, pad, pad + 260);
  ctx.font = '600 30px "Inter Variable", system-ui, sans-serif';
  ctx.fillStyle = '#0055A3';
  const badges = [
    REGIME_LABEL[data.country.regime],
    data.country.dta ? 'CDI en vigueur' : 'Pas de CDI',
  ];
  ctx.fillText(badges.join('  ·  '), pad, pad + 320);
  let y = pad + 410;
  const rows: Array<[string, typeof data.sheet.avs]> = [
    ['AVS', data.sheet.avs],
    ['LPP', data.sheet.lpp],
    ['3a', data.sheet.p3a],
    ['3b', data.sheet.p3b],
    ['Bon à savoir', data.sheet.tip],
  ];
  const icon = { ok: '✅', warn: '⚠️', no: '❌' } as const;
  for (const [label, bullets] of rows) {
    ctx.fillStyle = '#1A2A49';
    ctx.font = '700 32px "Inter Variable", system-ui, sans-serif';
    ctx.fillText(label, pad, y);
    y += 48;
    ctx.font = '400 30px "Inter Variable", system-ui, sans-serif';
    for (const b of bullets) {
      y =
        wrapText(
          ctx,
          `${icon[b.status]}  ${b.text}${b.unverified ? ' (à confirmer)' : ''}`,
          pad + 10,
          y,
          W - 2 * pad - 10,
          40,
        ) + 10;
    }
    y += 22;
  }
  ctx.fillStyle = '#56627A';
  ctx.font = '400 22px "Inter Variable", system-ui, sans-serif';
  ctx.fillText(`Source : ${data.sourceLabel.slice(0, 80)}`, pad, H - pad - 34);
  ctx.fillText(
    `Vérifié le ${new Date(data.verifiedOn).toLocaleDateString('fr-CH')} · Simulation indicative`,
    pad,
    H - pad,
  );

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) return;
  const file = new File([blob], `retraite-${data.country.iso3.toLowerCase()}.png`, {
    type: 'image/png',
  });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: `Retraite : ${data.country.nameFr}` });
      return;
    } catch {
      /* cancelled: fall back to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}
