CREATE TYPE valid_status AS ENUM ('sent', 'failed');

CREATE TABLE customers (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id              SERIAL PRIMARY KEY,
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  move_date       DATE NOT NULL,
  moving_address  TEXT NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE email_logs (
  id              SERIAL PRIMARY KEY,
  booking_id      INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  email_to        TEXT NOT NULL,
  body            TEXT NOT NULL CHECK (length(body) > 0),
  sent_at         timestamptz NOT NULL,
  status          valid_status NOT NULL
);


CREATE INDEX bookings_customer_id_idx ON bookings(customer_id);
CREATE INDEX email_logs_booking_id_idx ON email_logs(booking_id);
