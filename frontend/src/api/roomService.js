import api from './apiConfig';

const getMultipartConfig = (payload) =>
  payload instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;

const getRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

const getPublicRooms = async () => {
  const response = await api.get('/rooms/public');
  return response.data;
};

const getAvailablePublicRooms = async () => {
  const response = await api.get('/rooms/public/available');
  return response.data;
};

const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData, getMultipartConfig(roomData));
  return response.data;
};

const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData, getMultipartConfig(roomData));
  return response.data;
};

const deleteRoom = async (id) => {
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};

export {
  getRooms,
  getPublicRooms,
  getAvailablePublicRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};