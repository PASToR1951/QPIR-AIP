const email = "admin@qpir.local";
const password = "admin123";
const baseUrl = "http://localhost:3001";

async function run() {
  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email, password})
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Login failed: " + err);
  }
  const cookies = res.headers.get("set-cookie");
  
  const usersRes = await fetch(`${baseUrl}/api/admin/users?limit=100`, {
    headers: {
      "cookie": cookies
    }
  });
  const users = await usersRes.json();
  console.log(users);
}
run().catch(console.error);
