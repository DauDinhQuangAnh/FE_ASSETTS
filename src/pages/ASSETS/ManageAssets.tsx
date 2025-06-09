import { useState, useEffect, useMemo } from 'react';
import { Button, Form, Table, Modal, Spinner, Alert, Row, Col, Pagination } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../api/axiosInstance';
import Layout from '../../components/Layout';
import styles from './ManageAssets.module.css';
import type {
  Asset,
  Category,
  Status,
  Department,
  SoftwareUsed,
  Vendor,
  Location
} from '../../types/typeAsset';

export default function ManageAssets() {
  const navigate = useNavigate();
  const location = useLocation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [softwareUsed, setSoftwareUsed] = useState<SoftwareUsed[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    asset_code: '',
    asset_name: '',
    category_id: undefined,
    brand: '',
    OS: '',
    OFFICE: '',
    software_used: undefined,
    configuration: '',
    model: '',
    serial_number: '',
    type: '',
    ip_address: '',
    mac_address: '',
    hub: '',
    vcs_lan_no: '',
    start_use_date: '',
    factory_area: '',
    belongs_to_dept_id: undefined,
    vendor_id: undefined,
    location_id: undefined,
    purchase_date: '',
    purchase_price: undefined,
    warranty_expiry: '',
    maintenance_cycle: undefined,
    status_id: undefined,
    upgrade_infor: '',
    notes: '',
    old_ip_address: ''
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all'
  });
  const [, setAddLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (location.state?.initialFilter) {
      setFilters(location.state.initialFilter);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, categoriesRes, statusesRes, softwareRes] = await Promise.all([
          axios.get('/asset'),
          axios.get('/asset/categories'),
          axios.get('/asset/statuses'),
          axios.get('/asset/software')
        ]);
        setAssets(assetsRes.data);
        setCategories(categoriesRes.data);
        setStatuses(statusesRes.data);
        setSoftwareUsed(softwareRes.data);

        const uniqueDepartments: Department[] = Array.from(
          new Set(assetsRes.data.map((asset: Asset) => ({
            department_id: asset.belongs_to_dept_id,
            department_name: asset.department_name
          })))
        );
        setDepartments(uniqueDepartments);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi tải danh sách thiết bị');
        toast.error('Lỗi khi tải danh sách thiết bị');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [deptRes, vendorRes, locationRes] = await Promise.all([
          axios.get('/asset/departments'),
          axios.get('/asset/vendors'),
          axios.get('/asset/locations')
        ]);
        setDepartments(deptRes.data);
        setVendors(vendorRes.data);
        setLocations(locationRes.data);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const statusNameToKey = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'đang sử dụng':
      case 'in use':
        return 'inUse';
      case 'new':
        return 'new';
      case 'đang bị lỗi':
      case 'error':
        return 'error';
      case 'chưa bàn giao':
      case 'pending':
        return 'pending';
      case 'đang cài đặt':
      case 'installing':
        return 'installing';
      case 'đang đổi máy':
      case 'replacing':
        return 'replacing';
      case 'chờ xóa':
      case 'disposed':
        return 'disposed';
      case 'khác':
      case 'other':
        return 'other';
      default:
        return statusName;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      (asset.asset_code?.toLowerCase() || '').includes(searchLower) ||
      (asset.asset_name?.toLowerCase() || '').includes(searchLower);
    const statusKey = statusNameToKey(asset.status_name);
    const matchesStatus = filters.status === 'all' || statusKey === filters.status;
    const matchesCategory = filters.category === 'all' || asset.category_name === filters.category;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  useEffect(() => {
    setTotalRecords(filteredAssets.length);
    setTotalPages(Math.ceil(filteredAssets.length / ITEMS_PER_PAGE));
  }, [filteredAssets.length, ITEMS_PER_PAGE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (pageNumber: number) => {
    console.log('Changing page to:', pageNumber);
    setCurrentPage(pageNumber);
    const tableElement = document.querySelector('.assets-table-container');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    const pages: (number | '...')[] = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} của {totalRecords} bản ghi
        </div>
        <Pagination className="mb-0">
          <Pagination.First
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
          />
          <Pagination.Prev
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          />

          {pages.map((p, idx) =>
            p === '...' ? (
              <Pagination.Ellipsis key={`e${idx}`} disabled />
            ) : (
              <Pagination.Item
                key={p}
                active={p === currentPage}
                onClick={() => handlePageChange(p as number)}
              >
                {p}
              </Pagination.Item>
            )
          )}

          <Pagination.Next
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          />
          <Pagination.Last
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          />
        </Pagination>
      </div>
    );
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      await axios.delete(`/asset/${assetToDelete.asset_id}`);
      setAssets(prev => prev.filter(asset => asset.asset_id !== assetToDelete.asset_id));
      toast.success('Thiết bị đã được xóa thành công');
      setShowDeleteModal(false);
      setAssetToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa thiết bị');
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      console.log('Bắt đầu tạo thiết bị mới với dữ liệu:', newAsset);

      // Validate required fields
      if (!newAsset.asset_code || !newAsset.asset_name || !newAsset.category_id || !newAsset.status_id) {
        console.error('Thiếu thông tin bắt buộc:', {
          asset_code: !newAsset.asset_code,
          asset_name: !newAsset.asset_name,
          category_id: !newAsset.category_id,
          status_id: !newAsset.status_id
        });
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        setAddLoading(false);
        return;
      }

      console.log('Gửi request tạo thiết bị đến API...');
      const response = await axios.post('/assets', newAsset);
      console.log('Response từ API:', response.data);

      toast.success('Thiết bị đã được thêm thành công');
      setShowAddModal(false);

      // Reset form
      console.log('Reset form về trạng thái ban đầu');
      setNewAsset({
        asset_code: '',
        asset_name: '',
        category_id: 0,
        status_id: 0,
        brand: '',
        model: '',
        serial_number: '',
        type: '',
        OS: '',
        OFFICE: '',
        software_used: 0,
        configuration: '',
        ip_address: '',
        mac_address: '',
        hub: '',
        vcs_lan_no: '',
        start_use_date: '',
        factory_area: '',
        belongs_to_dept_id: 0,
        vendor_id: 0,
        location_id: 0,
        purchase_date: '',
        purchase_price: 0,
        warranty_expiry: '',
        maintenance_cycle: 0,
        upgrade_infor: '',
        notes: '',
        old_ip_address: ''
      });

      console.log('Cập nhật lại danh sách thiết bị');
      await fetchAssets();

    } catch (err: any) {
      console.error('Lỗi khi tạo thiết bị:', err);
      console.error('Chi tiết lỗi:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast.error(err.response?.data?.message || 'Lỗi khi thêm thiết bị');
    } finally {
      setAddLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'đang sử dụng':
        return styles['status-badge'] + ' ' + styles['in-use'];
      case 'new':
        return styles['status-badge'] + ' ' + styles['new'];
      case 'đang bị lỗi':
        return styles['status-badge'] + ' ' + styles['error'];
      case 'chưa bàn giao':
        return styles['status-badge'] + ' ' + styles['pending'];
      case 'đang cài đặt':
        return styles['status-badge'] + ' ' + styles['installing'];
      case 'đang đổi máy':
        return styles['status-badge'] + ' ' + styles['replacing'];
      case 'chờ xóa':
        return styles['status-badge'] + ' ' + styles['disposed'];
      case 'khác':
        return styles['status-badge'] + ' ' + styles['other'];
      default:
        return styles['status-badge'];
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/assets');
      setAssets(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải danh sách thiết bị');
    }
  };

  const uniqueStatusKeys = Array.from(new Set(statuses.map(s => statusNameToKey(s.status_name))));

  if (loading) {
    return (
      <Layout>
        <div className={styles['loading-container']}>
          <Spinner animation="border" className={styles['loading-spinner']} />
          <p className="mt-3 text-muted">Đang tải danh sách thiết bị...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles['manage-assets-container']}>
        <div className={styles['header-section']}>
          <div className={styles['header-content']}>
            <h1 className={styles['header-title']}>Quản lý thiết bị</h1>
            <div className={styles['search-container']}>
              <Form.Control
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Tìm kiếm theo mã thiết bị..."
                className={styles['search-input']}
              />
            </div>
            <div className={styles['header-actions']}>
              <Button variant="light" onClick={() => setShowAddModal(true)}>
                <i className="fas fa-plus me-2"></i>
                Thêm thiết bị mới
              </Button>
            </div>
          </div>
        </div>

        <div className={styles['assets-table-container']}>
          <div className={styles['filter-section']}>
            <Row className="g-3">
              <Col md={5}>
                <Form.Group className={styles['filter-group']}>
                  <Form.Label className={styles['filter-label']}>Trạng thái</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="all">Tất cả</option>
                    {uniqueStatusKeys.map(key => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className={styles['filter-group']}>
                  <Form.Label className={styles['filter-label']}>Loại thiết bị</Form.Label>
                  <Form.Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="all">Tất cả</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_name}>
                        {category.category_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <div className={styles['asset-count-container']}>
                  <div className="d-flex align-items-center justify-content-end h-100">
                    <small className={styles['asset-count']}>
                      {filteredAssets.length} thiết bị
                    </small>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {error ? (
            <Alert variant="danger">{error}</Alert>
          ) : filteredAssets.length === 0 ? (
            <div className={styles['empty-state']}>
              <p>Không tìm thấy thiết bị nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Mã thiết bị</th>
                      <th>Tên thiết bị</th>
                      <th>Loại</th>
                      <th style={{ minWidth: '141px' }}>Trạng thái</th>
                      <th>Phòng ban</th>
                      <th>Loại thiết bị</th>
                      <th>Vị trí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.map(asset => (
                      <tr
                        key={asset.asset_id}
                        onClick={() => navigate(`/asset-detail/${asset.asset_code}`)}
                        className={styles.clickableRow}
                      >
                        <td>{asset.asset_code}</td>
                        <td>{asset.asset_name}</td>
                        <td>{asset.category_name}</td>
                        <td>
                          <span className={getStatusBadgeClass(asset.status_name)}>
                            {asset.status_name}
                          </span>
                        </td>
                        <td>{asset.department_name}</td>
                        <td>{asset.category_name}</td>
                        <td>{asset.location_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>

        <Modal
          show={showDetailModal}
          onHide={() => setShowDetailModal(false)}
          size="lg"
          className={styles['asset-detail-modal']}
        >
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết thiết bị</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Hiển thị chi tiết thiết bị ở đây nếu cần */}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={() => navigate(`/edit-asset/${assetToDelete?.asset_id}`)}>
              Chỉnh sửa
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {`Bạn có chắc chắn muốn xóa thiết bị ${assetToDelete?.asset_name} (${assetToDelete?.asset_code})?`}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Xóa
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Thêm thiết bị mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mã thiết bị <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.asset_code}
                      onChange={(e) => setNewAsset({ ...newAsset, asset_code: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên thiết bị <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.asset_name}
                      onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại thiết bị <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={newAsset.category_id}
                      onChange={(e) => setNewAsset({ ...newAsset, category_id: Number(e.target.value) })}
                      required
                    >
                      <option value="">Chọn loại thiết bị</option>
                      {categories.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Thương hiệu</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Hệ điều hành</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.OS}
                      onChange={(e) => setNewAsset({ ...newAsset, OS: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Office</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.OFFICE}
                      onChange={(e) => setNewAsset({ ...newAsset, OFFICE: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Phần mềm sử dụng</Form.Label>
                    <Form.Select
                      value={newAsset.software_used}
                      onChange={(e) => setNewAsset({ ...newAsset, software_used: Number(e.target.value) })}
                    >
                      <option value="">Chọn phần mềm</option>
                      {softwareUsed.map(software => (
                        <option key={software.software_used_id} value={software.software_used_id}>
                          {software.software_used_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Cấu hình</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.configuration}
                      onChange={(e) => setNewAsset({ ...newAsset, configuration: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Model</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.model}
                      onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Số serial</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.serial_number}
                      onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Loại</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.type}
                      onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ IP</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.ip_address}
                      onChange={(e) => setNewAsset({ ...newAsset, ip_address: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ MAC</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.mac_address}
                      onChange={(e) => setNewAsset({ ...newAsset, mac_address: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Hub</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.hub}
                      onChange={(e) => setNewAsset({ ...newAsset, hub: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>VCS LAN No</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.vcs_lan_no}
                      onChange={(e) => setNewAsset({ ...newAsset, vcs_lan_no: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày bắt đầu sử dụng</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAsset.start_use_date}
                      onChange={(e) => setNewAsset({ ...newAsset, start_use_date: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Khu vực nhà máy</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.factory_area}
                      onChange={(e) => setNewAsset({ ...newAsset, factory_area: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Phòng ban quản lý</Form.Label>
                    <Form.Select
                      value={newAsset.belongs_to_dept_id}
                      onChange={(e) => setNewAsset({ ...newAsset, belongs_to_dept_id: Number(e.target.value) })}
                    >
                      <option value="">Chọn phòng ban</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Nhà cung cấp</Form.Label>
                    <Form.Select
                      value={newAsset.vendor_id}
                      onChange={(e) => setNewAsset({ ...newAsset, vendor_id: Number(e.target.value) })}
                    >
                      <option value="">Chọn nhà cung cấp</option>
                      {vendors.map(vendor => (
                        <option key={vendor.vendor_id} value={vendor.vendor_id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Vị trí</Form.Label>
                    <Form.Select
                      value={newAsset.location_id}
                      onChange={(e) => setNewAsset({ ...newAsset, location_id: Number(e.target.value) })}
                    >
                      <option value="">Chọn vị trí</option>
                      {locations.map(location => (
                        <option key={location.location_id} value={location.location_id}>
                          {location.location_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày mua</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAsset.purchase_date}
                      onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Giá mua</Form.Label>
                    <Form.Control
                      type="number"
                      value={newAsset.purchase_price}
                      onChange={(e) => setNewAsset({ ...newAsset, purchase_price: Number(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Hạn bảo hành</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAsset.warranty_expiry}
                      onChange={(e) => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Chu kỳ bảo trì</Form.Label>
                    <Form.Control
                      type="number"
                      value={newAsset.maintenance_cycle}
                      onChange={(e) => setNewAsset({ ...newAsset, maintenance_cycle: Number(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={newAsset.status_id}
                      onChange={(e) => setNewAsset({ ...newAsset, status_id: Number(e.target.value) })}
                      required
                    >
                      <option value="">Chọn trạng thái</option>
                      {statuses.map(status => (
                        <option key={status.status_id} value={status.status_id}>
                          {status.status_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Thông tin nâng cấp</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={newAsset.upgrade_infor}
                      onChange={(e) => setNewAsset({ ...newAsset, upgrade_infor: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={newAsset.notes}
                      onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>IP cũ</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.old_ip_address}
                      onChange={(e) => setNewAsset({ ...newAsset, old_ip_address: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleAddAsset}>
              Thêm mới
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
}