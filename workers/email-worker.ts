import { PgBoss } from "pg-boss";
import { Resend } from "resend";
import { BookingEmailJob } from "../types/db";
import OpenAI from "openai";
import { getPool } from "../lib/db";
import { escapeHtml } from "../lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY!);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pool = getPool();

async function getFunFacts(location: string): Promise<string[]> {
  const prompt = `
    You are generating content for an email.

    Task:
    - Create exactly 3 short, fun, email-friendly facts about "${location}".
    - Each fact must be one concise sentence.
    - Do NOT add any explanations, intros, or outros.

    Output format (very important):
    - Return ONLY a valid JSON object.
    - It must have exactly one property: "facts".
    - "facts" must be an array of exactly 3 strings.
    - Example:
      { "facts": ["Fact 1...", "Fact 2...", "Fact 3..."] }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content ?? "{}";

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.facts)) {
        const facts = parsed.facts.filter(
          (f: unknown) => typeof f === "string"
        );
        return facts.slice(0, 3);
      }
    } catch (e) {
      console.error("Failed to parse fun facts JSON:", e, content);
    }
  } catch (e) {
    console.error("Failed to fetch fun facts from OpenAI:", e);
  }

  return [];
}

async function getLocationImages(
  location: string = "Stockholm"
): Promise<string[]> {
  const API_KEY = process.env.PEXELS_API_KEY!;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    location
  )}&per_page=10`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: API_KEY },
    });

    if (!res.ok) {
      console.error("Pexels API Error:", await res.text());
      return [];
    }

    const data: {
      photos: { src: { large: string } }[];
    } = await res.json();
    return data.photos.slice(0, 10).map((p) => p.src.large);
  } catch (err) {
    console.error("Failed to fetch Pexels images:", err);
    return [];
  }
}

async function start() {
  const boss = new PgBoss({ connectionString: process.env.DATABASE_URL! });
  await boss.start();
  await boss.createQueue("send-booking-email");

  await boss.work<BookingEmailJob>("send-booking-email", async (jobs) => {
    let status: "sent" | "failed" = "failed";
    for (const job of jobs) {
      const { customerId, email, name, move_date, moving_address } = job.data;
      const [funFacts, images] = await Promise.all([
        getFunFacts(moving_address),
        getLocationImages(moving_address),
      ]);

      const safeName = escapeHtml(name);
      const safeAddress = escapeHtml(moving_address);
      const safeMove_date = escapeHtml(move_date);

      const funFactsHtml = funFacts.length
        ? funFacts.map((fact) => `• ${fact}`).join("<br>")
        : "We couldn't find any fun facts for this location, but we're excited for your move!";

      const imagesSection = images.length
        ? `
          <h3>What ${safeAddress} Looks Like</h3>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                ${images
                  .map(
                    (src) =>
                      `<img src="${src}" width="180" style="border-radius:8px; margin:4px;" alt="${safeAddress}" />`
                  )
                  .join("")}
              </td>
            </tr>
          </table>
        `
        : "";

      const html = `
        <p>Hello ${safeName}, your booking #${customerId} was created.</p>

        <p><strong>Move date:</strong> ${safeMove_date}</p>
        <p><strong>Address:</strong> ${safeAddress}</p>

        <h3>Fun Facts About Your New Location</h3>
        <p>${funFactsHtml}</p>
        ${imagesSection}
      `;

      try {
        await resend.emails.send({
          from: "Booking System <onboarding@resend.dev>",
          to: email,
          subject: "Booking Confirmation",
          html,
        });
        status = "sent";
        console.log("Email sent:", email);
      } catch (err) {
        status = "failed";
        console.error("Failed to send email:", email, err);
      }
      await pool.query(
        `INSERT INTO email_logs (booking_id, email_to, body, sent_at, status)
       VALUES ($1, $2, $3, now(), $4)`,
        [customerId, email, html, status]
      );
    }
  });

  console.log("Worker started");
}

start();
