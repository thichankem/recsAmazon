-- Create users table
CREATE TABLE IF NOT EXISTS users (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    image_url TEXT
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(_id),
    product_id TEXT REFERENCES products(_id),
    action TEXT NOT NULL,
    rating_score NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
