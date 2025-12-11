import fetch from "node-fetch";

async function runTest() {
  const requests = [];

  for (let i = 0; i < 1000; i++) {
    requests.push(
      fetch("http://localhost:3000/api/v1/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Test${i}`,
          email: `test${i}@test.com`,
          move_date: "2025-12-11",
          moving_address: "Stockholm",
        }),
      })
    );
  }

  console.time("all requests");
  await Promise.all(requests);
  console.timeEnd("all requests");
}

runTest();
