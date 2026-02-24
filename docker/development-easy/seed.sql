-- =============================================================================
-- OpenEMR Development Seed Data
-- Idempotent: safe to run multiple times.
--
-- Run with:
--   docker compose exec openemr mariadb -u openemr -popenemr openemr < seed.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PROVIDERS (35 total across diverse specialties)
-- Password for all: "pass"  (bcrypt hash of "pass", same as admin)
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO users (uuid, username, authorized, fname, lname, title, specialty, npi, taxonomy, facility, facility_id, active, calendar, main_menu_role, patient_menu_role, phone, email)
VALUES
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.smith',      1, 'James',    'Smith',      'Dr.', 'Internal Medicine',          '1234567890', '207R00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-100-0001', 'j.smith@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.patel',      1, 'Priya',    'Patel',      'Dr.', 'Family Medicine',            '2345678901', '207Q00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-100-0002', 'p.patel@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.chen',       1, 'Michael',  'Chen',       'Dr.', 'Pediatrics',                 '3456789012', '208000000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-100-0003', 'm.chen@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.rodriguez',  1, 'Maria',    'Rodriguez',  'Dr.', 'Obstetrics & Gynecology',    '4567890123', '207V00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-100-0004', 'm.rodriguez@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.johnson',    1, 'Robert',   'Johnson',    'Dr.', 'Cardiology',                 '5678901234', '207RC0000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-100-0005', 'r.johnson@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.nguyen',     1, 'Linda',    'Nguyen',     'Dr.', 'Neurology',                  '6000000001', '2084N0400X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0001', 'l.nguyen@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.kim',        1, 'Daniel',   'Kim',        'Dr.', 'Dermatology',                '6000000002', '207N00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0002', 'd.kim@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.okonkwo',    1, 'Chidi',    'Okonkwo',    'Dr.', 'Orthopedic Surgery',         '6000000003', '207X00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0003', 'c.okonkwo@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.pham',       1, 'Thi',      'Pham',       'Dr.', 'Psychiatry',                 '6000000004', '2084P0800X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0004', 't.pham@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.washington', 1, 'Angela',   'Washington', 'Dr.', 'Endocrinology',              '6000000005', '207RE0101X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0005', 'a.washington@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.hassan',     1, 'Yusuf',    'Hassan',     'Dr.', 'Pulmonology',                '6000000006', '207RP1001X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0006', 'y.hassan@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.torres',     1, 'Sofia',    'Torres',     'Dr.', 'Gastroenterology',           '6000000007', '207RG0100X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0007', 's.torres@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.ibrahim',    1, 'Omar',     'Ibrahim',    'Dr.', 'Nephrology',                 '6000000008', '207RN0300X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0008', 'o.ibrahim@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.clark',      1, 'Patricia', 'Clark',      'Dr.', 'Rheumatology',               '6000000009', '207RR0500X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0009', 'p.clark@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.nakamura',   1, 'Hiroshi',  'Nakamura',   'Dr.', 'Ophthalmology',              '6000000010', '207W00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0010', 'h.nakamura@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.osei',       1, 'Kwame',    'Osei',       'Dr.', 'Urology',                    '6000000011', '208800000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0011', 'k.osei@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.silva',      1, 'Fernanda', 'Silva',      'Dr.', 'Hematology/Oncology',        '6000000012', '207RH0000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0012', 'f.silva@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.mueller',    1, 'Klaus',    'Mueller',    'Dr.', 'Anesthesiology',             '6000000013', '207L00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0013', 'k.mueller@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.ali',        1, 'Fatima',   'Ali',        'Dr.', 'Infectious Disease',         '6000000014', '207RI0200X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0014', 'f.ali@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.jensen',     1, 'Erik',     'Jensen',     'Dr.', 'Emergency Medicine',         '6000000015', '207P00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0015', 'e.jensen@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.garcia',     1, 'Carmen',   'Garcia',     'Dr.', 'Allergy & Immunology',       '6000000016', '207K00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0016', 'c.garcia@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.petrov',     1, 'Alexei',   'Petrov',     'Dr.', 'Radiology',                  '6000000017', '2085R0202X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0017', 'a.petrov@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.amara',      1, 'Nia',      'Amara',      'Dr.', 'General Surgery',            '6000000018', '208600000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0018', 'n.amara@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.larsson',    1, 'Ingrid',   'Larsson',    'Dr.', 'Geriatrics',                 '6000000019', '207QG0300X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0019', 'i.larsson@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.patel2',     1, 'Ravi',     'Patel',      'Dr.', 'Neurosurgery',               '6000000020', '207T00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0020', 'r.patel@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.brooks',     1, 'Marcus',   'Brooks',     'Dr.', 'Sports Medicine',            '6000000021', '207QS0010X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0021', 'm.brooks@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.yamamoto',   1, 'Keiko',    'Yamamoto',   'Dr.', 'Plastic Surgery',            '6000000022', '208200000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0022', 'k.yamamoto@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.owens',      1, 'Denise',   'Owens',      'Dr.', 'Palliative Care',            '6000000023', '207QH0002X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0023', 'd.owens@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.khalil',     1, 'Amir',     'Khalil',     'Dr.', 'Vascular Surgery',           '6000000024', '208G00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0024', 'a.khalil@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.nwosu',      1, 'Adaeze',   'Nwosu',      'Dr.', 'Neonatology',                '6000000025', '2084N0600X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0025', 'a.nwosu@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.burns',      1, 'Thomas',   'Burns',      'Dr.', 'Otolaryngology (ENT)',        '6000000026', '207Y00000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0026', 't.burns@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.diaz',       1, 'Isabel',   'Diaz',       'Dr.', 'Physical Medicine & Rehab',  '6000000027', '208100000X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0027', 'i.diaz@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.levy',       1, 'Samuel',   'Levy',       'Dr.', 'Clinical Genetics',          '6000000028', '207SG0201X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0028', 's.levy@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.choudhury',  1, 'Ananya',   'Choudhury',  'Dr.', 'Sleep Medicine',             '6000000029', '207QS0010X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0029', 'a.choudhury@clinic.example'),
  (UNHEX(REPLACE(UUID(),'-','')), 'dr.fitzgerald', 1, 'Sean',     'Fitzgerald', 'Dr.', 'Addiction Medicine',         '6000000030', '2084A2900X', 'Your Clinic Name Here', 3, 1, 1, 'standard', 'standard', '555-200-0030', 's.fitzgerald@clinic.example');

