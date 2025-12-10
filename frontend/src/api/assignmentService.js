import api from './apiConfig';

const getAssignments = async () => {
  const response = await api.get('/assignments');
  return response.data;
};

const getAssignmentById = async (id) => {
  const response = await api.get(`/assignments/${id}`);
  return response.data;
};

const getPendingAssignments = async () => {
  const response = await api.get('/assignments/pending');
  return response.data;
};

const createAssignment = async (assignmentData) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  const response = await api.post('/assignments', assignmentData, config);
  return response.data;
};

const updateAssignment = async (id, assignmentData) => {
  const response = await api.put(`/assignments/${id}`, assignmentData);
  return response.data;
};

const deleteAssignment = async (id) => {
  const response = await api.delete(`/assignments/${id}`);
  return response.data;
};

const checkoutAssignment = async (id) => {
  const response = await api.put(`/assignments/${id}/checkout`);
  return response.data;
};

export {
  getAssignments,
  getAssignmentById,
  getPendingAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  checkoutAssignment
};

