create table if not exists customers
(
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(36) UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    street_address VARCHAR(50),
    city VARCHAR(50),
    province VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(9),
    user_id VARCHAR(36)
    );

CREATE TABLE IF NOT EXISTS customer_phonenumbers (
                                                   customer_id INTEGER,
                                                   type VARCHAR(50),
    number VARCHAR(50)

    );

CREATE TABLE jobs (
                      id INT AUTO_INCREMENT PRIMARY KEY,

                      job_id VARCHAR(50) NOT NULL UNIQUE,    -- from JobIdentifier
                      job_name VARCHAR(255) NOT NULL,
                      job_description VARCHAR(500),

                      hourly_rate DOUBLE NOT NULL,
                      estimated_duration_minutes INT NOT NULL,

                      job_type VARCHAR(50) NOT NULL,

                      active BOOLEAN NOT NULL
);