-- Insert users_secure for any provider not yet in the table (password: "pass")
INSERT IGNORE INTO users_secure (id, username, password, last_update_password)
SELECT u.id, u.username, '$2y$12$tEWowk2D2H9Ek6SYiru3x.cU1nW3n6zOh1wDnUqQr1ELa4W7f3no6', NOW()
FROM users u
WHERE u.username LIKE 'dr.%';

-- -----------------------------------------------------------------------------
-- PATIENTS: assign existing unassigned patients to providers round-robin
-- Cycles through the 35 seeded providers using row_number % 35.
-- -----------------------------------------------------------------------------

UPDATE patient_data pd
JOIN (
  SELECT p.pid, u.id AS assigned_id
  FROM (
    SELECT pid, (ROW_NUMBER() OVER (ORDER BY pid) - 1) AS rn
    FROM patient_data
    WHERE providerID IS NULL
  ) p
  JOIN (
    SELECT id, (ROW_NUMBER() OVER (ORDER BY id) - 1) AS rn
    FROM users
    WHERE username LIKE 'dr.%'
  ) u ON (p.rn % 35) = u.rn
) sub ON pd.pid = sub.pid
SET pd.providerID = sub.assigned_id;

-- -----------------------------------------------------------------------------
-- APPOINTMENTS (weeks of 2026-02-24 and 2026-03-02)
-- Safe to re-run: DELETE + INSERT scoped to these providers/dates.
-- pc_duration in seconds: 1800 = 30 min, 3600 = 60 min.
-- pc_apptstatus '-' = scheduled.
-- Uses MIN(id) per username to handle multiple seed runs.
-- -----------------------------------------------------------------------------

