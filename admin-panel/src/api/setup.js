import api from './axios';

export const getContextData = async () => {
    const response = await api.get('/tenant-setup/context-data');
    return response.data;
};

export const createRoom = async (data) => {
    const response = await api.post('/tenant-setup/rooms', data);
    return response.data;
};

export const createService = async (data) => {
    const response = await api.post('/tenant-setup/services', data);
    return response.data;
};

export const createTherapist = async (data) => {
    const response = await api.post('/tenant-setup/therapists', data);
    return response.data;
};

export const createShiftPattern = async (data) => {
    const response = await api.post('/tenant-setup/shifts', data);
    return response.data;
};

export const createTestBooking = async (data) => {
    const response = await api.post('/tenant-setup/test-booking', data);
    return response.data;
};
