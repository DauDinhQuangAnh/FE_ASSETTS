import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { Form, Button, Alert, Spinner, Table, Badge, Pagination } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(err.response?.data?.message || t('historyone.messages.loadError'));
      toast.error(t('historyone.messages.loadError'));
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
    if (!dateString) return t('historyone.status.notUpdated');
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
        return <Badge bg="info" className="history-badge">{t('historyone.status.registered')}</Badge>;
      case 'đang sử dụng':
        return <Badge bg="success" className="history-badge">{t('historyone.status.inUse')}</Badge>;
      case 'ngưng sử dụng':
        return <Badge bg="warning" text="dark" className="history-badge">{t('historyone.status.stopped')}</Badge>;
      case 'đang chờ xóa':
        return <Badge bg="danger" className="history-badge">{t('historyone.status.pendingDelete')}</Badge>;
      case 'đã trả lại':
        return <Badge bg="danger" className="history-badge">{t('historyone.status.returned')}</Badge>;
      case 'chờ bàn giao':
        return <Badge bg="info" className="history-badge">{t('historyone.status.pendingHandover')}</Badge>;
      case 'đã hủy':
        return <Badge bg="danger" className="history-badge">{t('historyone.status.canceled')}</Badge>;
      case 'đã xóa':
        return <Badge bg="danger" className="history-badge">{t('historyone.status.deleted')}</Badge>;
      case 'cấp phát chờ xóa':
        return <Badge bg="warning" className="history-badge">{t('historyone.status.pendingAllocationDelete')}</Badge>;
      case 'khác':
        return <Badge bg="secondary" className="history-badge">{t('historyone.status.other')}</Badge>;
      default:
        return <Badge bg="secondary" className="history-badge">{t('historyone.status.notUpdated')}</Badge>;
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
          {t('historyone.pagination.first')}
        </Pagination.Item>
      );
    }

    if (currentPage > 1) {
      pages.push(
        <Pagination.Item key="prev" onClick={() => handlePageChange(currentPage - 1)}>
          {t('historyone.pagination.previous')}
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
          {t('historyone.pagination.next')}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      pages.push(
        <Pagination.Item key="last" onClick={() => handlePageChange(totalPages)}>
          {t('historyone.pagination.last')}
        </Pagination.Item>
      );
    }

    return pages;
  };

  return (
    <Layout>
      <div className="history-container">
        <h4>{t('historyone.title')}</h4>

        <div className="history-filters">
          <div className="history-filter-group">
            <Form.Select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="history-filter-select"
            >
              <option value="all">{t('historyone.filters.allStatus')}</option>
              <option value="Đã đăng ký">{t('historyone.filters.registered')}</option>
              <option value="Đang sử dụng">{t('historyone.filters.inUse')}</option>
              <option value="Chờ bàn giao">{t('historyone.filters.pendingHandover')}</option>
              <option value="Đang chờ xóa">{t('historyone.filters.pendingDelete')}</option>
              <option value="Cấp phát chờ xóa">{t('historyone.filters.pendingAllocationDelete')}</option>
              <option value="Hủy bỏ">{t('historyone.filters.canceled')}</option>
              <option value="Khác">{t('historyone.filters.other')}</option>
            </Form.Select>
          </div>
          <div className="history-search-container">
            <Form.Group>
              <Form.Control
                type="text"
                placeholder={t('historyone.search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="history-search-input"
              />
            </Form.Group>
          </div>
          <div className="history-refresh-btn">
            <Button variant="light" onClick={fetchHistoryRecords} className="history-btn">
              <i className="fas fa-sync-alt me-2"></i>
              {t('historyone.refresh')}
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger" className="history-alert">{error}</Alert>}

        {loading ? (
          <div className="history-loading">
            <Spinner animation="border" />
            <p className="mt-3 text-muted">{t('historyone.loading')}</p>
          </div>
        ) : (
          <div className="history-table-container">
            {historyRecords.length > 0 ? (
              <>
                <Table responsive hover className="history-table">
                  <thead>
                    <tr>
                      <th>{t('historyone.table.assetCode')}</th>
                      <th>{t('historyone.table.assetName')}</th>
                      <th>{t('historyone.table.employeeCode')}</th>
                      <th>{t('historyone.table.employeeName')}</th>
                      <th>{t('historyone.table.handoverBy')}</th>
                      <th>{t('historyone.table.status')}</th>
                      <th>{t('historyone.table.handoverDate')}</th>
                      <th>{t('historyone.table.returnDate')}</th>
                      <th>{t('historyone.table.floor')}</th>
                      <th>{t('historyone.table.note')}</th>
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
                        <td>{record.floor || t('historyone.status.notUpdated')}</td>
                        <td>{record.note || t('historyone.status.notUpdated')}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    {t('historyone.pagination.showing', {
                      start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      end: Math.min(currentPage * ITEMS_PER_PAGE, totalRecords),
                      total: totalRecords
                    })}
                  </div>
                  <Pagination className="mb-0">
                    {renderPagination()}
                  </Pagination>
                </div>
              </>
            ) : (
              <Alert variant="info" className="history-alert">
                <i className="fas fa-info-circle me-2"></i>
                {t('historyone.noData')}
              </Alert>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
