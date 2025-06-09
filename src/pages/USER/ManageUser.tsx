import { useState, useEffect, useCallback, useMemo, FC, FormEvent } from 'react';
import Layout from '../../components/Layout';
import { Form, Button, Alert, Spinner, Modal, Table, Image, Pagination } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './ManageUser.css';
import { fetchBusinessUnits, fetchDepartments } from '../../api/userApi';
import type {
  Asset,
  BusinessUnit,
  Department,
  User,
  CreateUserFormData,
  AssetDetailModalProps,
  EditUserModalProps,
  CreateUserModalProps,
  FormControlElement
} from '../../types/typeManageUser';

const getStatusBadgeClass = (status: string | undefined) => {
  switch (status) {
    case 'Working':
      return 'working';
    case 'On Leave':
      return 'on-leave';
    case 'Resigned':
      return 'resigned';
    case 'Deleted':
      return 'deleted';
    default:
      return '';
  }
};

const POSITION_OPTIONS = [
  'Junior Staff',
  'Staff',
  'Assistant Supervisor',
  'Supervisor',
  'Senior Supervisor',
  'Assistant Manager',
  'Deputy Manager',
  'Manager',
  'Senior Manager',
  'Deputy General Manager',
  'BU HEAD',
  'General Director',
  'Chairman',
  'Operator',
  'Group Leader',
  'Team Leader',
  'Shift Staff',
  'SUB Leader',
  'Worker',
  'Senior Technician',
  'Technician',
  'Internship',
  'Other'
];

