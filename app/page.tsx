"use client";

import { useState, useDeferredValue } from "react";
import { NominatimResult, BookingInput } from "@/types/db";
import { useMutation } from "@tanstack/react-query";

async function putBooking(payload: BookingInput) {
  const res = await fetch("/api/v1/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to run booking process");
  return res.json();
}

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [moveLocation, setQuery] = useState("");
  const deferredQuery = useDeferredValue(moveLocation);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const { mutate, data, isPending, error } = useMutation({
    mutationFn: putBooking,
  });

  async function search(value: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
      value
    )}`;

    const res = await fetch(url);
    const data: NominatimResult[] = await res.json();
    setSuggestions(data);
  }

  const handleChange = async (value: string) => {
    setQuery(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    search(deferredQuery);
  };

  const handleSubmit = () => {
    mutate({
      name: name,
      email: email,
      move_date: moveDate,
      moving_address: moveLocation,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
            setName("");
            setEmail("");
            setMoveDate("");
            setQuery("");
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Moving Date
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              value={moveDate}
              onChange={(e) => setMoveDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Moving Address
            </label>
            <input
              value={moveLocation}
              onChange={(e) => handleChange(e.target.value)}
              type="text"
              placeholder="Enter address…"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />

            {suggestions.length > 0 && (
              <div className="">
                {suggestions.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onClick={() => {
                      setQuery(item.display_name);
                      setSuggestions([]);
                    }}
                    className=""
                  >
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {isPending ? "Saving..." : "Submit"}
            </button>
            {error && <p>Error saving booking</p>}
            {data && <p>Booking sumbited!</p>}
          </div>
        </form>
      </main>
    </div>
  );
}
