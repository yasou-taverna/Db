export const API_URL ='https://script.google.com/macros/s/AKfycby2aRidcEkq3qCyvujsicufIEajXg4sa5ytSZj90qLR5AFoHsQ61qf00HZVOUKr2Cillg/exec';

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
