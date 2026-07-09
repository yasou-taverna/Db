export const API_URL ='https://script.google.com/macros/s/AKfycbxmiHGnlHf8f8jxAiqK40XQ1pTdasCZs3-GY3adJZIQKfm4BOie4b7dJZTp8m2TX4vOLg/exec';

export async function apiGet(action) {
  const response = await fetch(
    `${API_URL}?action=${encodeURIComponent(action)}&t=${Date.now()}`
  );

  try {
    return await response.json();
  } catch (e) {
    return [];
  }
}

export async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  try {
    return await response.json();
  } catch (e) {
    return { ok: true };
  }
}
