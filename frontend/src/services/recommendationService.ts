import { Product } from '../types';
import { PRODUCTS } from '../data/products';

const normalize = (value: string) => value.toLowerCase().trim();

const getTopRatedProducts = (topK = 30): Product[] => {
  return [...PRODUCTS]
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, topK);
};

const mapTitlesToProducts = (titles: string[], topK = 30): Product[] => {
  if (!Array.isArray(titles) || titles.length === 0) {
    return getTopRatedProducts(topK);
  }

  const matched: Product[] = [];
  const seen = new Set<string>();

  for (const title of titles) {
    const normalizedTitle = normalize(title);
    if (!normalizedTitle) continue;

    const bestMatch = PRODUCTS.find((product) => {
      const normalizedProductTitle = normalize(product.title);
      return (
        normalizedProductTitle === normalizedTitle ||
        normalizedProductTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(normalizedProductTitle)
      );
    });

    if (bestMatch && !seen.has(bestMatch.parent_asin)) {
      seen.add(bestMatch.parent_asin);
      matched.push(bestMatch);
    }
  }

  if (matched.length >= topK) {
    return matched.slice(0, topK);
  }

  const fallback = getTopRatedProducts(topK).filter(
    (product) => !matched.some((item) => item.parent_asin === product.parent_asin)
  );

  return [...matched, ...fallback].slice(0, topK);
};

export async function getCollaborativeRecommendations(viewedTitles: string[], topK = 30): Promise<Product[]> {
  try {
    const response = await fetch('/api/recommendations/collaborative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewed_titles: viewedTitles, top_k: topK }),
    });

    if (!response.ok) {
      throw new Error(`Collaborative API lỗi: ${response.status}`);
    }

    const data = await response.json();
    const titles = Array.isArray(data?.titles) ? data.titles : [];
    return mapTitlesToProducts(titles, topK);
  } catch (error) {
    console.error('getCollaborativeRecommendations error:', error);
    return getTopRatedProducts(topK);
  }
}

export async function getContentRecommendations(title: string, description: string, topK = 8): Promise<Product[]> {
  try {
    const response = await fetch('/api/recommendations/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, top_k: topK }),
    });

    if (!response.ok) {
      throw new Error(`Content API lỗi: ${response.status}`);
    }

    const data = await response.json();
    const titles = Array.isArray(data?.titles) ? data.titles : [];
    return mapTitlesToProducts(titles, topK);
  } catch (error) {
    console.error('getContentRecommendations error:', error);
    return getTopRatedProducts(topK);
  }
}
