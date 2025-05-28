import axios from './axiosInstance';

export const fetchBusinessUnits = async () => {
  try {
    const response = await axios.get('/auth/business-units');
    return response.data;
  } catch (error) {
    console.error('Error fetching business units:', error);
    throw error;
  }
};

export const fetchDepartments = async (businessUnitId?: number) => {
  try {
    const url = businessUnitId 
      ? `/auth/departments?business_unit_id=${businessUnitId}`
      : '/auth/departments';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}; 