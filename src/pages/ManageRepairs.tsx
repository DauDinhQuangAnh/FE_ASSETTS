import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Toast, Row, Col, InputGroup } from 'react-bootstrap';
import axios from '../api/axiosInstance';
import Layout from '../components/Layout';
import './ManageRepairs.css';

interface Asset {
  asset_id: number;
  asset_code: string;
  asset_name: string;
}

interface Repair {
  repair_id: number;
  asset_id: number;
  asset_code: string;
  asset_name: string;
  repair_date: string;
  repaired_by: string;
  repair_description: string;
  cost: number;
  next_maintenance_date?: string;
  notes?: string;
  repair_status: string;
}

export default function ManageRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: '',
    asset_code: '',
    asset_name: '',
    repair_date: new Date().toISOString().split('T')[0],
    repaired_by: '',
    repair_description: '',
    cost: '',
    next_maintenance_date: '',
    notes: '',
    repair_status: 'Đã yêu cầu sửa'
  });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/asset/repair-history');
      setRepairs(response.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sửa chữa:', err);
      setError('Không thể tải danh sách sửa chữa');
    } finally {
      setLoading(false);
    }
  };

  const searchAssets = async (term: string) => {
    try {
      const response = await axios.get(`/asset/search?term=${term}`);
      setAssets(response.data);
    } catch (err) {
      console.error('Lỗi khi tìm kiếm thiết bị:', err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 2) {
      searchAssets(value);
      setShowAssetDropdown(true);
    } else {
      setShowAssetDropdown(false);
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    setFormData({
      ...formData,
      asset_id: asset.asset_id.toString(),
      asset_code: asset.asset_code,
      asset_name: asset.asset_name
    });
    setShowAssetDropdown(false);
    setSearchTerm('');
  };

  const handleOpenModal = (repair?: Repair) => {
    if (repair) {
      setSelectedRepair(repair);
      setFormData({
        asset_id: repair.asset_id.toString(),
        asset_code: repair.asset_code,
        asset_name: repair.asset_name,
        repair_date: new Date(repair.repair_date).toISOString().split('T')[0],
        repaired_by: repair.repaired_by,
        repair_description: repair.repair_description,
        cost: repair.cost.toString(),
        next_maintenance_date: repair.next_maintenance_date ? new Date(repair.next_maintenance_date).toISOString().split('T')[0] : '',
        notes: repair.notes || '',
        repair_status: repair.repair_status
      });
    } else {
      setSelectedRepair(null);
      setFormData({
        asset_id: '',
        asset_code: '',
        asset_name: '',
        repair_date: new Date().toISOString().split('T')[0],
        repaired_by: '',
        repair_description: '',
        cost: '',
        next_maintenance_date: '',
        notes: '',
        repair_status: 'Đã yêu cầu sửa'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cost: Number(formData.cost),
        next_maintenance_date: formData.next_maintenance_date || null
      };

      if (selectedRepair) {
        await axios.put(`/asset/repair-history/${selectedRepair.repair_id}`, payload);
        setToastVariant('success');
        setToastMessage('Đã cập nhật lịch sử sửa chữa thành công');
      } else {
        await axios.post(`/asset/${formData.asset_code}/repair-history`, payload);
        setToastVariant('success');
        setToastMessage('Đã thêm lịch sử sửa chữa thành công');
      }

      setShowToast(true);
      setShowModal(false);
      fetchRepairs();

    } catch (err) {
      console.error('Lỗi khi xử lý lịch sử sửa chữa:', err);
      setToastVariant('danger');
      setToastMessage('Không thể xử lý lịch sử sửa chữa');
      setShowToast(true);
    }
  };

  const handleDelete = async (repairId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử sửa chữa này?')) {
      try {
        await axios.delete(`/asset/repair-history/${repairId}`);
        setToastVariant('success');
        setToastMessage('Đã xóa lịch sử sửa chữa thành công');
        setShowToast(true);
        fetchRepairs();
      } catch (err) {
        console.error('Lỗi khi xóa lịch sử sửa chữa:', err);
        setToastVariant('danger');
        setToastMessage('Không thể xóa lịch sử sửa chữa');
        setShowToast(true);
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'đã yêu cầu sửa':
        return 'warning';
      case 'đang sửa chữa':
        return 'info';
      case 'đã sửa xong và chưa bàn giao':
        return 'success';
      case 'đã bàn giao':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Lọc danh sách sửa chữa theo filter
  const filteredRepairs = repairs.filter(repair => {
    const keyword = filter.toLowerCase();
    return (
      repair.asset_code.toLowerCase().includes(keyword) ||
      repair.asset_name.toLowerCase().includes(keyword) ||
      repair.repaired_by.toLowerCase().includes(keyword) ||
      repair.repair_description.toLowerCase().includes(keyword)
    );
  });

  if (loading) {
    return (
      <Layout>
        <div className="container mt-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p>Đang tải danh sách sửa chữa...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mt-5 ">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý sửa chữa</h2>
          <div className="mb-1" style={{ width: '700px' }}>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo mã, tên thiết bị, người sửa, mô tả..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                border: '2px solid #ccc',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold'
              }}
            />
          </div>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <i className="fas fa-plus me-2"></i>
            Thêm yêu cầu sửa chữa
          </Button>
        </div>
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th>Mã thiết bị</th>
                <th>Tên thiết bị</th>
                <th>Ngày sửa</th>
                <th>Người sửa</th>
                <th>Mô tả</th>
                <th>Chi phí</th>
                <th>Ngày bảo dưỡng tiếp</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length > 0 ? (
                filteredRepairs.map(repair => (
                  <tr key={repair.repair_id}>
                    <td>{repair.asset_code}</td>
                    <td>{repair.asset_name}</td>
                    <td>{new Date(repair.repair_date).toLocaleDateString('vi-VN')}</td>
                    <td>{repair.repaired_by}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {repair.repair_description}
                    </td>
                    <td>{Number(repair.cost).toLocaleString('vi-VN')} VNĐ</td>
                    <td>{repair.next_maintenance_date ? new Date(repair.next_maintenance_date).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeClass(repair.repair_status)}`}>
                        {repair.repair_status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleOpenModal(repair)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(repair.repair_id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center">Không có lịch sử sửa chữa</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              {selectedRepair ? 'Cập nhật lịch sử sửa chữa' : 'Thêm lịch sử sửa chữa'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tìm kiếm thiết bị</Form.Label>
                    <div className="position-relative">
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Nhập mã hoặc tên thiết bị..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        <Button variant="outline-secondary">
                          <i className="fas fa-search"></i>
                        </Button>
                      </InputGroup>
                      {showAssetDropdown && (
                        <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm" style={{ zIndex: 1000 }}>
                          {assets.length > 0 ? (
                            assets.map(asset => (
                              <div
                                key={asset.asset_id}
                                className="p-2 hover-bg-light cursor-pointer"
                                onClick={() => handleSelectAsset(asset)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="d-flex justify-content-between">
                                  <span>{asset.asset_code}</span>
                                  <span className="text-muted">{asset.asset_name}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-muted">Không tìm thấy thiết bị</div>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.asset_code && (
                      <div className="mt-2">
                        <strong>Thiết bị đã chọn:</strong> {formData.asset_code} - {formData.asset_name}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày sửa chữa</Form.Label>
                    <Form.Control
                      type="date"
                      name="repair_date"
                      value={formData.repair_date}
                      onChange={(e) => setFormData({ ...formData, repair_date: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Người/Đơn vị sửa chữa</Form.Label>
                    <Form.Control
                      type="text"
                      name="repaired_by"
                      value={formData.repaired_by}
                      onChange={(e) => setFormData({ ...formData, repaired_by: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Chi phí (VNĐ)</Form.Label>
                    <Form.Control
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      name="repair_status"
                      value={formData.repair_status}
                      onChange={(e) => setFormData({ ...formData, repair_status: e.target.value })}
                      required
                    >
                      <option value="Đã yêu cầu sửa">Đã yêu cầu sửa</option>
                      <option value="Đang sửa chữa">Đang sửa chữa</option>
                      <option value="Đã sửa xong và chưa bàn giao">Đã sửa xong và chưa bàn giao</option>
                      <option value="Đã bàn giao">Đã bàn giao</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày bảo dưỡng tiếp theo</Form.Label>
                    <Form.Control
                      type="date"
                      name="next_maintenance_date"
                      value={formData.next_maintenance_date}
                      onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Mô tả nội dung sửa chữa</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="repair_description"
                      value={formData.repair_description}
                      onChange={(e) => setFormData({ ...formData, repair_description: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={!formData.asset_id}>
                  {selectedRepair ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999
          }}
        >
          <Toast
            show={showToast}
            onClose={() => setShowToast(false)}
            delay={3000}
            autohide
            bg={toastVariant}
          >
            <Toast.Header closeButton={false}>
              <strong className="me-auto">
                {toastVariant === 'success' ? 'Thành công' : 'Lỗi'}
              </strong>
            </Toast.Header>
            <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>
              {toastMessage}
            </Toast.Body>
          </Toast>
        </div>
      </div>
    </Layout>
  );
} 