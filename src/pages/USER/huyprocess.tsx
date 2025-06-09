import { useState } from 'react';
import { Modal, Button, Alert, Table, Form, Spinner } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import type { Asset, User } from '../../types/typeUserDetail';
import { updateNetworkSegment } from '../../services/networkSegmentService';

interface UnregisterModalProps {
    show: boolean;
    onHide: () => void;
    user: User | null;
    userAssets: Asset[];
    onUnregisterComplete: () => void;
}

export default function UnregisterModal({ show, onHide, user, userAssets, onUnregisterComplete }: UnregisterModalProps) {
    const [selectedUnregisterAssets, setSelectedUnregisterAssets] = useState<number[]>([]);
    const [unregisterLoading, setUnregisterLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleUnregisterAssetSelection = (assetId: number) => {
        const asset = userAssets.find(a => a.asset_id === assetId);
        if (!asset) return;

        if (asset.history_status === 'Đã hủy đăng ký') {
            toast.warning('Thiết bị này đã được hủy đăng ký');
            return;
        }

        if (asset.history_status !== 'Đã đăng ký' &&
            asset.history_status !== 'Chờ bàn giao' &&
            asset.history_status !== 'Đang bị lỗi') {
            toast.warning('Chỉ có thể hủy đăng ký thiết bị đang trong trạng thái "Đã đăng ký", "Chờ bàn giao" hoặc "Đang bị lỗi"');
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

            const response = await axios.post(`/auth/users/${user?.emp_code}/unregister-assets`, payload);

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
            localStorage.clear();
            onUnregisterComplete();
            onHide();
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

    return (
        <Modal show={show} onHide={onHide} size="lg">
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
                                <th style={{ width: '50px' }}></th>
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
                    {userAssets.filter(asset =>
                        asset.history_status === 'Đã đăng ký' ||
                        asset.history_status === 'Chờ bàn giao' ||
                        asset.history_status === 'Cấp phát chờ xóa'
                    ).length === 0 && (
                            <Alert variant="info" className="mt-3">
                                <i className="fas fa-info-circle me-2"></i>
                                Không có thiết bị nào đang ở trạng thái "Đã đăng ký" hoặc "Chờ bàn giao"
                            </Alert>
                        )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => {
                    onHide();
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
    );
}
