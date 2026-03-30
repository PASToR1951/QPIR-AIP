-- Create division_programs table — exclusively for Division-Based Programs
-- The `division` column (NOT NULL: CID/OSDS/SGOD) is a clear, mandatory indicator
-- of which functional division owns each program. This table is kept separate from
-- the `programs` table which handles school-level programs.

CREATE TABLE "division_programs" (
  "id"           SERIAL PRIMARY KEY,
  "title"        TEXT NOT NULL,
  "abbreviation" TEXT,
  "division"     TEXT NOT NULL
);

CREATE UNIQUE INDEX "division_programs_title_division_key" ON "division_programs"("title", "division");

-- ==========================================
-- SEED: CID-based Programs (23 programs)
-- ==========================================
INSERT INTO "division_programs" ("title", "division") VALUES
  ('Alternative Learning System (ALS)', 'CID'),
  ('Indigenous People''s Education (IPEd)', 'CID'),
  ('ISP- MAPEH', 'CID'),
  ('Learning Intervention Program', 'CID'),
  ('ADM- Education in Emergencies', 'CID'),
  ('Instructional Supervisory Program (ISP)', 'CID'),
  ('ISP- Edukasyon sa Pagpapakatao (ESP)', 'CID'),
  ('ISP- English', 'CID'),
  ('Reading Remediation Program', 'CID'),
  ('ISP- Science', 'CID'),
  ('Learning Outcome Assessment Program', 'CID'),
  ('ISP- Mathematics', 'CID'),
  ('Learning Resource Development and Management Program', 'CID'),
  ('Learning Resource Center Program', 'CID'),
  ('ISP- TLE', 'CID'),
  ('ISP- Araling Panlipunan', 'CID'),
  ('Multigrade', 'CID'),
  ('ISP- Filipino', 'CID'),
  ('Continuous Improvement (CI) Program', 'CID'),
  ('Office Housekeeping Program (CID)', 'CID'),
  ('Kindergarten Program', 'CID'),
  ('Special Education (SPED) Program', 'CID'),
  ('Senior High School Program', 'CID');

-- ==========================================
-- SEED: OSDS-based Programs (23 programs)
-- ==========================================
INSERT INTO "division_programs" ("title", "division") VALUES
  ('Office Housekeeping Program (OSDS)', 'OSDS'),
  ('Field Coordination Program', 'OSDS'),
  ('Grievance and Employee Discipline Management Program', 'OSDS'),
  ('PRAISE', 'OSDS'),
  ('Gender and Development (GAD)', 'OSDS'),
  ('Fiscal Management Program', 'OSDS'),
  ('Client Feedback Program', 'OSDS'),
  ('Office Communication Management Program', 'OSDS'),
  ('Records Management Program', 'OSDS'),
  ('Division Utilities and Services Maintenance Program', 'OSDS'),
  ('Division Physical Facilities Improvement and Equipment Maintenance Program', 'OSDS'),
  ('Performance Management Program', 'OSDS'),
  ('Personnel Organizations Management Program', 'OSDS'),
  ('Computerization Program', 'OSDS'),
  ('Internet Connectivity Program', 'OSDS'),
  ('Advocacy, Information, and Communication Program', 'OSDS'),
  ('Division ICT System and Infrastructure Management Program', 'OSDS'),
  ('Employee Welfare and Benefits Program', 'OSDS'),
  ('PRIMe- HRM', 'OSDS'),
  ('Secretariat Affairs Program', 'OSDS'),
  ('Crucial Resources Inventory and Acquisition Program', 'OSDS'),
  ('Procurement Management Program', 'OSDS'),
  ('School Site Titling Program', 'OSDS');

-- ==========================================
-- SEED: SGOD-based Programs (33 programs)
-- ==========================================
INSERT INTO "division_programs" ("title", "division") VALUES
  ('School Establishment Program', 'SGOD'),
  ('Human Resource Development Program', 'SGOD'),
  ('Learning Action Cells (LAC) Program', 'SGOD'),
  ('OK sa DepEd', 'SGOD'),
  ('School Dental Health Care Program', 'SGOD'),
  ('School-Based Repair and Maintenance Program', 'SGOD'),
  ('School-Based Feeding Program', 'SGOD'),
  ('Fitness and Wellness Program', 'SGOD'),
  ('Early Registration', 'SGOD'),
  ('EBEIS/LIS', 'SGOD'),
  ('Oplan Balik Eskwela', 'SGOD'),
  ('School Information Management Program', 'SGOD'),
  ('Strategic Development Planning Program', 'SGOD'),
  ('Brigada Eskwela', 'SGOD'),
  ('Division Partnership and Linkages Program', 'SGOD'),
  ('Enhanced School Sports Program', 'SGOD'),
  ('Adopt-a-School Program', 'SGOD'),
  ('PTA Affairs Management Program', 'SGOD'),
  ('School-based Management Program', 'SGOD'),
  ('Child Protection Program', 'SGOD'),
  ('Youth Leadership Development Program', 'SGOD'),
  ('Child-Friendly School System', 'SGOD'),
  ('Adolescent Reproductive Health Program', 'SGOD'),
  ('Guidance and Counseling Program', 'SGOD'),
  ('Mental Health and Psycho-Social Support Program', 'SGOD'),
  ('Basic Education Research Program', 'SGOD'),
  ('Field Technical Assistance Program', 'SGOD'),
  ('Program Implementation Review', 'SGOD'),
  ('Regulatory and Developmental Services for Private Schools Program', 'SGOD'),
  ('Dropout Reduction Program (DORP)', 'SGOD'),
  ('Disaster Risk Reduction and Management (DRRM)', 'SGOD'),
  ('National Drug Education Program', 'SGOD'),
  ('WINS', 'SGOD');
