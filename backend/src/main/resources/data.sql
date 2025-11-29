INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'John', 'Doe', '123 Main St', 'Toronto', 'Ontario', 'Canada', 'M5V 1K4', 'f9b67bf1-3f7e-4f69-9c5d-5b5bdf9a02fd');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('223e4567-e89b-12d3-a456-426614174001', 'Jane', 'Smith', '456 Elm St', 'Vancouver', 'British Columbia', 'Canada', 'V6B 3H7', 'a4c2d47e-8bd7-4b38-8e7a-356d02fb8e22');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('323e4567-e89b-12d3-a456-426614174002', 'Alice', 'Brown', '789 Oak St', 'Montreal', 'Quebec', 'Canada', 'H3B 2Y5', '59a8ccc0-4e0f-4c4d-af64-2f61c7bea612');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('423e4567-e89b-12d3-a456-426614174003', 'Bob', 'Johnson', '101 Maple St', 'Calgary', 'Alberta', 'Canada', 'T2P 3G7', '2a9aaa77-8c8d-47cc-8e7c-6c9835172bd4');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('523e4567-e89b-12d3-a456-426614174004', 'Charlie', 'White', '202 Birch St', 'Halifax', 'Nova Scotia', 'Canada', 'B3J 2X4', 'b32f729b-48c4-43a3-a64e-cb7d871f763e');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('623e4567-e89b-12d3-a456-426614174005', 'David', 'Lee', '303 Cedar St', 'Winnipeg', 'Manitoba', 'Canada', 'R3C 4W5', 'c4f6a9fc-2c36-4c54-9cea-4704ceca16fa');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('723e4567-e89b-12d3-a456-426614174006', 'Eve', 'Martinez', '404 Pine St', 'Edmonton', 'Alberta', 'Canada', 'T5J 1Y6', 'd5a7db32-cf90-4a4d-b854-ad0b70339ad9');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('823e4567-e89b-12d3-a456-426614174007', 'Frank', 'Clark', '505 Spruce St', 'Quebec City', 'Quebec', 'Canada', 'G1A 1A1', 'e0998012-7a2b-4b17-88a9-4acc2bee3a19');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('923e4567-e89b-12d3-a456-426614174008', 'Grace', 'Harris', '606 Fir St', 'Regina', 'Saskatchewan', 'Canada', 'S4P 3X6', 'aaab9c8d-f0e5-4d4a-9db5-8bcbd6b692ac');

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('a23e4567-e89b-12d3-a456-426614174009', 'Henry', 'Adams', '707 Willow St', 'St. John''s', 'Newfoundland', 'Canada', 'A1C 1B2', '8f3c8a74-f24d-48bb-b74a-f1b62af0bb1c');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (1, 'MOBILE', '514-555-1234'),
    (1, 'HOME', '514-555-5678');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (2, 'MOBILE', '514-555-2345'),
    (2, 'HOME', '514-555-6789');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (3, 'WORK', '514-555-3456'),
    (3, 'MOBILE', '514-555-7890');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (4, 'WORK', '514-555-4567'),
    (4, 'MOBILE', '514-555-8901');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (5, 'MOBILE', '514-555-5679'),
    (5, 'HOME', '514-555-1234');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (6, 'MOBILE', '514-555-6782'),
    (6, 'HOME', '514-555-2346');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (7, 'MOBILE', '514-555-2348'),
    (7, 'WORK', '514-555-8765');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (8, 'WORK', '514-555-3458'),
    (8, 'MOBILE', '514-555-9990');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (9, 'MOBILE', '514-555-1237'),
    (9, 'HOME', '514-555-4569');

INSERT INTO customer_phonenumbers (customer_id, type, number) VALUES
    (10, 'MOBILE', '514-555-6781'),
    (10, 'WORK', '514-555-5555');

INSERT INTO jobs (job_id, job_name, job_description, hourly_rate, estimated_duration_minutes, job_type, active)
VALUES
    -- QUOTATION
    (UUID(), 'Free Quotation', 'Technician visits the site to evaluate cellar needs and prepare a detailed quote.', 0.00, 30, 'QUOTATION', TRUE),

    -- INSTALLATION
    (UUID(), 'Cellar Installation', 'Full installation of a new refrigeration system, wiring, tubing, and calibration.', 120.00, 240, 'INSTALLATION', TRUE),

    -- REPARATION
    (UUID(), 'Repair Service', 'Diagnosis and repair of refrigeration, humidity control, or electrical issues.', 95.00, 90, 'REPARATION', TRUE),

    -- MAINTENANCE
    (UUID(), 'Annual Maintenance', 'Full system checkup, cleaning, refrigerant check and performance optimization.', 85.00, 60, 'MAINTENANCE', TRUE);

INSERT INTO employees (
    employee_id, first_name, last_name, user_id, employee_role_type,
    street_address, city, province, country, postal_code
) VALUES (
             'c41b8f1c-7f5d-4f0e-8f2e-4b7d1e8c0b2d', -- Unique UUID
             'Alice',
             'Johnson',
             'AJOHNSON',
             'ADMIN', -- Role: ADMIN
             '45 Admin Plaza',
             'Toronto',
             'Ontario',
             'Canada',
             'M5V 2T3'
         );

