-- Create database for MWU Student Clearance System
CREATE DATABASE IF NOT EXISTS mwu_clearance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON mwu_clearance.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;

-- Switch to the database
USE mwu_clearance;

-- Verify database creation
SELECT 'Database mwu_clearance created successfully!' AS status;
