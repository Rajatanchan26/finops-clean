-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- e.g., 'admin', 'user', etc.
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL, -- e.g., 'Finance', 'HR', 'Digital Transformation', 'Planning', 'Data&AI'
    profile_picture_url TEXT
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    justification TEXT
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 