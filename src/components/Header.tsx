import { Navbar, Nav, Image, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import sharpLogo from '../assets/sharp-logo.png';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuthStore();

  const formatName = (name: string | undefined) => {
    if (!name) return 'User';
    return name.normalize('NFD').replace(/[̀-ͯ]/g, '');
  };

  return (
    <Navbar
      expand="lg"
      fixed="top"
      className="shadow-sm"
      style={{
        height: '60px',
        backgroundColor: '#3c8dbc'
      }}
    >
      <div className="container-fluid d-flex align-items-center">
        <Navbar.Brand as={Link} to="/" className="me-4 d-flex align-items-center">
          <Image
            src={sharpLogo}
            alt="Sharp Logo"
            style={{
              height: '60px',
              objectFit: 'contain',
              marginRight: '-20px',
              paddingTop: '6px',
            }}
          />
        </Navbar.Brand>
        <Nav className="me-auto">
          {user?.role === 'admin' && (
            <Dropdown className="me-3">
              <Dropdown.Toggle
                className="d-flex align-items-center border-0 bg-transparent text-white"
              >
                <i className="fas fa-cogs me-1"></i>
                Quản lý chung
              </Dropdown.Toggle>
              <Dropdown.Menu className="custom-dropdown-menu">
                <Dropdown.Item as={Link} to="/manage-user" className="custom-dropdown-item">
                  <i className="fas fa-users me-2"></i>
                  Quản lý người dùng
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/manage-assets" className="custom-dropdown-item">
                  <i className="fas fa-laptop me-2"></i>
                  Quản lý thiết bị
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/history-status" className="custom-dropdown-item">
                  <i className="fas fa-history me-2"></i>
                  Lịch sử thiết bị
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/manage-repairs" className="custom-dropdown-item">
                  <i className="fas fa-tools me-2"></i>
                  Quản lý sửa chữa
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          {user?.role === 'admin' && (
            <Dropdown className="me-3">
              <Dropdown.Toggle
                className="d-flex align-items-center border-0 bg-transparent text-white"
              >
                <i className="fas fa-code me-1"></i>
                Script
              </Dropdown.Toggle>
              <Dropdown.Menu className="custom-dropdown-menu">
                <Dropdown.Item as={Link} to="/script/create-aduser" className="custom-dropdown-item">
                  <i className="fas fa-user-plus me-2"></i>
                  Tạo người dùng AD
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/script/set-logon" className="custom-dropdown-item">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Đặt Logon
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/script/delete-user" className="custom-dropdown-item">
                  <i className="fas fa-user-minus me-2"></i>
                  Xóa người dùng
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/script/delete-dhcp" className="custom-dropdown-item">
                  <i className="fas fa-trash-alt me-2"></i>
                  Xóa DHCP
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          {user?.role === 'admin' && (
            <Dropdown className="me-3">
              <Dropdown.Toggle
                className="d-flex align-items-center border-0 bg-transparent text-white"
              >
                <i className="fas fa-network-wired me-1"></i>
                Quản lý IP
              </Dropdown.Toggle>
              <Dropdown.Menu className="custom-dropdown-menu">
                <Dropdown.Item as={Link} to="/network-segment" className="custom-dropdown-item">
                  <i className="fas fa-network-wired me-2"></i>
                  Phân đoạn mạng
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/ip-division" className="custom-dropdown-item">
                  <i className="fas fa-table me-2"></i>
                  Chia IP
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/export-ip" className="custom-dropdown-item">
                  <i className="fas fa-file-export me-2"></i>
                  Xuất IP
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/ip-history" className="custom-dropdown-item">
                  <i className="fas fa-history me-2"></i>
                  Lịch sử IP
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Nav>
        <Dropdown align="end">
          <Dropdown.Toggle
            className="d-flex align-items-center border-0 bg-transparent"
          >
            <div
              className="me-2 text-end d-none d-md-block text-white"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
              }}
            >
              <div className="fw-bold" style={{ fontSize: '14px' }}>{user?.full_name || 'Người dùng'}</div>
              <small className="text-white-50" style={{ fontSize: '12px' }}>
                {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </small>
            </div>
            <Image
              src={`https://ui-avatars.com/api/?name=${formatName(user?.full_name)}&background=0D8ABC&color=fff`}
              roundedCircle
              width={40}
              height={40}
              style={{ border: '2px solid rgba(255, 255, 255, 0.2)' }}
            />
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow-sm">
            <Dropdown.Header
              className="text-center"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              <div className="fw-bold">{user?.emp_code || 'Người dùng'}</div>
              <small className="text-muted">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </small>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout} className="text-danger">
              <i className="fas fa-sign-out-alt me-2" />
              Đăng xuất
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </Navbar>
  );
}
