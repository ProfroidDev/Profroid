DROP TABLE IF EXISTS employee_phonenumbers;
DROP TABLE IF EXISTS customer_phonenumbers;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS cellars;
DROP TABLE IF EXISTS customers;


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

CREATE TABLE IF NOT EXISTS jobs  (
                      id INT AUTO_INCREMENT PRIMARY KEY,

                      job_id VARCHAR(50) NOT NULL UNIQUE,    -- from JobIdentifier
                      job_name VARCHAR(255) NOT NULL,
                      job_description VARCHAR(500),

                      hourly_rate DOUBLE NOT NULL,
                      estimated_duration_minutes INT NOT NULL,

                      job_type VARCHAR(50) NOT NULL,

                      active BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
                           id INT PRIMARY KEY AUTO_INCREMENT,
                           employee_id VARCHAR(36) NOT NULL UNIQUE,
                           first_name VARCHAR(255) NOT NULL,
                           last_name VARCHAR(255) NOT NULL,
                           user_id VARCHAR(255) NOT NULL UNIQUE,
                           employee_role_type VARCHAR(50) NOT NULL,
                           street_address VARCHAR(255) NOT NULL,
                           city VARCHAR(255) NOT NULL,
                           province VARCHAR(255) NOT NULL,
                           country VARCHAR(255) NOT NULL,
                           postal_code VARCHAR(10) NOT NULL
);


CREATE TABLE IF NOT EXISTS employee_phonenumbers (

                                       employee_id INT NOT NULL,
                                       type VARCHAR(10) NOT NULL,
                                       number VARCHAR(20) NOT NULL,
                                       FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
                                       PRIMARY KEY (employee_id, number)
);

CREATE TABLE IF NOT EXISTS schedules (
                                         id INT PRIMARY KEY AUTO_INCREMENT,
                                         employee_fk INT NOT NULL,
                                         day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    FOREIGN KEY (employee_fk) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (employee_fk, day_of_week, time_slot)
    );

CREATE TABLE cellars (
                         id INT AUTO_INCREMENT PRIMARY KEY,                 -- Internal DB ID

                         cellar_id VARCHAR(36) NOT NULL UNIQUE,             -- Public UUID (CellarIdentifier)
                         owner_customer_id VARCHAR(36) NOT NULL,            -- CustomerIdentifier

                         name VARCHAR(255) NOT NULL,

                         height DOUBLE,
                         width DOUBLE,
                         depth DOUBLE,

                         bottle_capacity INT,

                         has_cooling_system BOOLEAN NOT NULL,
                         has_humidity_control BOOLEAN NOT NULL,
                         has_auto_regulation BOOLEAN NOT NULL,

                         cellar_type VARCHAR(50) NOT NULL                 -- Enum stored as string
);


