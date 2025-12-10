import api from './apiConfig';

const getDashboardStats = async (monthOffset = 0, yearOffset = 0) => {
  const response = await api.get('/dashboard/stats', {
    params: {
      monthOffset,
      yearOffset
    }
  });
  return response.data;
};

export { getDashboardStats };

