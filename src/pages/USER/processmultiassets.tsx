import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner, Modal, Form, Table } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { fetchNetworkSegments, updateNetworkSegment } from '../../services/networkSegmentService';
import type { Asset, User, FloorFilterType } from '../../types/typeUserDetail';

const FLOOR_VLANS = {
    '1F': ['166', '167'],
    '2F': ['168', '169'],
    'BF': ['164']
};

const FLOOR_OPTIONS = ['1F', '2F', 'BF'];

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

interface ProcessMultiAssetsModalProps {
    show: boolean;
    onHide: () => void;
    user: User | null;
    onAssetsAssigned: () => void;
}

const ProcessMultiAssetsModal: React.FC<ProcessMultiAssetsModalProps> = ({ show, onHide, user, onAssetsAssigned }) => {

    const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
    const [availableInUseAssets, setAvailableInUseAssets] = useState<Asset[]>([]);
    const [availableDeleteAssets, setAvailableDeleteAssets] = useState<Asset[]>([]);
    const [loadingAvailableAssets, setLoadingAvailableAssets] = useState(false);
    const [selectedAssetType, setSelectedAssetType] = useState<'new' | 'Đang sử dụng' | 'Chờ xóa' | 'all'>('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [floorFilters, setFloorFilters] = useState<FloorFilterType>({
        'BF': false,
        '1F': false,
        '2F': false
    });

    const [selectedAssetsAllType, setSelectedAssetsAllType] = useState<Asset[]>([]);
    const [multiAssignData, setMultiAssignData] = useState<{ [assetId: string]: { floor?: string, ip?: string, ipType?: 'DHCP' | 'FIXED', note?: string } }>({});
    const [multiAvailableIPs, setMultiAvailableIPs] = useState<{ [assetId: string]: string[] }>({});

    const fetchAvailableAssets = async () => {
        if (!user?.emp_code) return;
        setLoadingAvailableAssets(true);
        try {
            const [newAssetsRes, inUseAssetsRes, deleteAssetsRes] = await Promise.all([
                axios.get(`/auth/users/${user.emp_code}/available-assets`),
                axios.get(`/auth/users/${user.emp_code}/available-assets2`),
                axios.get(`/auth/users/${user.emp_code}/available-assets3`),
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

    useEffect(() => {
        if (show) {
            fetchAvailableAssets();
        }
    }, [show, user?.emp_code]);

    const handleCloseAssignModal = () => {
        onHide();
        setSelectedAssetType('new');
        setSearchTerm('');
        setSelectedAssetsAllType([]);
        setMultiAssignData({});
        setMultiAvailableIPs({});
        setFloorFilters({ 'BF': false, '1F': false, '2F': false });
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
    }, [selectedAssetType, searchTerm, floorFilters]); // Add floorFilters to dependencies

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

    const handleMultiAssignFloorChange = async (assetId: string, floor: string, ipType: 'DHCP' | 'FIXED' = 'DHCP') => {
        setMultiAssignData(prev => ({ ...prev, [assetId]: { ...prev[assetId], floor, ip: '', ipType } }));
        if (floor) {
            await fetchMultiIPs(assetId, floor, ipType);
        } else {
            setMultiAvailableIPs(prev => ({ ...prev, [assetId]: [] }));
        }
    };

    const handleMultiAssign = async () => {
        if (!user?.emp_code || selectedAssetsAllType.length === 0) return;
        setAssignLoading(true);
        try {
            const newAssets = selectedAssetsAllType.filter(a => a.status_name === 'New');
            const inuseAssets = selectedAssetsAllType.filter(a => a.status_name === 'Đang sử dụng');
            const deleteAssets = selectedAssetsAllType.filter(a => a.status_name === 'Chờ xóa');

            for (const asset of newAssets) {
                const data = multiAssignData[String(asset.asset_id)] || {};
                if (!data.floor || !data.ip) {
                    toast.error(`Vui lòng chọn đầy đủ tầng và IP cho thiết bị ${asset.asset_code}`);
                    setAssignLoading(false);
                    return; // Stop further processing
                }
                const payload = {
                    asset_id: asset.asset_id,
                    department_id: user.department_id,
                    handover_by: JSON.parse(sessionStorage.getItem('auth') || '{}').employee_id,
                    floor: data.floor,
                    history_status: 'Đã đăng ký',
                    is_handover: true,
                    ip_address: [data.ip],
                    ipType: data.ipType || 'DHCP'
                };
                await axios.post(`/auth/users/${user.emp_code}/assign-asset`, payload);
            }

            for (const asset of inuseAssets) {
                const data = multiAssignData[String(asset.asset_id)] || {};
                // For inuse assets, floor and IP might not be required if they are already assigned
                // Add validation or adjust logic based on your requirements for inuse asset assignment
                const payload = {
                    asset_id: asset.asset_id,
                    department_id: user.department_id,
                    handover_by: JSON.parse(sessionStorage.getItem('auth') || '{}').employee_id,
                    floor: data.floor || asset.floor, // Use existing floor if not provided
                    history_status: 'Đã đăng ký',
                    is_handover: false, // Set is_handover to false for inuse assets
                    ip_address: data.ip ? [data.ip] : (typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address) || [], // Use new IP if provided, otherwise keep existing IPs
                    ipType: data.ipType || (localStorage.getItem(`ipType_${(typeof asset.ip_address === 'string' ? asset.ip_address.split(', ')[0] : asset.ip_address?.[0]) || ''}`) as 'FIXED' | 'DHCP') || 'DHCP' // Keep existing IP type if not provided
                };
                await axios.post(`/auth/users/${user.emp_code}/assign-asset`, payload);
            }

            for (const asset of deleteAssets) {
                if (!asset.ip_address) {
                    toast.error(`Thiết bị ${asset.asset_code} không có IP`);
                    setAssignLoading(false);
                    return; // Stop further processing
                }
                const ips = typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address;
                const floors = ips.map((ip: string) => getFloorFromIP(ip)).filter(Boolean);
                const floorString = floors.join(' ');
                const payload = {
                    asset_id: asset.asset_id,
                    department_id: user.department_id,
                    handover_by: JSON.parse(sessionStorage.getItem('auth') || '{}').employee_id,
                    floor: floorString,
                    note: multiAssignData[String(asset.asset_id)]?.note || null, // Allow adding note for delete assets
                    is_handover: true // Assuming delete assets are handled as handover true for reassignment
                };
                await axios.post(`/asset/users/${user.emp_code}/assign-delete-asset`, payload);
            }

            // Update IP statuses for newly assigned assets (New and In Use)
            const assetsToUpdateIp = [...newAssets, ...inuseAssets];
            for (const asset of assetsToUpdateIp) {
                const data = multiAssignData[String(asset.asset_id)] || {};
                const currentIPs = (typeof asset.ip_address === 'string' ? asset.ip_address.split(', ') : asset.ip_address) || [];

                // IPs to set to null/unused (old IPs)
                const oldIPsToClear = currentIPs.filter(ip => ip !== data.ip);
                await Promise.all(oldIPsToClear.map(ip => updateNetworkSegment({ ip, status: null, hostname: null, ipType: (localStorage.getItem(`ipType_${ip}`) as 'FIXED' | 'DHCP') || 'DHCP' })));

                // New IP to set to Registered
                if (data.ip && !currentIPs.includes(data.ip)) {
                    await updateNetworkSegment({ ip: data.ip, status: "Registered", ipType: data.ipType || 'DHCP' });
                }
            }

            toast.success('Cấp phát thiết bị thành công!');
            handleCloseAssignModal();
            onAssetsAssigned(); // Notify parent component

        } catch (err: any) {
            console.error('Error in handleMultiAssign:', err);
            toast.error(err.response?.data?.message || 'Lỗi khi cấp phát thiết bị');
        } finally {
            setAssignLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'đang sử dụng': return 'success';
            case 'new': return 'success';
            case 'đang bị lỗi': return 'danger';
            case 'chưa bàn giao': return 'info';
            case 'đã đăng ký': return 'info';
            case 'cấp phát chờ xóa': return 'info';
            case 'chờ bàn giao': return 'info';
            case 'đang cài đặt': return 'warning';
            case 'đang đổi máy': return 'primary';
            case 'khác': return 'secondary';
            case 'đã trả lại': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <Modal
            show={show}
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
                                setSearchTerm('');
                                setFloorFilters({ 'BF': false, '1F': false, '2F': false });
                                setSelectedAssetsAllType([]); // Clear selected assets when changing type
                                setMultiAssignData({});
                                setMultiAvailableIPs({});
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
                <Form>
                    {/* Thêm filter tầng ngay sau header */}
                    {selectedAssetType === 'Chờ xóa' && (filteredAssets.length > 0) && (
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
                                            {paginatedAssets.map((asset: Asset) => {
                                                const isChecked = selectedAssetsAllType.some(a => a.asset_id === asset.asset_id);
                                                const assetType = asset.status_name === 'New' ? 'New' : (asset.status_name === 'Đang sử dụng' ? 'inuse' : 'delete');

                                                return (
                                                    <React.Fragment key={asset.asset_id}>
                                                        <tr>
                                                            <td className="text-center">
                                                                <Form.Check
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={e => {
                                                                        if (e.target.checked) {
                                                                            setSelectedAssetsAllType(prev => [...prev, asset]);

                                                                            // Ensure initial ipType is set correctly and handle inuse prefill
                                                                            const initialIp = (typeof asset.ip_address === 'string' ? asset.ip_address.split(', ')[0] : asset.ip_address?.[0]) || '';
                                                                            const initialIpType = (localStorage.getItem(`ipType_${initialIp}`) as 'FIXED' | 'DHCP') || 'DHCP';

                                                                            setMultiAssignData(prev => {
                                                                                const assetData = prev[asset.asset_id] || {};
                                                                                const updatedData = { ...assetData, ipType: initialIpType };

                                                                                // Prefill floor and IP for inuse assets if available
                                                                                if (assetType === 'inuse' && asset.floor) {
                                                                                    updatedData.floor = asset.floor;
                                                                                    updatedData.ip = initialIp;
                                                                                    fetchMultiIPs(String(asset.asset_id), asset.floor, initialIpType);
                                                                                }

                                                                                return { ...prev, [asset.asset_id]: updatedData };
                                                                            });

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
                                                                    ? (typeof asset.ip_address === 'string'
                                                                        ? asset.ip_address.split(', ')
                                                                        : asset.ip_address
                                                                    ).map((ip: string, ipIndex: number) => (
                                                                        <div key={asset.asset_id + '-' + ipIndex}>
                                                                            {ip}
                                                                            <div className="text-muted small">Tầng: {getFloorFromIP(ip) || 'Không xác định'}</div>
                                                                        </div>
                                                                    ))
                                                                    : <span className="text-muted">Không có IP</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                        {isChecked && assetType !== 'delete' && (
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
                                                                                disabled={!multiAssignData[String(asset.asset_id)]?.floor || (multiAvailableIPs[String(asset.asset_id)] || []).length === 0}
                                                                            >
                                                                                <option value="">Chọn IP</option>
                                                                                {(multiAvailableIPs[String(asset.asset_id)] || []).map(ip => (
                                                                                    <option key={ip} value={ip}>{ip}</option>
                                                                                ))}
                                                                            </Form.Select>
                                                                            {assetType === 'New' && <span className="text-danger ms-2">* Bắt buộc</span>}
                                                                            {(!multiAssignData[String(asset.asset_id)]?.floor || (multiAvailableIPs[String(asset.asset_id)] || []).length === 0) && (assetType === 'New') && (
                                                                                <Form.Text className="text-danger ms-2">Vui lòng chọn tầng để tải danh sách IP</Form.Text>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
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

                    {/* Note for Delete Assets */}
                    {selectedAssetType === 'Chờ xóa' && selectedAssetsAllType.length > 0 && (
                        <Form.Group className="mb-3">
                            <Form.Label>Ghi chú (Áp dụng chung cho các thiết bị chờ xóa đã chọn)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={multiAssignData[String(selectedAssetsAllType[0]?.asset_id)]?.note || ''}
                                onChange={e => setMultiAssignData(prev => {
                                    const newState = { ...prev };
                                    // Apply note to all selected delete assets
                                    selectedAssetsAllType.forEach(asset => {
                                        if (asset.status_name === 'Chờ xóa') {
                                            newState[String(asset.asset_id)] = { ...newState[String(asset.asset_id)], note: e.target.value };
                                        }
                                    });
                                    return newState;
                                })}
                                placeholder="Nhập ghi chú"
                            />
                        </Form.Group>
                    )}

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
                                    // Chỉ kiểm tra điều kiện cho thiết bị 'new'
                                    if (asset.status_name === 'New') {
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
    );
};

export default ProcessMultiAssetsModal;
