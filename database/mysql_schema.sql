-- Run on an empty MySQL 8 database. Data is never dropped by startup.
CREATE TABLE users (
 user_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
 role ENUM('Customer','Staff','Admin') NOT NULL DEFAULT 'Customer',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sessions (
 token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL, expires_at DATETIME NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
 INDEX idx_session_expiry(expires_at)
);
CREATE TABLE parking_lots (
 lot_id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
 location VARCHAR(255) NOT NULL, total_capacity INT NOT NULL CHECK(total_capacity>0)
);
CREATE TABLE parking_slots (
 slot_id INT AUTO_INCREMENT PRIMARY KEY, lot_id INT NOT NULL,
 slot_number VARCHAR(20) NOT NULL,
 slot_type ENUM('Standard','EV','Accessible') NOT NULL DEFAULT 'Standard',
 status ENUM('Available','Occupied','Maintenance') NOT NULL DEFAULT 'Available',
 FOREIGN KEY(lot_id) REFERENCES parking_lots(lot_id), UNIQUE(lot_id,slot_number),
 INDEX idx_lot_status(lot_id,status)
);
CREATE TABLE vehicles (
 vehicle_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
 license_plate VARCHAR(20) NOT NULL UNIQUE,
 FOREIGN KEY(user_id) REFERENCES users(user_id),
 UNIQUE KEY uq_vehicle_owner(vehicle_id,user_id)
);
CREATE TABLE bookings (
 booking_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
 slot_id INT NOT NULL, vehicle_id INT NOT NULL,
 entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, exit_time TIMESTAMP NULL,
 total_fee DECIMAL(10,2) NULL CHECK(total_fee>=0),
 status ENUM('Active','Completed','Cancelled') NOT NULL DEFAULT 'Active',
 active_slot INT GENERATED ALWAYS AS (CASE WHEN status='Active' THEN slot_id ELSE NULL END) STORED,
 active_vehicle INT GENERATED ALWAYS AS (CASE WHEN status='Active' THEN vehicle_id ELSE NULL END) STORED,
 UNIQUE(active_slot), UNIQUE(active_vehicle),
 FOREIGN KEY(user_id) REFERENCES users(user_id), FOREIGN KEY(slot_id) REFERENCES parking_slots(slot_id),
 FOREIGN KEY(vehicle_id) REFERENCES vehicles(vehicle_id),
 CONSTRAINT fk_booking_vehicle_owner FOREIGN KEY(vehicle_id,user_id) REFERENCES vehicles(vehicle_id,user_id),
 CHECK(exit_time IS NULL OR exit_time>=entry_time), INDEX idx_user_status(user_id,status)
);
CREATE TABLE payments (
 payment_id INT AUTO_INCREMENT PRIMARY KEY, booking_id INT NOT NULL UNIQUE,
 amount DECIMAL(10,2) NOT NULL CHECK(amount>=0),
 payment_method ENUM('Demo') NOT NULL DEFAULT 'Demo',
 transaction_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(booking_id) REFERENCES bookings(booking_id)
);
CREATE TABLE incident_reports (
 incident_id INT AUTO_INCREMENT PRIMARY KEY, slot_id INT NOT NULL, user_id INT NOT NULL,
 category ENUM('Property Damage','Barrier Malfunction','Unauthorized Parking','Security') NOT NULL,
 description TEXT NOT NULL, severity ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
 status ENUM('Open','Under Investigation','Resolved') NOT NULL DEFAULT 'Open',
 reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(CHAR_LENGTH(description) BETWEEN 10 AND 2000),
 FOREIGN KEY(slot_id) REFERENCES parking_slots(slot_id), FOREIGN KEY(user_id) REFERENCES users(user_id),
 INDEX idx_incident_status(status,severity)
);
CREATE VIEW vw_active_occupancy AS
 SELECT l.lot_id,l.name AS lot_name,l.total_capacity,
 COALESCE(SUM(s.status='Available'),0) AS available_slots,COALESCE(SUM(s.status='Occupied'),0) AS occupied_slots,
 COALESCE(SUM(s.status='Maintenance'),0) AS maintenance_slots
 FROM parking_lots l LEFT JOIN parking_slots s ON s.lot_id=l.lot_id
 GROUP BY l.lot_id,l.name,l.total_capacity;
DELIMITER //
CREATE FUNCTION calculate_parking_fee(p_booking_id INT) RETURNS DECIMAL(10,2)
 NOT DETERMINISTIC READS SQL DATA
BEGIN
 DECLARE v_fee DECIMAL(10,2);
 SELECT CASE WHEN status='Cancelled' THEN 0 ELSE ROUND(GREATEST(TIMESTAMPDIFF(SECOND,entry_time,COALESCE(exit_time,UTC_TIMESTAMP()))/3600*20,15),2) END
 INTO v_fee FROM bookings WHERE booking_id=p_booking_id;
 RETURN v_fee;
END //
CREATE TRIGGER trg_release_slot AFTER UPDATE ON bookings FOR EACH ROW
BEGIN
 IF OLD.status='Active' AND NEW.status IN ('Completed','Cancelled') THEN
  UPDATE parking_slots SET status='Available' WHERE slot_id=NEW.slot_id;
 END IF;
END //
DELIMITER ;
