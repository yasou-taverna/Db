export const API_URL =
  'https://script.google.com/macros/s/AKfycbxmiHGnlHf8f8jxAiqK40XQ1pTdasCZs3-GY3adJZIQKfm4BOie4b7dJZTp8m2TX4vOLg/exec';

export async function postReservation(reservation) {
  const response = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'addReservation',
      ...reservation
    })
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Reservation failed');
  }

  return data;
}
