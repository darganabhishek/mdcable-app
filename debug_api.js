async function testApi() {
  try {
    console.log("Calling http://localhost:5000/api/customers...");
    const res = await fetch('http://localhost:5000/api/customers');
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data length:", data.length);
  } catch (err) {
    console.log("Error:", err.message);
  }
}

testApi();
