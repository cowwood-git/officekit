import { SITE } from '@/consts';
import type { FaqItem, Tool } from '@/data/tools';
import type { Locale } from '@/i18n/ui';

export function websiteSchema(site: URL | string) {
  const base = new URL(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: base.toString(),
    inLanguage: 'ko',
    description: SITE.description,
  };
}

export function organizationSchema(site: URL | string) {
  const base = new URL(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: base.toString(),
    email: SITE.email,
    foundingDate: SITE.founded,
  };
}

export function breadcrumbSchema(site: URL | string, items: Array<{ name: string; path: string }>) {
  const base = new URL(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, base).toString(),
    })),
  };
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

const APP_CATEGORY: Record<Tool['category'], string> = {
  document: 'BusinessApplication',
  image: 'MultimediaApplication',
  text: 'UtilitiesApplication',
  utility: 'UtilitiesApplication',
};

export function toolSchema(tool: Tool, site: URL | string, path: string, locale: Locale = 'ko') {
  const base = new URL(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title[locale] ?? tool.title.ko,
    description: tool.description[locale] ?? tool.description.ko,
    url: new URL(path, base).toString(),
    applicationCategory: APP_CATEGORY[tool.category],
    operatingSystem: 'Any',
    browserRequirements: 'JavaScript',
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    dateModified: tool.updated,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: base.toString(),
    },
  };
}

export function itemListSchema(
  site: URL | string,
  name: string,
  items: Array<{ name: string; path: string; description?: string }>,
) {
  const base = new URL(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: new URL(item.path, base).toString(),
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

export function collectionPageSchema(
  site: URL | string,
  name: string,
  description: string,
  path: string,
  items: Array<{ name: string; path: string; description?: string }>,
  locale: Locale = 'ko',
) {
  const base = new URL(site);
  const url = new URL(path, base).toString();
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE.name,
      url: base.toString(),
    },
    mainEntity: itemListSchema(site, name, items),
  };
}

export function howToSchema(
  site: URL | string,
  name: string,
  description: string,
  path: string,
  steps: Array<{ name: string; text: string; path?: string }>,
) {
  const base = new URL(site);
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    url: new URL(path, base).toString(),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.path ? { url: new URL(step.path, base).toString() } : {}),
    })),
  };
}
