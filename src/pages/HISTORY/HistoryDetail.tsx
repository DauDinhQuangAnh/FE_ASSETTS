import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Button,
  Spinner,
  Badge,
  Tab,
  Tabs,
  Row,
  Col
} from 'react-bootstrap';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import './HistoryDetail.css';

interface HistoryDetail {
  history_id: number;
  asset_id: number;
  asset_code: string;
  asset_name: string;
  brand: string;
  model: string;
  serial_number: string;
  employee_code: string;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  handover_by_code: string;
  handover_by_name: string;
  handover_by_email: string;
  handover_by_position: string;
  department_name: string;
  department_code: string;
  business_unit_name: string;
  vendor_name: string;
  vendor_representative: string;
  vendor_contact: string;
  vendor_address: string;
  status_name: string;
  handover_date: string;
  returned_date: string;
  floor: string;
  position: string;
  mac_address: string;
  history_status: string;
  is_handover: boolean;
  note: string;
  type: string;
  os: string;
  office: string;
  software_used: string[];
  configuration: string;
  ip_address: string;
  hub: string;
  vcs_lan_no: string;
  start_use_date: string;
  factory_area: string;
  location_id: string;
  purchase_date: string;
  purchase_price: number;
  warranty_expiry: string;
  maintenance_cycle: number;
  upgrade_infor: string;
  old_ip: string;
}

