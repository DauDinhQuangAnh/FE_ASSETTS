import { useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import bgImage from '../assets/BGR.jpg';
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const [emp_code, setEmpCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('/auth/login', { emp_code, password });

      console.log('Full API response data:', res.data);

      const token = res.data.token;

      const userInfo: any = jwtDecode(token);
      console.log('Decoded user info:', userInfo);

      localStorage.setItem('token', token);
      localStorage.setItem('emp_code', userInfo.emp_code);
      localStorage.setItem('employee_id', userInfo.employee_id);
      localStorage.setItem('full_name', userInfo.full_name);
      localStorage.setItem('department_id', userInfo.department_id);

      login(token);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      console.error('Login API error details:', err.response?.data);
      console.error('Full error object:', err);
      setError(err.response?.data?.message || 'Lỗi đăng nhập');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backgroundBlendMode: 'overlay'
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={5}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '15px',
                padding: '2rem',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.6)'
              }}
            >
              <h2 className="mb-4 text-center text-black">LOGIN</h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-black">Mã nhân viên (emp_code)</Form.Label>
                  <Form.Control
                    type="text"
                    value={emp_code}
                    onChange={(e) => setEmpCode(e.target.value)}
                    required
                    style={{
                      color: 'black'
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="text-black">Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      color: 'black'
                    }}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  style={{
                    background: 'rgba(13, 81, 253, 0.8)',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.3rem'
                  }}
                >
                  Đăng nhập
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