DELETE FROM openemr_postcalendar_events
WHERE pc_eventDate BETWEEN '2026-02-24' AND '2026-03-06'
  AND pc_aid IN (
    SELECT id FROM (
      SELECT MIN(id) AS id FROM users WHERE username = 'dr.smith'    UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.patel'   UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.chen'    UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.johnson' UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.mueller' UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.nguyen'  UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.pham'    UNION ALL
      SELECT MIN(id)         FROM users WHERE username = 'dr.rodriguez'
    ) AS provider_ids
  );

INSERT INTO openemr_postcalendar_events
  (uuid, pc_catid, pc_multiple, pc_aid, pc_pid, pc_title, pc_time,
   pc_hometext, pc_eventDate, pc_endDate, pc_duration, pc_recurrtype,
   pc_recurrspec, pc_startTime, pc_endTime, pc_alldayevent,
   pc_eventstatus, pc_sharing, pc_apptstatus, pc_facility, pc_billing_location)
SELECT
  UNHEX(REPLACE(UUID(),'-','')),
  t.catid, 0,
  (SELECT MIN(id) FROM users WHERE username = t.uname),
  t.pid, t.title,
  CONCAT(t.edate, ' ', t.stime),
  '', t.edate, t.edate, t.dur, 0,
  'a:5:{s:17:"event_repeat_freq";s:1:"0";s:22:"event_repeat_freq_type";s:1:"0";s:19:"event_repeat_on_num";s:1:"1";s:19:"event_repeat_on_day";s:1:"0";s:20:"event_repeat_on_freq";s:1:"0";}',
  t.stime, t.etime, 0, 1, 1, '-', 3, 3
