const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "";

async function apiRequest(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    let data = {};
    const text = await response.text();

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        success: false,
        message: text || "Response server tidak valid.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Terjadi kesalahan pada server.",
        error: data.error || null,
      };
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);

    return {
      success: false,
      message: "Terjadi kesalahan saat menghubungkan ke server.",
      error: error.message,
    };
  }
}