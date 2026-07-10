fetch("http://localhost:3001/api/auth/login/", {
  method: "POST",
  headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
  body: JSON.stringify({ email: "admin@sridatriphysio.in", password: "Admin@123" })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
