import { createReservation } from '../../js/engine/reservation-engine.js';
import { postReservation } from './booking-api.js';
import { validateBookingForm } from './validator.js';

const $ = (id) => document.getElementById(id);

const state = {
  draft: null,
  receiptFile: null,
  receiptBase64: ''
};

$('date').valueAsDate = new Date();

$('receiptFile').addEventListener('change', async () => {
  const file = $('receiptFile').files[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('נא להעלות קובץ תמונה בלבד');
    $('receiptFile').value = '';
    return;
  }

  state.receiptFile = file;
  state.receiptBase64 = await fileToBase64(file);

  $('receiptImage').src = state.receiptBase64;
  $('receiptFileName').textContent = file.name;
  $('receiptPreview').classList.remove('hidden');

  $('submitBtn').disabled = false;
});

$('continueBtn').addEventListener('click', () => {
  $('errorBox').textContent = '';

  const formData = getFormData();
  const errors = validateBookingForm(formData, $('agree').checked);

  if (errors.length) {
    $('errorBox').innerHTML = errors.join('<br>');
    return;
  }

  state.draft = createReservation(formData);

  $('summaryBox').innerHTML = `
    <strong>שם:</strong> ${state.draft.customerName}<br>
    <strong>טלפון:</strong> ${state.draft.phone}<br>
    <strong>תאריך:</strong> ${state.draft.date}<br>
    <strong>שעה:</strong> ${state.draft.time}<br>
    <strong>סועדים:</strong> ${state.draft.guests}<br>
    <strong>סוג הזמנה:</strong> ${getReservationTypeLabel(state.draft.reservationType)}<br>
    <strong>פיקדון:</strong> ממתין לתשלום
  `;

  $('stepForm').classList.add('hidden');
  $('stepPayment').classList.remove('hidden');
});

$('backBtn').addEventListener('click', () => {
  $('stepPayment').classList.add('hidden');
  $('stepForm').classList.remove('hidden');
});

$('submitBtn').addEventListener('click', async () => {
  $('paymentErrorBox').textContent = '';

  if (!state.draft) return;

  if (!state.receiptBase64) {
    $('paymentErrorBox').textContent = 'יש להעלות צילום של קבלת התשלום לפני שליחת ההזמנה.';
    return;
  }

  $('submitBtn').disabled = true;
  $('submitBtn').textContent = 'שולח...';

  const reservationToSend = {
    ...state.draft,
    receiptFileName: state.receiptFile?.name || '',
    receiptImageBase64: state.receiptBase64,
    depositStatus: 'receipt_uploaded'
  };

  try {
    await postReservation(reservationToSend);
    window.location.href = 'success.html';
  } catch (err) {
    $('paymentErrorBox').textContent = 'אירעה שגיאה בשליחת ההזמנה. נסה שוב.';
    $('submitBtn').disabled = false;
    $('submitBtn').textContent = 'שליחת ההזמנה';
  }
});

function getFormData() {
  return {
    customerName: $('customerName').value.trim(),
    phone: $('phone').value.trim(),
    date: $('date').value,
    time: $('time').value,
    guests: Number($('guests').value),
    reservationType: $('reservationType').value
  };
}

function getReservationTypeLabel(type) {
  if (type === 'group') return 'הזמנה כקבוצה';
  return 'הזמנה פרטית';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}
