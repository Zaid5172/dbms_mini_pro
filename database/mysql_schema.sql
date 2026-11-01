-- MySQL Database Schema for Smart Vehicle Parking and Incident Management System

CREATE DATABASE IF NOT EXISTS smart_parking_db;
USE smart_parking_db;

-- 1. Users Table (Role-based access: Customer, Staff, Admin)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Customer', 'Staff', 'Admin') DEFAULT 'Customer',
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Parking Lots Table
CREATE TABLE parking_lots (
    lot_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    total_capacity INT NOT NULL
);

-- 3. Parking Slots Table
CREATE TABLE parking_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id INT,
    slot_number VARCHAR(20) NOT NULL,
    slot_type ENUM('Standard', 'EV', 'Handicapped') DEFAULT 'Standard',
    status ENUM('Available', 'Occupied', 'Maintenance') DEFAULT 'Available',
    FOREIGN KEY (lot_id) REFERENCES parking_lots(lot_id) ON DELETE CASCADE
);

-- 4. Vehicles Table
CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_model VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Bookings Table
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    slot_id INT,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    total_fee DECIMAL(10, 2) NULL,
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(slot_id) ON DELETE CASCADE
);

-- 6. Payments Table
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 7. Incident Reports Table (Relational log backup)
CREATE TABLE incident_reports (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id INT,
    slot_id INT,
    user_id INT,
    category VARCHAR(50),
    description TEXT NOT NULL,
    severity ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status ENUM('Open', 'Under Investigation', 'Resolved') DEFAULT 'Open',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lot_id) REFERENCES parking_lots(lot_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(slot_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for performance (Fulfilling index requirement)
CREATE INDEX idx_vehicle_plate ON vehicles(license_plate);
CREATE INDEX idx_slot_status ON parking_slots(status);
CREATE INDEX idx_booking_status ON bookings(status);

-- SQL View: Active Lot Occupancy and Available Slots
CREATE VIEW vw_active_occupancy AS
SELECT l.lot_id, l.name AS lot_name, l.total_capacity,
       SUM(CASE WHEN s.status = 'Available' THEN 1 ELSE 0 END) AS available_slots,
       SUM(CASE WHEN s.status = 'Occupied' THEN 1 ELSE 0 END) AS occupied_slots
FROM parking_lots l
LEFT JOIN parking_slots s ON l.lot_id = s.lot_id
GROUP BY l.lot_id, l.name, l.total_capacity;

-- Stored Function: Calculate Parking Fee based on duration
DELIMITER //
CREATE FUNCTION calculate_parking_fee(p_booking_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_entry TIMESTAMP;
    DECLARE v_exit TIMESTAMP;
    DECLARE v_hours DECIMAL(10,4);
    DECLARE v_fee DECIMAL(10,2);
    
    SELECT entry_time, COALESCE(exit_time, CURRENT_TIMESTAMP) 
    INTO v_entry, v_exit 
    FROM bookings 
    WHERE booking_id = p_booking_id;
    
    SET v_hours = TIMESTAMPDIFF(SECOND, v_entry, v_exit) / 3600.0;
    SET v_fee = GREATEST(v_hours * 20.00, 15.00); -- $20/hr with $15 minimum
    
    RETURN ROUND(v_fee, 2);
END //
DELIMITER ;

-- Trigger: Automatically update slot status back to 'Available' when booking is completed
DELIMITER //
CREATE TRIGGER trg_complete_booking
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'Completed' AND OLD.status = 'Active' THEN
        UPDATE parking_slots 
        SET status = 'Available' 
        WHERE slot_id = NEW.slot_id;
    END IF;
END //
DELIMITER ;
