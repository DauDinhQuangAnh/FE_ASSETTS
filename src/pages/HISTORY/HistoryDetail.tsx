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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setError(err.response?.data?.message || t('historyDetail.notFound'));
      } finally {
        setLoading(false);
      }
    };

    if (historyId) {
      fetchHistoryDetail();
    }
  }, [historyId, t]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'đã đăng ký':
        return <Badge bg="info" className="history-badge">{t('historyDetail.status.registered')}</Badge>;
      case 'đang sử dụng':
        return <Badge bg="success" className="history-badge">{t('historyDetail.status.inUse')}</Badge>;
      case 'ngưng sử dụng':
        return <Badge bg="warning" text="dark" className="history-badge">{t('historyDetail.status.stopped')}</Badge>;
      case 'chờ bàn giao':
        return <Badge bg="warning" text="dark" className="history-badge">{t('historyDetail.status.pendingHandover')}</Badge>;
      case 'đã hủy':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.canceled')}</Badge>;
      case 'đã trả lại':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.returned')}</Badge>;
      case 'khác':
        return <Badge bg="secondary" className="history-badge">{t('historyDetail.status.other')}</Badge>;
      case 'cấp phát chờ xóa':
        return <Badge bg="warning" className="history-badge">{t('historyDetail.status.pendingAllocationDelete')}</Badge>;
      default:
        return <Badge bg="secondary" className="history-badge">{t('historyDetail.status.notUpdated')}</Badge>;
    }
  };

  const getDeviceStatusBadge = (status: string) => {
    console.log('Device Status:', status);
    if (!status) return <Badge bg="secondary" className="history-badge">{t('historyDetail.status.notUpdated')}</Badge>;

    switch (status.toLowerCase()) {
      case 'đã đăng ký':
        return <Badge bg="info" className="history-badge">{t('historyDetail.status.registered')}</Badge>;
      case 'chờ bàn giao':
        return <Badge bg="info" className="history-badge">{t('historyDetail.status.pendingHandover')}</Badge>;
      case 'chưa bàn giao':
        return <Badge bg="info" className="history-badge">{t('historyDetail.status.notHandover')}</Badge>;
      case 'đang sử dụng':
        return <Badge bg="success" className="history-badge">{t('historyDetail.status.inUse')}</Badge>;
      case 'ngưng sử dụng':
        return <Badge bg="warning" text="dark" className="history-badge">{t('historyDetail.status.stopped')}</Badge>;
      case 'đang bị lỗi':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.error')}</Badge>;
      case 'đang cài đặt':
        return <Badge bg="warning" text="dark" className="history-badge">{t('historyDetail.status.installing')}</Badge>;
      case 'đang đổi máy':
        return <Badge bg="primary" className="history-badge">{t('historyDetail.status.changingDevice')}</Badge>;
      case 'đang chờ xóa':
      case 'chờ xóa':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.pendingDelete')}</Badge>;
      case 'đã trả lại':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.returned')}</Badge>;
      case 'new':
        return <Badge bg="success" className="history-badge">{t('historyDetail.status.new')}</Badge>;
      case 'đã hủy':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.canceled')}</Badge>;
      case 'đã xóa':
        return <Badge bg="danger" className="history-badge">{t('historyDetail.status.deleted')}</Badge>;
      case 'khác':
        return <Badge bg="secondary" className="history-badge">{t('historyDetail.status.other')}</Badge>;
      case 'cấp phát chờ xóa':
        return <Badge bg="warning" className="history-badge">{t('historyDetail.status.pendingAllocationDelete')}</Badge>;
      default:
        return <Badge bg="secondary" className="history-badge">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('historyDetail.status.notUpdated');
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
            <p className="mt-3 text-muted">{t('historyDetail.loading')}</p>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error || !historyDetail) {
    return (
      <Layout>
        <Container className="d-flex justify-content-center align-items-center vh-100 flex-column">
          <p className="text-danger">{error || t('historyDetail.notFound')}</p>
          <Button variant="primary" onClick={() => navigate('/history')}>
            &larr; {t('historyDetail.backToList')}
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
          <h4 className="page-title">{t('historyDetail.title')}</h4>
          <Button variant="outline-primary" onClick={() => navigate('/history')}>
            &larr; {t('historyDetail.backToList')}
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
          <Tab eventKey="device" title={t('historyDetail.tabs.device')}>
            <Card className="history-detail-card shadow-sm mb-3 animate-fadeIn">
              <Card.Header className="card-header-gradient d-flex align-items-center">
                <i className="bi bi-laptop me-2 fs-5"></i>
                <h5 className="mb-0">{t('historyDetail.deviceInfo.title')}</h5>
              </Card.Header>
              <Card.Body>
                <Row xs={1} md={2} lg={4} className="g-3">
                  <Col>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.assetCode')}:</label>
                      <span className="fw-bold highlight">{historyDetail.asset_code}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.assetName')}:</label>
                      <span className="fw-semibold">{historyDetail.asset_name}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.brand')}:</label>
                      <span>{historyDetail.brand || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.model')}:</label>
                      <span>{historyDetail.model || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.serialNumber')}:</label>
                      <span>{historyDetail.serial_number || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.deviceType')}:</label>
                      <span>{historyDetail.type || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.deviceStatus')}:</label>
                      <span>{getDeviceStatusBadge(historyDetail.status_name)}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.status')}:</label>
                      <span>{getStatusBadge(historyDetail.history_status)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.os')}:</label>
                      <span>{historyDetail.os || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.office')}:</label>
                      <span>{historyDetail.office || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.softwareUsed')}:</label>
                      <span>{historyDetail.software_used?.join(', ') || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.configuration')}:</label>
                      <span>{historyDetail.configuration || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.maintenanceCycle')}:</label>
                      <span>
                        {historyDetail.maintenance_cycle
                          ? historyDetail.maintenance_cycle + ' tháng'
                          : t('historyDetail.status.notUpdated')
                        }
                      </span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.ipAddress')}:</label>
                      <span>{historyDetail.ip_address || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.macAddress')}:</label>
                      <span>{historyDetail.mac_address || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.hub')}:</label>
                      <span>{historyDetail.hub || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.vcsLanNo')}:</label>
                      <span>{historyDetail.vcs_lan_no || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.oldIp')}:</label>
                      <span>{historyDetail.old_ip || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.upgradeInfo')}:</label>
                      <span>{historyDetail.upgrade_infor || t('historyDetail.status.notUpdated')}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.startUseDate')}:</label>
                      <span>{formatDate(historyDetail.start_use_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.factoryArea')}:</label>
                      <span>{historyDetail.factory_area || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.location')}:</label>
                      <span>{historyDetail.location_id || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.purchaseDate')}:</label>
                      <span>{formatDate(historyDetail.purchase_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.purchasePrice')}:</label>
                      <span>
                        {historyDetail.purchase_price
                          ? new Intl.NumberFormat('vi-VN').format(historyDetail.purchase_price) + ' VNĐ'
                          : t('historyDetail.status.notUpdated')
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.deviceInfo.warrantyExpiry')}:</label>
                      <span>{formatDate(historyDetail.warranty_expiry)}</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          {/* Tab: Thông tin người sử dụng */}
          <Tab eventKey="user" title={t('historyDetail.tabs.user')}>
            <Card className="history-detail-card shadow-sm mb-3 animate-fadeIn">
              <Card.Header className="card-header-gradient d-flex align-items-center">
                <i className="bi bi-person me-2 fs-5"></i>
                <h5 className="mb-0">{t('historyDetail.userInfo.title')}</h5>
              </Card.Header>
              <Card.Body>
                <Row xs={1} md={2} className="g-3">
                  <Col>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.employeeCode')}:</label>
                      <span className="fw-bold highlight">{historyDetail.employee_code}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.employeeName')}:</label>
                      <span className="fw-semibold">{historyDetail.employee_name}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.role')}:</label>
                      <span className="fw-semibold">
                        {historyDetail.is_handover ? t('historyDetail.userInfo.mainUser') : t('historyDetail.userInfo.sharedUser')}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.department')}:</label>
                      <span>{historyDetail.department_name || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.handoverBy')}:</label>
                      <span>{historyDetail.handover_by_name || t('historyDetail.status.notUpdated')}</span>
                    </div>
                  </Col>
                  <Col>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.handoverByCode')}:</label>
                      <span>{historyDetail.handover_by_code || t('historyDetail.status.notUpdated')}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.handoverDate')}:</label>
                      <span>{formatDate(historyDetail.handover_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.returnDate')}:</label>
                      <span>{formatDate(historyDetail.returned_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t('historyDetail.userInfo.floor')}:</label>
                      <span>{historyDetail.floor || t('historyDetail.status.notUpdated')}</span>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Tab>

          {/* Tab: Ghi chú */}
          <Tab eventKey="note" title={t('historyDetail.tabs.note')}>
            <Card className="history-detail-card shadow-sm mb-3 animate-fadeIn">
              <Card.Header className="card-header-gradient d-flex align-items-center">
                <i className="bi bi-sticky me-2 fs-5"></i>
                <h5 className="mb-0">{t('historyDetail.note.title')}</h5>
              </Card.Header>
              <Card.Body>
                <div className="history-detail-note">
                  {historyDetail.note || t('historyDetail.note.noNote')}
                </div>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Container>
    </Layout>
  );
}