export default function ManageUser() {
  const [mode, setMode] = useState<"list" | "detail">("list");
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [listError, setListError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState('All');
  const [user, setUser] = useState<User | null>(null);
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const navigate = useNavigate();
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function loadBusinessUnits() {
      try {
        const data = await fetchBusinessUnits();
        setBusinessUnits(data);
      } catch (err) {
        console.error('Lỗi lấy BU:', err);
        toast.error('Không thể tải danh sách đơn vị');
      }
    }
    loadBusinessUnits();
  }, []);

  useEffect(() => {
    async function loadDepartments() {
      if (selectedBusinessUnit === 'All') {
        setLoadingDepartments(true);
        try {
          const departmentsPromises = businessUnits.map(bu =>
            fetchDepartments(bu.business_unit_id)
          );
          const departmentsArrays = await Promise.all(departmentsPromises);
          const allDepts = departmentsArrays.flat();
          setDepartments(allDepts);
        } catch (err) {
          console.error('Lỗi lấy tất cả phòng ban:', err);
          toast.error('Không thể tải danh sách phòng ban');
        } finally {
          setLoadingDepartments(false);
        }
      } else {
        setLoadingDepartments(true);
        try {
          const depts = await fetchDepartments(Number(selectedBusinessUnit));
          setDepartments(depts);
        } catch (err) {
          console.error('Lỗi lấy phòng ban:', err);
          toast.error('Không thể tải danh sách phòng ban');
        } finally {
          setLoadingDepartments(false);
        }
      }
    }
    loadDepartments();
  }, [selectedBusinessUnit, businessUnits]);

  useEffect(() => {
    if (mode !== 'list') return;

    (async () => {
      setLoadingAllUsers(true);
      setListError('');
      try {
        const res = await axios.get('/auth/users/all');
        setAllUsers(res.data);
      } catch (err: any) {
        setListError(err.response?.data?.message || 'Lỗi khi lấy danh sách người dùng');
      } finally {
        setLoadingAllUsers(false);
      }
    })();
  }, [mode]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const matchesSearch =
        (user.emp_code?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(search.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || user.status_work === selectedStatus;
      const matchesPosition = selectedPosition === 'All' || user.position === selectedPosition;
      const matchesDepartment = selectedDepartment === 'All' || user.department_id === Number(selectedDepartment);
      const matchesBusinessUnit = selectedBusinessUnit === 'All' || user.business_unit_id === Number(selectedBusinessUnit);

      return matchesSearch && matchesStatus && matchesPosition && matchesDepartment && matchesBusinessUnit;
    });
  }, [allUsers, selectedStatus, selectedPosition, selectedDepartment, selectedBusinessUnit, search]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedPosition, selectedDepartment, selectedBusinessUnit, search]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  }, []);

  const handlePositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPosition(e.target.value);
  }, []);

  const handleDepartmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value);
  }, []);

  const handleBusinessUnitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBU = e.target.value;
    setSelectedBusinessUnit(newBU);
    setSelectedDepartment('All');
  }, []);

  const handleRowClick = useCallback((emp_code: string) => {
    navigate(`/user-detail/${emp_code}`);
  }, [navigate]);

  const handleUserUpdated = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, [setUser]);

  const openAssetDetail = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetail(true);
  }, [setSelectedAsset, setShowAssetDetail]);

  const handleBackToList = useCallback(() => {
    setUser(null);
    setUserAssets([]);
    setMode('list');
  }, [setUser, setUserAssets, setMode]);

  return (
    <Layout>
      <div className="header-section">
        <div className="header-content">
          <h5>Quản lý danh sách người dùng</h5>

          <Form.Group className="search-container d-flex" style={{ gap: '1px' }}>
            <div className="col-12">
              <Form.Group className="filter-group1">
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo mã nhân viên, họ tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form.Group>
            </div>
            {mode === "detail" && (
              <Button variant="outline-secondary" onClick={handleBackToList}>
                Quay lại danh sách
              </Button>
            )}
          </Form.Group>

          <Button variant="light" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus me-2"></i>
            Thêm người dùng mới
          </Button>
        </div>
      </div>

      {mode === 'detail' && (
        <div className="user-management-container">
          {loadingAllUsers ? (
            <div className="loading-container">
              <Spinner animation="border" />
              <p className="mt-3 text-muted">Đang tải danh sách người dùng...</p>
            </div>
          ) : user ? (
            <>
              <div className="user-info-section section-card">
                <div className="user-profile-header">
                  <div className="user-avatar-container">
                    <Image
                      src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random&size=128`}
                      roundedCircle
                      className="user-avatar"
                    />
                    {user.status_work === 'Working' ? (
                      <span className="status-badge">
                        <span className="status-dot"></span>
                        Đang làm việc
                      </span>
                    ) : user.status_work === 'On Leave' ? (
                      <span className="status-badge status-badge-leave">
                        <span className="status-dot"></span>
                        Đang nghỉ
                      </span>
                    ) : user.status_work === 'Resigned' && (
                      <span className="status-badge status-badge-resigned">
                        <span className="status-dot"></span>
                        Đã nghỉ việc
                      </span>
                    )}
                  </div>
                  <div className="user-basic-info">
                    <h4>{user.full_name}</h4>
                    <p className="text-muted mb-1">{user.position}</p>
                    <p className="text-muted mb-1">{user.department_name}</p>
                    <p className="text-muted mb-0">{user.business_unit_name}</p>
                  </div>
                </div>

                <div className="user-info-display">
                  <div className="row g-3">
                    <div className="col-5">
                      <div className="info-group">
                        <label>Họ</label>
                        <div className="info-value">{user.first_name}</div>
                      </div>
                    </div>
                    <div className="col-7">
                      <div className="info-group">
                        <label>Tên</label>
                        <div className="info-value">{user.last_name}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="info-group">
                        <label>Mã nhân viên</label>
                        <div className="info-value">{user.emp_code}</div>
                      </div>
                    </div>
                    <div className="col-8">
                      <div className="info-group">
                        <label>Email</label>
                        <div className="info-value">{user.email}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-group">
                        <label>Đơn vị (BU)</label>
                        <div className="info-value">{user.business_unit_name}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-group">
                        <label>Phòng ban</label>
                        <div className="info-value">{user.department_name}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-group">
                        <label>Chức vụ</label>
                        <div className="info-value">{user.position}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-group">
                        <label>Vai trò</label>
                        <div className="info-value">{user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-group">
                        <label>Ngày vào làm</label>
                        <div className="info-value">{new Date(user.join_date).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-group">
                        <label>Ngày nghỉ việc</label>
                        <div className="info-value">
                          {user.leave_date
                            ? new Date(user.leave_date).toLocaleDateString('vi-VN')
                            : <div className="text-success"><i className="fas fa-check-circle me-2"></i>Chưa nghỉ việc</div>}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-group">
                        <label>Ghi chú</label>
                        <div className="info-value note-value">{user.note || 'Chưa có ghi chú'}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-100 mt-4"
                    onClick={() => setShowEditModal(true)}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Chỉnh sửa thông tin
                  </Button>
                </div>
              </div>

              <div className="assets-section section-card">
                <h5 className="section-title">Danh sách thiết bị đang sử dụng</h5>
                {loadingAllUsers ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                  </div>
                ) : userAssets.length > 0 ? (
                  <div className="assets-table-container">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã thiết bị</th>
                          <th>Tên thiết bị</th>
                          <th>Loại</th>
                          <th>Trạng thái</th>
                          <th>Ngày cấp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userAssets.map(asset => (
                          <tr key={asset.asset_id}>
                            <td>
                              <button
                                type="button"
                                className="asset-code-btn"
                                onClick={() => openAssetDetail(asset)}
                              >
                                {asset.asset_code}
                              </button>
                            </td>
                            <td>
                              <div>{asset.asset_name}</div>
                              <small className="text-muted">{asset.brand} {asset.model}</small>
                            </td>
                            <td>{asset.category_name}</td>
                            <td>
                              <span
                                className={`badge bg-${asset.status_name === 'In Use' ? 'success' : 'warning'}`}
                              >
                                {asset.status_name}
                              </span>
                            </td>
                            <td>{new Date(asset.handover_date).toLocaleDateString('vi-VN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="info" className="m-0">
                    Người dùng chưa được cấp thiết bị nào
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state text-center">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Vui lòng tìm kiếm lại bằng mã nhân viên
              </div>
              <Button variant="outline-primary" onClick={handleBackToList} className="mt-3">
                <i className="fas fa-arrow-left me-2"></i>
                Quay lại danh sách
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === 'list' && (
        <div className="user-list-container section-card">
          <div className="d-flex dev1 justify-content-between align-items-center">
            <h5></h5>
            <div className="d-flex align-items-center gap-3">
              <small className="text-muted">
                {filteredUsers.length} Mã nhân viên
              </small>
            </div>
          </div>

          <div className="filters-section">
            <div className="row g-3">
              <div className="col-md-3">
                <Form.Group className="filter-group">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select value={selectedStatus} onChange={handleStatusChange} id="status-filter">
                    <option value="All">Tất cả trạng thái</option>
                    {Array.from(new Set(allUsers.map(u => u.status_work))).filter(Boolean).map((status, idx) => (
                      <option key={idx} value={status}>{status}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group className="filter-group">
                  <Form.Label>Đơn vị (BU)</Form.Label>
                  <Form.Select value={selectedBusinessUnit} onChange={handleBusinessUnitChange} id="business-unit-filter">
                    <option value="All">Tất cả đơn vị</option>
                    {businessUnits.map(bu => (
                      <option key={bu.business_unit_id} value={bu.business_unit_id}>
                        {bu.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group className="filter-group">
                  <Form.Label>Phòng ban</Form.Label>
                  <Form.Select
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    disabled={loadingDepartments}
                  >
                    <option value="All">Tất cả phòng ban</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </Form.Select>
                  {loadingDepartments && (
                    <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Đang tải phòng ban...
                    </div>
                  )}
                </Form.Group>
              </div>

              <div className="col-md-3">
                <Form.Group className="filter-group">
                  <Form.Label>Chức vụ</Form.Label>
                  <Form.Select value={selectedPosition} onChange={handlePositionChange}>
                    <option value="All">Tất cả chức vụ</option>
                    {Array.from(new Set(allUsers.map(u => u.position))).filter(Boolean).map((position, idx) => (
                      <option key={idx} value={position}>{position}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </div>

          {listError && <Alert variant="danger">{listError}</Alert>}

          {loadingAllUsers ? (
            <div className="loading-container">
              <Spinner animation="border" />
              <p className="mt-3 text-muted">Đang tải danh sách người dùng...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Mã nhân viên</th>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Đơn vị</th>
                      <th>Phòng ban</th>
                      <th>Chức vụ</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(u => (
                      <tr
                        key={u.emp_code}
                        onClick={() => handleRowClick(u.emp_code)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="fw-medium">{u.emp_code}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Image
                              src={`https://ui-avatars.com/api/?name=${u.full_name}&background=random&size=32`}
                              roundedCircle
                              width={32}
                              height={32}
                            />
                            {u.full_name}
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.business_unit_name}</td>
                        <td>{u.department_name}</td>
                        <td>{u.position}</td>
                        <td>
                          <span className={`status-badge-list ${getStatusBadgeClass(u.status_work)}`}>
                            <span className="status-dot"></span>
                            {u.status_work}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} trên tổng số {filteredUsers.length} bản ghi
                </div>
                <Pagination>
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    } else if (
                      pageNumber === currentPage - 3 ||
                      pageNumber === currentPage + 3
                    ) {
                      return <Pagination.Ellipsis key={pageNumber} disabled />;
                    }
                    return null;
                  })}

                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Không tìm thấy người dùng nào phù hợp với bộ lọc</p>
            </div>
          )}
        </div>
      )}

      <AssetDetailModal
        show={showAssetDetail}
        asset={selectedAsset}
        onHide={() => setShowAssetDetail(false)}
      />

      {user && (
        <EditUserModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          initialData={user}
          businessUnits={businessUnits}
          departments={departments}
          onUserUpdated={handleUserUpdated}
        />
      )}

      <CreateUserModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        businessUnits={businessUnits}
        onUserCreated={() => {
          toast.info('Vui lòng tìm kiếm lại bằng mã nhân viên');
        }}
      />
    </Layout>
  );
}

