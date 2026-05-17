async function testTranslate() {
  try {
    const text = "Hello World! This is a fast, keyless, and free translation test.";
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("=== FREE TRANSLATE API RESPONSE ===");
    console.log("Raw Response:", JSON.stringify(data));
    if (Array.isArray(data) && data[0]) {
      const translated = data[0].map(s => s[0] || "").join("");
      console.log("Translated Text:", translated);
    }
    console.log("===================================\n");
  } catch (e) {
    console.error("Error during test:", e);
  }
}

testTranslate();
