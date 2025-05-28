import { create } from 'zustand';

type MinimalUser = {
  employee_id: string;
  emp_code: string;
  role: string;
  full_name: string;
  last_name: string;
};

type AuthState = {
  token: string | null;
  user: MinimalUser | null;
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  // Khởi tạo giá trị từ sessionStorage (nếu có)
  token: sessionStorage.getItem('token'),
  user: JSON.parse(sessionStorage.getItem('auth') || 'null'),
  isLoggedIn: !!sessionStorage.getItem('token'),

  login: (token: string) => {
    // Giả sử JWT payload chứa { emp_code, role, exp... }
    // Dùng atob() để decode base64, parse JSON
    const payload = JSON.parse(atob(token.split('.')[1])) || {};
    console.log('JWT Payload:', payload);

    // Lấy những thông tin cần thiết
    const userData: MinimalUser = {
      employee_id: payload.employee_id || '',
      emp_code: payload.emp_code || '',
      role: payload.role || 'user',
      full_name: payload.full_name || '',
      last_name: payload.last_name || ''
    };
    console.log('UserData:', userData);

    // Lưu token & userData vào sessionStorage
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('auth', JSON.stringify(userData));

    // Cập nhật Zustand state
    set({
      token,
      user: userData,
      isLoggedIn: true,
    });
  },

  logout: () => {
    // Xoá token & userData
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth');

    // Reset Zustand
    set({
      token: null,
      user: null,
      isLoggedIn: false,
    });
  },
}));
