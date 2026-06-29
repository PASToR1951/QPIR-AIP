-- Align school-level program functional divisions with the official
-- "List of Program per Functional Division" used for CES routing.
UPDATE "programs"
SET "division" = CASE "title"
  WHEN 'Child Friendly School System' THEN 'SGOD'::"Division"
  WHEN 'Drop-Out Reduction Program' THEN 'SGOD'::"Division"
  WHEN 'Early Registration / Oplan Balik Eskwela' THEN 'SGOD'::"Division"
  WHEN 'Alternative Learning System (For school-based ALS)' THEN 'CID'::"Division"
  WHEN ' Indigenous Peoples Education' THEN 'CID'::"Division"
  WHEN 'Kindergarten Education' THEN 'CID'::"Division"
  WHEN 'Inclusive Education for LDS' THEN 'CID'::"Division"
  WHEN 'Learning Resource Materials Development and QA for LDS' THEN 'CID'::"Division"
  WHEN 'Adopt-a-School for Learners in Disadvantage Situation' THEN 'SGOD'::"Division"
  WHEN 'Alternative Delivery Modality for Learners in Disadvantage Situation' THEN 'CID'::"Division"
  WHEN 'Curriculum / Learning Area Programs' THEN 'CID'::"Division"
  WHEN 'Curricular Support Programs' THEN 'CID'::"Division"
  WHEN 'Reading Remediation' THEN 'CID'::"Division"
  WHEN 'Instructional Supervisory Program' THEN 'CID'::"Division"
  WHEN 'Continuing Professional Development for Teachers' THEN 'SGOD'::"Division"
  WHEN 'Learning Action Cells' THEN 'SGOD'::"Division"
  WHEN 'Learning Outcomes Assessment Program' THEN 'CID'::"Division"
  WHEN 'Learning Intervention Program' THEN 'CID'::"Division"
  WHEN 'Learning Materials Development and Quality Assurance Program' THEN 'CID'::"Division"
  WHEN 'Basic Education Research Program' THEN 'SGOD'::"Division"
  WHEN 'Learning Resource Centers Program' THEN 'SGOD'::"Division"
  WHEN 'Programs for Senior High School: Immersion' THEN 'CID'::"Division"
  WHEN 'National Certification' THEN 'CID'::"Division"
  WHEN 'Senior High School Tracking' THEN 'CID'::"Division"
  WHEN 'Child Protection Program' THEN 'SGOD'::"Division"
  WHEN 'Youth Development Program/SSG/SPG' THEN 'SGOD'::"Division"
  WHEN 'Disaster Risk Reduction and Management' THEN 'SGOD'::"Division"
  WHEN 'OK sa DepED' THEN 'SGOD'::"Division"
  WHEN 'Enhanced School Sports' THEN 'SGOD'::"Division"
  WHEN 'Guidance and Counseling Program' THEN 'SGOD'::"Division"
  WHEN 'Mental Health and Psychosocial Support' THEN 'SGOD'::"Division"
  WHEN 'Fitness and Wellness' THEN 'SGOD'::"Division"
  WHEN 'Education in Emergencies (Alternative Delivery Modality)' THEN 'CID'::"Division"
  WHEN 'School-Based Management Program' THEN 'SGOD'::"Division"
  WHEN 'Client Feedback Program' THEN 'OSDS'::"Division"
  WHEN 'School Utilities and Services Maintenance Program' THEN 'OSDS'::"Division"
  WHEN 'School-Based Repair and Maintenance' THEN 'OSDS'::"Division"
  WHEN 'Fiscal Management' THEN 'OSDS'::"Division"
  WHEN 'Performance Management Program' THEN 'OSDS'::"Division"
  WHEN 'Procurement Management Program' THEN 'OSDS'::"Division"
  WHEN 'Adopt-a-School Program' THEN 'SGOD'::"Division"
  WHEN 'PTA Affairs Management' THEN 'OSDS'::"Division"
  WHEN 'Development Planning Program' THEN 'OSDS'::"Division"
  WHEN 'Program Implementation Review' THEN 'OSDS'::"Division"
  WHEN 'PRAISE/Rewards and Incentives' THEN 'OSDS'::"Division"
  WHEN 'EBEIS, LIS, School Information Management Program' THEN 'SGOD'::"Division"
  WHEN 'Crucial Resources Inventory Program' THEN 'OSDS'::"Division"
  WHEN 'Advocacy, Information, Education and Communications Program' THEN 'OSDS'::"Division"
  WHEN 'Gender and Development' THEN 'CID'::"Division"
  ELSE "division"
END
WHERE "school_level_requirement" <> 'Division'
  AND "title" IN (
    'Child Friendly School System',
    'Drop-Out Reduction Program',
    'Early Registration / Oplan Balik Eskwela',
    'Alternative Learning System (For school-based ALS)',
    ' Indigenous Peoples Education',
    'Kindergarten Education',
    'Inclusive Education for LDS',
    'Learning Resource Materials Development and QA for LDS',
    'Adopt-a-School for Learners in Disadvantage Situation',
    'Alternative Delivery Modality for Learners in Disadvantage Situation',
    'Curriculum / Learning Area Programs',
    'Curricular Support Programs',
    'Reading Remediation',
    'Instructional Supervisory Program',
    'Continuing Professional Development for Teachers',
    'Learning Action Cells',
    'Learning Outcomes Assessment Program',
    'Learning Intervention Program',
    'Learning Materials Development and Quality Assurance Program',
    'Basic Education Research Program',
    'Learning Resource Centers Program',
    'Programs for Senior High School: Immersion',
    'National Certification',
    'Senior High School Tracking',
    'Child Protection Program',
    'Youth Development Program/SSG/SPG',
    'Disaster Risk Reduction and Management',
    'OK sa DepED',
    'Enhanced School Sports',
    'Guidance and Counseling Program',
    'Mental Health and Psychosocial Support',
    'Fitness and Wellness',
    'Education in Emergencies (Alternative Delivery Modality)',
    'School-Based Management Program',
    'Client Feedback Program',
    'School Utilities and Services Maintenance Program',
    'School-Based Repair and Maintenance',
    'Fiscal Management',
    'Performance Management Program',
    'Procurement Management Program',
    'Adopt-a-School Program',
    'PTA Affairs Management',
    'Development Planning Program',
    'Program Implementation Review',
    'PRAISE/Rewards and Incentives',
    'EBEIS, LIS, School Information Management Program',
    'Crucial Resources Inventory Program',
    'Advocacy, Information, Education and Communications Program',
    'Gender and Development'
  );
