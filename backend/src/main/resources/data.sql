-- Customer Data (includes user_id set to NULL)
INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'John', 'Doe', '123 Main St', 'Toronto', 'Ontario', 'Canada', 'M5V 1K4', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('223e4567-e89b-12d3-a456-426614174001', 'Jane', 'Smith', '456 Elm St', 'Vancouver', 'British Columbia', 'Canada', 'V6B 3H7', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('323e4567-e89b-12d3-a456-426614174002', 'Alice', 'Brown', '789 Oak St', 'Montreal', 'Quebec', 'Canada', 'H3B 2Y5', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('423e4567-e89b-12d3-a456-426614174003', 'Bob', 'Johnson', '101 Maple St', 'Calgary', 'Alberta', 'Canada', 'T2P 3G7', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('523e4567-e89b-12d3-a456-426614174004', 'Charlie', 'White', '202 Birch St', 'Halifax', 'Nova Scotia', 'Canada', 'B3J 2X4', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('623e4567-e89b-12d3-a456-426614174005', 'David', 'Lee', '303 Cedar St', 'Winnipeg', 'Manitoba', 'Canada', 'R3C 4W5', NULL);

-- ✔ FIXED ROW (added 'Canada')
INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('723e4567-e89b-12d3-a456-426614174006', 'Eve', 'Martinez', '404 Pine St', 'Edmonton', 'Alberta', 'Canada', 'T5J 1Y6', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('823e4567-e89b-12d3-a456-426614174007', 'Frank', 'Clark', '505 Spruce St', 'Quebec City', 'Quebec', 'Canada', 'G1A 1A1', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('923e4567-e89b-12d3-a456-426614174008', 'Grace', 'Harris', '606 Fir St', 'Regina', 'Saskatchewan', 'Canada', 'S4P 3X6', NULL);

INSERT INTO customers (customer_id, first_name, last_name, street_address, city, province, country, postal_code, user_id) VALUES
    ('a23e4567-e89b-12d3-a456-426614174009', 'Henry', 'Adams', '707 Willow St', 'St. John''s', 'Newfoundland', 'Canada', 'A1C 1B2', NULL);

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
