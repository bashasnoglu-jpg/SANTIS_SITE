
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/axios';
import Navbar from '../components/Navbar';

import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Setup the localizer by providing the moment (or globalize, or Luxon) instance
// to the localizer function.
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const Operations = () => {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('week');
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                // Fetch bookings for the current view
                // We need to pass start and end dates based on the current 'date' and 'view'
                // For simplicity, let's fetch a wide range around the current date for now, 
                // or ideally calculate start/end of the current view.

                const start = moment(date).startOf('month').subtract(1, 'month').format();
                const end = moment(date).endOf('month').add(1, 'month').format();

                const response = await api.get('/bookings/', {
                    params: {
                        start_date: start,
                        end_date: end
                    }
                });

                if (response.data) {
                    const mappedEvents = response.data.map(booking => ({
                        id: booking.id,
                        // Use nested objects if available, fallback to direct fields if legacy
                        title: `${booking.customer?.full_name || booking.customer_name || 'Guest'} - ${booking.service?.name || 'Service'}`,
                        start: new Date(booking.start_time),
                        end: new Date(booking.end_time),
                        resourceId: booking.staff_id,
                        status: booking.status
                    }));
                    setEvents(mappedEvents);
                }
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
                // Fallback Mock for Demo
                setEvents([
                    {
                        id: 1,
                        title: 'Aromatherapy - Room 1',
                        start: new Date(new Date().setHours(10, 0, 0)),
                        end: new Date(new Date().setHours(11, 0, 0)),
                        resourceId: 1,
                    }
                ]);
            }
        };

        fetchBookings();
    }, [date, view]);

    const handleSelectSlot = ({ start, end }) => {
        const title = window.prompt('New Event name');
        if (title) {
            setEvents([...events, { start, end, title }]);
        }
    };

    const handleSelectEvent = (event) => {
        window.alert(event.title);
    };

    // Drag and Drop Handler
    const handleEventDrop = async ({ event, start, end, isAllDay: droppedOnAllDaySlot = false }) => {
        const { id } = event;

        // 1. Optimistic Update
        const idx = events.indexOf(event);
        const updatedEvent = { ...event, start, end };

        const nextEvents = [...events];
        nextEvents.splice(idx, 1, updatedEvent);
        setEvents(nextEvents);

        // 2. API Call
        try {
            await api.patch(`/bookings/${id}`, {
                start_time: start.toISOString() // Backend will calc end time based on service duration
            });
            console.log("Rescheduling successful");
        } catch (error) {
            console.error("Reschedule failed:", error);
            alert("Reschedule failed: " + (error.response?.data?.detail || error.message));
            // Revert
            setEvents(events);
        }
    };

    // Custom styling for calendar events
    const eventPropGetter = (event) => {
        const backgroundColor = '#d4af37'; // Santis Gold
        return { style: { backgroundColor, color: 'black', border: 'none' } };
    };

    return (
        <div className="min-h-screen bg-santis-bg text-santis-text">
            <Navbar />
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Operations</h1>
                    <div>
                        {/* Placeholder for controls */}
                        <button className="px-4 py-2 bg-santis-card border border-santis-border rounded-lg text-sm hover:border-santis-gold transition-colors text-white">
                            + New Booking
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-santis-border shadow-lg h-[800px] text-white">
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        style={{ height: '100%' }}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        onEventDrop={handleEventDrop}
                        draggableAccessor={() => true}
                        resizable={false} // Only drag logic for now as duration is service-bound
                        eventPropGetter={eventPropGetter}
                    />
                </div>
            </div>
        </div>
    );
};

export default Operations;
