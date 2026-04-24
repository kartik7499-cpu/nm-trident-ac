const axios = require("axios");
const FormData = require("form-data");
const { normalizePokemonName } = require("./nameResolver");
const config = require("../config");

async function getName(imageUrl) {
  try {
    const apiKey = config.aiApiKey || config.aiLicenseKey;
    const apiUrl = `${config.aiHostname.replace(/\/+$/, "")}/predict`;

    // 1. download image
    const img = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    // 2. create form-data
    const form = new FormData();
    form.append("image", Buffer.from(img.data), "pokemon.png");

    // 3. send request
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 15000,
    });

    const data = response.data;

    if (!data || data.error || data.success === false) {
      console.log(data?.error || "Unknown API error");
      return [null, 0];
    }

    // 4. parse response
    let name =
      data.pokemon ||
      data.prediction ||
      data.name ||
      data.predicted_class ||
      null;

    const confidence = Number(data.confidence) || 0;

    if (!name) return [null, 0];

    // 🔥 APPLY RESOLVER HERE
    name = normalizePokemonName(name);

    return [name, confidence];

  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "AI request failed:",
      error.message
    );
    return [null, 0];
  }
}

module.exports = {
  getName,
};