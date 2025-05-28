import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { fetchNetworkSegments, updateNetworkSegment } from '../../services/networkSegmentService';
import type {
  Asset,
  BusinessUnit,
  Department,
  User,
  UploadedFile,
  FloorFilterType,
  FormControlElement
} from '../../types/typeUserDetail';

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

const FLOOR_OPTIONS = ['1F', '2F', 'BF'];

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
  const [editData, setEditData] = useState<User | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetDetailLoading, setAssetDetailLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [availableInUseAssets, setAvailableInUseAssets] = useState<Asset[]>([]);
  const [availableDeleteAssets, setAvailableDeleteAssets] = useState<Asset[]>([]);
  const [loadingAvailableAssets, setLoadingAvailableAssets] = useState(false);
  const [selectedAssetType, setSelectedAssetType] = useState<'new' | 'Đang sử dụng' | 'Chờ xóa' | 'all'>('new');
  const [assignmentData, setAssignmentData] = useState<{
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
  const [searchTerm, setSearchTerm] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [showHandoverReport, setShowHandoverReport] = useState(false);
  const [handoverBy, setHandoverBy] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnConfirmModal, setShowReturnConfirmModal] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [selectedReturnAssets, setSelectedReturnAssets] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'complete' | 'deleteAD' | 'forceDelete' | null>(null);
  const [loadingFiles,] = useState(false);
  const [uploadedFiles,] = useState<UploadedFile[]>([]);

  const [floorFilters, setFloorFilters] = useState<FloorFilterType>({
    'BF': false,
    '1F': false,
    '2F': false
  });

  const [selectedAssetsAllType, setSelectedAssetsAllType] = useState<Asset[]>([]);
  const [multiAssignData, setMultiAssignData] = useState<{ [assetId: string]: { floor?: string, ip?: string, ipType?: 'DHCP' | 'FIXED' } }>({});
  const [multiAvailableIPs, setMultiAvailableIPs] = useState<{ [assetId: string]: string[] }>({});

  const getFloorFromIP = (ip: string): string | null => {
    const ipParts = ip.split('.');
    if (ipParts.length !== 4) return null;

    const vlan = ipParts[2];

    for (const [floor, vlans] of Object.entries(FLOOR_VLANS)) {
      if (vlans.includes(vlan)) {
        return floor;
      }
    }

    return null;
  };

  const filteredAssets = useMemo(() => {
    let assets: Asset[] = [];
    if (selectedAssetType === 'all') {
      assets = [...availableAssets, ...availableInUseAssets, ...availableDeleteAssets];
    } else if (selectedAssetType === 'new') {
      assets = availableAssets;
    } else if (selectedAssetType === 'Đang sử dụng') {
      assets = availableInUseAssets;
    } else {
      assets = availableDeleteAssets;
    }

    if (!searchTerm && !Object.values(floorFilters).some(value => value)) {
      return assets;
    }

    return assets.filter(asset => {
      const matchesSearch = !searchTerm ||
        (asset.asset_code?.toLowerCase?.() || '').includes(searchTerm.toLowerCase()) ||
        (asset.asset_name?.toLowerCase?.() || '').includes(searchTerm.toLowerCase()) ||
        (asset.brand?.toLowerCase?.() || '').includes(searchTerm.toLowerCase()) ||
        (asset.model?.toLowerCase?.() || '').includes(searchTerm.toLowerCase());

      if ((selectedAssetType === 'Chờ xóa' || selectedAssetType === 'all') && Object.values(floorFilters).some(value => value)) {
        if (!asset.ip_address) return false;

        const ips = typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address;
        const hasMatchingFloor = ips.some((ip: string) => {
          const floor = getFloorFromIP(ip);
          return floor && floorFilters[floor as keyof FloorFilterType];
        });

        return matchesSearch && hasMatchingFloor;
      }

      return matchesSearch;
    });
  }, [selectedAssetType, availableAssets, availableInUseAssets, availableDeleteAssets, searchTerm, floorFilters]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssets, currentPage]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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
  }, [empCode]);

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
      const userData = {
        ...user,
        status_account: user.status_account || 'active',
        position: user.position || '' // Đảm bảo position không bị undefined
      };
      setEditData(userData);
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditData(null);
    setEditError('');
  };

  const handleChange = useCallback((e: React.ChangeEvent<FormControlElement>) => {
    const { name, value } = e.target;
    setEditData(prev => {
      if (!prev) return null;

      if (name === 'business_unit_id') {
        return {
          ...prev,
          [name]: Number(value),
          department_id: 0,
          department_name: ''
        };
      }

      if (name === 'status_work' || name === 'status_account') {
        return { ...prev, [name]: value };
      }

      return { ...prev, [name]: value };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    if (editData.status_work === 'Resigned') {
      const hasNotReturnedAssets = userAssets.some(asset =>
        asset.history_status !== 'Đã trả lại'
      );

      if (hasNotReturnedAssets) {
        toast.error('Không thể chuyển sang trạng thái Resigned khi vẫn còn thiết bị chưa được trả lại. Vui lòng trả lại tất cả thiết bị trước.');
        return;
      }
    }

    setEditLoading(true);
    setEditError('');

    try {
      const full_name = `${editData.first_name} ${editData.last_name}`.toUpperCase();

      const status_work = editData.status_work || 'Working';
      const status_account = editData.status_account || 'active';

      const payload = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        full_name,
        email: editData.email,
        business_unit_id: Number(editData.business_unit_id),
        department_id: Number(editData.department_id),
        position: editData.position,
        join_date: editData.join_date,
        role: editData.role,
        status_account: status_account,
        leave_date: editData.leave_date || null,
        status_work: status_work,
        note: editData.note || null
      };

      await axios.put(`/auth/users/${editData.emp_code}`, payload);

      const userRes = await axios.get(`/auth/users/${empCode}`);
      setUser(userRes.data);

      toast.success('Cập nhật thông tin người dùng thành công!');
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Lỗi cập nhật:', err.response?.data || err);
      setEditError(err.response?.data?.message || 'Lỗi khi cập nhật người dùng');
    } finally {
      setEditLoading(false);
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

  const fetchAvailableAssets = async () => {
    setLoadingAvailableAssets(true);
    try {
      const [newAssetsRes, inUseAssetsRes, deleteAssetsRes] = await Promise.all([
        axios.get(`/auth/users/${empCode}/available-assets`),
        axios.get(`/auth/users/${empCode}/available-assets2`),
        axios.get(`/auth/users/${empCode}/available-assets3`),
      ]);
      setAvailableAssets(newAssetsRes.data);
      setAvailableInUseAssets(inUseAssetsRes.data);
      setAvailableDeleteAssets(deleteAssetsRes.data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách thiết bị');
    } finally {
      setLoadingAvailableAssets(false);
    }
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedAssetType('new');
    setSearchTerm('');
    setAssignmentData({
      asset_id: '',
      floor: '',
      note: '',
      history_status: 'Đã đăng ký',
      is_handover: true,
      ip_address: []
    });
  };

  const handleOpenAssignModal = () => {
    fetchAvailableAssets();
    setShowAssignModal(true);
  };

  const handleAssignmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAssignmentData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!assignmentData.asset_id) {
      toast.error('Vui lòng chọn thiết bị');
      return;
    }

    if (selectedAssetType === 'new') {
      if (!assignmentData.floor) {
        toast.error('Vui lòng chọn ít nhất một tầng');
        return;
      }
      const floors = assignmentData.floor.split(' ').filter(Boolean);
      const selectedIPs = assignmentData.ip_address;
      const floorIPs: { [key: string]: string[] } = {};
      floors.forEach(floor => {
        floorIPs[floor] = selectedIPs.filter(ip =>
          availableIPs[floor]?.includes(ip)
        );
      });
      for (const floor of floors) {
        if (!floorIPs[floor] || floorIPs[floor].length === 0) {
          toast.error(`Vui lòng chọn IP cho tầng ${floor}`);
          return;
        }
        if (floorIPs[floor].length > 1) {
          toast.error(`Tầng ${floor} chỉ được chọn 1 IP`);
          return;
        }
      }
    }

    const currentUser = sessionStorage.getItem('auth');
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    const { employee_id } = JSON.parse(currentUser);
    if (!employee_id) {
      toast.error('Không tìm thấy thông tin người cấp phát');
      return;
    }

    setAssignLoading(true);
    try {
      if (selectedAssetType === 'Chờ xóa') {
        const assetInfo = availableDeleteAssets.find(asset =>
          asset.asset_id.toString() === assignmentData.asset_id
        );

        if (!assetInfo || !assetInfo.ip_address) {
          toast.error('Thiết bị không có IP');
          return;
        }

        const ips = typeof assetInfo.ip_address === 'string' ? assetInfo.ip_address.split(', ') : assetInfo.ip_address;
        const floors = ips.map((ip: string) => getFloorFromIP(ip)).filter(Boolean);
        const floorString = floors.join(' ');

        const payload = {
          asset_id: assignmentData.asset_id,
          department_id: user.department_id,
          handover_by: employee_id,
          floor: floorString,
          history_status: 'Đã đăng ký',
          note: assignmentData.note || null,
          is_handover: true
        };

        await axios.post(`/asset/users/${empCode}/assign-delete-asset`, payload);
        toast.success('Cấp phát thiết bị chờ xóa thành công');
      } else {
        const payload = {
          asset_id: assignmentData.asset_id,
          department_id: user.department_id,
          handover_by: employee_id,
          floor: assignmentData.floor,
          history_status: 'Đã đăng ký',
          note: assignmentData.note || null,
          is_handover: null,
          ip_address: assignmentData.ip_address
        };

        await axios.post(`/auth/users/${empCode}/assign-asset`, payload);
        toast.success('Cấp phát thiết bị thành công');

        const ipUpdates = assignmentData.ip_address.map(ip => ({
          ip: ip,
          status: "Registered",
          ipType: localStorage.getItem(`ipType_${ip}`) as 'Fixed' | 'DHCP' || 'DHCP'
        }));

        await Promise.all(ipUpdates.map(update => updateNetworkSegment(update)));
        toast.success('Cập nhật trạng thái IP thành công');
      }

      const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
      console.log('Danh sách thiết bị sau khi cấp phát:', assetsRes.data);
      setUserAssets(assetsRes.data);

      setShowAssignModal(false);
      setAssignmentData({
        asset_id: '',
        floor: '',
        note: '',
        history_status: 'Đã đăng ký',
        is_handover: true,
        ip_address: []
      });

      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cấp phát thiết bị');
    } finally {
      setAssignLoading(false);
    }
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

  const handleHandoverAssets = async () => {

    if (selectedAssets.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thiết bị');
      return;
    }

    const invalidAssets = userAssets.filter(asset =>
      selectedAssets.includes(asset.history_id) &&
      asset.history_status !== 'Chờ bàn giao'
    );

    if (invalidAssets.length > 0) {
      const assetCodes = invalidAssets.map(asset => asset.asset_code).join(', ');
      toast.error(`Chỉ có thể bàn giao thiết bị có trạng thái "Chờ bàn giao". Các thiết bị sau không đủ điều kiện: ${assetCodes}`);
      return;
    }

    const currentUser = sessionStorage.getItem('auth');

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    const { employee_id, full_name } = JSON.parse(currentUser);

    if (!employee_id) {
      toast.error('Không tìm thấy thông tin người bàn giao');
      return;
    }

    setHandoverBy(full_name);
    setShowHandoverModal(false);
    setShowHandoverReport(true);
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
  const toggleAssetSelection = (assetId: number) => {
    const asset = userAssets.find(a => a.asset_id === assetId);
    if (asset && asset.history_status !== 'Chờ bàn giao') {
      toast.warning('Chỉ có thể bàn giao thiết bị có trạng thái "Chờ bàn giao"');
      return;
    }

    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleOpenImportFile = () => {
    setShowImportModal(true);
    setSelectedFiles([]);
    setUploadProgress({});
    setImportError('');
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setSelectedFiles([]);
    setUploadProgress({});
    setImportError('');
  };

  const processFileWithDebounce = useCallback((file: File) => {
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }

    uploadTimeoutRef.current = setTimeout(() => {
      setImportFile(file);
      setImportError('');
    }, 300);
  }, []);

  const validateFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-outlook',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type) &&
      !file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|msg|jpg|jpeg|png|gif|txt|csv|zip|rar|7z|json)$/i)) {
      throw new Error('File không đúng định dạng. Vui lòng tải lên file được hỗ trợ');
    }

    return true;
  }, []);


  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFileLoading(true);

      try {
        await validateFile(file);
        await new Promise(resolve => setTimeout(resolve, 300));
        processFileWithDebounce(file);
      } catch (error: any) {
        console.error('Lỗi khi đọc file:', error);
        setImportError(error.message || 'Không thể đọc file. Vui lòng thử lại.');
        setImportFile(null);
      } finally {
        setFileLoading(false);
      }
    }
  }, [validateFile, processFileWithDebounce]);

  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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

  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [selectedUnregisterAssets, setSelectedUnregisterAssets] = useState<number[]>([]);
  const [unregisterLoading, setUnregisterLoading] = useState(false);

  const handleUnregisterAssets = async () => {
    if (selectedUnregisterAssets.length === 0) {
      toast.error('Vui lòng chọn ít nhất một thiết bị');
      return;
    }

    try {
      setUnregisterLoading(true);
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
        asset_ids: selectedUnregisterAssets,
        processed_by: employee_id,
        department_id: user?.department_id,
        note: 'Hủy đăng ký thiết bị'
      };

      const response = await axios.post(`/auth/users/${empCode}/unregister-assets`, payload);

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((err: any) =>
          `Thiết bị ${err.asset_code}: ${err.message}`
        );
        toast.error(
          <div>
            <strong>Lỗi hủy đăng ký thiết bị:</strong>
            <ul className="mt-2 mb-0">
              {errorMessages.map((msg: string, idx: number) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        );
        return;
      }

      const assetsToUnregister = userAssets.filter(asset =>
        selectedUnregisterAssets.includes(asset.asset_id)
      );

      const ipUpdates = assetsToUnregister
        .filter(asset => asset.ip_address)
        .flatMap(asset => {
          if (!asset.ip_address) return [];
          const ips = typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address;
          return ips.map((ip: string) => ({
            ip: ip,
            status: null,
            hostname: null,
            ipType: localStorage.getItem(`ipType_${ip}`) as 'Fixed' | 'DHCP' || 'DHCP'
          }));
        });

      if (ipUpdates.length > 0) {
        await Promise.all(ipUpdates.map(update => updateNetworkSegment(update)));
        toast.success('Cập nhật trạng thái IP thành công');
      }

      toast.success('Hủy đăng ký thiết bị thành công');
      localStorage.clear()
      const assetsRes = await axios.get(`/auth/users/${empCode}/assets`);
      setUserAssets(assetsRes.data);

      setShowUnregisterModal(false);
      setSelectedUnregisterAssets([]);

    } catch (err: any) {
      console.error('Lỗi hủy đăng ký thiết bị:', err);
      const errorMessage = err.response?.data?.message || 'Lỗi không xác định khi hủy đăng ký thiết bị';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {

      setUnregisterLoading(false);
    }
  };

  const toggleUnregisterAssetSelection = (assetId: number) => {
    const asset = userAssets.find(a => a.asset_id === assetId);
    if (!asset) return;

    if (asset.history_status === 'Đã hủy đăng ký') {
      toast.warning('Thiết bị này đã được hủy đăng ký');
      return;
    }

    if (asset.history_status !== 'Đã đăng ký' && asset.history_status !== 'Chờ bàn giao') {
      toast.warning('Chỉ có thể hủy đăng ký thiết bị đang trong trạng thái "Đã đăng ký" hoặc "Chờ bàn giao"');
      return;
    }

    setSelectedUnregisterAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
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

  const [showImportModal, setShowImportModal] = useState(false);
  const [, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [folderStatus, setFolderStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleMultipleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file');
      return;
    }

    setImportLoading(true);
    const formData = new FormData();

    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await axios.post(`/auth/users/${empCode}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({ ...prev, total: progress }));
          }
        }
      });

      toast.success('Upload files thành công');
      setSelectedFiles([]);
      setUploadProgress({});
      handleCloseImportModal();
    } catch (err: any) {
      console.error('Lỗi upload files:', err);
      toast.error(err.response?.data?.message || 'Không thể upload files');
    } finally {
      setImportLoading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenFolder = async () => {
    try {
      setFileLoading(true);
      setFolderStatus({ type: null, message: '' });
      await axios.get(`/auth/users/${empCode}/open-folder`);
      setFolderStatus({
        type: 'success',
        message: 'Đã mở folder thành công!'
      });
      toast.success('Đã mở folder thành công');
    } catch (err) {
      console.error('Lỗi mở folder:', err);
      setFolderStatus({
        type: 'error',
        message: 'Không thể mở folder. Vui lòng kiểm tra: \n1. Đường dẫn folder có tồn tại\n2. Bạn có quyền truy cập folder\n3. Thử lại sau'
      });
      toast.error('Không thể mở folder');
    } finally {
      setFileLoading(false);
    }
  };

  const [availableIPs, setAvailableIPs] = useState<{ [key: string]: string[] }>({});
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


  const handleMultiAssignFloorChange = async (assetId: string, floor: string, ipType: 'DHCP' | 'FIXED' = 'DHCP') => {
    setMultiAssignData(prev => ({ ...prev, [assetId]: { ...prev[assetId], floor, ip: '', ipType } }));
    if (floor) {
      await fetchMultiIPs(assetId, floor, ipType);
    } else {
      setMultiAvailableIPs(prev => ({ ...prev, [assetId]: [] }));
    }
  };


  const fetchMultiIPs = async (assetId: string, floor: string, ipType: 'DHCP' | 'FIXED') => {
    const vlans = FLOOR_VLANS[floor as keyof typeof FLOOR_VLANS];
    let ips: string[] = [];
    for (const vlan of vlans) {
      try {
        const segments = await fetchNetworkSegments({ vlan, ipUsage: 'unused1', searchTerm: ipType.toLowerCase() });
        const floorIPs = segments.map(segment => segment['IP address']);
        const uniqueIPs = floorIPs.filter(ip => !ips.includes(ip));
        ips.push(...uniqueIPs);
      } catch (error) { }
    }
    setMultiAvailableIPs(prev => ({ ...prev, [assetId]: ips.sort() }));
  };


  const handleMultiAssign = async () => {
    if (selectedAssetsAllType.length === 0) return;
    setAssignLoading(true);
    try {
      const newAssets = selectedAssetsAllType.filter(a => a.status_name === 'New');
      const inuseAssets = selectedAssetsAllType.filter(a => a.status_name === 'Đang sử dụng');
      const deleteAssets = selectedAssetsAllType.filter(a => a.status_name === 'Chờ xóa');

      console.log('Selected Assets:', {
        new: newAssets,
        inuse: inuseAssets,
        delete: deleteAssets
      });

      for (const asset of newAssets) {
        const data = multiAssignData[String(asset.asset_id)] || {};
        if (!data.floor || !data.ip) {
          toast.error(`Vui lòng chọn đầy đủ tầng và IP cho thiết bị ${asset.asset_code}`);
          continue;
        }
        const payload = {
          asset_id: asset.asset_id,
          department_id: user?.department_id,
          handover_by: JSON.parse(sessionStorage.getItem('auth') || '{}').employee_id,
          floor: data.floor,
          history_status: 'Đã đăng ký',
          is_handover: true,
          ip_address: [data.ip],
          ipType: data.ipType || 'DHCP'
        };
        await axios.post(`/auth/users/${user?.emp_code}/assign-asset`, payload);
      }

      for (const asset of inuseAssets) {
        const data = multiAssignData[String(asset.asset_id)] || {};
        const payload = {
          asset_id: asset.asset_id,
          department_id: user?.department_id,
          handover_by: JSON.parse(sessionStorage.getItem('auth') || '{}').employee_id,
          floor: data.floor,
          history_status: 'Đã đăng ký',
          is_handover: false,
          ip_address: data.ip ? [data.ip] : [],
          ipType: data.ipType || 'DHCP'
        };
        await axios.post(`/auth/users/${user?.emp_code}/assign-asset`, payload);
      }

      for (const asset of deleteAssets) {
        if (!asset.ip_address) {
          toast.error(`Thiết bị ${asset.asset_code} không có IP`);
          continue;
        }
        const ips = typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address;
        const floors = ips.map((ip: string) => getFloorFromIP(ip)).filter(Boolean);
        const floorString = floors.join(' ');
        const payload = {
          asset_id: asset.asset_id,
          department_id: user?.department_id,
          handover_by: JSON.parse(sessionStorage.getItem('auth') || '{}').employee_id,
          floor: floorString,
          note: null,
          is_handover: true
        };
        await axios.post(`/asset/users/${user?.emp_code}/assign-delete-asset`, payload);
      }

      const allAssignedAssets = [...newAssets, ...inuseAssets];
      for (const asset of allAssignedAssets) {
        const data = multiAssignData[String(asset.asset_id)] || {};
        if (data.ip) {
          const ipUpdate = {
            ip: data.ip,
            status: "Registered",
            ipType: data.ipType || 'DHCP'
          };
          await updateNetworkSegment(ipUpdate);
        }
      }

      toast.success('Cấp phát thiết bị thành công!');
      setSelectedAssetsAllType([]);
      setMultiAssignData({});
      setMultiAvailableIPs({});
      setShowAssignModal(false);

      const assetsRes = await axios.get(`/auth/users/${user?.emp_code}/assets`);
      setUserAssets(assetsRes.data);
    } catch (err: any) {
      console.error('Error in handleMultiAssign:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi cấp phát thiết bị');
    } finally {
      setAssignLoading(false);
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
                                  setShowUnregisterModal(true);
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
            </div>
          ) : (
            <Alert variant="info" className="m-0">
              Người dùng chưa được cấp thiết bị nào
            </Alert>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Chỉnh sửa thông tin người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          {editData && (
            <Form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Mã nhân viên</Form.Label>
                    <Form.Control
                      type="text"
                      value={editData.emp_code}
                      disabled
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleChange}
                      disabled
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Họ</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={editData.first_name}
                      onChange={handleChange}
                      disabled
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Tên</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={editData.last_name}
                      onChange={handleChange}
                      disabled
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Đơn vị (BU)</Form.Label>
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
                    <Form.Label>Phòng ban</Form.Label>
                    <Form.Select
                      name="department_id"
                      value={editData.department_id}
                      onChange={handleChange}
                      required
                      disabled={!editData.business_unit_id || loadingDepartments}
                    >
                      <option value="">Chọn phòng ban</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </Form.Select>
                    {loadingDepartments && (
                      <div className="mt-1">
                        <small className="text-muted">Đang tải danh sách phòng ban...</small>
                      </div>
                    )}
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Chức vụ</Form.Label>
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
                    {!editData?.position && (
                      <Form.Text className="text-danger">
                        Vui lòng chọn chức vụ
                      </Form.Text>
                    )}
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Vai trò</Form.Label>
                    <Form.Select
                      name="role"
                      value={editData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Ngày vào làm</Form.Label>
                    <Form.Control
                      type="date"
                      name="join_date"
                      value={editData.join_date.split('T')[0]}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Ngày nghỉ việc</Form.Label>
                    <Form.Control
                      type="date"
                      name="leave_date"
                      value={editData.leave_date ? editData.leave_date.split('T')[0] : ''}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Trạng thái làm việc</Form.Label>
                    <Form.Select
                      name="status_work"
                      value={editData.status_work || 'Working'}
                      onChange={handleChange}
                      required
                    >
                      <option value="Working">Working</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Resigned">Resigned</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label>Trạng thái tài khoản</Form.Label>
                    <Form.Select
                      name="status_account"
                      value={editData.status_account || 'active'}
                      onChange={handleChange}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
                      value={editData.note || ''}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end mt-3">
                <Button variant="secondary" onClick={handleCloseEditModal}>
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={editLoading}>
                  {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

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
                    <strong>Địa chỉ IP:</strong> {selectedAsset.ip_address || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>Địa chỉ MAC:</strong> {selectedAsset.mac_address || 'Chưa cập nhật'}
                  </div>
                  <div className="mb-3">
                    <strong>IP cũ:</strong> {selectedAsset.old_ip || 'Chưa cập nhật'}
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
      <Modal
        show={showAssignModal}
        onHide={handleCloseAssignModal}
        size="xl"
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #dee2e6' }}>
          <Modal.Title>Cấp phát thiết bị</Modal.Title>
          <div style={{ padding: '0px 0px 0px 28px', display: 'flex', gap: '10px', minWidth: '800px' }}>
            <Form.Group style={{ flex: '1' }}>
              <Form.Select
                value={selectedAssetType}
                onChange={(e) => {
                  const selectedValue = e.target.value as 'all' | 'new' | 'Đang sử dụng' | 'Chờ xóa';
                  setSelectedAssetType(selectedValue);
                  setAssignmentData(prev => ({
                    ...prev,
                    asset_id: '',
                    floor: '',
                    ip_address: [],
                    is_handover: selectedValue !== 'Đang sử dụng'
                  }));
                  setSearchTerm('');
                  setSelectedFloor(null);
                }}
                required
              >
                <option value="all">Tất cả</option>
                <option value="new">Thiết bị mới</option>
                <option value="Đang sử dụng">Thiết bị đang sử dụng</option>
                <option value="Chờ xóa">Thiết bị chờ xóa</option>
              </Form.Select>
            </Form.Group>
            <Form.Group style={{ flex: '3' }}>
              <Form.Control
                type="text"
                placeholder="Tìm theo mã, tên, thương hiệu hoặc model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={false}
              />
            </Form.Group>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px 24px' }}>
          <Form onSubmit={handleAssignAsset}>
            {/* Thêm filter tầng ngay sau header */}
            {selectedAssetType === 'Chờ xóa' && (
              <div className="floor-filter-container mb-4">
                <div className="d-flex align-items-center gap-4 p-3 bg-light rounded">
                  <strong className="text-primary">Lọc theo tầng:</strong>
                  <div className="d-flex gap-4">
                    {Object.entries(FLOOR_VLANS).map(([floor, vlans]) => (
                      <Form.Check
                        key={floor}
                        type="checkbox"
                        id={`floor-filter-${floor}`}
                        label={
                          <span>
                            <i className="fas fa-building me-1"></i>
                            {floor} <small className="text-muted">(VLAN: {vlans.join(', ')})</small>
                          </span>
                        }
                        checked={floorFilters[floor as keyof FloorFilterType]}
                        onChange={(e) => {
                          setFloorFilters(prev => ({
                            ...prev,
                            [floor as keyof FloorFilterType]: e.target.checked
                          }));
                        }}
                        className="user-select-none"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <div className="table-responsive">
                {loadingAvailableAssets ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" />
                    <p className="mt-2">Đang tải danh sách thiết bị...</p>
                  </div>
                ) : (
                  <>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th style={{ width: '50px' }}></th>
                          <th>Mã thiết bị</th>
                          <th>Tên thiết bị</th>
                          <th>Loại</th>
                          <th>Thương hiệu</th>
                          <th>Model</th>
                          <th>Trạng thái</th>
                          <th>IP / Tầng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAssets.flatMap((asset: Asset) => {
                          const isChecked = selectedAssetsAllType.some(a => a.asset_id === asset.asset_id);
                          const assetType = asset.status_name === 'New' ? 'New' : (asset.status_name === 'Đang sử dụng' ? 'inuse' : 'delete');
                          const rows: React.ReactNode[] = [
                            <tr key={asset.asset_id}>
                              <td className="text-center">
                                <Form.Check
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedAssetsAllType(prev => [...prev, asset]);
                                      setMultiAssignData(prev => ({ ...prev, [asset.asset_id]: {} }));
                                    } else {
                                      setSelectedAssetsAllType(prev => prev.filter(a => a.asset_id !== asset.asset_id));
                                      setMultiAssignData(prev => {
                                        const copy = { ...prev };
                                        delete copy[asset.asset_id];
                                        return copy;
                                      });
                                      setMultiAvailableIPs(prevIPs => {
                                        const copy = { ...prevIPs };
                                        delete copy[String(asset.asset_id)];
                                        return copy;
                                      });
                                    }
                                  }}
                                />
                              </td>
                              <td>{asset.asset_code}</td>
                              <td>{asset.asset_name}</td>
                              <td>{asset.category_name}</td>
                              <td>{asset.brand}</td>
                              <td>{asset.model}</td>
                              <td>
                                <span className={`badge bg-${getStatusBadgeClass(asset.status_name)}`}>{asset.status_name}</span>
                              </td>
                              <td>
                                {asset.ip_address && asset.ip_address !== ''
                                  ? (
                                    typeof asset.ip_address === 'string'
                                      ? asset.ip_address.split(', ')
                                      : asset.ip_address
                                  ).map((ip: string) => (
                                    <div key={asset.asset_id + '-' + ip}>
                                      {ip}
                                      <div className="text-muted small">Tầng: {getFloorFromIP(ip) || 'Không xác định'}</div>
                                    </div>
                                  ))
                                  : <span className="text-muted">Không có IP</span>
                                }
                              </td>
                            </tr>
                          ];
                          if (isChecked && assetType !== 'delete') {
                            rows.push(
                              <tr key={asset.asset_id + '-extra'}>
                                <td colSpan={8} style={{ background: '#f8f9fa' }}>
                                  <div className="d-flex align-items-center gap-4">
                                    <div>
                                      <Form.Label className="mb-0">Tầng:</Form.Label>
                                      <Form.Select
                                        value={multiAssignData[String(asset.asset_id)]?.floor || ''}
                                        onChange={e => handleMultiAssignFloorChange(String(asset.asset_id), e.target.value, multiAssignData[String(asset.asset_id)]?.ipType || 'DHCP')}
                                        style={{ width: 120, display: 'inline-block', marginLeft: 8 }}
                                      >
                                        <option value="">Chọn tầng</option>
                                        {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                      </Form.Select>
                                    </div>
                                    <div>
                                      <Form.Label className="mb-0">IP Type:</Form.Label>
                                      <Form.Select
                                        value={multiAssignData[String(asset.asset_id)]?.ipType || 'DHCP'}
                                        onChange={e => {
                                          const ipType = e.target.value as 'DHCP' | 'FIXED';
                                          setMultiAssignData(prev => ({ ...prev, [String(asset.asset_id)]: { ...prev[String(asset.asset_id)], ipType, ip: '' } }));
                                          const floor = multiAssignData[String(asset.asset_id)]?.floor;
                                          if (floor) fetchMultiIPs(String(asset.asset_id), floor, ipType);
                                        }}
                                        style={{ width: 120, display: 'inline-block', marginLeft: 8 }}
                                      >
                                        <option value="DHCP">DHCP</option>
                                        <option value="FIXED">FIX</option>
                                      </Form.Select>
                                    </div>
                                    <div>
                                      <Form.Label className="mb-0">IP:</Form.Label>
                                      <Form.Select
                                        value={multiAssignData[String(asset.asset_id)]?.ip || ''}
                                        onChange={e => setMultiAssignData(prev => ({ ...prev, [String(asset.asset_id)]: { ...prev[String(asset.asset_id)], ip: e.target.value } }))}
                                        style={{ width: 180, display: 'inline-block', marginLeft: 8 }}
                                        disabled={!multiAssignData[String(asset.asset_id)]?.floor}
                                      >
                                        <option value="">Chọn IP</option>
                                        {(multiAvailableIPs[String(asset.asset_id)] || []).map(ip => (
                                          <option key={ip} value={ip}>{ip}</option>
                                        ))}
                                      </Form.Select>
                                      {assetType === 'New' && <span className="text-danger ms-2">* Bắt buộc</span>}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                          return rows;
                        })}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <nav>
                          <ul className="pagination">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                                Đầu
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                Trước
                              </button>
                            </li>
                            {/* Logic hiển thị số trang rút gọn */}
                            {(() => {
                              const pageNumbers = [];
                              const maxPage = totalPages;
                              const delta = 2; // số trang lân cận
                              let left = Math.max(1, currentPage - delta);
                              let right = Math.min(maxPage, currentPage + delta);
                              if (currentPage - 1 <= delta) right = Math.min(maxPage, 1 + 2 * delta);
                              if (maxPage - currentPage <= delta) left = Math.max(1, maxPage - 2 * delta);
                              for (let i = 1; i <= maxPage; i++) {
                                if (i === 1 || i === maxPage || (i >= left && i <= right)) {
                                  pageNumbers.push(i);
                                } else if (
                                  (i === left - 1 && left > 2) ||
                                  (i === right + 1 && right < maxPage - 1)
                                ) {
                                  pageNumbers.push('...');
                                }
                              }
                              return pageNumbers.map((page, idx) => {
                                if (page === '...') {
                                  return (
                                    <li key={`ellipsis-${idx}`} className="page-item disabled">
                                      <span className="page-link">...</span>
                                    </li>
                                  );
                                }
                                return (
                                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(page as number)}>
                                      {page}
                                    </button>
                                  </li>
                                );
                              });
                            })()}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                Sau
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
                                Cuối
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Form.Group>

            {selectedAssetType === 'Chờ xóa' && selectedFloor && false && (
              <Form.Group className="mb-3">
                <div className="floor-selection-container">
                  <div className="floor-selection-title">
                    <i className="fas fa-building"></i>
                    Chọn tầng cấp phát
                  </div>
                  <div className="floor-options-container">
                    {assignmentData.floor.split(' ').map((floor, index) => (
                      <div key={index} className="floor-option">
                        <input
                          type="checkbox"
                          id={`floor-${floor}`}
                          name="floor"
                          value={floor}
                          checked={true}
                          disabled
                        />
                        <label htmlFor={`floor-${floor}`}>
                          <i className="fas fa-building"></i>
                          <span>{floor}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </Form.Group>
            )}



            <Form.Group className="mb-3">
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="note"
                value={assignmentData.note}
                onChange={handleAssignmentChange}
                placeholder="Nhập ghi chú"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseAssignModal}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={
                  assignLoading ||
                  selectedAssetsAllType.length === 0 ||
                  selectedAssetsAllType.some(asset => {
                    // Chỉ so sánh đúng 'new'
                    if (asset.status_name === 'new') {
                      const data = multiAssignData[String(asset.asset_id)] || {};
                      return !data.floor || !data.ip;
                    }
                    return false;
                  })
                }
                onClick={handleMultiAssign}
              >
                {assignLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Đang xử lý...
                  </>
                ) : (
                  'Cấp phát'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Handover Modal */}
      <Modal show={showHandoverModal} onHide={() => setShowHandoverModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Bàn giao thiết bị</Modal.Title>
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
                  <th style={{ width: '50px' }}></th>
                  <th>Mã thiết bị</th>
                  <th>Tên thiết bị</th>
                  <th>Trạng thái</th>
                  <th>Ngày cấp</th>
                </tr>
              </thead>
              <tbody>
                {userAssets
                  .filter(asset => asset.history_status === 'Chờ bàn giao')
                  .map(asset => (
                    <tr key={asset.asset_id}>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={selectedAssets.includes(asset.asset_id)}
                          onChange={() => toggleAssetSelection(asset.asset_id)}
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
            {userAssets.filter(asset => asset.history_status === 'Chờ bàn giao').length === 0 && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                Không có thiết bị nào đang ở trạng thái "Chờ bàn giao"
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowHandoverModal(false);
            setError('');
            setSelectedAssets([]);
          }}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleHandoverAssets}
            disabled={handoverLoading || selectedAssets.length === 0}
          >
            {handoverLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Xác nhận bàn giao
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Import File Modal */}
      <Modal show={showImportModal} onHide={handleCloseImportModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Files</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {importError && (
            <Alert variant="danger">{importError}</Alert>
          )}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <Button
                variant="outline-primary"
                onClick={handleOpenFolder}
                disabled={fileLoading}
              >
                {fileLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Đang mở folder...
                  </>
                ) : (
                  <>
                    <i className="fas fa-folder-open me-2"></i>
                    Mở Folder
                  </>
                )}
              </Button>
            </div>
          </div>

          {folderStatus.type && (
            <Alert variant={folderStatus.type} className="mt-3">
              <div className="d-flex align-items-center">
                <i className={`fas fa-${folderStatus.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                <div>
                  {folderStatus.message.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
            </Alert>
          )}

          <div
            className="upload-zone p-4 text-center border rounded mb-3"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: '2px dashed #ccc',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            <input
              type="file"
              multiple
              onChange={handleMultipleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />

            <div onClick={() => fileInputRef.current?.click()}>
              <i className="fas fa-cloud-upload-alt fa-3x text-primary mb-3"></i>
              <h5>Kéo thả files vào đây hoặc click để chọn</h5>
              <p className="text-muted">Hỗ trợ nhiều file</p>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h6>Files đã chọn:</h6>
              <div className="list-group">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-file me-2"></i>
                      {file.name}
                      <small className="text-muted ms-2">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </small>
                    </div>
                    <Button
                      variant="link"
                      className="text-danger"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-3">
              <div className="progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${uploadProgress.total || 0}%` }}
                  aria-valuenow={uploadProgress.total || 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {uploadProgress.total}%
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseImportModal}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleMultipleFileUpload}
            disabled={selectedFiles.length === 0 || importLoading}
          >
            {importLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang upload...
              </>
            ) : (
              <>
                <i className="fas fa-upload me-2"></i>
                Upload {selectedFiles.length} file(s)
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

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
      <Modal show={showUnregisterModal} onHide={() => setShowUnregisterModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Hủy đăng ký thiết bị</Modal.Title>
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
                  .filter(asset =>
                    asset.history_status === 'Đã đăng ký' ||
                    asset.history_status === 'Chờ bàn giao' ||
                    asset.history_status === 'Cấp phát chờ xóa'
                  )
                  .map(asset => (
                    <tr key={asset.asset_id}>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={selectedUnregisterAssets.includes(asset.asset_id)}
                          onChange={() => toggleUnregisterAssetSelection(asset.asset_id)}
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
            {userAssets.filter(asset => asset.history_status === 'Đã đăng ký' || asset.history_status === 'Chờ bàn giao' || asset.history_status === 'Cấp phát chờ xóa').length === 0 && (
              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                Không có thiết bị nào đang ở trạng thái "Đã đăng ký" hoặc "Chờ bàn giao"
              </Alert>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowUnregisterModal(false);
            setError('');
            setSelectedUnregisterAssets([]);
          }}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleUnregisterAssets}
            disabled={unregisterLoading || selectedUnregisterAssets.length === 0}
          >
            {unregisterLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Xác nhận hủy đăng ký
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

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
    </Layout>
  );
}

<style>
  {`
  .modal-90w {
    max-width: 90%;
    width: 1200px;
  }
  .modal-90w .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
  }
  .modal-90w .modal-title {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .action-button {
    min-width: 150px;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  .action-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .action-button i {
    font-size: 1rem;
  }

  .btn-outline-primary.action-button {
    border-color: #0d6efd;
    color: #0d6efd;
  }

  .btn-outline-primary.action-button:hover {
    background-color: #0d6efd;
    color: white;
  }

  .btn-outline-success.action-button {
    border-color: #198754;
    color: #198754;
  }

  .btn-outline-success.action-button:hover {
    background-color: #198754;
    color: white;
  }

  .btn-outline-warning.action-button {
    border-color: #ffc107;
    color: #ffc107;
  }

  .btn-outline-warning.action-button:hover {
    background-color: #ffc107;
    color: black;
  }

  .btn-outline-danger.action-button {
    border-color: #dc3545;
    color: #dc3545;
  }

  .btn-outline-danger.action-button:hover {
    background-color: #dc3545;
    color: white;
  }

  .floor-filter-container {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .floor-filter-title {
    font-weight: 600;
    margin-bottom: 12px;
  }

  .floor-filter-options {
    display: flex;
    gap: 24px;
  }

  .floor-filter-option {
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
    cursor: pointer;
  }

  .floor-filter-option:hover {
    color: #0d6efd;
  }

  .floor-filter-container {
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .floor-filter-container .form-check {
    padding-left: 0;
    margin-right: 16px;
  }

  .floor-filter-container .form-check-input {
    margin-right: 8px;
  }

  .floor-filter-container .form-check-label {
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .floor-filter-container .form-check-label:hover {
    color: #0d6efd;
  }
`}
</style> 