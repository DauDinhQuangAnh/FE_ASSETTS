import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Form, Button, Alert, Spinner, Table, Badge, Pagination } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './historyone.css';

interface AssetHistory {
  history_id: number;
  asset_id: number;
  asset_code: string;
  asset_name: string;
  brand: string;
  model: string;
  serial_number: string;
  employee_code: string;
  employee_name: string;
  handover_by_code: string;
  handover_by_name: string;
  department_name: string;
  status_name: string;
  handover_date: string;
  returned_date: string;
  floor: string;
  position: string;
  mac_address: string;
  history_status: string;
  is_handover: boolean;
  note: string;
}

export default function historyone() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [historyRecords, setHistoryRecords] = useState<AssetHistory[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 20;

  const filteredRecords = useMemo(() => {
    return historyRecords.filter(record => {
      const matchesSearch =
        record.asset_code.toLowerCase().includes(search.toLowerCase()) ||
        record.asset_name.toLowerCase().includes(search.toLowerCase()) ||
        record.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        record.employee_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || record.history_status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [historyRecords, selectedStatus, search]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const fetchHistoryRecords = async () => {
    setLoading(true);
    setError('');

    try {
      let url = '/script/history';
      const params = new URLSearchParams();

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setHistoryRecords(response.data);
      setTotalRecords(response.data.length);
      setTotalPages(Math.ceil(response.data.length / ITEMS_PER_PAGE));
    } catch (err: any) {
      console.error('Error fetching history records:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu lịch sử');
      toast.error('Không thể tải dữ liệu lịch sử');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryRecords();
  }, [selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'đã đăng ký':
        return <Badge bg="info" className="history-badge">Đã đăng ký</Badge>;
      case 'đang sử dụng':
        return <Badge bg="success" className="history-badge">Đang sử dụng</Badge>;
      case 'ngưng sử dụng':
        return <Badge bg="warning" text="dark" className="history-badge">Ngưng sử dụng</Badge>;
      case 'đang chờ xóa':
        return <Badge bg="danger" className="history-badge">Đang chờ xóa</Badge>;
      case 'đã trả lại':
        return <Badge bg="danger" className="history-badge">Đã trả lại</Badge>;
      case 'chờ bàn giao':
        return <Badge bg="info" className="history-badge">Chờ bàn giao</Badge>;
      case 'đã hủy':
        return <Badge bg="danger" className="history-badge">Đã hủy</Badge>;
      case 'đã xóa':
        return <Badge bg="danger" className="history-badge">Đã xóa</Badge>;
      case 'cấp phát chờ xóa':
        return <Badge bg="warning" className="history-badge">Cấp phát chờ xóa</Badge>;
      case 'khác':
        return <Badge bg="secondary" className="history-badge">Khác</Badge>;
      default:
        return <Badge bg="secondary" className="history-badge">Chưa cập nhật</Badge>;
    }
  };

  const handleRowClick = (historyId: number) => {
    navigate(`/history/${historyId}`);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <Pagination.Item key="first" onClick={() => handlePageChange(1)}>
          Đầu
        </Pagination.Item>
      );
    }

    if (currentPage > 1) {
      pages.push(
        <Pagination.Item key="prev" onClick={() => handlePageChange(currentPage - 1)}>
          Trước
        </Pagination.Item>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (currentPage < totalPages) {
      pages.push(
        <Pagination.Item key="next" onClick={() => handlePageChange(currentPage + 1)}>
          Sau
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      pages.push(
        <Pagination.Item key="last" onClick={() => handlePageChange(totalPages)}>
          Cuối
        </Pagination.Item>
      );
    }

    return pages;
  };

  return (
    <Layout>
      <div className="history-container">
        <h4>Lịch sử sử dụng thiết bị</h4>

        <div className="history-filters">
          <div className="history-filter-group">
            <Form.Select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="history-filter-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đã đăng ký">Đã đăng ký</option>
              <option value="Đang sử dụng">Đang sử dụng</option>
              <option value="Chờ bàn giao">Chờ bàn giao</option>
              <option value="Đang chờ xóa">Đang chờ xóa</option>
              <option value="Cấp phát chờ xóa">Cấp phát chờ xóa</option>
              <option value="Hủy bỏ">Hủy bỏ</option>
              <option value="Khác">Khác</option>
            </Form.Select>
          </div>
          <div className="history-search-container">
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm theo mã, tên thiết bị hoặc nhân viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="history-search-input"
              />
            </Form.Group>
          </div>
          <div className="history-refresh-btn">
            <Button variant="light" onClick={fetchHistoryRecords} className="history-btn">
              <i className="fas fa-sync-alt me-2"></i>
              Làm mới
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger" className="history-alert">{error}</Alert>}

        {loading ? (
          <div className="history-loading">
            <Spinner animation="border" />
            <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="history-table-container">
            {historyRecords.length > 0 ? (
              <>
                <Table responsive hover className="history-table">
                  <thead>
                    <tr>
                      <th>Mã thiết bị</th>
                      <th>Tên thiết bị</th>
                      <th>Mã nhân viên</th>
                      <th>Tên nhân viên</th>
                      <th>Người bàn giao</th>
                      <th>Trạng thái</th>
                      <th>Ngày bàn giao</th>
                      <th>Ngày trả</th>
                      <th>Tầng</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record) => (
                      <tr
                        key={record.history_id}
                        className="history-table-row"
                        onClick={() => handleRowClick(record.history_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="fw-medium">{record.asset_code}</td>
                        <td>{record.asset_name}</td>
                        <td>{record.employee_code}</td>
                        <td>{record.employee_name}</td>
                        <td>{record.handover_by_name}</td>
                        <td>{getStatusBadge(record.history_status)}</td>
                        <td>{formatDate(record.handover_date)}</td>
                        <td>{formatDate(record.returned_date)}</td>
                        <td>{record.floor || 'Chưa cập nhật'}</td>
                        <td>{record.note || 'Chưa cập nhật'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Hiển thị {filteredRecords.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                    -{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} trong tổng số {totalRecords} bản ghi
                  </div>
                  <Pagination className="mb-0">
                    {renderPagination()}
                  </Pagination>
                </div>
              </>
            ) : (
              <Alert variant="info" className="history-alert">
                <i className="fas fa-info-circle me-2"></i>
                Không có dữ liệu
              </Alert>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
