import { Product } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const mapProduct = (apiProduct: any): Product => ({
  parent_asin: apiProduct._id,
  title: apiProduct.name,
  main_category: apiProduct.category,
  categories: [apiProduct.category],
  price: apiProduct.price,
  description: [apiProduct.description],
  average_rating: 4.5,
  rating_number: Math.floor(Math.random() * 500) + 10,
  features: ["Chất lượng cao", "Bền bỉ", "Thiết kế đẹp"],
  store: 'Official Store',
  details: {},
  bought_together: [],
  image_url: apiProduct.image_url
});
