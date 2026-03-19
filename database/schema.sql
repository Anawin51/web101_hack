-- ===================================================
-- web101 - Restaurant Table Reservation System Schema
-- ===================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ===================================================
-- 1. ตาราง users (เก็บข้อมูลลูกค้าและผู้ดูแลระบบ)
-- ===================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) CHARACTER SET utf8 NOT NULL,
  `lastname` varchar(255) CHARACTER SET utf8 NOT NULL,
  `email` varchar(255) CHARACTER SET utf8 NOT NULL UNIQUE,
  `phone` varchar(20) CHARACTER SET utf8 NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8 NOT NULL,
  `role` enum('customer','admin') CHARACTER SET utf8 DEFAULT 'customer',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================
-- 2. ตาราง tables (เก็บข้อมูลโต๊ะ และจัดการสถานะ Real-time)
-- ===================================================
CREATE TABLE IF NOT EXISTS `tables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_number` varchar(50) CHARACTER SET utf8 NOT NULL UNIQUE,
  `capacity` int(11) NOT NULL,
  `status` enum('available','occupied','maintenance') CHARACTER SET utf8 DEFAULT 'available',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================
-- 3. ตาราง reservations (เก็บข้อมูลการจอง)
-- ความสัมพันธ์: users (1) ──< (many) reservations
--              tables (1) ──< (many) reservations
-- ===================================================
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `table_id` int(11) DEFAULT NULL, -- ให้เป็น NULL ได้ เพราะร้านอาจจัดโต๊ะให้ตอนกดยืนยัน (Confirmed)
  `reservation_date` date NOT NULL,
  `reservation_time` time NOT NULL,
  `guest_count` int(11) NOT NULL,
  `status` enum('pending','confirmed','rejected','cancelled','completed') CHARACTER SET utf8 DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===================================================
-- ข้อมูลตัวอย่าง (Mock Data)
-- ===================================================

-- เพิ่มข้อมูล User (admin 1 คน, customer 2 คน)
INSERT INTO `users` (`firstname`, `lastname`, `email`, `phone`, `password_hash`, `role`) VALUES
('Admin', 'ร้านอาหาร', 'admin@shop.com', '0800000000', 'hashed_password_here', 'admin'),
('สมชาย', 'ใจดี', 'somchai@email.com', '0811111111', 'hashed_password_here', 'customer'),
('สมหญิง', 'รักเรียน', 'somying@email.com', '0822222222', 'hashed_password_here', 'customer');


-- เพิ่มข้อมูลโต๊ะ
INSERT INTO `tables` (`table_number`, `capacity`, `status`) VALUES
('A1', 2, 'available'),
('A2', 2, 'available'),
('A3', 4, 'available'),
('A4', 8, 'available'),
('A5', 3, 'available'),
('A6', 3, 'available'),
('A7', 4, 'available'),
('A8', 8, 'available');


-- เพิ่มข้อมูลการจอง
INSERT INTO `reservations` (`user_id`, `table_id`, `reservation_date`, `reservation_time`, `guest_count`, `status`) VALUES
(2, NULL, '2023-11-20', '18:00:00', 4, 'pending'),    -- รอร้านอนุมัติและจัดโต๊ะให้
(3, 1, '2023-11-20', '19:00:00', 2, 'confirmed'),     -- ร้านยืนยันแล้ว ได้โต๊ะ A1
(2, 2, '2023-11-19', '12:00:00', 2, 'completed');     -- กินเสร็จแล้ว

COMMIT;