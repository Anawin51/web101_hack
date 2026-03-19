-- ===================================================
-- Seed Data (ข้อมูลตัวอย่างสำหรับทดสอบ)
-- รัน schema.sql ก่อน แล้วค่อยรัน seed.sql
-- ===================================================

INSERT INTO `users` (`firstname`, `lastname`, `age`, `gender`, `interests`, `description`) VALUES
('สมชาย', 'ใจดี', 25, 'ชาย', 'วิดีโอเกม', 'นักพัฒนาซอฟต์แวร์'),
('สมหญิง', 'รักเรียน', 22, 'หญิง', 'หนังสือ', 'นักศึกษา');

INSERT INTO `projects` (`name`, `description`, `user_id`) VALUES
('เว็บไซต์บริษัท', 'พัฒนาเว็บไซต์หลักของบริษัท', 1),
('แอปมือถือ', 'พัฒนาแอปสำหรับลูกค้า', 2);

INSERT INTO `tags` (`name`) VALUES ('bug'), ('feature'), ('urgent'), ('design');

INSERT INTO `tasks` (`title`, `description`, `status`, `project_id`, `assigned_user_id`) VALUES
('ออกแบบ UI หน้าแรก', 'ออกแบบ mockup หน้า landing page', 'todo', 1, 1),
('สร้าง API login', 'เขียน endpoint สำหรับ authentication', 'in_progress', 1, 2),
('แก้บัค login ไม่ได้', 'user บางคน login ไม่ผ่าน', 'todo', 2, 1);

INSERT INTO `task_tags` (`task_id`, `tag_id`) VALUES
(1, 4),
(2, 2),
(3, 1),
(3, 3);
