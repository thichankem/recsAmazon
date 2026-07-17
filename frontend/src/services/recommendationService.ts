import { Product } from '../types';

const normalize = (value: string) => (value || '').toLowerCase().trim();

const getTopRatedProducts = (allProducts: Product[], topK = 30): Product[] => {
  return [...allProducts]
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, topK);
};

const mapTitlesToProducts = (titles: string[], allProducts: Product[], topK = 30): Product[] => {
  if (!Array.isArray(titles) || titles.length === 0) {
    return getTopRatedProducts(allProducts, topK);
  }

  const matched: Product[] = [];
  const seen = new Set<string>();

  for (const title of titles) {
    const normalizedTitle = normalize(title);
    if (!normalizedTitle) continue;

    const bestMatch = allProducts.find((product) => {
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

  const fallback = getTopRatedProducts(allProducts, topK).filter(
    (product) => !matched.some((item) => item.parent_asin === product.parent_asin)
  );

  return [...matched, ...fallback].slice(0, topK);
};

export async function getCollaborativeRecommendations(viewedTitles: string[], allProducts: Product[], topK = 30): Promise<Product[]> {
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
    const items = Array.isArray(data?.titles) ? data.titles : [];
    
    // Nếu backend trả về object có parent_asin (đã được làm giàu thông tin)
    if (items.length > 0 && typeof items[0] === 'object' && items[0].parent_asin) {
        return items as Product[];
    }
    
    return mapTitlesToProducts(items, allProducts, topK);
  } catch (error) {
    console.error('getCollaborativeRecommendations error:', error);
    return getTopRatedProducts(allProducts, topK);
  }
}

export async function getContentRecommendations(title: string, description: string, allProducts: Product[], topK = 8): Promise<Product[]> {
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
    const items = Array.isArray(data?.titles) ? data.titles : [];
    
    // Nếu backend trả về object có parent_asin (đã được làm giàu thông tin)
    if (items.length > 0 && typeof items[0] === 'object' && items[0].parent_asin) {
        return items as Product[];
    }
    
    return mapTitlesToProducts(items, allProducts, topK);
  } catch (error) {
    console.error('getContentRecommendations error:', error);
    return getTopRatedProducts(allProducts, topK);
  }
}
