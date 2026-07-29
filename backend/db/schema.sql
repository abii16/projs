-- NHK Zero-Trust Identity System - PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    provider VARCHAR(32) DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    browser VARCHAR(64) NOT NULL,
    os VARCHAR(64) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, browser, os)
);

CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR(128) NOT NULL,
    country VARCHAR(128) NOT NULL,
    ip VARCHAR(45),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, country, city)
);

CREATE TABLE IF NOT EXISTS active_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    auth_method VARCHAR(64) NOT NULL,
    access_token TEXT NOT NULL,
    access_token_expires_at BIGINT NOT NULL,
    refresh_token TEXT NOT NULL,
    refresh_token_expires_at BIGINT NOT NULL,
    device VARCHAR(128),
    browser VARCHAR(64),
    os VARCHAR(64),
    ip VARCHAR(45),
    location VARCHAR(128),
    created_timestamp BIGINT NOT NULL,
    last_active_timestamp BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
    identifier VARCHAR(255) PRIMARY KEY,
    attempt_count INT DEFAULT 0,
    locked_until BIGINT,
    captcha_required BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Demo User Insertion
INSERT INTO users (id, email, username, password_hash, full_name, provider)
VALUES ('usr_001', 'demo@gmail.com', 'sec_admin', 'Demo@2026!', 'Security Lead', 'local')
ON CONFLICT (id) DO NOTHING;
