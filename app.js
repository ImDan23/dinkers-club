import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Expose functions to window for inline onclick handlers
window.selectCourt = selectCourt;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.confirmBooking = confirmBooking;
window.updateBookingDate = updateBookingDate;

// Booking State Management
let bookingData = {
    courtId: null,
    courtName: null,
    time: null,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD for Supabase
};

let unavailableSlots = [];

// Initialize time slots with 1-hour duration and 10-minute buffer
const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:10 AM - 10:10 AM",
    "10:20 AM - 11:20 AM",
    "11:30 AM - 12:30 PM",
    "12:40 PM - 01:40 PM",
    "01:50 PM - 02:50 PM",
    "03:00 PM - 04:00 PM",
    "04:10 PM - 05:10 PM",
    "05:20 PM - 06:20 PM",
    "06:30 PM - 07:30 PM",
    "07:40 PM - 08:40 PM",
    "08:50 PM - 09:50 PM"
];

async function fetchAvailability() {
    if (!bookingData.courtId || !bookingData.date) return;
    
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('time_slot')
            .eq('court_id', bookingData.courtId)
            .eq('booking_date', bookingData.date)
            .eq('status', 'confirmed');

        if (error) throw error;
        
        unavailableSlots = data.map(b => b.time_slot);
        renderTimeSlots();
    } catch (error) {
        console.error('Error fetching availability:', error);
    }
}

function updateBookingDate(newDate) {
    bookingData.date = newDate;
    bookingData.time = null; // Reset time on date change
    document.getElementById('btn-to-step3').disabled = true;
    fetchAvailability();
}

function selectCourt(courtId, courtName, element) {
    // UI Update
    document.querySelectorAll('.court-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    
    // State Update
    bookingData.courtId = courtId;
    bookingData.courtName = courtName;
    
    // Move to next step automatically with a small delay for feedback
    setTimeout(() => {
        nextStep(2);
    }, 400);
}

function renderTimeSlots() {
    const container = document.getElementById('time-slots-container');
    container.innerHTML = '';
    
    timeSlots.forEach(slot => {
        const div = document.createElement('div');
        const isBooked = unavailableSlots.includes(slot);
        div.className = `time-slot ${isBooked ? 'disabled' : ''}`;
        if (bookingData.time === slot) div.classList.add('selected');
        
        div.innerText = slot;
        
        if (!isBooked) {
            div.onclick = () => selectTime(slot, div);
        }
        
        container.appendChild(div);
    });
}

function selectTime(slot, element) {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    
    bookingData.time = slot;
    document.getElementById('btn-to-step3').disabled = false;
}

function nextStep(step) {
    // Hide all steps
    document.getElementById('step1-content').style.display = 'none';
    document.getElementById('step2-content').style.display = 'none';
    document.getElementById('step3-content').style.display = 'none';
    
    // Show active step
    document.getElementById(`step${step}-content`).style.display = 'block';
    
    // Update Sidebar
    document.querySelectorAll('.step-card').forEach(card => card.classList.remove('active'));
    document.getElementById(`step${step}-card`).classList.add('active');
    
    if (step === 2) {
        // Set min date to today
        const dateInput = document.getElementById('booking-date-input');
        dateInput.value = bookingData.date;
        dateInput.min = new Date().toISOString().split('T')[0];
        
        fetchAvailability();
    }
    
    if (step === 3) {
        document.getElementById('summary-court').innerText = bookingData.courtName;
        document.getElementById('summary-time').innerText = bookingData.time;
    }
}

function prevStep(step) {
    nextStep(step);
}

async function confirmBooking(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    // UI feedback
    submitBtn.innerText = 'Confirming...';
    submitBtn.disabled = true;
    
    // Gather form data
    const formData = new FormData(form);
    const bookingDetails = {
        court_id: bookingData.courtId,
        booking_date: bookingData.date,
        time_slot: bookingData.time,
        user_name: form.querySelector('input[type="text"]').value,
        user_email: form.querySelector('input[type="email"]').value,
        user_phone: form.querySelector('input[type="tel"]').value,
        skill_level: form.querySelector('select').value,
        status: 'confirmed'
    };

    try {
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingDetails])
            .select();

        if (error) throw error;

        // Show Success
        const bookingId = data[0].id;
        document.getElementById('booking-id').innerText = `DKR-${bookingId}-OK`;
        
        document.getElementById('step3-content').style.display = 'none';
        document.getElementById('success-content').style.display = 'block';
        
        document.querySelector('.booking-steps').style.opacity = '0.3';
        document.querySelector('.booking-steps').style.pointerEvents = 'none';
        
        document.getElementById('booking-flow').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error booking:', error);
        alert('Booking failed: ' + (error.message || 'Unknown error. Please try another slot.'));
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// Initial display setup
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup if needed
});
