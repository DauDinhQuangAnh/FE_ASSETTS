import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Carousel, Card, Row, Col, } from 'react-bootstrap';
import { NavLink, useNavigate } from "react-router-dom";
import { FaDesktop, FaMobileAlt, FaTabletAlt, FaServer, FaNetworkWired, FaPrint, FaHeadset, FaKeyboard, FaMouse, FaUserShield, FaHistory, FaTrash, FaFileExport, FaUser } from 'react-icons/fa';
import './Dashboard.css';
import axiosInstance from '../api/axiosInstance';

// Data ảnh slider mẫu (bạn có thể thay URL ảnh tùy ý)
const sliderImages = [
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
];

interface Category {
  category_id: number;
  category_name: string;
}

// Core system features
const getFeatures = () => [
  {
    id: 1,
    name: "Quản lý thiết bị",
    icon: <FaDesktop />,
    description: "Theo dõi và quản lý tất cả thiết bị trong tổ chức",
    href: "/manage-assets"
  },
  {
    id: 2,
    name: "Quản lý người dùng",
    icon: <FaUser />,
    description: "Quản lý người dùng và kiểm soát quyền truy cập",
    href: "/user-management"
  },
  {
    id: 3,
    name: "Lịch sử thiết bị",
    icon: <FaHistory />,
    description: "Xem lịch sử thay đổi của thiết bị",
    href: "/history-status"
  },
  {
    id: 4,
    name: "Danh sách phân đoạn",
    icon: <FaUserShield />,
    description: "Xem danh sách các phân đoạn mạng",
    href: "/ip-division"
  },
  {
    id: 5,
    name: "Xuất IP",
    icon: <FaFileExport />,
    description: "Xuất danh sách các địa chỉ IP đã cấp phát",
    href: "/export-ip"
  },
  {
    id: 6,
    name: "Lịch sử IP",
    icon: <FaHistory />,
    description: "Xem lịch sử thay đổi của địa chỉ IP",
    href: "/ip-history"
  }
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    "Đang sử dụng": 0,
    "Đang cài đặt": 0,
    "Chờ xóa": 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const navigate = useNavigate();
  const features = getFeatures();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/asset/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats...');
        const response = await axiosInstance.get('http://localhost:3000/api/asset/count');
        console.log('Raw API Response:', response);
        console.log('API Response Data:', response.data);

        // Kiểm tra chi tiết từng trường
        if (response.data) {
          console.log('Checking each field:');
          console.log('total:', response.data.total);
          console.log('Đang sử dụng:', response.data["Đang sử dụng"]);
          console.log('Đang cài đặt:', response.data["Đang cài đặt"]);
          console.log('Chờ xóa:', response.data["Chờ xóa"]);

          const newStats = {
            total: response.data.total || 0,
            "Đang sử dụng": response.data["Đang sử dụng"] || 0,
            "Đang cài đặt": response.data["Đang cài đặt"] || 0,
            "Chờ xóa": response.data["Chờ xóa"] || 0
          };

          console.log('New Stats State:', newStats);
          setStats(newStats);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Không thể tải dữ liệu thống kê');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Get icon for category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'máy tính':
        return <FaDesktop />;
      case 'điện thoại':
        return <FaMobileAlt />;
      case 'máy tính bảng':
        return <FaTabletAlt />;
      case 'máy chủ':
        return <FaServer />;
      case 'thiết bị mạng':
        return <FaNetworkWired />;
      case 'máy in':
        return <FaPrint />;
      case 'tai nghe':
        return <FaHeadset />;
      case 'bàn phím':
        return <FaKeyboard />;
      case 'chuột':
        return <FaMouse />;
      default:
        return <FaDesktop />;
    }
  };

  // Get color for category
  const getCategoryColor = (index: number) => {
    const colors = [
      '#4e73df', // Blue
      '#1cc88a', // Green
      '#36b9cc', // Cyan
      '#f6c23e', // Yellow
      '#e74a3b', // Red
      '#5a5c69', // Gray
      '#6f42c1', // Purple
      '#20c997', // Teal
      '#fd7e14'  // Orange
    ];
    return colors[index % colors.length];
  };

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    navigate('/manage-assets', {
      state: {
        initialFilter: {
          category: categoryName,
          status: 'all',
          search: ''
        }
      }
    });
  };

  return (
    <Layout>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header mb-4">
          <h2 className="dashboard-title">Hệ thống Quản lý Thiết bị SMV</h2>
          <p className="dashboard-subtitle">Giải pháp toàn diện cho việc quản lý và theo dõi thiết bị trong tổ chức</p>
        </div>

        {/* Slider */}
        <Carousel className="dashboard-carousel mb-4">
          {sliderImages.map((imgUrl, idx) => (
            <Carousel.Item key={idx}>
              <img
                className="d-block w-100"
                src={imgUrl}
                alt={`slide-${idx}`}
              />
              <Carousel.Caption>
                <h3>Quản lý thiết bị thông minh</h3>
                <p>Giải pháp toàn diện cho việc theo dõi và quản lý thiết bị</p>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Thống kê */}
        <div className="stats-section mb-4">
          <h3 className="section-title">Thống kê tổng quan</h3>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Row>
            <Col md={3} sm={6}>
              <Card className="stats-card total">
                <Card.Body>
                  <div className="stats-icon">
                    <FaDesktop />
                  </div>
                  <div className="stats-info">
                    <h4>{loading ? 'Đang tải...' : stats.total}</h4>
                    <p>Tổng số thiết bị</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stats-card in-use">
                <Card.Body>
                  <div className="stats-icon">
                    <FaUserShield />
                  </div>
                  <div className="stats-info">
                    <h4>{loading ? 'Đang tải...' : stats["Đang sử dụng"]}</h4>
                    <p>Đang sử dụng</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stats-card maintenance">
                <Card.Body>
                  <div className="stats-icon">
                    <FaHistory />
                  </div>
                  <div className="stats-info">
                    <h4>{loading ? 'Đang tải...' : stats["Đang cài đặt"]}</h4>
                    <p>Đang cài đặt</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stats-card inactive">
                <Card.Body>
                  <div className="stats-icon">
                    <FaTrash />
                  </div>
                  <div className="stats-info">
                    <h4>{loading ? 'Đang tải...' : stats["Chờ xóa"]}</h4>
                    <p>Chờ xóa</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Tính năng chính */}
        <div className="features-section mb-4">
          <h3 className="section-title">Tính năng chính</h3>
          <Row>
            {features.map(feature => (
              <Col md={4} sm={6} key={feature.id}>
                <Card className="feature-card mb-3 h-100">
                  <Card.Body className="d-flex flex-column align-items-center text-center">
                    <div className="feature-icon mb-3">{feature.icon}</div>
                    <Card.Title className="mb-2">{feature.name}</Card.Title>
                    <Card.Text className="mb-3">{feature.description}</Card.Text>
                    <NavLink
                      to={feature.href || ''}
                      className="mt-auto btn btn-primary btn-sm"
                      style={{ textDecoration: 'none' }}
                    >
                      Xem chi tiết
                    </NavLink>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Loại thiết bị */}
        <div className="device-types-section mb-4">
          <h3 className="section-title">Loại thiết bị</h3>
          {categoryLoading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : (
            <div className="device-types-container">
              {categories.map((category, index) => (
                <div
                  key={category.category_id}
                  className="device-type-item"
                  style={{ backgroundColor: getCategoryColor(index) }}
                  onClick={() => handleCategoryClick(category.category_name)}
                >
                  <div className="device-icon">{getCategoryIcon(category.category_name)}</div>
                  <div className="device-name">{category.category_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
