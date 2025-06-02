import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Image, Table, Alert, Modal, Form } from 'react-bootstrap';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import './UserDetail.css';
import { fetchBusinessUnits, fetchDepartments } from '../../api/userApi';
import HandoverReport from '../../components/HandoverReport';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { PDFDocument } from 'pdf-lib';
import { fetchNetworkSegments } from '../../services/networkSegmentService';
import type {
  Asset,
  BusinessUnit,
  Department,
  User,
  UploadedFile

} from '../../types/typeUserDetail';
import ProcessMultiAssetsModal from './processmultiassets';
import UpdateUserModal from './capnhatprocess';
import UnregisterModal from './huyprocess';
import HandoverModal from './bienbanbangiao';
import UploadProcess from './uploadProcess';

const FLOOR_VLANS = {
  '1F': ['166', '167'],
  '2F': ['168', '169'],
  'BF': ['164']
};

export default function UserDetail() {
  const { empCode } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [userAssets, setUserAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData,] = useState<User | null>(null);
  const [, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [, setDepartments] = useState<Department[]>([]);
  const [, setLoadingDepartments] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetDetailLoading, setAssetDetailLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loadingAvailableAssets,] = useState(false);
  const [selectedAssetType,] = useState<'new' | 'Đang sử dụng' | 'Chờ xóa' | 'all'>('new');
  const [assignmentData,] = useState<{
    asset_id: string;
    floor: string;
    note: string;
    history_status: string;
    is_handover: boolean;
    ip_address: string[];
  }>({
    asset_id: '',
    floor: '',
    note: '',
    history_status: 'Đã đăng ký',
    is_handover: true,
    ip_address: []
  });
  const [searchTerm,] = useState('');
  const [, setCurrentPage] = useState(1);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [, setHandoverLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [showHandoverReport, setShowHandoverReport] = useState(false);
  const [handoverBy,] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnConfirmModal, setShowReturnConfirmModal] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [selectedReturnAssets, setSelectedReturnAssets] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'complete' | 'deleteAD' | 'forceDelete' | null>(null);
  const [loadingFiles,] = useState(false);
  const [uploadedFiles,] = useState<UploadedFile[]>([]);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [, setSelectedUnregisterAssets] = useState<number[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAssetType, searchTerm]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [userRes, assetsRes] = await Promise.all([
          axios.get(`/auth/users/${empCode}`),
          axios.get(`/auth/users/${empCode}/assets`)
        ]);

        setUser(userRes.data);
        setUserAssets(assetsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải thông tin người dùng');
        toast.error('Không thể tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [empCode, showAssignModal]);

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
      if (!editData?.business_unit_id) {
        setDepartments([]);
        return;
      }
      setLoadingDepartments(true);
      try {
        const data = await fetchDepartments(editData.business_unit_id);
        setDepartments(data);
      } catch (err) {
        console.error('Lỗi lấy departments:', err);
        toast.error('Không thể tải danh sách phòng ban');
      } finally {
        setLoadingDepartments(false);
      }
    }
    if (showEditModal && editData) {
      loadDepartments();
    }
  }, [editData?.business_unit_id, showEditModal]);

  const handleOpenEditModal = () => {
    if (user) {
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleUserUpdated = async () => {
    try {
      const userRes = await axios.get(`/auth/users/${empCode}`);
      setUser(userRes.data);
    } catch (err) {
      console.error('Error refetching user:', err);
      toast.error('Không thể tải lại thông tin người dùng');
    }
  };

  const handleAssetClick = async (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetailModal(true);

    try {
      setAssetDetailLoading(true);
      const response = await axios.get(`/auth/users/${empCode}/assets`);
      const detailedAsset = response.data.find((a: Asset) => a.asset_id === asset.asset_id);

      if (detailedAsset) {
        setSelectedAsset(detailedAsset);
      }
    } catch (err) {
      console.error('Error fetching asset details:', err);
      toast.error('Không thể tải thông tin chi tiết thiết bị');
    } finally {
      setAssetDetailLoading(false);
    }
  };

  const handleCloseAssetDetailModal = () => {
    setShowAssetDetailModal(false);
    setSelectedAsset(null);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'đang sử dụng':
        return 'success';
      case 'new':
        return 'success';
      case 'đang bị lỗi':
        return 'danger';
      case 'chưa bàn giao':
        return 'info';
      case 'đã đăng ký':
        return 'info';
      case 'cấp phát chờ xóa':
        return 'info';
      case 'chờ bàn giao':
        return 'info';
      case 'đang cài đặt':
        return 'warning';
      case 'đang đổi máy':
        return 'primary';
      case 'khác':
        return 'secondary';
      case 'đã trả lại':
        return 'danger';
      default:
        return 'secondary';
    }
  };


  const handleCloseHandoverModal = () => {
    setShowHandoverModal(false);
    setSelectedAssets([]);
  };

  const handleHandoverComplete = async () => {
    try {
      const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
      setUserAssets(assetsRes.data);
    } catch (err) {
      console.error('Error refetching assets:', err);
      toast.error('Không thể tải lại danh sách thiết bị sau khi bàn giao');
    }
  };


  const handleConfirmHandover = async () => {
    try {
      setHandoverLoading(true);
      setError('');

      const currentUser = sessionStorage.getItem('auth');
      if (!currentUser) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const { employee_id } = JSON.parse(currentUser);
      if (!employee_id) {
        toast.error('Không tìm thấy thông tin người bàn giao');
        return;
      }

      const payload = {
        asset_ids: selectedAssets,
        history_ids: selectedAssets,
        handover_by: employee_id,
        department_id: user?.department_id,
        note: 'Bàn giao thiết bị'
      };

      const response = await axios.post(`/script/users/${empCode}/handover-assets`, payload);

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((err: any) =>
          `Thiết bị ${err.asset_code}: ${err.message}`
        );
        toast.error(
          <div>
            <strong>Lỗi bàn giao thiết bị:</strong>
            <ul className="mt-2 mb-0">
              {errorMessages.map((msg: string, idx: number) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        );
        return;
      }

      toast.success('Bàn giao thiết bị thành công');

      const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
      setUserAssets(assetsRes.data);

      setShowHandoverReport(false);
      setSelectedAssets([]);

    } catch (err: any) {
      console.error('Lỗi bàn giao thiết bị:', err);
      const errorMessage = err.response?.data?.message || 'Lỗi không xác định khi bàn giao thiết bị';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setHandoverLoading(false);
    }
  };

  const handleCancelHandover = () => {
    setShowHandoverReport(false);
    setSelectedAssets([]);
  };

  const handleDownloadHandoverReport = async () => {
    try {
      const element = document.querySelector('#reportContainer') as HTMLElement;
      if (!element) throw new Error('Không tìm thấy phần tử báo cáo');

      const actionButtons = element.querySelector('.action-buttons') as HTMLElement;
      const originalDisplay = actionButtons?.style.display || '';
      if (actionButtons) actionButtons.style.display = 'none';

      element.classList.add('preparing-pdf');

      await new Promise(res => setTimeout(res, 300));

      const opt = {
        margin: 0,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: [] }
      };

      const worker = html2pdf().set(opt).from(element);
      const blob: Blob = await (worker as any).outputPdf('blob');

      const originalPdf = await PDFDocument.load(await blob.arrayBuffer());
      const newPdf = await PDFDocument.create();
      const [firstPage] = await newPdf.copyPages(originalPdf, [0]);
      newPdf.addPage(firstPage);

      const finalBlob = await newPdf.saveAsBase64({ dataUri: true });
      const link = document.createElement('a');
      link.href = finalBlob;
      link.download = `Bien_ban_ban_giao_${format(new Date(), 'ddMMyyyy')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Đã tải biên bản bàn giao (1 trang) thành công');

      if (actionButtons) actionButtons.style.display = originalDisplay;
      element.classList.remove('preparing-pdf');
    } catch (err) {
      console.error('Lỗi khi tải biên bản:', err);
      toast.error('Không thể tải biên bản bàn giao');
    }
  };

  const handleOpenImportFile = () => {
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
  };

  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const handleReturnAssets = async () => {
    if (selectedReturnAssets.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thiết bị');
      return;
    }

    setShowReturnConfirmModal(true);
  };

  const handleConfirmReturn = async () => {
    try {
      setReturnLoading(true);
      setError('');

      const currentUser = sessionStorage.getItem('auth');
      if (!currentUser) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }

      const { employee_id } = JSON.parse(currentUser);
      if (!employee_id) {
        toast.error('Không tìm thấy thông tin người xử lý');
        return;
      }

      const payload = {
        asset_ids: selectedReturnAssets,
        processed_by: employee_id,
        department_id: user?.department_id,
        note: 'Trả thiết bị'
      };

      const response = await axios.post(`/auth/users/${empCode}/return-assets`, payload);

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((err: any) =>
          `Thiết bị ${err.asset_code}: ${err.message}`
        );
        toast.error(
          <div>
            <strong>Lỗi trả thiết bị:</strong>
            <ul className="mt-2 mb-0">
              {errorMessages.map((msg: string, idx: number) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        );
        return;
      }

      toast.success('Trả thiết bị thành công');

      const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
      setUserAssets(assetsRes.data);

      setShowReturnModal(false);
      setShowReturnConfirmModal(false);
      setSelectedReturnAssets([]);

    } catch (err: any) {
      console.error('Lỗi trả thiết bị:', err);
      const errorMessage = err.response?.data?.message || 'Lỗi không xác định khi trả thiết bị';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setReturnLoading(false);
    }
  };

  const toggleReturnAssetSelection = (assetId: number) => {
    const asset = userAssets.find(a => a.asset_id === assetId);
    if (!asset) return;

    if (asset.history_status === 'Đang chờ xóa') {
      toast.warning('Thiết bị này đã được chọn trả');
      return;
    }

    if (asset.history_status !== 'Đang sử dụng') {
      toast.warning('Chỉ có thể trả thiết bị đang trong trạng thái "Đang sử dụng"');
      return;
    }

    setSelectedReturnAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleActionSelect = async (action: 'complete' | 'deleteAD' | 'forceDelete') => {
    if (action === 'deleteAD') {
      try {
        setDeleteLoading(true);
        await axios.post(`/auth/users/${empCode}/delete-ad-user`);
        toast.success('Xóa AD User thành công');
        window.location.href = 'http://localhost:5173/script/delete-user';
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa AD User');
      } finally {
        setDeleteLoading(false);
        setShowConfirmModal(false);
        setShowDeleteModal(false);
        setSelectedAction(null);
      }
    } else {
      setSelectedAction(action);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    setDeleteLoading(true);
    try {
      let apiEndpoint = '';
      let successMessage = '';

      switch (selectedAction) {
        case 'complete':
          apiEndpoint = `/auth/users/${empCode}/complete`;
          successMessage = 'Cập nhật trạng thái user thành công';
          break;
        case 'deleteAD':
          apiEndpoint = `/auth/users/${empCode}/delete-ad-user`;
          successMessage = 'Xóa AD User thành công';
          break;
        case 'forceDelete':
          apiEndpoint = `/auth/users/${empCode}/force-delete`;
          successMessage = 'Xóa người dùng thành công';
          break;
      }

      await axios.post(apiEndpoint);
      toast.success(successMessage);
      navigate('/manage-user');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thực hiện thao tác');
    } finally {
      setDeleteLoading(false);
      setShowConfirmModal(false);
      setShowDeleteModal(false);
      setSelectedAction(null);
    }
  };

  const handleDownloadFile = async (fileId: number, filename: string) => {
    try {
      const response = await axios.get(`/auth/users/${empCode}/download-file/${fileId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi tải file:', err);
      toast.error('Không thể tải file');
    }
  };

  const [, setAvailableIPs] = useState<{ [key: string]: string[] }>({});
  const [ipType, setIpType] = useState<{ [key: string]: 'Fixed' | 'DHCP' }>({});

  const fetchIPsForFloor = async (floor: string) => {
    const vlans = FLOOR_VLANS[floor as keyof typeof FLOOR_VLANS];
    const ips: string[] = [];

    for (const vlan of vlans) {
      try {
        const segments = await fetchNetworkSegments({
          vlan,
          ipUsage: 'unused1',
          searchTerm: ipType[floor]?.toLowerCase() || 'dhcp'
        });
        const floorIPs = segments.map(segment => segment['IP address']);
        const uniqueIPs = floorIPs.filter(ip => !ips.includes(ip));
        ips.push(...uniqueIPs);
      } catch (error) {
        console.error(`Error fetching IPs for floor ${floor}, vlan ${vlan}:`, error);
      }
    }

    const sortedIPs = ips.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return ipType[floor] === 'Fixed' ? bParts[i] - aParts[i] : aParts[i] - bParts[i];
        }
      }
      return 0;
    });

    setAvailableIPs(prev => ({
      ...prev,
      [floor]: sortedIPs
    }));
  };

  useEffect(() => {
    if (assignmentData.floor) {
      const floors = assignmentData.floor.split(' ').filter(Boolean);
      floors.forEach(floor => {
        if (!ipType[floor]) {
          setIpType(prev => ({
            ...prev,
            [floor]: 'DHCP'
          }));
        }
        fetchIPsForFloor(floor);
      });
    }
  }, [assignmentData.floor, ipType]);

  const handleOpenUnregisterModal = () => {
    setShowUnregisterModal(true);
  };

  const handleCloseUnregisterModal = () => {
    setShowUnregisterModal(false);
    setSelectedUnregisterAssets([]);
  };

  const handleUnregisterComplete = async () => {
    try {
      const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
      setUserAssets(assetsRes.data);
    } catch (err) {
      console.error('Error refetching assets:', err);
      toast.error('Không thể tải lại danh sách thiết bị sau khi hủy đăng ký');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Đang tải thông tin người dùng...</p>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="empty-state text-center">
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error || 'Không tìm thấy thông tin người dùng'}
          </div>
          <Button variant="outline-primary" onClick={() => navigate('/manage-user')} className="mt-3">
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại danh sách
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="header-section">
        <div className="header-content">
          <h5>User Detail</h5>
          <Button variant="outline-light" onClick={() => navigate('/manage-user')}>
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại danh sách
          </Button>
        </div>
      </div>

      <div className="user-management-container">
        <div className="user-info-section section-card1">
          <div className="user-profile-header">

            <div className="user-avatar-container">
              <Image
                src={`https://ui-avatars.com/api/?name=${user.full_name}&background=random&size=128`}
                roundedCircle
                className="user-avatar"
              />
              {user.status_work === 'Working' ? (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#ffffff',
                    color: '#1e7e34',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #c8e6c9'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#28a745',
                      borderRadius: '50%',
                      marginRight: '6px'
                    }}
                  />
                  Working
                </span>
              ) : user.status_work === 'On Leave' ? (
                <span className="status-badge status-badge-leave">
                  <span className="status-dot"></span>
                  On Leave
                </span>
              ) : user.status_work === 'Resigned' && (
                <span className="status-badge status-badge-resigned">
                  <span className="status-dot"></span>
                  Resigned
                </span>
              )}

            </div>
            <div className="user-basic-info">
              <h4>{user.full_name}</h4>
              <p className="text-muted mb-1">{user.position}</p>
              <p className="text-muted mb-1">{user.department_name}</p>
              <p className="text-muted mb-0">{user.business_unit_name}</p>
            </div>
            <div style={{ paddingTop: '96px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenImportFile}
              >
                <i className="fa-solid fa-file me-2"></i>
                Import file
              </Button>
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
                  <div className="info-value">{user.role === 'admin' ? 'Admin' : 'User'}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="info-group">
                  <label>Trạng thái tài khoản</label>
                  <div className="info-value">
                    <span className={`badge bg-${user.status_account === 'active' ? 'success' : 'danger'}`}>
                      {user.status_account === 'active' ? 'active' : 'inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="info-group">
                  <label>Ngày vào làm</label>
                  <div className="info-value">
                    {new Date(user.join_date).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="info-group">
                  <label>Ngày nghỉ việc</label>
                  <div className="info-value">
                    {user.leave_date ? (
                      new Date(user.leave_date).toLocaleDateString('vi-VN')
                    ) : (
                      <div className="text-success">
                        <i className="fas fa-check-circle me-2"></i>
                        Chưa nghỉ việc
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="info-group">
                  <label>Ghi chú</label>
                  <div className="info-value note-value">{user.note || 'Chưa có ghi chú'}</div>
                </div>
              </div>
              <div className="col-12">
                <div className="info-group">
                  <label>Files đã upload</label>
                  <div className="info-value">
                    {loadingFiles ? (
                      <Spinner animation="border" size="sm" />
                    ) : uploadedFiles.length > 0 ? (
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Tên file</th>
                            <th>Ngày upload</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedFiles.map(file => (
                            <tr key={file.id}>
                              <td>{file.filename}</td>
                              <td>{new Date(file.upload_date).toLocaleDateString('vi-VN')}</td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleDownloadFile(file.id, file.filename)}
                                >
                                  <i className="fas fa-download"></i> Tải xuống
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <span className="text-muted">Chưa có file nào được upload</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <Button
                variant="primary"
                className="flex-grow-1"
                onClick={handleOpenEditModal}
              >
                <i className="fas fa-edit me-2"></i>
                Chỉnh sửa thông tin
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="fas fa-trash-alt me-1"></i>
                Xóa
              </Button>
            </div>
          </div>
        </div>

        <div className="assets-section section-card1">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">

            </div>
            <div>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleOpenAssignModal}
                className="action-button"
              >
                Cấp phát thiết bị
              </Button>
            </div>
          </div>
          {userAssets.length > 0 ? (
            <div className="assets-table-container">
              {loadingAvailableAssets ? (
                <div className="text-center p-4">
                  <Spinner animation="border" />
                  <p className="mt-2">Đang tải danh sách thiết bị...</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Mã thiết bị</th>
                      <th>Tên thiết bị</th>
                      <th>Trạng thái</th>
                      <th>Ngày cấp</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAssets.map(asset => (
                      <tr
                        key={asset.asset_id}
                        onClick={() => handleAssetClick(asset)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{asset.asset_code}</td>
                        <td>
                          <div>{asset.asset_name}</div>
                          <small className="text-muted">{asset.model}</small>
                        </td>
                        <td>
                          <span className={`badge bg-${getStatusBadgeClass(asset.history_status)}`}>
                            {asset.history_status}
                          </span>
                        </td>
                        <td>{new Date(asset.handover_date).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div className="d-flex gap-2">
                            {(asset.history_status === 'Đã đăng ký' ||
                              asset.history_status === 'Chờ bàn giao' ||
                              asset.history_status === 'Cấp phát chờ xóa') && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="px-3"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSelectedUnregisterAssets([asset.asset_id]);
                                    handleOpenUnregisterModal();
                                  }}
                                >
                                  <i className="fas fa-times me-1"></i> Hủy đăng ký
                                </Button>
                              )}
                            {asset.history_status === 'Đang sử dụng' && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="px-3"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedReturnAssets([asset.asset_id]);
                                  setShowReturnConfirmModal(true);
                                }}
                              >
                                <i className="fas fa-undo me-1"></i> Trả thiết bị
                              </Button>
                            )}
                            {asset.history_status === 'Chờ bàn giao' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="px-3"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedAssets([asset.asset_id]);
                                  setShowHandoverModal(true);
                                }}
                              >
                                <i className="fas fa-handshake me-1"></i> Bàn giao
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          ) : (
            <Alert variant="info" className="m-0">
              Người dùng chưa được cấp thiết bị nào
            </Alert>
          )}
        </div>
      </div>

      {/* Replace the old Edit User Modal with the new UpdateUserModal */}
      <UpdateUserModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        user={user}
        onUserUpdated={handleUserUpdated}
      />

      {/* Asset Detail Modal */}
      <Modal show={showAssetDetailModal} onHide={handleCloseAssetDetailModal} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Thông tin chi tiết thiết bị</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {assetDetailLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" />
              <p className="mt-3">Đang tải thông tin chi tiết...</p>
            </div>
          ) : selectedAsset ? (
            <div className="asset-detail-container">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Thông tin cơ bản</h5>
                  <div className="mb-3">
                    <strong>Mã thiết bị:</strong> {selectedAsset.asset_code}
                  </div>
                  <div className="mb-3">
                    <strong>Tên thiết bị:</strong> {selectedAsset.asset_name}
                  </div>
                  <div className="mb-3">
                    <strong>Loại:</strong> {selectedAsset.category_name}
                  </div>
                  <div className="mb-3">
                    <strong>Thương hiệu:</strong> {selectedAsset.brand}
                  </div>
                  <div className="mb-3">
                    <strong>Model:</strong> {selectedAsset.model}
                  </div>
                  <div className="mb-3">
                    <strong>Loại thiết bị:</strong> {selectedAsset.type || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Trạng thái thiết bị:</strong>
                    <span className={`badge bg-${getStatusBadgeClass(selectedAsset.status_name)} ms-2`}>
                      {selectedAsset.status_name}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Thông tin kỹ thuật</h5>
                  <div className="mb-3">
                    <strong>Số serial:</strong> {selectedAsset.serial_number || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Cấu hình:</strong> {selectedAsset.configuration || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Hệ điều hành:</strong> {selectedAsset.os || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Office:</strong> {selectedAsset.office || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Phần mềm:</strong> {selectedAsset.software_used ? selectedAsset.software_used.join(', ') : 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Thông tin mạng</h5>
                  <div className="mb-3">
                    <strong>Địa chỉ IP:</strong> {Array.isArray(selectedAsset.ip_address) ? selectedAsset.ip_address.join(', ') : selectedAsset.ip_address || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Địa chỉ MAC:</strong> {selectedAsset.mac_address || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>IP cũ:</strong> {Array.isArray(selectedAsset.old_ip_address) ? selectedAsset.old_ip_address.join(', ') : selectedAsset.old_ip_address || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Hub:</strong> {selectedAsset.hub || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Số LAN VCS:</strong> {selectedAsset.vcs_lan_no || 'Chưa cập nhật'}
                  </div>
                </div>
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Thông tin vị trí</h5>
                  <div className="mb-3">
                    <strong>Khu vực nhà máy:</strong> {selectedAsset.factory_area || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Vị trí:</strong> {selectedAsset.location_id || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Thuộc phòng ban:</strong> {selectedAsset.department_name || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Nhà cung cấp:</strong> {selectedAsset.vendor_name || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Thông tin mua sắm</h5>
                  <div className="mb-3">
                    <strong>Ngày mua:</strong> {selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Giá mua:</strong> {selectedAsset.purchase_price ? `${Number(selectedAsset.purchase_price).toLocaleString()} VNĐ` : 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Ngày hết hạn bảo hành:</strong> {selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Chu kỳ bảo trì (tháng):</strong> {selectedAsset.maintenance_cycle || 'Chưa cập nhật'}
                  </div>
                </div>
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Thông tin sử dụng</h5>
                  <div className="mb-3">
                    <strong>Ngày bắt đầu sử dụng:</strong> {selectedAsset.start_use_date ? new Date(selectedAsset.start_use_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Ngày cấp phát:</strong> {new Date(selectedAsset.handover_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="mb-3">
                    <strong>Người sử dụng:</strong> {user?.full_name || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Sử dụng:</strong> {selectedAsset.is_handover ? 'Bàn giao chính' : 'Sử dụng chung'}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12">
                  <h5 className="border-bottom pb-2">Thông tin nâng cấp</h5>
                  <div className="mb-3">
                    <div className="p-3 bg-light rounded">
                      {selectedAsset.upgrade_infor || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h5 className="border-bottom pb-2">Ghi chú</h5>
                  <div className="mb-3">
                    <div className="p-3 bg-light rounded">
                      {selectedAsset.notes || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="warning">Không thể tải thông tin chi tiết thiết bị</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAssetDetailModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa người dùng <strong>{user?.full_name}</strong>?</p>
          <p className="text-danger mb-0">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Hành động này không thể hoàn tác!
          </p>
          <div className="mt-3">
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              Vui lòng chọn một trong ba phương thức xử lý:
            </div>
            <div className="d-flex flex-column gap-2">

              <Button
                variant="warning"
                onClick={() => handleActionSelect('deleteAD')}
                disabled={deleteLoading}
              >
                <i className="fas fa-user-minus me-2"></i>
                Xóa AD User
                <small className="d-block text-muted">Xóa AD User và chuyển trạng thái sang Resigned</small>
              </Button>
              <Button
                variant="danger"
                onClick={() => handleActionSelect('forceDelete')}
                disabled={deleteLoading}
              >
                <i className="fas fa-trash-alt me-2"></i>
                Xóa hoàn toàn
                <small className="d-block text-muted">Chỉ thực hiện khi user đã Resigned</small>
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Action Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận thực hiện</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning">
            <i className="fas fa-question-circle me-2"></i>
            {selectedAction === 'complete' && 'Bạn có chắc chắn muốn chuyển trạng thái user sang Resigned?'}
            {selectedAction === 'deleteAD' && 'Bạn có chắc chắn muốn xóa AD User và chuyển trạng thái sang Resigned?'}
            {selectedAction === 'forceDelete' && 'Bạn có chắc chắn muốn xóa hoàn toàn user này?'}
          </div>
          <p className="text-muted mb-0">
            {selectedAction === 'forceDelete' && 'Lưu ý: Chỉ có thể xóa user khi đã ở trạng thái Resigned'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmAction}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Xác nhận
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Asset Assignment Modal */}
      {/* This modal is now handled by ProcessMultiAssetsModal component */}

      {/* Handover Modal */}
      <HandoverModal
        show={showHandoverModal}
        onHide={handleCloseHandoverModal}
        user={user}
        userAssets={userAssets}
        onHandoverComplete={handleHandoverComplete}
      />

      {/* Import File Modal */}
      <UploadProcess
        show={showImportModal}
        onHide={handleCloseImportModal}
        empCode={empCode || ''}
      />

      {/* Return Modal */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Trả thiết bị</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </Alert>
          )}

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Trạng thái</th>
                  <th>Ngày cấp</th>
                </tr>
              </thead>
              <tbody>
                {userAssets
                  .filter(asset => asset.history_status === 'Đang sử dụng')
                  .map(asset => (
                    <tr key={asset.asset_id}>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={selectedReturnAssets.includes(asset.asset_id)}
                          onChange={() => toggleReturnAssetSelection(asset.asset_id)}
                        />
                      </td>
                      <td>{asset.asset_code}</td>
                      <td>
                        <div>{asset.asset_name}</div>
                        <small className="text-muted">{asset.model}</small>
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusBadgeClass(asset.history_status)}`}>
                          {asset.history_status}
                        </span>
                      </td>
                      <td>{new Date(asset.handover_date).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            {userAssets.filter(asset => asset.history_status === 'Đang sử dụng').length === 0 && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                Không có thiết bị nào đang ở trạng thái "Đang sử dụng"
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowReturnModal(false);
            setError('');
            setSelectedReturnAssets([]);
          }}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleReturnAssets}
            disabled={returnLoading || selectedReturnAssets.length === 0}
          >
            {returnLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Xác nhận trả
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Unregister Modal */}
      <UnregisterModal
        show={showUnregisterModal}
        onHide={handleCloseUnregisterModal}
        user={user}
        userAssets={userAssets}
        onUnregisterComplete={handleUnregisterComplete}
      />

      {/* Handover Report Modal */}
      <Modal show={showHandoverReport} onHide={handleCancelHandover} size="lg">
        <Modal.Body className="p-0">
          <HandoverReport
            selectedAssets={userAssets.filter(asset => selectedAssets.includes(asset.asset_id))}
            user={user}
            handoverBy={handoverBy}
            onConfirm={handleConfirmHandover}
            onCancel={handleCancelHandover}
            onDownload={handleDownloadHandoverReport}
          />
        </Modal.Body>
      </Modal>

      {/* Return Confirmation Modal */}
      <Modal show={showReturnConfirmModal} onHide={() => setShowReturnConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận trả thiết bị</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Bạn có chắc chắn muốn trả {selectedReturnAssets.length} thiết bị đã chọn?
          </div>
          <p className="text-muted mb-0">
            Hành động này sẽ cập nhật trạng thái thiết bị sang "Đã trả lại"
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReturnConfirmModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmReturn}
            disabled={returnLoading}
          >
            {returnLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Xác nhận trả
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Render the new ProcessMultiAssetsModal component */}
      <ProcessMultiAssetsModal
        show={showAssignModal}
        onHide={handleCloseAssignModal}
        user={user}
        onAssetsAssigned={() => {
          // Refetch user assets after assignment is complete
          async function fetchUserAssets() {
            try {
              const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
              setUserAssets(assetsRes.data);
            } catch (err) {
              console.error('Error refetching assets:', err);
              toast.error('Không thể tải lại danh sách thiết bị sau khi cấp phát');
            }
          }
          fetchUserAssets();
        }}
      />
    </Layout>
  );
}