CREATE TABLE users (
 id CHAR(36) PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, display_name VARCHAR(120) NOT NULL,
 password_hash VARCHAR(100) NOT NULL, role VARCHAR(24) NOT NULL DEFAULT 'USER',
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);
CREATE TABLE subscriptions (
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL UNIQUE, plan_code VARCHAR(24) NOT NULL DEFAULT 'FREE',
 status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE', current_period_start TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 current_period_end TIMESTAMP(6) NULL, external_customer_id VARCHAR(160) NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_subscription_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE vehicles (
 id CHAR(36) PRIMARY KEY, owner_id CHAR(36) NOT NULL, vin VARCHAR(17) NULL, nickname VARCHAR(100) NULL,
 make VARCHAR(80) NULL, model VARCHAR(100) NULL, model_year INT NULL, engine VARCHAR(120) NULL,
 transmission VARCHAR(80) NULL, fuel_type VARCHAR(60) NULL, region VARCHAR(80) NULL,
 displacement_l DECIMAL(4,1) NULL, mileage BIGINT NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_vehicle_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT uq_vehicle_vin_owner UNIQUE(owner_id,vin), INDEX idx_vehicle_owner(owner_id,created_at)
);
CREATE TABLE scan_reports (
 id CHAR(36) PRIMARY KEY, owner_id CHAR(36) NOT NULL, vehicle_id CHAR(36) NULL,
 original_file_name VARCHAR(255) NOT NULL, source_format VARCHAR(20) NOT NULL, storage_key VARCHAR(160) NULL,
 diagnostics_json LONGTEXT NOT NULL, summary TEXT NULL, ai_analysis TEXT NULL,
 health_score INT NULL, uploaded_bytes BIGINT NOT NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_report_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_report_vehicle FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
 INDEX idx_report_owner_created(owner_id,created_at), INDEX idx_report_vehicle_created(vehicle_id,created_at)
);
CREATE TABLE cached_diagnostics (
 code VARCHAR(5) PRIMARY KEY, payload_json LONGTEXT NOT NULL, source VARCHAR(255) NOT NULL,
 cached_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), expires_at TIMESTAMP(6) NOT NULL,
 INDEX idx_diagnostic_expiry(expires_at)
);
CREATE TABLE refresh_tokens (
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
 expires_at TIMESTAMP(6) NOT NULL, revoked_at TIMESTAMP(6) NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_refresh_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_refresh_user(user_id,expires_at)
);
CREATE TABLE notifications (
 id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, category VARCHAR(32) NOT NULL,
 title VARCHAR(180) NOT NULL, body TEXT NOT NULL, read_at TIMESTAMP(6) NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_notification_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_notification_user(user_id,created_at)
);
CREATE TABLE maintenance_records (
 id CHAR(36) PRIMARY KEY, vehicle_id CHAR(36) NOT NULL, owner_id CHAR(36) NOT NULL,
 title VARCHAR(140) NOT NULL, notes VARCHAR(1000) NULL, performed_at TIMESTAMP(6) NULL,
 cost DECIMAL(10,2) NULL, mileage BIGINT NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 CONSTRAINT fk_maintenance_vehicle FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
 CONSTRAINT fk_maintenance_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_maintenance_vehicle(vehicle_id,performed_at)
);
CREATE TABLE audit_logs (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, actor_id CHAR(36) NULL,
 action VARCHAR(80) NOT NULL, resource_type VARCHAR(60) NOT NULL, resource_id VARCHAR(64) NULL,
 created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 INDEX idx_audit_actor_created(actor_id,created_at), INDEX idx_audit_action_created(action,created_at)
);
