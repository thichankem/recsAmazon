/**
 * Types representing the Amazon-like product and review schema
 * based on the provided dataset documentation.
 */

export interface Review {
  rating: number; // float from 1.0 to 5.0
  title: string;
  text: string;
  asin: string;
  parent_asin: string; // Used to find product meta
  user_id: string;
  timestamp: number; // unix timestamp
  verified_purchase: boolean;
  helpful_vote: number;
}

export interface Product {
  main_category: string;
  title: string;
  average_rating: number;
  rating_number: number;
  features: string[];
  description: string[];
  price: number;
  store: string;
  categories: string[];
  details: Record<string, string>;
  parent_asin: string; // Unique ID
  bought_together: string[]; // List of parent_asin values
}

export interface RecUser {
  id: string;
  name: string;
  avatarColor: string;
  persona: string; // e.g. "Tech Enthusiast"
  history: string[]; // parent_asins purchased
  preferredCategories: string[];
}

export type RecommendationMethod = 
  | 'collaborative' // User profile filtering
  | 'content'       // Item description & category matching
  | 'bought_together' // Bought together list
  | 'popularity'    // High ratings & counts
  | 'custom_api';   // Direct external API testing

export interface CustomApiConfig {
  homepageUrl: string;
  homepageMethod: 'GET' | 'POST';
  homepageHeaders: string; // JSON string
  homepageKeyPath: string; // e.g. "recommended" or "data.items" or ""
  
  itempageUrl: string;
  itempageMethod: 'GET' | 'POST';
  itempageHeaders: string; // JSON string
  itempageKeyPath: string; // e.g. "related" or ""
}

export interface ApiCallLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  payload: string;
  status: number | 'PENDING' | 'FAILED';
  response: string;
  durationMs: number;
}
