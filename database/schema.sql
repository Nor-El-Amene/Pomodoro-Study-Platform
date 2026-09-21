-- Pomodoro Study Platform database schema
-- This file contains database structure only.
-- No user, payment, room, or study-history data is included.
-- Database: focus_app
-- Compatible with MySQL / MariaDB

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `payments`
-- --------------------------------------------------------

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'DZD',
  `payment_method` varchar(50) DEFAULT 'dahabia',
  `payment_gateway` varchar(50) DEFAULT 'chargily',
  `gateway_payment_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `rate_limits`
-- --------------------------------------------------------

CREATE TABLE `rate_limits` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `room_members`
-- --------------------------------------------------------

CREATE TABLE `room_members` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `payment_status` enum('pending','paid','free') DEFAULT 'pending',
  `payment_id` varchar(255) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `room_study_logs`
-- --------------------------------------------------------

CREATE TABLE `room_study_logs` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `study_date` date NOT NULL,
  `minutes_studied` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `study_rooms`
-- --------------------------------------------------------

CREATE TABLE `study_rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `goal_hours` decimal(10,2) NOT NULL DEFAULT 10.00,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_members` int(11) NOT NULL DEFAULT 10,
  `owner_id` int(11) NOT NULL,
  `invite_code` varchar(20) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `study_sessions`
-- --------------------------------------------------------

CREATE TABLE `study_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_date` date NOT NULL,
  `sessions_count` int(11) DEFAULT 0,
  `minutes_studied` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `todos`
-- --------------------------------------------------------

CREATE TABLE `todos` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `text` varchar(500) NOT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `user_settings`
-- --------------------------------------------------------

CREATE TABLE `user_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Indexes
-- --------------------------------------------------------

ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `room_id` (`room_id`);

ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_identifier_time` (`identifier`,`created_at`);

ALTER TABLE `room_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_room_user` (`room_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `room_study_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_room_user_date` (`room_id`,`user_id`,`study_date`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `study_rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `owner_id` (`owner_id`);

ALTER TABLE `study_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_date` (`user_id`,`session_date`);

ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_setting` (`user_id`,`setting_key`);

-- --------------------------------------------------------
-- Auto-increment
-- --------------------------------------------------------

ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `rate_limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `room_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `room_study_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `study_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `study_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `todos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Foreign keys
-- --------------------------------------------------------

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2`
    FOREIGN KEY (`room_id`) REFERENCES `study_rooms` (`id`) ON DELETE CASCADE;

ALTER TABLE `room_members`
  ADD CONSTRAINT `room_members_ibfk_1`
    FOREIGN KEY (`room_id`) REFERENCES `study_rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_members_ibfk_2`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `room_study_logs`
  ADD CONSTRAINT `room_study_logs_ibfk_1`
    FOREIGN KEY (`room_id`) REFERENCES `study_rooms` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_study_logs_ibfk_2`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `study_rooms`
  ADD CONSTRAINT `study_rooms_ibfk_1`
    FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `study_sessions`
  ADD CONSTRAINT `study_sessions_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `todos`
  ADD CONSTRAINT `todos_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