export default function HistoryDetail() {
  const { historyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyDetail, setHistoryDetail] = useState<HistoryDetail | null>(null);

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`/script/history/${historyId}`);
        console.log('History Detail Response:', response.data);
        setHistoryDetail(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không tìm thấy thông tin lịch sử');
      } finally {
        setLoading(false);
      }
    };

    if (historyId) {
      fetchHistoryDetail();
    }
  }, [historyId]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'đã đăng ký':
        return <Badge bg="info" className="history-badge">Đã đăng ký</Badge>;
      case 'đang sử dụng':
        return <Badge bg="success" className="history-badge">Đang sử dụng</Badge>;
      case 'ngưng sử dụng':
        return <Badge bg="warning" text="dark" className="history-badge">Ngưng sử dụng</Badge>;
      case 'chờ bàn giao':
        return <Badge bg="warning" text="dark" className="history-badge">Chờ bàn giao</Badge>;
      case 'đã hủy':
        return <Badge bg="danger" className="history-badge">Đã hủy</Badge>;
      case 'đã trả lại':
        return <Badge bg="danger" className="history-badge">Đã trả lại</Badge>;
      case 'khác':
        return <Badge bg="secondary" className="history-badge">Khác</Badge>;
      case 'cấp phát chờ xóa':
        return <Badge bg="warning" className="history-badge">Cấp phát chờ xóa</Badge>;
      default:
        return <Badge bg="secondary" className="history-badge">Chưa cập nhật</Badge>;
    }
  };

  const getDeviceStatusBadge = (status: string) => {
    console.log('Device Status:', status);
    if (!status) return <Badge bg="secondary" className="history-badge">Chưa cập nhật</Badge>;

    switch (status.toLowerCase()) {
      case 'đã đăng ký':
        return <Badge bg="info" className="history-badge">Đã đăng ký</Badge>;
      case 'chờ bàn giao':
        return <Badge bg="info" className="history-badge">Chờ bàn giao</Badge>;
      case 'chưa bàn giao':
        return <Badge bg="info" className="history-badge">Chưa bàn giao</Badge>;
      case 'đang sử dụng':
        return <Badge bg="success" className="history-badge">Đang sử dụng</Badge>;
      case 'ngưng sử dụng':
        return <Badge bg="warning" text="dark" className="history-badge">Ngưng sử dụng</Badge>;
      case 'đang bị lỗi':
        return <Badge bg="danger" className="history-badge">Đang bị lỗi</Badge>;
      case 'đang cài đặt':
        return <Badge bg="warning" text="dark" className="history-badge">Đang cài đặt</Badge>;
      case 'đang đổi máy':
        return <Badge bg="primary" className="history-badge">Đang đổi máy</Badge>;
      case 'đang chờ xóa':
      case 'chờ xóa':
        return <Badge bg="danger" className="history-badge">Đang chờ xóa</Badge>;
      case 'đã trả lại':
        return <Badge bg="danger" className="history-badge">Đã trả lại</Badge>;
      case 'new':
        return <Badge bg="success" className="history-badge">Mới</Badge>;
      case 'đã hủy':
        return <Badge bg="danger" className="history-badge">Đã hủy</Badge>;
      case 'đã xóa':
        return <Badge bg="danger" className="history-badge">Đã xóa</Badge>;
      case 'khác':
        return <Badge bg="secondary" className="history-badge">Khác</Badge>;
      case 'cấp phát chờ xóa':
        return <Badge bg="warning" className="history-badge">Cấp phát chờ xóa</Badge>;
      default:
        return <Badge bg="secondary" className="history-badge">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <Container className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error || !historyDetail) {
    return (
      <Layout>
        <Container className="d-flex justify-content-center align-items-center vh-100 flex-column">
          <p className="text-danger">{error || 'Không tìm thấy thông tin lịch sử'}</p>
          <Button variant="primary" onClick={() => navigate('/history')}>
            &larr; Quay lại danh sách
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="history-detail-container py-4">
        {/* Header */}
        <div className="history-detail-header mb-4">
          <h4 className="page-title">Chi tiết lịch sử sử dụng</h4>
          <Button variant="outline-primary" onClick={() => navigate('/history')}>
            &larr; Quay lại danh sách
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          defaultActiveKey="device"
          id="history-detail-tabs"
          className="mb-4 custom-tabs"
          fill
          transition
        >
          {/* Tab: Thông tin thiết bị */}
          <Tab eventKey="device" title="Thông tin thiết bị">
            <Card className="history-detail-card shadow-sm mb-3 animate-fadeIn">
              <Card.Header className="card-header-gradient d-flex align-items-center">
                <i className="bi bi-laptop me-2 fs-5"></i>
                <h5 className="mb-0">Thông tin thiết bị</h5>
              </Card.Header>
              <Card.Body>
                <Row xs={1} md={2} lg={4} className="g-3">
                  <Col>
                    <div className="info-item">
                      <label>Mã thiết bị:</label>
                      <span className="fw-bold highlight">{historyDetail.asset_code}</span>
                    </div>
                    <div className="info-item">
                      <label>Tên thiết bị:</label>
                      <span className="fw-semibold">{historyDetail.asset_name}</span>
                    </div>
                    <div className="info-item">
                      <label>Thương hiệu:</label>
                      <span>{historyDetail.brand || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Model:</label>
                      <span>{historyDetail.model || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Số serial:</label>
                      <span>{historyDetail.serial_number || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Loại thiết bị:</label>
                      <span>{historyDetail.type || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Trạng thái thiết bị:</label>
                      <span>{getDeviceStatusBadge(historyDetail.status_name)}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>Trạng thái:</label>
                      <span>{getStatusBadge(historyDetail.history_status)}</span>
                    </div>
                    <div className="info-item">
                      <label>Hệ điều hành:</label>
                      <span>{historyDetail.os || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Office:</label>
                      <span>{historyDetail.office || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phần mềm sử dụng:</label>
                      <span>{historyDetail.software_used?.join(', ') || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Cấu hình:</label>
                      <span>{historyDetail.configuration || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Chu kỳ bảo trì:</label>
                      <span>
                        {historyDetail.maintenance_cycle
                          ? historyDetail.maintenance_cycle + ' tháng'
                          : 'Chưa cập nhật'
                        }
                      </span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>Địa chỉ IP:</label>
                      <span>{historyDetail.ip_address || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Địa chỉ MAC:</label>
                      <span>{historyDetail.mac_address || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Hub:</label>
                      <span>{historyDetail.hub || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Số LAN VCS:</label>
                      <span>{historyDetail.vcs_lan_no || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>IP cũ:</label>
                      <span>{historyDetail.old_ip || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Thông tin nâng cấp:</label>
                      <span>{historyDetail.upgrade_infor || 'Chưa cập nhật'}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>Ngày bắt đầu sử dụng:</label>
                      <span>{formatDate(historyDetail.start_use_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>Khu vực nhà máy:</label>
                      <span>{historyDetail.factory_area || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Vị trí:</label>
                      <span>{historyDetail.location_id || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Ngày mua:</label>
                      <span>{formatDate(historyDetail.purchase_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>Giá mua:</label>
                      <span>
                        {historyDetail.purchase_price
                          ? new Intl.NumberFormat('vi-VN').format(historyDetail.purchase_price) + ' VNĐ'
                          : 'Chưa cập nhật'
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Hạn bảo hành:</label>
                      <span>{formatDate(historyDetail.warranty_expiry)}</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          {/* Tab: Thông tin người sử dụng và ghi chú */}
          <Tab eventKey="user" title="Thông tin người sử dụng">
            <Card className="history-detail-card shadow-sm mb-3 animate-fadeIn">
              <Card.Header className="card-header-gradient d-flex align-items-center">
                <i className="bi bi-person me-2 fs-5"></i>
                <h5 className="mb-0">Thông tin người sử dụng</h5>
              </Card.Header>
              <Card.Body>
                <Row xs={1} md={2} className="g-3">
                  <Col>
                    <div className="info-item">
                      <label>Mã nhân viên:</label>
                      <span className="fw-bold highlight">{historyDetail.employee_code}</span>
                    </div>
                    <div className="info-item">
                      <label>Họ và tên:</label>
                      <span className="fw-semibold">{historyDetail.employee_name}</span>
                    </div>
                    <div className="info-item">
                      <label>Vai trò:</label>
                      <span className="fw-semibold">
                        {historyDetail.is_handover ? 'Người sử dụng chính' : 'Người dùng chung'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Phòng ban:</label>
                      <span>{historyDetail.department_name || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Người bàn giao:</label>
                      <span>{historyDetail.handover_by_name || 'Chưa cập nhật'}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>Mã người bàn giao:</label>
                      <span>{historyDetail.handover_by_code || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="info-item">
                      <label>Ngày bàn giao:</label>
                      <span>{formatDate(historyDetail.handover_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>Ngày trả:</label>
                      <span>{formatDate(historyDetail.returned_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>Tầng:</label>
                      <span>{historyDetail.floor || 'Chưa cập nhật'}</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Ghi chú */}
            <Card className="history-detail-card shadow-sm mb-3 animate-fadeIn">
              <Card.Header className="card-header-gradient d-flex align-items-center">
                <i className="bi bi-sticky me-2 fs-5"></i>
                <h5 className="mb-0">Ghi chú</h5>
              </Card.Header>
              <Card.Body>
                <div className="history-detail-note">
                  {historyDetail.note || 'Không có ghi chú'}
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Container>
    </Layout>
  );
}
