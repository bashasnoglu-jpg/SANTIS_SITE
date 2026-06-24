import React, { useState, useEffect } from 'react';
import { getContextData, createRoom, createService, createTherapist, createShiftPattern, createTestBooking } from '../api/setup';

export default function TenantSetupWizard() {
    const [step, setStep] = useState(1);
    const [contextData, setContextData] = useState({ therapists: [], rooms: [], services: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    const loadContextData = async () => {
        try {
            setLoading(true);
            const data = await getContextData();
            setContextData(data);
            setError(null);
        } catch (err) {
            setError(err?.response?.data?.detail || "Failed to load tenant context.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadContextData();
    }, []);

    const handleSuccess = async (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
        await loadContextData(); // Refresh dropdowns
        setStep(prev => Math.min(prev + 1, 5));
    };

    const handleError = (err) => {
        setError(err?.response?.data?.detail || "An error occurred.");
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a] text-[#f2f2f2]">
                <div className="animate-pulse">Loading setup wizard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#f2f2f2] font-sans antialiased p-8 selection:bg-[#333] selection:text-white">
            <div className="max-w-3xl mx-auto">
                <header className="mb-12 border-b border-[#222] pb-6">
                    <h1 className="text-3xl font-light tracking-tight text-[#f2f2f2] mb-2">Tenant Setup Wizard</h1>
                    <p className="text-[#888] font-light">Complete your spa setup in 5 steps.</p>
                </header>

                {error && (
                    <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 text-red-200 text-sm">
                        {error}
                        <button onClick={() => setError(null)} className="ml-4 underline text-xs">Dismiss</button>
                    </div>
                )}
                {successMsg && (
                    <div className="mb-8 p-4 bg-green-900/20 border border-green-900/50 text-green-200 text-sm">
                        {successMsg}
                    </div>
                )}

                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => setStep(1)}
                        className={`flex-1 pb-2 whitespace-nowrap text-sm uppercase tracking-widest border-b transition-colors ${step === 1 ? 'border-[#f2f2f2] text-[#f2f2f2]' : 'border-[#333] text-[#555] hover:text-[#888]'}`}
                    >
                        Rooms {contextData?.rooms?.length > 0 && '✅'}
                    </button>
                    <button
                        onClick={() => setStep(2)}
                        className={`flex-1 pb-2 whitespace-nowrap text-sm uppercase tracking-widest border-b transition-colors ${step === 2 ? 'border-[#f2f2f2] text-[#f2f2f2]' : 'border-[#333] text-[#555] hover:text-[#888]'}`}
                    >
                        Services {contextData?.services?.length > 0 && '✅'}
                    </button>
                    <button
                        onClick={() => setStep(3)}
                        className={`flex-1 pb-2 whitespace-nowrap text-sm uppercase tracking-widest border-b transition-colors ${step === 3 ? 'border-[#f2f2f2] text-[#f2f2f2]' : 'border-[#333] text-[#555] hover:text-[#888]'}`}
                    >
                        Therapists {contextData?.therapists?.length > 0 && '✅'}
                    </button>
                    <button
                        onClick={() => setStep(4)}
                        className={`flex-1 pb-2 whitespace-nowrap text-sm uppercase tracking-widest border-b transition-colors ${step === 4 ? 'border-[#f2f2f2] text-[#f2f2f2]' : 'border-[#333] text-[#555] hover:text-[#888]'}`}
                    >
                        Working Hours {contextData?.has_shifts && '✅'}
                    </button>
                    <button
                        onClick={() => setStep(5)}
                        className={`flex-1 pb-2 whitespace-nowrap text-sm uppercase tracking-widest border-b transition-colors ${step === 5 ? 'border-[#f2f2f2] text-[#f2f2f2]' : 'border-[#333] text-[#555] hover:text-[#888]'}`}
                    >
                        Test Booking {contextData?.has_bookings && '✅'}
                    </button>
                </div>

                <div className="bg-[#111] border border-[#222] p-8">
                    {step === 1 && <RoomForm onSuccess={() => handleSuccess('Room created successfully.')} onError={handleError} />}
                    {step === 2 && <ServiceForm onSuccess={() => handleSuccess('Service created successfully.')} onError={handleError} />}
                    {step === 3 && <TherapistForm onSuccess={() => handleSuccess('Therapist created successfully.')} onError={handleError} />}
                    {step === 4 && <ShiftForm contextData={contextData} onSuccess={() => handleSuccess('Shift pattern created successfully.')} onError={handleError} />}
                    {step === 5 && <BookingForm contextData={contextData} onSuccess={() => handleSuccess('Test booking created successfully. Setup complete!')} onError={handleError} />}
                </div>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------
// Form Components
// -----------------------------------------------------------------------------

function RoomForm({ onSuccess, onError }) {
    const [formData, setFormData] = useState({ name: '', room_type: 'Treatment Room', capacity: 1, cleaning_buffer_minutes: 15, status: 'Active' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createRoom(formData);
            onSuccess();
            setFormData({ name: '', room_type: 'Treatment Room', capacity: 1, cleaning_buffer_minutes: 15, status: 'Active' });
        } catch (err) {
            onError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-light text-[#f2f2f2] mb-4">1. Add Room</h2>
            <div className="grid grid-cols-2 gap-6">
                <Input label="Room Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                <Input label="Room Type" value={formData.room_type} onChange={v => setFormData({ ...formData, room_type: v })} required />
                <Input label="Capacity" type="number" value={formData.capacity} onChange={v => setFormData({ ...formData, capacity: parseInt(v) })} required />
                <Input label="Cleaning Buffer (min)" type="number" value={formData.cleaning_buffer_minutes} onChange={v => setFormData({ ...formData, cleaning_buffer_minutes: parseInt(v) })} required />
                <Select label="Status" value={formData.status} onChange={v => setFormData({ ...formData, status: v })} options={[{value: 'Active', label: 'Active'}, {value: 'Maintenance', label: 'Maintenance'}]} />
            </div>
            <SubmitButton disabled={submitting}>Save Room & Continue</SubmitButton>
        </form>
    );
}

function ServiceForm({ onSuccess, onError }) {
    const [formData, setFormData] = useState({ name: '', category: 'Massage', duration_minutes: 60, price: 100.0, active: true });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createService(formData);
            onSuccess();
            setFormData({ name: '', category: 'Massage', duration_minutes: 60, price: 100.0, active: true });
        } catch (err) {
            onError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-light text-[#f2f2f2] mb-4">2. Add Service</h2>
            <div className="grid grid-cols-2 gap-6">
                <Input label="Service Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                <Input label="Category" value={formData.category} onChange={v => setFormData({ ...formData, category: v })} required />
                <Input label="Duration (min)" type="number" value={formData.duration_minutes} onChange={v => setFormData({ ...formData, duration_minutes: parseInt(v) })} required />
                <Input label="Price" type="number" value={formData.price} onChange={v => setFormData({ ...formData, price: parseFloat(v) })} required />
            </div>
            <SubmitButton disabled={submitting}>Save Service & Continue</SubmitButton>
        </form>
    );
}

function TherapistForm({ onSuccess, onError }) {
    const [formData, setFormData] = useState({ name: '', phone: '', specialties: '', active: true });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createTherapist(formData);
            onSuccess();
            setFormData({ name: '', phone: '', specialties: '', active: true });
        } catch (err) {
            onError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-light text-[#f2f2f2] mb-4">3. Add Therapist</h2>
            <div className="grid grid-cols-2 gap-6">
                <Input label="Therapist Name" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                <Input label="Phone" value={formData.phone} onChange={v => setFormData({ ...formData, phone: v })} required />
                <div className="col-span-2">
                    <Input label="Specialties (comma separated)" value={formData.specialties} onChange={v => setFormData({ ...formData, specialties: v })} />
                </div>
            </div>
            <SubmitButton disabled={submitting}>Save Therapist & Continue</SubmitButton>
        </form>
    );
}

function ShiftForm({ contextData, onSuccess, onError }) {
    const [formData, setFormData] = useState({ therapist_id: '', days_of_week: 'Monday,Tuesday,Wednesday,Thursday,Friday', start_time: '09:00', end_time: '18:00', break_minutes: 60 });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.therapist_id) return onError({response: {data: {detail: "Please select a therapist."}}});
        setSubmitting(true);
        try {
            await createShiftPattern({
                ...formData,
                days_of_week: formData.days_of_week.split(',').map(s => s.trim())
            });
            onSuccess();
            setFormData({ therapist_id: '', days_of_week: 'Monday,Tuesday,Wednesday,Thursday,Friday', start_time: '09:00', end_time: '18:00', break_minutes: 60 });
        } catch (err) {
            onError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-light text-[#f2f2f2] mb-4">4. Staff Shift Patterns</h2>
            <div className="grid grid-cols-2 gap-6">
                <Select label="Therapist" value={formData.therapist_id} onChange={v => setFormData({ ...formData, therapist_id: v })} options={[{value: '', label: 'Select Therapist'}, ...contextData.therapists.map(t => ({value: t.id, label: t.name}))]} />
                <Input label="Days of Week (comma separated)" value={formData.days_of_week} onChange={v => setFormData({ ...formData, days_of_week: v })} required />
                <Input label="Start Time (HH:MM)" type="time" value={formData.start_time} onChange={v => setFormData({ ...formData, start_time: v })} required />
                <Input label="End Time (HH:MM)" type="time" value={formData.end_time} onChange={v => setFormData({ ...formData, end_time: v })} required />
                <Input label="Break (min)" type="number" value={formData.break_minutes} onChange={v => setFormData({ ...formData, break_minutes: parseInt(v) })} required />
            </div>
            <SubmitButton disabled={submitting}>Save Shifts & Continue</SubmitButton>
        </form>
    );
}

function BookingForm({ contextData, onSuccess, onError }) {
    const [formData, setFormData] = useState({ guest_name: '', service_id: '', date: '', time: '10:00', therapist_id: '', room_id: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.service_id || !formData.therapist_id || !formData.room_id) {
            return onError({response: {data: {detail: "Please fill all dropdowns."}}});
        }
        setSubmitting(true);
        try {
            await createTestBooking(formData);
            onSuccess();
            setFormData({ guest_name: '', service_id: '', date: '', time: '10:00', therapist_id: '', room_id: '' });
        } catch (err) {
            onError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-light text-[#f2f2f2] mb-4">5. Test Booking</h2>
            <div className="grid grid-cols-2 gap-6">
                <Input label="Guest Name" value={formData.guest_name} onChange={v => setFormData({ ...formData, guest_name: v })} required />
                <Select label="Service" value={formData.service_id} onChange={v => setFormData({ ...formData, service_id: v })} options={[{value: '', label: 'Select Service'}, ...contextData.services.map(s => ({value: s.id, label: s.name}))]} />
                <Input label="Date (YYYY-MM-DD)" type="date" value={formData.date} onChange={v => setFormData({ ...formData, date: v })} required />
                <Input label="Time (HH:MM)" type="time" value={formData.time} onChange={v => setFormData({ ...formData, time: v })} required />
                <Select label="Therapist" value={formData.therapist_id} onChange={v => setFormData({ ...formData, therapist_id: v })} options={[{value: '', label: 'Select Therapist'}, ...contextData.therapists.map(t => ({value: t.id, label: t.name}))]} />
                <Select label="Room" value={formData.room_id} onChange={v => setFormData({ ...formData, room_id: v })} options={[{value: '', label: 'Select Room'}, ...contextData.rooms.map(r => ({value: r.id, label: r.name}))]} />
            </div>
            <SubmitButton disabled={submitting}>Create Test Booking</SubmitButton>
        </form>
    );
}

// -----------------------------------------------------------------------------
// UI Utilities
// -----------------------------------------------------------------------------

function Input({ label, type = "text", value, onChange, required = false }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-[#888]">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                className="bg-[#1a1a1a] border border-[#333] px-4 py-3 text-sm text-[#f2f2f2] focus:outline-none focus:border-[#666] transition-colors"
            />
        </div>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-widest text-[#888]">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="bg-[#1a1a1a] border border-[#333] px-4 py-3 text-sm text-[#f2f2f2] focus:outline-none focus:border-[#666] transition-colors appearance-none"
            >
                {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function SubmitButton({ children, disabled }) {
    return (
        <div className="pt-4 mt-8 border-t border-[#222]">
            <button
                type="submit"
                disabled={disabled}
                className="bg-[#f2f2f2] text-[#0a0a0a] px-8 py-3 text-sm font-medium uppercase tracking-widest hover:bg-[#d4d4d4] transition-colors disabled:opacity-50"
            >
                {disabled ? 'Processing...' : children}
            </button>
        </div>
    );
}
