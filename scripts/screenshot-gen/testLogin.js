const email = "admin@qpir.local";
const password = "admin123";
const baseUrl = "https://aip-pir.depedguihulngan.ph";

async function run() {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email, password})
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Login failed: " + res.status + " " + err);
  }
  const cookies = res.headers.get("set-cookie");
  console.log("Login OK!");
}
run().catch(console.error);
