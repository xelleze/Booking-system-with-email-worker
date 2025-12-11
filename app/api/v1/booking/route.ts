import { NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { validateBookingInput } from "@/lib/validateBooking";
import { BookingInput } from "@/types/db";
import { PgBoss } from "pg-boss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let boss: PgBoss | null = null;

async function getBoss() {
  if (!boss) {
    boss = new PgBoss({ connectionString: process.env.DATABASE_URL! });
    await boss.start();
  }
  return boss;
}

export async function POST(req: NextRequest) {
  try {
    const pool = getPool();
    const body: unknown = await req.json();
    const boss = await getBoss();

    const { valid, errors } = validateBookingInput(body);

    if (!valid) {
      return new Response(JSON.stringify({ errors }), { status: 400 });
    }

    const { name, email, move_date, moving_address } = body as BookingInput;

    const existing = await pool.query(
      `SELECT id FROM customers WHERE email = $1`,
      [email]
    );

    let customerId: number;

    if (existing.rows.length > 0) {
      customerId = existing.rows[0].id;
    } else {
      const newCustomer = await pool.query(
        `INSERT INTO customers (name, email)
         VALUES ($1, $2)
         RETURNING id`,
        [name.trim(), email.trim()]
      );
      customerId = newCustomer.rows[0].id;
    }

    const booking = await pool.query(
      `INSERT INTO bookings (customer_id, move_date, moving_address)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [customerId, move_date, moving_address.trim()]
    );

    await boss.send("send-booking-email", {
      customerId,
      email,
      name,
      move_date,
      moving_address,
    });

    return new Response(
      JSON.stringify({
        booking_id: booking.rows[0].id,
        customer_id: customerId,
        created_at: booking.rows[0].created_at,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
