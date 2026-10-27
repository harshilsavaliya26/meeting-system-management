CREATE DATABASE IF NOT EXISTS meetsphere_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE meetsphere_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  meeting_code VARCHAR(32) NOT NULL UNIQUE,
  host_user_id INT NOT NULL,
  scheduled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_meeting_host FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE
);




ALTER TABLE meetings ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS details_json LONGTEXT NULL;


-- Payment records for paid meetings. The API also uses these columns for checkout tracking.
CREATE TABLE IF NOT EXISTS meeting_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  user_id INT NOT NULL,
  meeting_title VARCHAR(180) NOT NULL,
  user_name VARCHAR(120) NOT NULL,
  user_email VARCHAR(190) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(40) NOT NULL DEFAULT 'Razorpay',
  transaction_id VARCHAR(190) NOT NULL,
  gateway_order_id VARCHAR(190) NULL,
  gateway_payment_id VARCHAR(190) NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  INDEX idx_payment_user (user_id),
  INDEX idx_payment_meeting (meeting_id),
  INDEX idx_payment_order (gateway_order_id),
  CONSTRAINT fk_payment_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- One-time password reset codes; codes are hashed and expire after 10 minutes.
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_user (user_id),
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
