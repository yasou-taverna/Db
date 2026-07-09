export const API_URL = 'https://script.google.com/macros/s/AKfycbyR8vPh0M-RsbkLoVFlPWSK9GqZL38v0OC73vg4KkldhgPBf3XJrMSGz7XCpNR1ZWVW/exec';

export async function postReservation(reservation) {
  const response = await fetch(API_URL, { 
    method: 'POST',
    body: JSON.stringify({
      action: 'addReservation',
      ...reservation
    })
  });

  try {
    return await response.json();
  } catch (e) {
    return { ok: true };
  }
}
