import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Card, Row, Col, Table, Container, Modal, Form, Toast } from 'react-bootstrap';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import { AxiosError } from 'axios';
import styles from './AssetDetail.module.css';
import type { Asset, AssetHistory } from '../../types/typeAsset';
import { useTranslation } from 'react-i18next';
import { updateNetworkSegment } from '../../services/networkSegmentService';

export default function AssetDetail() {
  const { assetCode } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedAsset, setEditedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<AssetHistory | null>(null);
  const [handoverPerson, setHandoverPerson] = useState<{ full_name: string } | null>(null);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairData, setRepairData] = useState({
    repair_date: new Date().toISOString().split('T')[0],
    repaired_by: '',
    repair_description: '',
    cost: '',
    next_maintenance_date: '',
    notes: '',
    repair_status: 'Đã yêu cầu sửa'
  });
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [assignPage, setAssignPage] = useState(1);
  const [assignRowsPerPage, setAssignRowsPerPage] = useState(10);
  const [multiAssignData, setMultiAssignData] = useState<{ [empId: number]: { floor?: string, ip?: string, ipType?: 'DHCP' | 'FIXED' } }>({});
  const [multiAvailableIPs, setMultiAvailableIPs] = useState<{ [empId: number]: string[] }>({});
  const { t } = useTranslation();

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!assetCode) {
        setError('Mã thiết bị không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const assetResponse = await axios.get(`/asset/${assetCode}`);

        if (!assetResponse.data) {
          setError('Không tìm thấy thông tin thiết bị');
          setLoading(false);
          return;
        }
        setAsset(assetResponse.data);

        try {
          const historyResponse = await axios.get(`/asset/${assetResponse.data.asset_id}/history`);

          setHistory(historyResponse.data);
        } catch (historyErr) {

          setHistory([]);
        }

        try {
          const repairResponse = await axios.get(`/asset/${assetCode}/repair-history`);
          setRepairHistory(repairResponse.data);
        } catch (repairErr) {

          setRepairHistory([]);
        }

      } catch (err) {

        if (err instanceof AxiosError) {

          if (err.response?.status === 404) {
            setError('Không tìm thấy thiết bị');
          } else {
            setError('Không thể tải thông tin chi tiết thiết bị');
          }
        } else {
          setError('Đã xảy ra lỗi không xác định');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [assetCode]);


  useEffect(() => {
    if (showAssignModal) {
      setLoadingEmployees(true);
      axios.get('/auth/employees')
        .then(res => setEmployees(res.data))
        .catch(() => setEmployees([]))
        .finally(() => setLoadingEmployees(false));
    }
  }, [showAssignModal]);

  const handleSelectEmployee = (empId: number) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.employee_id));
    }
  };

  const fetchMultiIPs = async (empId: number, floor: string, ipType: 'DHCP' | 'FIXED' = 'DHCP') => {
    let fakeIPs: string[] = [];
    if (floor === '1F') fakeIPs = ipType === 'DHCP' ? ['172.25.166.10', '172.25.166.11'] : ['172.25.166.100', '172.25.166.101'];
    else if (floor === '2F') fakeIPs = ipType === 'DHCP' ? ['172.25.168.20', '172.25.168.21'] : ['172.25.168.120', '172.25.168.121'];
    else fakeIPs = ipType === 'DHCP' ? ['172.25.164.30'] : ['172.25.164.130'];
    setMultiAvailableIPs(prev => ({ ...prev, [empId]: fakeIPs }));
  };

  const handleMultiAssignFloorChange = async (empId: number, floor: string, ipType: 'DHCP' | 'FIXED' = 'DHCP') => {
    setMultiAssignData(prev => ({ ...prev, [empId]: { ...prev[empId], floor, ip: '', ipType } }));
    if (floor) {
      await fetchMultiIPs(empId, floor, ipType);
    } else {
      setMultiAvailableIPs(prev => ({ ...prev, [empId]: [] }));
    }
  };

  const handleMultiAssignIPTypeChange = async (empId: number, ipType: 'DHCP' | 'FIXED') => {
    const floor = multiAssignData[empId]?.floor || '';
    setMultiAssignData(prev => ({ ...prev, [empId]: { ...prev[empId], ipType, ip: '' } }));
    if (floor) {
      await fetchMultiIPs(empId, floor, ipType);
    }
  };

  const handleMultiAssignIPChange = (empId: number, ip: string) => {
    setMultiAssignData(prev => ({ ...prev, [empId]: { ...prev[empId], ip } }));
  };

  const validateMultiAssign = () => {
    for (const empId of selectedEmployees) {
      const emp = employees.find(e => e.employee_id === empId);
      if (!emp) continue;
      const status = asset?.status_name || 'New';

      if (status !== 'Chờ xóa' && status !== 'Chờ xóa') {
        if (!multiAssignData[empId]?.floor) {
          return `Nhân viên ${emp.full_name} phải chọn tầng!`;
        }
        if (status !== 'Đang sử dụng' && !multiAssignData[empId]?.ip) {
          return `Nhân viên ${emp.full_name} phải chọn IP!`;
        }
      }
    }
    return null;
  };

  const handleMultiAssign = async () => {
    const error = validateMultiAssign();
    if (error) {
      setToastVariant('danger');
      setToastMessage(error);
      setShowToast(true);
      return;
    }

    try {
      setUpdating(true);
      setError('');

      for (const empId of selectedEmployees) {
        const emp = employees.find(e => e.employee_id === empId);
        if (!emp) continue;

        if (asset?.status_name === 'Chờ xóa') {
          if (!asset.ip_address) {
            setToastVariant('danger');
            setToastMessage('Thiết bị không có IP');
            setShowToast(true);
            return;
          }

          const ips = typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address;
          const floors = ips.map((ip: string) => getFloorFromIP(ip)).filter(Boolean);
          const floorString = floors.join(' ');

          const employeeId = localStorage.getItem('employee_id');

          if (!employeeId) {
            setToastVariant('danger');
            setToastMessage('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            setShowToast(true);
            return;
          }

          const payload = {
            asset_id: asset.asset_id,
            department_id: emp.department_id,
            handover_by: employeeId,
            floor: floorString,
            note: `Cấp phát thiết bị ${asset.asset_code} cho nhân viên ${emp.full_name}`,
            is_handover: true
          };

          await axios.post(`/asset/users/${emp.emp_code}/assign-delete-asset`, payload);
        } else {
          const assignData = multiAssignData[empId] || {};
          const employeeId = localStorage.getItem('employee_id');

          const payload = {
            asset_id: asset?.asset_id,
            department_id: emp.department_id,
            handover_by: employeeId,
            floor: assignData.floor || '',
            history_status: 'Đã đăng ký',
            note: `Cấp phát thiết bị ${asset?.asset_code} cho nhân viên ${emp.full_name}`,
            is_handover: asset?.status_name === 'Đang sử dụng' ? false : true,
            ip_address: assignData.ip ? [assignData.ip] : []
          };

          await axios.post(`/auth/users/${emp.emp_code}/assign-asset`, payload);

          if (assignData.ip) {
            const ipUpdate = {
              ip: assignData.ip,
              status: "Registered",
              ipType: assignData.ipType || 'DHCP'
            };
            await updateNetworkSegment(ipUpdate);
          }
        }
      }

      const detailResponse = await axios.get(`/asset/${asset?.asset_code}`);
      setAsset(detailResponse.data);

      const historyResponse = await axios.get(`/asset/${asset?.asset_id}/history`);
      setHistory(historyResponse.data);

      setToastVariant('success');
      setToastMessage('Cấp phát thiết bị thành công');
      setShowToast(true);
      setShowAssignModal(false);
      setSelectedEmployees([]);
      setMultiAssignData({});
      setMultiAvailableIPs({});

    } catch (err: any) {
      setToastVariant('danger');
      setToastMessage(err.response?.data?.message || 'Không thể cấp phát thiết bị');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const getFloorFromIP = (ip: string): string | null => {
    if (!ip) return null;

    if (ip.startsWith('172.25.166.')) return '1F';
    if (ip.startsWith('172.25.168.')) return '2F';
    if (ip.startsWith('172.25.164.')) return 'BF';

    return null;
  };

  const handleEdit = () => {
    setEditedAsset({ ...asset! });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    const updateData = {
      asset_name: editedAsset?.asset_name,
      brand: editedAsset?.brand,
      model: editedAsset?.model,
      serial_number: editedAsset?.serial_number,
      os: editedAsset?.os,
      OS: editedAsset?.OS,
      OFFICE: editedAsset?.OFFICE,
      office: editedAsset?.office,
      configuration: editedAsset?.configuration,
      software_used_name: editedAsset?.software_used_name,
      type: editedAsset?.type,
      ip_address: editedAsset?.ip_address,
      mac_address: editedAsset?.mac_address,
      mac_wifi: editedAsset?.mac_wifi,
      hub: editedAsset?.hub,
      vcs_lan_no: editedAsset?.vcs_lan_no,
      factory_area: editedAsset?.factory_area,
      purchase_date: editedAsset?.purchase_date,
      purchase_price: editedAsset?.purchase_price,
      start_use_date: editedAsset?.start_use_date,
      warranty_expiry: editedAsset?.warranty_expiry,
      maintenance_cycle: editedAsset?.maintenance_cycle,
      status_id: editedAsset?.status_id,
      category_id: editedAsset?.category_id,
      belongs_to_dept_id: editedAsset?.belongs_to_dept_id,
      vendor_id: editedAsset?.vendor_id,
      location_id: editedAsset?.location_id,
      upgrade_infor: editedAsset?.upgrade_infor,
      notes: editedAsset?.notes
    };
    try {
      setUpdating(true);
      setError('');

      await axios.put(`/asset/${asset?.asset_code}`, updateData);
      setToastVariant('success');
      setToastMessage('Cập nhật thông tin thiết bị thành công');

      const detailResponse = await axios.get(`/asset/${asset?.asset_code}`);
      setAsset(detailResponse.data);

      setShowEditModal(false);
      setShowToast(true);

    } catch (err: any) {
      setToastVariant('danger');
      setToastMessage(err.response?.data?.message || 'Không thể cập nhật thông tin');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'Không có';

    const numberStr = Math.round(value).toString();

    const parts = [];
    for (let i = numberStr.length; i > 0; i -= 3) {
      parts.unshift(numberStr.slice(Math.max(0, i - 3), i));
    }

    return parts.join('.') + ',000 VNĐ';
  };

  const repairStatusToKey = (status: string) => {
    switch (status.toLowerCase()) {
      case 'đã yêu cầu sửa':
      case 'requested':
        return 'requested';
      case 'đang sửa chữa':
      case 'repairing':
        return 'repairing';
      case 'đã sửa xong và chưa bàn giao':
      case 'fixed':
        return 'fixed';
      case 'đã bàn giao':
      case 'delivered':
        return 'delivered';
      default:
        return status;
    }
  };

  const statusNameToKey = (statusName: string) => {
    switch (statusName?.toLowerCase()) {
      case 'đang sử dụng':
      case 'in use':
        return 'inUse';
      case 'new':
      case 'đã đăng ký':
      case 'máy mới':
        return 'new@locales ';
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
      case 'đã hủy':
      case 'canceled':
        return 'canceled';
      case 'đã xóa':
      case 'deleted':
        return 'deleted';
      case 'đã trả lại':
      case 'returned':
        return 'returned';
      case 'ngưng sử dụng':
      case 'stopped':
        return 'stopped';
      case 'chờ bàn giao':
      case 'pending handover':
        return 'pendingHandover';
      case 'cấp phát chờ xóa':
      case 'pending allocation delete':
        return 'pendingAllocationDelete';
      case 'khác':
      case 'other':
        return 'other';
      default:
        return 'other';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (statusNameToKey(status)) {
      case 'inUse':
        return 'info';
      case 'new@locales ':
        return 'success';
      case 'error':
        return 'danger';
      case 'pending':
        return 'secondary';
      case 'replacing':
        return 'primary';
      case 'disposed':
        return 'danger';
      case 'installing':
        return 'warning';
      case 'canceled':
        return 'danger';
      case 'deleted':
        return 'dark';
      case 'returned':
        return 'info';
      case 'stopped':
        return 'warning';
      case 'pendingHandover':
        return 'warning';
      case 'pendingAllocationDelete':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleHistoryClick = async (record: AssetHistory) => {
    setSelectedHistory(record);
    setShowHistoryModal(true);

    try {
      const response = await axios.get(`/auth/users/${record.handover_by}/info`);
      setHandoverPerson(response.data);
    } catch (err) {
      setHandoverPerson(null);
    }
  };

  const handleOpenRepairModal = (repair?: any) => {
    if (repair) {
      setSelectedRepair(repair);
      setRepairData({
        repair_date: new Date(repair.repair_date).toISOString().split('T')[0],
        repaired_by: repair.repaired_by,
        repair_description: repair.repair_description,
        cost: repair.cost.toString(),
        next_maintenance_date: repair.next_maintenance_date ? new Date(repair.next_maintenance_date).toISOString().split('T')[0] : '',
        notes: repair.notes || '',
        repair_status: repair.repair_status
      });
      setIsEditing(true);
    } else {
      setSelectedRepair(null);
      setRepairData({
        repair_date: new Date().toISOString().split('T')[0],
        repaired_by: '',
        repair_description: '',
        cost: '',
        next_maintenance_date: '',
        notes: '',
        repair_status: 'Đã yêu cầu sửa'
      });
      setIsEditing(false);
    }
    setShowRepairModal(true);
  };

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...repairData,
        asset_id: asset?.asset_id,
        cost: Number(repairData.cost),
        next_maintenance_date: repairData.next_maintenance_date || null
      };

      if (isEditing) {
        await axios.put(`/asset/repair-history/${selectedRepair.repair_id}`, payload);
        setToastVariant('success');
        setToastMessage('Đã cập nhật lịch sử sửa chữa thành công');
      } else {
        await axios.post(`/asset/${assetCode}/repair-history`, payload);
        setToastVariant('success');
        setToastMessage('Đã thêm lịch sử sửa chữa thành công');
      }

      setShowToast(true);
      setShowRepairModal(false);

      const repairResponse = await axios.get(`/asset/${assetCode}/repair-history`);
      setRepairHistory(repairResponse.data);

      setRepairData({
        repair_date: new Date().toISOString().split('T')[0],
        repaired_by: '',
        repair_description: '',
        cost: '',
        next_maintenance_date: '',
        notes: '',
        repair_status: 'Đã yêu cầu sửa'
      });
    } catch (err) {
      console.error('Lỗi khi xử lý lịch sử sửa chữa:', err);
      setToastVariant('danger');
      setToastMessage('Không thể xử lý lịch sử sửa chữa');
      setShowToast(true);
    }
  };

  const handleDeleteRepair = async (repairId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử sửa chữa này?')) {
      try {
        await axios.delete(`/asset/repair-history/${repairId}`);
        setToastVariant('success');
        setToastMessage('Đã xóa lịch sử sửa chữa thành công');
        setShowToast(true);

        const repairResponse = await axios.get(`/asset/${assetCode}/repair-history`);
        setRepairHistory(repairResponse.data);
      } catch (err) {
        console.error('Lỗi khi xóa lịch sử sửa chữa:', err);
        setToastVariant('danger');
        setToastMessage('Không thể xóa lịch sử sửa chữa');
        setShowToast(true);
      }
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.emp_code?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.full_name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
    emp.department_name?.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  const totalAssignPages = Math.ceil(filteredEmployees.length / assignRowsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (assignPage - 1) * assignRowsPerPage,
    assignPage * assignRowsPerPage
  );

  useEffect(() => {
    setAssignPage(1);
  }, [searchEmployee]);

  if (loading) {
    return (
      <Layout>
        <Container className={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
          <p>{t('manageAssets.loading')}</p>
        </Container>
      </Layout>
    );
  }

  if (error || !asset) {
    return (
      <Layout>
        <Container className={styles.errorContainer}>
          <p className="text-danger">{error || t('manageAssets.messages.loadError')}</p>
          <Button variant="primary" onClick={() => navigate('/manage-assets')}>
            {t('header.backToList')}
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.assetDetailContainer}>
        <div className={styles.headerSection}>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className={styles.headerTitle}>{t('manageAssets.modals.detail.title')}</h1>
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={() => setShowAssignModal(true)}>
                <i className="fas fa-user-plus me-2"></i> Cấp phát thiết bị
              </Button>
              <Button variant="light" onClick={() => navigate('/manage-assets')}>
                {t('header.backToList')}
              </Button>
            </div>
          </div>
        </div>
        <Row className="g-2">
          <Col md={6}>
            <Card className={styles.infoCard}>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">{t('manageAssets.modals.detail.title')}</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-2">
                  <Col md={6}>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.assetCode')}:</strong> <span>{asset.asset_code}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.assetName')}:</strong> <span>{asset.asset_name}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.type')}:</strong> <span>{asset.category_name}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.brand')}:</strong> <span>{asset.brand}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.model')}:</strong> <span>{asset.model}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.table.status')}:</strong>{' '}
                      <span className={`badge bg-${getStatusBadgeClass(asset.status_name)}`}>
                        {t(`manageAssets.status.${statusNameToKey(asset.status_name)}`)}
                      </span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Số serial:</strong> <span>{asset.serial_number || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Cấu hình:</strong> <span>{asset.configuration || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Hệ điều hành:</strong> <span>{asset.OS || asset.os || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Office:</strong> <span>{asset.OFFICE || asset.office || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Phần mềm:</strong> <span>{asset.software_used_name || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Loại thiết bị:</strong> <span>{asset.type || t('header.noData')}</span>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.factoryArea')}:</strong> <span>{asset.factory_area || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.location')}:</strong> <span>{asset.location_name || asset.location_id || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.vendor')}:</strong> <span>{asset.vendor_name || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.macAddress')}:</strong> <span>{asset.mac_address || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Địa chỉ IP:</strong> <span>{Array.isArray(asset.ip_address) ? asset.ip_address.join(', ') : asset.ip_address || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>MAC WIFI:</strong> <span>{asset.mac_wifi || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Hub:</strong> <span>{asset.hub || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Số LAN VCS:</strong> <span>{asset.vcs_lan_no || t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.purchaseDate')}:</strong> <span>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('vi-VN') : t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.purchasePrice')}:</strong> <span>{formatCurrency(asset.purchase_price)}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.startUseDate')}:</strong> <span>{asset.start_use_date ? new Date(asset.start_use_date).toLocaleDateString('vi-VN') : t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>{t('manageAssets.modals.add.fields.warrantyExpiry')}:</strong> <span>{asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString('vi-VN') : t('header.noData')}</span>
                    </div>
                    <div className={styles.infoGroup}>
                      <strong>Chu kỳ bảo trì (tháng):</strong> <span>{asset.maintenance_cycle || t('header.noData')}</span>
                    </div>
                  </Col>
                </Row>
                <Card.Footer className="text-center">
                  <Button
                    variant="primary"
                    onClick={handleEdit}
                    className="w-100"
                  >
                    <i className="fas fa-edit me-2"></i>
                    {t('header.edit')}
                  </Button>
                </Card.Footer>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Usage History */}
          <Col md={6}>
            <Card className={styles.infoCard}>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">{t('manageAssets.table.status')}</h5>
              </Card.Header>
              <Card.Body>
                <div className={styles.tableContainer}>
                  <Table striped bordered hover responsive size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>{t('manageUser.table.employeeCode')}</th>
                        <th>{t('manageUser.table.fullName')}</th>
                        <th>{t('historyone.table.handoverDate')}</th>
                        <th>{t('manageAssets.table.status')}</th>
                        <th>{t('historyone.table.note')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? (
                        history.map((record) => (
                          <tr
                            key={record.history_id}
                            onClick={() => handleHistoryClick(record)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{record.emp_code || t('header.noData')}</td>
                            <td>{record.emp_name || t('header.noData')}</td>
                            <td>{new Date(record.handover_date).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <span className={`badge bg-${getStatusBadgeClass(record.history_status)}`}>
                                {t(`historyone.status.${statusNameToKey(record.history_status)}`)}
                              </span>
                            </td>
                            <td>{record.note || t('header.noData')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center">{t('historyone.noData')}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="g-2">
          <Col md={12}>
            <Card className={styles.infoCard}>
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('manageAssets.modals.detail.title')}</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover responsive size="sm">
                    <thead className="table-dark">
                      <tr>
                        <th>{t('historyDetail.deviceInfo.startUseDate')}</th>
                        <th>{t('manageAssets.modals.add.fields.vendor')}</th>
                        <th>{t('manageAssets.modals.add.fields.purchasePrice')}</th>
                        <th>{t('manageAssets.modals.add.fields.warrantyExpiry')}</th>
                        <th>{t('manageAssets.table.status')}</th>
                        <th>{t('header.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repairHistory.length > 0 ? (
                        repairHistory.map((repair) => (
                          <tr key={repair.repair_id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(repair.repair_date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{repair.repaired_by}</td>
                            <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repair.repair_description}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{Number(repair.cost).toLocaleString('vi-VN')} VNĐ</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{repair.next_maintenance_date ? new Date(repair.next_maintenance_date).toLocaleDateString('vi-VN') : '-'}</td>
                            <td>
                              <span className={`badge bg-${getStatusBadgeClass(repair.repair_status)}`}>
                                {t(`manageAssets.repairStatus.${repairStatusToKey(repair.repair_status)}`)}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleOpenRepairModal(repair)}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteRepair(repair.repair_id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center">{t('manageAssets.noData')}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* History Detail Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Chi tiết lịch sử sử dụng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedHistory && (
            <div className="history-detail">
              <Row className="g-4">
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="mb-3 text-primary">Thông tin nhân viên</h6>
                    <div className="info-group mb-3">
                      <strong>Mã nhân viên:</strong>
                      <span>{selectedHistory.emp_code || 'Không có'}</span>
                    </div>
                    <div className="info-group mb-3">
                      <strong>Họ và tên:</strong>
                      <span>{selectedHistory.emp_name || 'Không có'}</span>
                    </div>
                    <div className="info-group mb-3">
                      <strong>Phòng ban:</strong>
                      <span>{selectedHistory.department_name || 'Không có'}</span>
                    </div>
                    <div className="info-group mb-3">
                      <strong>Vị trí:</strong>
                      <span>{selectedHistory.position || 'Không có'}</span>
                    </div>

                    <div className="info-group mb-3">
                      <strong>Vị trí làm việc:</strong>
                      <span>{selectedHistory.location_position || 'Không có'}</span>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="info-section">
                    <h6 className="mb-3 text-primary">Thông tin bàn giao</h6>
                    <div className="info-group mb-3">
                      <strong>Người bàn giao:</strong>
                      <span>{selectedHistory.handover_by} - {handoverPerson?.full_name || 'Đang tải...'}</span>
                    </div>
                    <div className="info-group mb-3">
                      <strong>Ngày cấp:</strong>
                      <span>{new Date(selectedHistory.handover_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="info-group mb-3">
                      <strong>Ngày trả máy:</strong>
                      <span>{selectedHistory.returned_date ? new Date(selectedHistory.returned_date).toLocaleDateString('vi-VN') : ''}</span>
                    </div>
                    <div className="info-group mb-3">
                      <strong>Trạng thái:</strong>
                      <span className={`badge bg-${getStatusBadgeClass(selectedHistory.history_status)}`}>
                        {t(`historyone.status.${statusNameToKey(selectedHistory.history_status)}`)}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="info-section">
                    <h6 className="mb-3 text-primary">Ghi chú</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedHistory.note || 'Không có ghi chú'}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
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

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật thông tin thiết bị</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã thiết bị</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.asset_code || ''}
                    disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tên thiết bị</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.asset_name || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, asset_name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Loại thiết bị</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.category_name || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, category_name: e.target.value })}
                    disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Thương hiệu</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.brand || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, brand: e.target.value })} disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Model</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.model || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, model: e.target.value })} disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Số serial</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.serial_number || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, serial_number: e.target.value })} disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Hệ điều hành</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.os || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, os: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={editedAsset?.status_id || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, status_id: Number(e.target.value) })}
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="1">Đang sử dụng</option>
                    <option value="2">Đang bị lỗi</option>
                    <option value="3">New</option>
                    <option value="4">Chưa bàn giao</option>
                    <option value="5">Đang cài đặt</option>
                    <option value="6">Đang đổi máy</option>
                    <option value="7">Chờ xóa</option>
                    <option value="8">Khác</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ IP</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.ip_address || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, ip_address: e.target.value ? [e.target.value] : [] })} disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cấu hình</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.configuration || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, configuration: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Office</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.OFFICE || editedAsset?.office || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, OFFICE: e.target.value, office: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phần mềm</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.software_used_name || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, software_used_name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Loại thiết bị</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.type || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, type: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Khu vực nhà máy</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.factory_area || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, factory_area: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Vị trí</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.location_id || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, location_name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nhà cung cấp</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.vendor_name || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, vendor_name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ MAC</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.mac_address || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, mac_address: e.target.value })} disabled
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày mua</Form.Label>
                  <Form.Control
                    type="date"
                    value={editedAsset?.purchase_date ? new Date(editedAsset.purchase_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, purchase_date: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Giá mua (VNĐ)</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.purchase_price ? Math.round(editedAsset.purchase_price).toLocaleString('vi-VN').replace(/\./g, ',').replace(/,/g, '.') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setEditedAsset({
                        ...editedAsset!,
                        purchase_price: value ? Number(value) : undefined
                      });
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày bắt đầu sử dụng</Form.Label>
                  <Form.Control
                    type="date"
                    value={editedAsset?.start_use_date ? new Date(editedAsset.start_use_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, start_use_date: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Hạn bảo hành</Form.Label>
                  <Form.Control
                    type="date"
                    value={editedAsset?.warranty_expiry ? new Date(editedAsset.warranty_expiry).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, warranty_expiry: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>MAC WIFI</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.mac_wifi || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, mac_wifi: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Hub</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.hub || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, hub: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Số LAN VCS</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.vcs_lan_no || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, vcs_lan_no: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Chu kỳ bảo trì (tháng)</Form.Label>
                  <Form.Control
                    type="number"
                    value={editedAsset?.maintenance_cycle || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, maintenance_cycle: Number(e.target.value) })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Thông tin nâng cấp</Form.Label>
                  <Form.Control
                    type="text"
                    value={editedAsset?.upgrade_infor || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, upgrade_infor: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editedAsset?.notes || ''}
                    onChange={(e) => setEditedAsset({ ...editedAsset!, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Đang cập nhật...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Repair History Modal */}
      <Modal show={showRepairModal} onHide={() => setShowRepairModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{isEditing ? 'Cập nhật lịch sử sửa chữa' : 'Thêm lịch sử sửa chữa'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRepairSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày sửa chữa</Form.Label>
                  <Form.Control
                    type="date"
                    name="repair_date"
                    value={repairData.repair_date}
                    onChange={(e) => setRepairData({ ...repairData, repair_date: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Người/Đơn vị sửa chữa</Form.Label>
                  <Form.Control
                    type="text"
                    name="repaired_by"
                    value={repairData.repaired_by}
                    onChange={(e) => setRepairData({ ...repairData, repaired_by: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Chi phí (VNĐ)</Form.Label>
                  <Form.Control
                    type="number"
                    name="cost"
                    value={repairData.cost}
                    onChange={(e) => setRepairData({ ...repairData, cost: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    name="repair_status"
                    value={repairData.repair_status}
                    onChange={(e) => setRepairData({ ...repairData, repair_status: e.target.value })}
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
                    value={repairData.next_maintenance_date}
                    onChange={(e) => setRepairData({ ...repairData, next_maintenance_date: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mô tả nội dung sửa chữa</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="repair_description"
                    value={repairData.repair_description}
                    onChange={(e) => setRepairData({ ...repairData, repair_description: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={repairData.notes}
                    onChange={(e) => setRepairData({ ...repairData, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowRepairModal(false)}>
                Hủy
              </Button>
              <Button type="submit" variant="primary">
                Lưu thông tin
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal cấp phát thiết bị cho nhiều người dùng */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="xl" dialogClassName="modal-90w">
        <Modal.Header closeButton>
          <Modal.Title>Cấp phát thiết bị cho nhiều người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingEmployees ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <div>Đang tải danh sách nhân viên...</div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center text-muted py-4">Không có nhân viên nào.</div>
          ) : (
            <>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm theo mã, tên hoặc phòng ban..."
                  value={searchEmployee}
                  onChange={e => setSearchEmployee(e.target.value)}
                />
              </div>
              <div className="table-responsive">
                <Table bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedEmployees.length === employees.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Mã NV</th>
                      <th>Họ tên</th>
                      <th>Phòng ban</th>
                      <th>Tầng</th>
                      <th>Loại IP</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployees.map(emp => {
                      const isChecked = selectedEmployees.includes(emp.employee_id);
                      return (
                        <tr key={emp.employee_id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectEmployee(emp.employee_id)}
                            />
                          </td>
                          <td>{emp.emp_code}</td>
                          <td>{emp.full_name}</td>
                          <td>{emp.department_name}</td>
                          <td>
                            {isChecked && asset?.status_name !== 'Chờ xóa' && (
                              <select
                                className="form-select form-select-sm"
                                value={multiAssignData[emp.employee_id]?.floor || ''}
                                onChange={e => handleMultiAssignFloorChange(emp.employee_id, e.target.value, multiAssignData[emp.employee_id]?.ipType || 'DHCP')}
                              >
                                <option value="">Chọn tầng</option>
                                <option value="1F">1F</option>
                                <option value="2F">2F</option>
                                <option value="BF">BF</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {isChecked && asset?.status_name !== 'Chờ xóa' && (
                              <select
                                className="form-select form-select-sm"
                                value={multiAssignData[emp.employee_id]?.ipType || 'DHCP'}
                                onChange={e => handleMultiAssignIPTypeChange(emp.employee_id, e.target.value as 'DHCP' | 'FIXED')}
                                disabled={!multiAssignData[emp.employee_id]?.floor}
                              >
                                <option value="DHCP">DHCP</option>
                                <option value="FIXED">FIX</option>
                              </select>
                            )}
                          </td>
                          <td>
                            {isChecked && asset?.status_name !== 'Chờ xóa' && (
                              <select
                                className="form-select form-select-sm"
                                value={multiAssignData[emp.employee_id]?.ip || ''}
                                onChange={e => handleMultiAssignIPChange(emp.employee_id, e.target.value)}
                                disabled={!multiAssignData[emp.employee_id]?.floor}
                              >
                                <option value="">Chọn IP {asset?.status_name === 'Đang sử dụng' ? '(tùy chọn)' : ''}</option>
                                {(multiAvailableIPs[emp.employee_id] || []).map(ip => (
                                  <option key={ip} value={ip}>{ip}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              {/* Phân trang */}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <div>
                  <span>
                    Hiển thị {filteredEmployees.length === 0 ? 0 : (assignPage - 1) * assignRowsPerPage + 1}
                    -{Math.min(assignPage * assignRowsPerPage, filteredEmployees.length)} trong tổng số {filteredEmployees.length} nhân viên
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span>Số dòng/trang:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 70 }}
                    value={assignRowsPerPage}
                    onChange={e => {
                      setAssignRowsPerPage(Number(e.target.value));
                      setAssignPage(1);
                    }}
                  >
                    {[5, 10, 20, 50].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item${assignPage === 1 ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => setAssignPage(1)} disabled={assignPage === 1}>&laquo;</button>
                      </li>
                      <li className={`page-item${assignPage === 1 ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => setAssignPage(assignPage - 1)} disabled={assignPage === 1}>&lsaquo;</button>
                      </li>
                      <li className="page-item disabled">
                        <span className="page-link">{assignPage}/{totalAssignPages}</span>
                      </li>
                      <li className={`page-item${assignPage === totalAssignPages ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => setAssignPage(assignPage + 1)} disabled={assignPage === totalAssignPages}>&rsaquo;</button>
                      </li>
                      <li className={`page-item${assignPage === totalAssignPages ? ' disabled' : ''}`}>
                        <button className="page-link" onClick={() => setAssignPage(totalAssignPages)} disabled={assignPage === totalAssignPages}>&raquo;</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleMultiAssign}
            disabled={selectedEmployees.length === 0}
          >
            Xác nhận cấp phát
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}