-- Employee 2: TECHNICIAN
INSERT INTO employees (
    employee_id, first_name, last_name, user_id, employee_role_type,
    street_address, city, province, country, postal_code
) VALUES (
             'a9e6d3f2-1c0a-4b5c-9d8e-7a6f5e4d3c2b', -- Unique UUID
             'Bob',
             'Williams',
             'BWILLIAMS',
             'TECHNICIAN', -- Role: TECHNICIAN
             '101 Commerce Ave',
             'Montreal',
             'Quebec',
             'Canada',
             'H3B 2S2'
         );

-- Employee 3: SUPPORT
INSERT INTO employees (
    employee_id, first_name, last_name, user_id, employee_role_type,
    street_address, city, province, country, postal_code
) VALUES (
             '3f2c1b4a-9e7d-5c6b-1d0e-2a4f6b8c0d1e', -- Unique UUID
             'Carol',
             'Davis',
             'CDAVIS',
             'SUPPORT', -- Role: SUPPORT
             '707 Help Desk Dr',
             'Vancouver',
             'British Columbia',
             'Canada',
             'V6B 1P1'
         );

-- Employee 4: SALES
INSERT INTO employees (
    employee_id, first_name, last_name, user_id, employee_role_type,
    street_address, city, province, country, postal_code
) VALUES (
             '1e8c0b2d-4b7d-1e8c-0b2d-4b7d1e8c0b2d', -- Unique UUID
             'David',
             'Smith',
             'DSMITH',
             'SALES', -- Role: SALES
             '909 Commission Ct',
             'Calgary',
             'Alberta',
             'Canada',
             'T2G 0B8'
         );

-- ---------------------------------
-- 3. Insert Phone Number Data
-- ---------------------------------

-- Phones for Alice Johnson (ID = 1)
INSERT INTO employee_phonenumbers (employee_id, type, number) VALUES
    (1, 'WORK', '555-123-4567');

-- Phones for Bob Williams (ID = 2)
INSERT INTO employee_phonenumbers (employee_id, type, number) VALUES
                                                                  (2, 'WORK', '555-200-3000'),
                                                                  (2, 'MOBILE', '555-400-5000');

-- Phones for Carol Davis (ID = 3)
INSERT INTO employee_phonenumbers (employee_id, type, number) VALUES
    (3, 'WORK', '555-888-9999');

-- Phones for David Smith (ID = 4)
INSERT INTO employee_phonenumbers (employee_id, type, number) VALUES
    (4, 'MOBILE', '555-777-6666');

INSERT INTO schedules (employee_fk, day_of_week, time_slot)
SELECT
    e.id AS employee_fk,
    s.day_of_week,
    s.time_slot
FROM
    employees e
        CROSS JOIN
    (
        -- Virtual Table 's' that defines all 30 possible shifts
        SELECT 'MONDAY' AS day_of_week, 'NINE_AM' AS time_slot
        UNION ALL SELECT 'MONDAY', 'ELEVEN_AM'
        UNION ALL SELECT 'MONDAY', 'ONE_PM'
        UNION ALL SELECT 'MONDAY', 'THREE_PM'
        UNION ALL SELECT 'MONDAY', 'FOUR_PM'
        UNION ALL SELECT 'MONDAY', 'SIX_PM'

        UNION ALL SELECT 'TUESDAY', 'NINE_AM'
        UNION ALL SELECT 'TUESDAY', 'ELEVEN_AM'
        UNION ALL SELECT 'TUESDAY', 'ONE_PM'
        UNION ALL SELECT 'TUESDAY', 'THREE_PM'
        UNION ALL SELECT 'TUESDAY', 'FOUR_PM'
        UNION ALL SELECT 'TUESDAY', 'SIX_PM'

        UNION ALL SELECT 'WEDNESDAY', 'NINE_AM'
        UNION ALL SELECT 'WEDNESDAY', 'ELEVEN_AM'
        UNION ALL SELECT 'WEDNESDAY', 'ONE_PM'
        UNION ALL SELECT 'WEDNESDAY', 'THREE_PM'
        UNION ALL SELECT 'WEDNESDAY', 'FOUR_PM'
        UNION ALL SELECT 'WEDNESDAY', 'SIX_PM'

        UNION ALL SELECT 'THURSDAY', 'NINE_AM'
        UNION ALL SELECT 'THURSDAY', 'ELEVEN_AM'
        UNION ALL SELECT 'THURSDAY', 'ONE_PM'
        UNION ALL SELECT 'THURSDAY', 'THREE_PM'
        UNION ALL SELECT 'THURSDAY', 'FOUR_PM'
        UNION ALL SELECT 'THURSDAY', 'SIX_PM'

        UNION ALL SELECT 'FRIDAY', 'NINE_AM'
        UNION ALL SELECT 'FRIDAY', 'ELEVEN_AM'
        UNION ALL SELECT 'FRIDAY', 'ONE_PM'
        UNION ALL SELECT 'FRIDAY', 'THREE_PM'
        UNION ALL SELECT 'FRIDAY', 'FOUR_PM'
        UNION ALL SELECT 'FRIDAY', 'SIX_PM'
    ) s
-- Filter to only include the first four employees (IDs 1, 2, 3, and 4)
WHERE e.id IN (1, 2, 3, 4);