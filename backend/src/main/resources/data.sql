--customer Data
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'John', 'Doe', 'john.doe@example.com', 'password123', '123 Main St', 'Toronto', 'Ontario', 'Canada', 'M5V 1K4');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('223e4567-e89b-12d3-a456-426614174001', 'Jane', 'Smith', 'jane.smith@example.com', 'securepass', '456 Elm St', 'Vancouver', 'British Columbia', 'Canada', 'V6B 3H7');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('323e4567-e89b-12d3-a456-426614174002', 'Alice', 'Brown', 'alice.brown@example.com', 'alicepass', '789 Oak St', 'Montreal', 'Quebec', 'Canada', 'H3B 2Y5');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('423e4567-e89b-12d3-a456-426614174003', 'Bob', 'Johnson', 'bob.johnson@example.com', 'bobsecure', '101 Maple St', 'Calgary', 'Alberta', 'Canada', 'T2P 3G7');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('523e4567-e89b-12d3-a456-426614174004', 'Charlie', 'White', 'charlie.white@example.com', 'charlie123',  '202 Birch St', 'Halifax', 'Nova Scotia', 'Canada', 'B3J 2X4');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('623e4567-e89b-12d3-a456-426614174005', 'David', 'Lee', 'david.lee@example.com', 'davidpass', '303 Cedar St', 'Winnipeg', 'Manitoba', 'Canada', 'R3C 4W5');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('723e4567-e89b-12d3-a456-426614174006', 'Eve', 'Martinez', 'eve.martinez@example.com', 'evesecret', '404 Pine St', 'Edmonton', 'Alberta', 'Canada', 'T5J 1Y6');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('823e4567-e89b-12d3-a456-426614174007', 'Frank', 'Clark', 'frank.clark@example.com', 'frankpass', '505 Spruce St', 'Quebec City', 'Quebec', 'Canada', 'G1A 1A1');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('923e4567-e89b-12d3-a456-426614174008', 'Grace', 'Harris', 'grace.harris@example.com', 'gracepass', '606 Fir St', 'Regina', 'Saskatchewan', 'Canada', 'S4P 3X6');
INSERT INTO customers (customer_id, first_name, last_name, email, password,  street_address, city, province, country, postal_code) VALUES
    ('a23e4567-e89b-12d3-a456-426614174009', 'Henry', 'Adams', 'henry.adams@example.com', 'henrypass', '707 Willow St', 'St. John''s', 'Newfoundland', 'Canada', 'A1C 1B2');

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
