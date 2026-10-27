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

CREATE TABLE IF NOT EXISTS calendar_items (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(180) NOT NULL,
 start_at DATETIME NOT NULL, end_at DATETIME NULL, location VARCHAR(180) NULL, notes VARCHAR(500) NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_cal_user(user_id),
 CONSTRAINT fk_cal_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS notes (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(180) NOT NULL, content TEXT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_note_user(user_id), CONSTRAINT fk_note_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS contacts (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(120) NOT NULL, email VARCHAR(190) NULL,
 phone VARCHAR(40) NULL, company VARCHAR(120) NULL, notes VARCHAR(500) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_contact_user(user_id), CONSTRAINT fk_contact_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS automations (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(180) NOT NULL, trigger_name VARCHAR(120) NOT NULL,
 action_name VARCHAR(180) NOT NULL, enabled TINYINT(1) NOT NULL DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_auto_user(user_id), CONSTRAINT fk_auto_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS subscriptions (
 id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, plan_name VARCHAR(60) NOT NULL, amount DECIMAL(12,2) NOT NULL DEFAULT 0,
 status VARCHAR(30) NOT NULL DEFAULT 'Active', started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME NULL,
 transaction_id VARCHAR(190) NULL, INDEX idx_sub_user(user_id), CONSTRAINT fk_sub_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ZoomTokens (
  UserId INT NOT NULL PRIMARY KEY,
  AccessToken TEXT NOT NULL,
  RefreshToken TEXT NOT NULL,
  ExpiresAtUtc DATETIME NOT NULL,
  CreatedAtUtc DATETIME NOT NULL,
  UpdatedAtUtc DATETIME NOT NULL,
  CONSTRAINT fk_zoom_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE
);

-- Real-time audit logs for user logins and authentication/system errors.
-- Only records when a user attempts/completes login or encounters an error.
-- Users who only register without logging in are NOT added to this table.
CREATE TABLE IF NOT EXISTS user_login_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  email VARCHAR(190) NOT NULL,
  full_name VARCHAR(120) NULL,
  role VARCHAR(30) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Success',
  error_message TEXT NULL,
  ip_address VARCHAR(60) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_status (status),
  INDEX idx_login_email (email),
  INDEX idx_login_created (created_at),
  CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Action Items / Decision Ledger for workspace tasks & meeting follow-ups
CREATE TABLE IF NOT EXISTS action_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  due_date DATE NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
  done TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_action_user(user_id),
  INDEX idx_action_due(due_date),
  CONSTRAINT fk_action_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Platform-wide Admin Announcements banner
CREATE TABLE IF NOT EXISTS platform_announcements (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(500) NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idx_announcement_active_created (active, created_at),
  CONSTRAINT fk_announcement_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

