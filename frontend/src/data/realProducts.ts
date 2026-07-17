import { Product } from '../types';

const parseJsonl = (text: string) => {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

const loadProducts = (): Product[] => {
  const rawMeta = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_DATA_ROOT || '';
  const dataRoot = rawMeta ? `${rawMeta}` : '/src/data';

  const fallback: Product[] = [];
  return fallback;
};

export const REAL_PRODUCTS: Product[] = [];
