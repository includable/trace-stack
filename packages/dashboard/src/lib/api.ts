const BASE_URL = window.location.href.includes("localhost:")
  ? "http://localhost:3000"
  : "https://vite-ui-dashboard.vercel.app"; // TODO
const API_URL = `${BASE_URL}/api/explore`;

export const dataLoader =
  (path: string, key: string = path) =>
  async () => {
    return fetch(`${API_URL}/${path}`).then(async (res) => ({ [key]: await res.json() }));
  };