FROM (
  -- dr.smith (Internal Medicine)
  SELECT 'dr.smith' AS uname,'2026-02-24' AS edate,'09:00:00' AS stime,'09:30:00' AS etime,1800 AS dur,5 AS catid,1 AS pid,'Office Visit' AS title UNION ALL
  SELECT 'dr.smith','2026-02-24','09:30:00','10:00:00',1800,5,2,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-24','10:00:00','11:00:00',3600,5,3,'Extended Consultation' UNION ALL
  SELECT 'dr.smith','2026-02-24','14:00:00','14:30:00',1800,5,4,'Follow-up' UNION ALL
  SELECT 'dr.smith','2026-02-24','14:30:00','15:00:00',1800,5,5,'Follow-up' UNION ALL
  SELECT 'dr.smith','2026-02-25','09:00:00','09:30:00',1800,5,6,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-25','10:30:00','11:00:00',1800,5,7,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-25','11:00:00','11:30:00',1800,5,8,'New Patient' UNION ALL
  SELECT 'dr.smith','2026-02-25','15:00:00','15:30:00',1800,5,9,'Follow-up' UNION ALL
  SELECT 'dr.smith','2026-02-26','09:00:00','09:30:00',1800,5,10,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-26','10:00:00','10:30:00',1800,5,11,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-26','13:00:00','14:00:00',3600,5,12,'Extended Consultation' UNION ALL
  SELECT 'dr.smith','2026-02-27','09:00:00','09:30:00',1800,5,13,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-27','11:00:00','11:30:00',1800,5,14,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-02-27','14:00:00','14:30:00',1800,5,15,'Follow-up' UNION ALL
  SELECT 'dr.smith','2026-03-02','09:00:00','09:30:00',1800,5,16,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-03-02','09:30:00','10:00:00',1800,5,17,'Office Visit' UNION ALL
  SELECT 'dr.smith','2026-03-02','10:00:00','10:30:00',1800,5,18,'New Patient' UNION ALL
  SELECT 'dr.smith','2026-03-02','10:30:00','11:00:00',1800,5,19,'New Patient' UNION ALL
  SELECT 'dr.smith','2026-03-02','11:00:00','11:30:00',1800,5,20,'Office Visit' UNION ALL
  -- dr.patel (Family Medicine)
  SELECT 'dr.patel','2026-02-24','09:00:00','09:30:00',1800,5,1,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-24','10:00:00','10:30:00',1800,5,2,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-24','11:00:00','12:00:00',3600,5,3,'New Patient' UNION ALL
  SELECT 'dr.patel','2026-02-24','14:30:00','15:00:00',1800,5,4,'Follow-up' UNION ALL
  SELECT 'dr.patel','2026-02-25','09:30:00','10:00:00',1800,5,5,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-25','10:00:00','10:30:00',1800,5,6,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-25','13:00:00','13:30:00',1800,5,7,'Follow-up' UNION ALL
  SELECT 'dr.patel','2026-02-25','16:00:00','16:30:00',1800,5,8,'Follow-up' UNION ALL
  SELECT 'dr.patel','2026-02-26','10:00:00','10:30:00',1800,5,9,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-26','10:30:00','11:00:00',1800,5,10,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-26','11:00:00','11:30:00',1800,5,11,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-26','14:00:00','14:30:00',1800,5,12,'Follow-up' UNION ALL
  SELECT 'dr.patel','2026-02-27','09:00:00','09:30:00',1800,5,13,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-27','09:30:00','10:00:00',1800,5,14,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-02-27','13:00:00','14:00:00',3600,5,15,'Extended Consultation' UNION ALL
  SELECT 'dr.patel','2026-03-02','09:00:00','09:30:00',1800,5,16,'Office Visit' UNION ALL
  SELECT 'dr.patel','2026-03-02','11:00:00','11:30:00',1800,5,17,'New Patient' UNION ALL
  SELECT 'dr.patel','2026-03-02','14:00:00','14:30:00',1800,5,18,'Follow-up' UNION ALL
  -- dr.chen (Pediatrics)
  SELECT 'dr.chen','2026-02-24','09:00:00','09:30:00',1800,5,1,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-02-24','09:30:00','10:00:00',1800,5,2,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-02-24','10:00:00','10:30:00',1800,5,3,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-24','10:30:00','11:00:00',1800,5,4,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-24','11:00:00','11:30:00',1800,5,5,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-02-25','09:00:00','09:30:00',1800,5,6,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-25','13:00:00','13:30:00',1800,5,7,'Follow-up' UNION ALL
  SELECT 'dr.chen','2026-02-25','13:30:00','14:00:00',1800,5,8,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-02-25','14:00:00','14:30:00',1800,5,9,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-02-26','10:00:00','10:30:00',1800,5,10,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-26','11:00:00','11:30:00',1800,5,11,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-26','15:00:00','15:30:00',1800,5,12,'Follow-up' UNION ALL
  SELECT 'dr.chen','2026-02-26','15:30:00','16:00:00',1800,5,13,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-02-27','09:00:00','09:30:00',1800,5,14,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-27','09:30:00','10:00:00',1800,5,15,'Sick Visit' UNION ALL
  SELECT 'dr.chen','2026-02-27','11:00:00','12:00:00',3600,5,16,'Extended Consultation' UNION ALL
  SELECT 'dr.chen','2026-03-02','09:00:00','09:30:00',1800,5,17,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-03-02','09:30:00','10:00:00',1800,5,18,'Well Child Visit' UNION ALL
  SELECT 'dr.chen','2026-03-02','10:00:00','10:30:00',1800,5,19,'Sick Visit' UNION ALL
  -- dr.johnson (Cardiology)
  SELECT 'dr.johnson','2026-02-24','10:00:00','11:00:00',3600,5,1,'Cardiology Consult' UNION ALL
  SELECT 'dr.johnson','2026-02-24','13:00:00','13:30:00',1800,5,2,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-24','14:00:00','15:00:00',3600,5,3,'New Patient' UNION ALL
  SELECT 'dr.johnson','2026-02-25','09:00:00','09:30:00',1800,5,4,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-25','09:30:00','10:00:00',1800,5,5,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-25','11:00:00','12:00:00',3600,5,6,'Cardiology Consult' UNION ALL
  SELECT 'dr.johnson','2026-02-25','16:00:00','16:30:00',1800,5,7,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-26','13:00:00','13:30:00',1800,5,8,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-26','13:30:00','14:00:00',1800,5,9,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-26','14:00:00','14:30:00',1800,5,10,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-02-26','14:30:00','15:00:00',1800,5,11,'Cardiology Consult' UNION ALL
  SELECT 'dr.johnson','2026-02-27','10:00:00','11:00:00',3600,5,12,'New Patient' UNION ALL
  SELECT 'dr.johnson','2026-02-27','14:00:00','14:30:00',1800,5,13,'Follow-up' UNION ALL
  SELECT 'dr.johnson','2026-03-02','09:00:00','10:00:00',3600,5,14,'Cardiology Consult' UNION ALL
  SELECT 'dr.johnson','2026-03-02','10:00:00','11:00:00',3600,5,15,'New Patient' UNION ALL
  SELECT 'dr.johnson','2026-03-02','14:00:00','14:30:00',1800,5,16,'Follow-up' UNION ALL
  -- dr.mueller (Anesthesiology) - very busy, few gaps
  SELECT 'dr.mueller','2026-02-24','09:00:00','09:30:00',1800,5,1,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-24','09:30:00','10:00:00',1800,5,2,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-24','10:00:00','10:30:00',1800,5,3,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-24','10:30:00','11:00:00',1800,5,4,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-24','11:00:00','11:30:00',1800,5,5,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-24','11:30:00','12:00:00',1800,5,6,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-25','09:00:00','09:30:00',1800,5,7,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-25','13:00:00','13:30:00',1800,5,8,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-25','13:30:00','14:00:00',1800,5,9,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-25','14:00:00','14:30:00',1800,5,10,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-25','14:30:00','15:00:00',1800,5,11,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-26','10:00:00','10:30:00',1800,5,12,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-26','10:30:00','11:00:00',1800,5,13,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-26','11:00:00','11:30:00',1800,5,14,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-26','14:00:00','14:30:00',1800,5,15,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-26','15:00:00','15:30:00',1800,5,16,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-26','15:30:00','16:00:00',1800,5,17,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-27','09:00:00','09:30:00',1800,5,18,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-27','09:30:00','10:00:00',1800,5,19,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-02-27','11:00:00','11:30:00',1800,5,20,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-03-02','09:00:00','09:30:00',1800,5,1,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-03-02','09:30:00','10:00:00',1800,5,2,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-03-02','10:00:00','10:30:00',1800,5,3,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-03-02','14:00:00','14:30:00',1800,5,4,'Pre-op Consult' UNION ALL
  SELECT 'dr.mueller','2026-03-02','14:30:00','15:00:00',1800,5,5,'Pre-op Consult' UNION ALL
  -- dr.nguyen (Neurology)
  SELECT 'dr.nguyen','2026-02-24','09:00:00','10:00:00',3600,5,1,'Neurology Consult' UNION ALL
  SELECT 'dr.nguyen','2026-02-24','11:00:00','11:30:00',1800,5,2,'Follow-up' UNION ALL
  SELECT 'dr.nguyen','2026-02-24','14:00:00','15:00:00',3600,5,3,'New Patient' UNION ALL
  SELECT 'dr.nguyen','2026-02-25','10:00:00','10:30:00',1800,5,4,'Follow-up' UNION ALL
  SELECT 'dr.nguyen','2026-02-25','13:00:00','14:00:00',3600,5,5,'Neurology Consult' UNION ALL
  SELECT 'dr.nguyen','2026-02-26','09:00:00','09:30:00',1800,5,6,'Follow-up' UNION ALL
  SELECT 'dr.nguyen','2026-02-26','10:00:00','11:00:00',3600,5,7,'New Patient' UNION ALL
  SELECT 'dr.nguyen','2026-02-26','14:30:00','15:30:00',3600,5,8,'Neurology Consult' UNION ALL
  SELECT 'dr.nguyen','2026-02-27','09:00:00','09:30:00',1800,5,9,'Follow-up' UNION ALL
  SELECT 'dr.nguyen','2026-02-27','11:00:00','12:00:00',3600,5,10,'New Patient' UNION ALL
  SELECT 'dr.nguyen','2026-03-02','09:00:00','10:00:00',3600,5,11,'Neurology Consult' UNION ALL
  SELECT 'dr.nguyen','2026-03-02','13:00:00','13:30:00',1800,5,12,'Follow-up' UNION ALL
  -- dr.pham (Psychiatry - 60-min sessions)
  SELECT 'dr.pham','2026-02-24','09:00:00','10:00:00',3600,5,1,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-24','10:00:00','11:00:00',3600,5,2,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-24','11:00:00','12:00:00',3600,5,3,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-24','13:00:00','14:00:00',3600,5,4,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-24','14:00:00','15:00:00',3600,5,5,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-24','15:00:00','16:00:00',3600,5,6,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-25','09:00:00','10:00:00',3600,5,7,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-25','10:00:00','11:00:00',3600,5,8,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-25','14:00:00','15:00:00',3600,5,9,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-25','15:00:00','16:00:00',3600,5,10,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-26','09:00:00','10:00:00',3600,5,11,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-26','10:00:00','11:00:00',3600,5,12,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-26','13:00:00','14:00:00',3600,5,13,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-02-27','09:00:00','10:00:00',3600,5,14,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-02-27','11:00:00','12:00:00',3600,5,15,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-03-02','09:00:00','10:00:00',3600,5,16,'Psych Eval' UNION ALL
  SELECT 'dr.pham','2026-03-02','10:00:00','11:00:00',3600,5,17,'Therapy Session' UNION ALL
  SELECT 'dr.pham','2026-03-02','13:00:00','14:00:00',3600,5,18,'Psych Eval' UNION ALL
  -- dr.rodriguez (OB/GYN)
  SELECT 'dr.rodriguez','2026-02-24','09:00:00','09:30:00',1800,5,1,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-02-24','09:30:00','10:00:00',1800,5,2,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-02-24','10:00:00','10:30:00',1800,5,3,'OB/GYN Exam' UNION ALL
  SELECT 'dr.rodriguez','2026-02-24','11:00:00','11:30:00',1800,5,4,'OB/GYN Exam' UNION ALL
  SELECT 'dr.rodriguez','2026-02-25','09:00:00','09:30:00',1800,5,5,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-02-25','10:30:00','11:00:00',1800,5,6,'OB/GYN Exam' UNION ALL
  SELECT 'dr.rodriguez','2026-02-25','13:00:00','13:30:00',1800,5,7,'Follow-up' UNION ALL
  SELECT 'dr.rodriguez','2026-02-26','09:00:00','09:30:00',1800,5,8,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-02-26','09:30:00','10:00:00',1800,5,9,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-02-26','14:00:00','14:30:00',1800,5,10,'OB/GYN Exam' UNION ALL
  SELECT 'dr.rodriguez','2026-02-27','10:00:00','10:30:00',1800,5,11,'Follow-up' UNION ALL
  SELECT 'dr.rodriguez','2026-02-27','11:00:00','11:30:00',1800,5,12,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-03-02','09:00:00','09:30:00',1800,5,13,'Prenatal Visit' UNION ALL
  SELECT 'dr.rodriguez','2026-03-02','10:00:00','10:30:00',1800,5,14,'OB/GYN Exam' UNION ALL
  SELECT 'dr.rodriguez','2026-03-02','14:00:00','14:30:00',1800,5,15,'Follow-up'
) AS t
WHERE (SELECT MIN(id) FROM users WHERE username = t.uname) IS NOT NULL;
