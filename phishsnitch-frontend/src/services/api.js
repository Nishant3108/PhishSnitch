// Deployment part
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
export async function analyzeMessage(message) {
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze");
  }

  return await response.json();
}



// Local development version — backend running on localhost:8000
/*const BACKEND_URL = "http://localhost:8000";
export async function analyzeMessage(message) {
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error("Failed to analyze");
  }
  return await response.json();
}*/
