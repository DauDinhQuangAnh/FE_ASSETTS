import { useState, useEffect, useMemo } from 'react';
import { Button, Form, Table, Modal, Spinner, Alert, Row, Col, Pagination } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setError(err.response?.data?.message || t('manageAssets.messages.loadError'));
        toast.error(t('manageAssets.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

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
      toast.success(t('manageAssets.messages.deleteSuccess'));
      setShowDeleteModal(false);
      setAssetToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('manageAssets.messages.deleteError'));
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

      toast.success(t('manageAssets.messages.addSuccess'));
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
      toast.error(err.response?.data?.message || t('manageAssets.messages.addError'));
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
          <p className="mt-3 text-muted">{t('manageAssets.loading')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles['manage-assets-container']}>
        <div className={styles['header-section']}>
          <div className={styles['header-content']}>
            <h1 className={styles['header-title']}>{t('manageAssets.title')}</h1>
            <div className={styles['search-container']}>
              <Form.Control
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={t('manageAssets.search.placeholder')}
                className={styles['search-input']}
              />
            </div>
            <div className={styles['header-actions']}>
              <Button variant="light" onClick={() => setShowAddModal(true)}>
                <i className="fas fa-plus me-2"></i>
                {t('manageAssets.addNewAsset')}
              </Button>
            </div>
          </div>
        </div>

        <div className={styles['assets-table-container']}>
          <div className={styles['filter-section']}>
            <Row className="g-3">
              <Col md={5}>
                <Form.Group className={styles['filter-group']}>
                  <Form.Label className={styles['filter-label']}>{t('manageAssets.filters.status')}</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="all">{t('manageAssets.filters.allStatus')}</option>
                    {uniqueStatusKeys.map(key => (
                      <option key={key} value={key}>
                        {t(`manageAssets.status.${key}`)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className={styles['filter-group']}>
                  <Form.Label className={styles['filter-label']}>{t('manageAssets.filters.category')}</Form.Label>
                  <Form.Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="all">{t('manageAssets.filters.allCategories')}</option>
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
                      {t('manageAssets.filters.assetCount', { count: filteredAssets.length })}
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
              <p>{t('manageAssets.noData')}</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>{t('manageAssets.table.assetCode')}</th>
                      <th>{t('manageAssets.table.assetName')}</th>
                      <th>{t('manageAssets.table.type')}</th>
                      <th style={{ minWidth: '141px' }}>{t('manageAssets.table.status')}</th>
                      <th>{t('manageAssets.table.department')}</th>
                      <th>{t('manageAssets.table.deviceType')}</th>
                      <th>{t('manageAssets.table.location')}</th>
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
                            {t(`manageAssets.status.${statusNameToKey(asset.status_name)}`)}
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
            <Modal.Title>{t('manageAssets.modals.detail.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* No need to pass selectedAsset to the modal */}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              {t('manageAssets.modals.detail.close')}
            </Button>
            <Button variant="primary" onClick={() => navigate(`/edit-asset/${assetToDelete?.asset_id}`)}>
              {t('manageAssets.modals.detail.edit')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{t('manageAssets.modals.delete.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {t('manageAssets.modals.delete.message', {
              assetName: assetToDelete?.asset_name,
              assetCode: assetToDelete?.asset_code
            })}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              {t('manageAssets.modals.delete.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('manageAssets.modals.delete.delete')}
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{t('manageAssets.modals.add.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.assetCode')} <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.asset_code}
                      onChange={(e) => setNewAsset({ ...newAsset, asset_code: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.assetName')} <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.asset_name}
                      onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.category')} <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={newAsset.category_id}
                      onChange={(e) => setNewAsset({ ...newAsset, category_id: Number(e.target.value) })}
                      required
                    >
                      <option value="">{t('manageAssets.modals.add.fields.category')}</option>
                      {categories.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.brand')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.os')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.OS}
                      onChange={(e) => setNewAsset({ ...newAsset, OS: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.office')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.OFFICE}
                      onChange={(e) => setNewAsset({ ...newAsset, OFFICE: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.softwareUsed')}</Form.Label>
                    <Form.Select
                      value={newAsset.software_used}
                      onChange={(e) => setNewAsset({ ...newAsset, software_used: Number(e.target.value) })}
                    >
                      <option value="">{t('manageAssets.modals.add.fields.softwareUsed')}</option>
                      {softwareUsed.map(software => (
                        <option key={software.software_used_id} value={software.software_used_id}>
                          {software.software_used_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.configuration')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.configuration}
                      onChange={(e) => setNewAsset({ ...newAsset, configuration: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.model')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.model}
                      onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.serialNumber')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.serial_number}
                      onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.type')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.type}
                      onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.ipAddress')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.ip_address}
                      onChange={(e) => setNewAsset({ ...newAsset, ip_address: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.macAddress')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.mac_address}
                      onChange={(e) => setNewAsset({ ...newAsset, mac_address: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.hub')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.hub}
                      onChange={(e) => setNewAsset({ ...newAsset, hub: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.vcsLanNo')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.vcs_lan_no}
                      onChange={(e) => setNewAsset({ ...newAsset, vcs_lan_no: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.startUseDate')}</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAsset.start_use_date}
                      onChange={(e) => setNewAsset({ ...newAsset, start_use_date: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.factoryArea')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={newAsset.factory_area}
                      onChange={(e) => setNewAsset({ ...newAsset, factory_area: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.department')}</Form.Label>
                    <Form.Select
                      value={newAsset.belongs_to_dept_id}
                      onChange={(e) => setNewAsset({ ...newAsset, belongs_to_dept_id: Number(e.target.value) })}
                    >
                      <option value="">{t('manageAssets.modals.add.fields.department')}</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.vendor')}</Form.Label>
                    <Form.Select
                      value={newAsset.vendor_id}
                      onChange={(e) => setNewAsset({ ...newAsset, vendor_id: Number(e.target.value) })}
                    >
                      <option value="">{t('manageAssets.modals.add.fields.vendor')}</option>
                      {vendors.map(vendor => (
                        <option key={vendor.vendor_id} value={vendor.vendor_id}>
                          {vendor.vendor_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.location')}</Form.Label>
                    <Form.Select
                      value={newAsset.location_id}
                      onChange={(e) => setNewAsset({ ...newAsset, location_id: Number(e.target.value) })}
                    >
                      <option value="">{t('manageAssets.modals.add.fields.location')}</option>
                      {locations.map(location => (
                        <option key={location.location_id} value={location.location_id}>
                          {location.location_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.purchaseDate')}</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAsset.purchase_date}
                      onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.purchasePrice')}</Form.Label>
                    <Form.Control
                      type="number"
                      value={newAsset.purchase_price}
                      onChange={(e) => setNewAsset({ ...newAsset, purchase_price: Number(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.warrantyExpiry')}</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAsset.warranty_expiry}
                      onChange={(e) => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.maintenanceCycle')}</Form.Label>
                    <Form.Control
                      type="number"
                      value={newAsset.maintenance_cycle}
                      onChange={(e) => setNewAsset({ ...newAsset, maintenance_cycle: Number(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.status')} <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={newAsset.status_id}
                      onChange={(e) => setNewAsset({ ...newAsset, status_id: Number(e.target.value) })}
                      required
                    >
                      <option value="">{t('manageAssets.modals.add.fields.status')}</option>
                      {statuses.map(status => (
                        <option key={status.status_id} value={status.status_id}>
                          {status.status_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.upgradeInfo')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={newAsset.upgrade_infor}
                      onChange={(e) => setNewAsset({ ...newAsset, upgrade_infor: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.notes')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={newAsset.notes}
                      onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('manageAssets.modals.add.fields.oldIp')}</Form.Label>
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
              {t('manageAssets.modals.add.buttons.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddAsset}>
              {t('manageAssets.modals.add.buttons.add')}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
}