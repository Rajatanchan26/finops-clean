-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- e.g., 'admin', 'user', etc.
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL, -- e.g., 'Finance', 'HR', 'Digital Transformation', 'Planning', 'Data&AI'
    profile_picture_url TEXT,
    employee_grade VARCHAR(50),
    designation VARCHAR(100),
    firebase_uid VARCHAR(128)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    commission_amount DECIMAL(15,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    description TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Sample invoice data for analytics
INSERT INTO invoices (invoice_number, amount, commission_amount, commission_rate, status, description, user_id, created_at) VALUES
('INV-2024-001', 5000.00, 250.00, 5.00, 'approved', 'Q1 Sales Commission', 1, '2024-01-15 10:30:00'),
('INV-2024-002', 7500.00, 375.00, 5.00, 'approved', 'Marketing Campaign Revenue', 2, '2024-01-20 14:45:00'),
('INV-2024-003', 3000.00, 150.00, 5.00, 'pending', 'Client Consultation Fee', 1, '2024-02-01 09:15:00'),
('INV-2024-004', 12000.00, 600.00, 5.00, 'approved', 'Enterprise Software License', 3, '2024-02-05 16:20:00'),
('INV-2024-005', 8000.00, 400.00, 5.00, 'pending', 'Training Program Revenue', 2, '2024-02-10 11:30:00'),
('INV-2024-006', 4500.00, 225.00, 5.00, 'rejected', 'Consulting Services', 1, '2024-02-15 13:45:00'),
('INV-2024-007', 15000.00, 750.00, 5.00, 'approved', 'Annual Maintenance Contract', 3, '2024-02-20 10:00:00'),
('INV-2024-008', 6000.00, 300.00, 5.00, 'pending', 'Support Services', 2, '2024-02-25 15:30:00'),
('INV-2024-009', 9000.00, 450.00, 5.00, 'approved', 'Digital Transformation Project', 4, '2024-03-01 12:00:00'),
('INV-2024-010', 11000.00, 550.00, 5.00, 'approved', 'Data Analytics Platform', 5, '2024-03-05 14:30:00'),
('INV-2024-011', 7000.00, 350.00, 5.00, 'pending', 'HR System Implementation', 6, '2024-03-10 09:45:00'),
('INV-2024-012', 13000.00, 650.00, 5.00, 'approved', 'Financial Planning Services', 7, '2024-03-15 16:15:00')
ON CONFLICT (invoice_number) DO NOTHING; 