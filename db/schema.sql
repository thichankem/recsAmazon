-- Schema for Hybrid Amazon Recommendation System Database

-- User Interaction History
CREATE TABLE IF NOT EXISTS user_history (
    user_id TEXT PRIMARY KEY,
    items TEXT -- JSON array of product IDs: ["asin1", "asin2", ...]
) WITHOUT ROWID;

-- Precomputed Jaccard Item Similarities
CREATE TABLE IF NOT EXISTS item_similarities (
    item_id TEXT PRIMARY KEY,
    similar_items TEXT -- JSON array of tuples: [["asin1", score1], ["asin2", score2], ...]
) WITHOUT ROWID;

-- Item Category Mapping
CREATE TABLE IF NOT EXISTS item_metadata (
    item_id TEXT PRIMARY KEY,
    category TEXT -- Main category name
) WITHOUT ROWID;

-- Top rated items per Category
CREATE TABLE IF NOT EXISTS category_top_rated (
    category TEXT PRIMARY KEY,
    top_items TEXT -- JSON array of product IDs: ["asin1", "asin2", ...]
) WITHOUT ROWID;

-- Global Top rated items
CREATE TABLE IF NOT EXISTS global_top_rated (
    id INTEGER PRIMARY KEY,
    top_items TEXT -- JSON array of product IDs: ["asin1", "asin2", ...]
);
