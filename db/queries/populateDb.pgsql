CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    isMember BOOLEAN,
    isAdmin BOOLEAN
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    timestamp TIMESTAMP WITH TIME ZONE,
    title VARCHAR(255),
    message VARCHAR(255),
    author_id INTEGER,
    CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES users(id)
);