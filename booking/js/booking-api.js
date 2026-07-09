export const API_URL =
  'https://script.google.com/macros/s/AKfycby2aRidcEkq3qCyvujsicufIEajXg4sa5ytSZj90qLR5AFoHsQ61qf00HZVOUKr2Cillg/exec';

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