const AssetDetailModal: FC<AssetDetailModalProps> = ({ show, asset, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Thông tin chi tiết thiết bị</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {asset ? (
          <div className="asset-detail">
            <div className="row g-3">
              <div className="col-md-6">
                <p><strong>Mã thiết bị:</strong> {asset.asset_code}</p>
                <p><strong>Tên thiết bị:</strong> {asset.asset_name}</p>
                <p><strong>Loại thiết bị:</strong> {asset.category_name}</p>
                <p><strong>Thương hiệu:</strong> {asset.brand}</p>
                <p><strong>Model:</strong> {asset.model}</p>
                <p><strong>Số serial:</strong> {asset.serial_number}</p>
                <p><strong>Hệ điều hành:</strong> {asset.OS}</p>
                <p><strong>Office:</strong> {asset.OFFICE}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Cấu hình:</strong> {asset.configuration}</p>
                <p><strong>IP Address:</strong> {asset.ip_address}</p>
                <p><strong>MAC Address:</strong> {asset.mac_address}</p>
                <p><strong>Hub:</strong> {asset.hub}</p>
                <p><strong>VCS LAN:</strong> {asset.vcs_lan_no}</p>
                <p><strong>Khu vực:</strong> {asset.factory_area}</p>
                <p><strong>Vị trí:</strong> {asset.location_name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <Spinner animation="border" />
            <p className="mt-3">Đang tải thông tin chi tiết...</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
};

const EditUserModal: FC<EditUserModalProps> = ({
  show,
  onHide,
  initialData,
  businessUnits,
  departments,
  onUserUpdated,
}) => {
  const [editData, setEditData] = useState<User>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditData(initialData);
  }, [initialData]);

  const handleChange = useCallback((e: React.ChangeEvent<FormControlElement>) => {
    setEditData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const full_name = `${editData.first_name} ${editData.last_name}`.toUpperCase();
      const payload = {
        ...editData,
        full_name,
        business_unit_id: Number(editData.business_unit_id),
        department_id: Number(editData.department_id),
        position: editData.position,
        status_work: editData.status_work || 'Working',
        role: editData.role || 'user',
        status_account: editData.status_account || 'active'
      };
      await axios.put(`/auth/users/${editData.emp_code}`, payload);
      toast.success('Cập nhật người dùng thành công!');
      onUserUpdated({ ...editData, full_name });
      onHide();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật người dùng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa thông tin người dùng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Họ <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  value={editData.first_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Tên <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  value={editData.last_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Đơn vị (BU) <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="business_unit_id"
                  value={editData.business_unit_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn đơn vị</option>
                  {businessUnits.map(bu => (
                    <option key={bu.business_unit_id} value={bu.business_unit_id}>
                      {bu.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Phòng ban <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="department_id"
                  value={editData.department_id}
                  onChange={handleChange}
                  required
                  disabled={!editData.business_unit_id}
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </Form.Select>
                {!editData.business_unit_id && (
                  <Form.Text className="text-muted">
                    Vui lòng chọn đơn vị trước
                  </Form.Text>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Chức vụ <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="position"
                  value={editData.position}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn chức vụ</option>
                  {POSITION_OPTIONS.map((position, index) => (
                    <option key={index} value={position}>{position}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Ngày vào làm <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="join_date"
                  value={editData.join_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Trạng thái làm việc <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="status_work"
                  value="Working"
                  onChange={handleChange}
                  required
                >
                  <option value="Working">Đang làm việc</option>
                  <option value="On Leave">Đang nghỉ</option>
                  <option value="Resigned">Đã nghỉ việc</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group>
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="note"
                  value={editData.note}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end mt-4">
            <Button variant="secondary" onClick={onHide}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

const CreateUserModal: FC<CreateUserModalProps> = ({
  show,
  onHide,
  businessUnits,
  onUserCreated,
}) => {
  const [formData, setFormData] = useState<CreateUserFormData>({
    emp_code: '',
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    status_account: 'active',
    department_id: '',
    business_unit_id: '',
    position: '',
    join_date: '',
    status_work: 'Working',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalDepartments, setModalDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    async function loadDepartments() {
      if (!formData.business_unit_id) {
        setModalDepartments([]);
        return;
      }

      setLoadingDepartments(true);
      try {
        const data = await fetchDepartments(Number(formData.business_unit_id));
        setModalDepartments(data);
      } catch (err) {
        console.error('Lỗi lấy departments:', err);
        toast.error('Không thể tải danh sách phòng ban');
      } finally {
        setLoadingDepartments(false);
      }
    }
    loadDepartments();
  }, [formData.business_unit_id]);

  const handleChange = useCallback((e: React.ChangeEvent<FormControlElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'business_unit_id') {
        return { ...prev, [name]: value, department_id: '' };
      }
      return { ...prev, [name]: value };
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const full_name = `${formData.first_name} ${formData.last_name}`.toUpperCase();
      const payload = {
        ...formData,
        full_name,
        business_unit_id: Number(formData.business_unit_id),
        department_id: Number(formData.department_id),
        position: formData.position,
        status_work: formData.status_work || 'Working',
        role: formData.role || 'user',
        status_account: formData.status_account || 'active'
      };

      const res = await axios.post('/auth/register', payload);

      try {
        await axios.post('/auth/users/create-folder', {
          emp_code: formData.emp_code
        });
        toast.success(`Tạo user ${res.data.data.emp_code} và folder lưu trữ thành công`);

        onUserCreated();
        onHide();

        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } catch (folderError) {
        console.error('Lỗi khi tạo folder:', folderError);
        toast.warning('Thư mục đã tồn tại');
        onUserCreated();
        onHide();
      }
      console.log('User created:', res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tạo user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Thêm người dùng mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Mã nhân viên <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="emp_code"
                  value={formData.emp_code}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Họ <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Tên <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Mật khẩu <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Vai trò <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Đơn vị (BU)</Form.Label>
                <Form.Select
                  name="business_unit_id"
                  value={formData.business_unit_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn đơn vị</option>
                  {businessUnits.map(bu => (
                    <option key={bu.business_unit_id} value={bu.business_unit_id}>
                      {bu.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phòng ban</Form.Label>
                <Form.Select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.business_unit_id || loadingDepartments}
                >
                  <option value="">Chọn phòng ban</option>
                  {modalDepartments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </Form.Select>
                {loadingDepartments && (
                  <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Đang tải phòng ban...
                  </div>
                )}
                {!formData.business_unit_id && (
                  <Form.Text className="text-muted">
                    Vui lòng chọn đơn vị trước
                  </Form.Text>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Chức vụ <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn chức vụ</option>
                  {POSITION_OPTIONS.map((position, index) => (
                    <option key={index} value={position}>{position}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Ngày vào làm <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  name="join_date"
                  value={formData.join_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Trạng thái làm việc <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="status_work"
                  value={formData.status_work}
                  onChange={handleChange}
                  required
                >
                  <option value="Working">Đang làm việc</option>
                  <option value="On Leave">Đang nghỉ</option>
                  <option value="Resigned">Đã nghỉ việc</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12">
              <Form.Group>
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end mt-3">
            <Button variant="secondary" onClick={onHide}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
