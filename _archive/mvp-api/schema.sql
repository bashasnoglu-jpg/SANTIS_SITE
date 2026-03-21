-- To enforce global encoding locally or on VPS:
-- CREATE DATABASE santis WITH ENCODING 'UTF8';

CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    slug VARCHAR(60) UNIQUE
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    hotel_id INT REFERENCES hotels(id),
    name VARCHAR(100),
    price DECIMAL(10,2),
    duration INT
);

CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    hotel_id INT REFERENCES hotels(id),
    service_id INT REFERENCES services(id),
    guest_name VARCHAR(150),
    time TIMESTAMP
);

-- Seed Data
INSERT INTO hotels (name, slug) VALUES ('Rixos Antalya', 'rixos');
INSERT INTO services (hotel_id, name, price, duration) VALUES (1, 'Classic Spa', 50.00, 60);
