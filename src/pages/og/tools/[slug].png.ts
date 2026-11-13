import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { groupFor } from '@/data/app-groups';
import { CATEGORIES, type Tool, tools, tx } from '@/data/tools';
import { ogCardSvg } from '@/lib/og-card';

/** 빌드 때 도구마다 공유 이미지(1200×630 PNG)를 만든다 — /og/tools/{slug}.png */
export const getStaticPaths: GetStaticPaths = () =>
  tools.map((tool) => ({ params: { slug: tool.slug }, props: { tool } }));

export const GET: APIRoute<{ tool: Tool }> = async ({ props }) => {
  const { tool } = props;
  const svg = ogCardSvg({
    eyebrow: groupFor(tool.slug)?.label ?? CATEGORIES[tool.category].label,
    title: tx(tool.title),
    summary: tx(tool.summary),
  });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
