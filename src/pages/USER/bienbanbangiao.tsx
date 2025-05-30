import { useState } from 'react';
import { Modal, Button, Alert, Table, Form, Spinner } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import type { Asset, User } from '../../types/typeUserDetail';
import HandoverReport from '../../components/HandoverReport';
import { format } from 'date-fns';
import { PDFDocument } from 'pdf-lib';
import html2pdf from 'html2pdf.js';

interface HandoverModalProps {
    show: boolean;
    onHide: () => void;
    user: User | null;
    userAssets: Asset[];
    onHandoverComplete: () => void;
}

export default function HandoverModal({ show, onHide, user, userAssets, onHandoverComplete }: HandoverModalProps) {
    const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [handoverLoading, setHandoverLoading] = useState(false);
    const [error, setError] = useState('');
    const [handoverBy, setHandoverBy] = useState('');

    const toggleAssetSelection = (assetId: number) => {
        const asset = userAssets.find(a => a.asset_id === assetId);
        if (!asset) return;

        if (asset.history_status !== 'Chờ bàn giao') {
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

    const handleHandover = async () => {
        if (selectedAssets.length === 0) {
            toast.error('Vui lòng chọn ít nhất một thiết bị');
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
        setShowReport(true);
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

            const response = await axios.post(`/script/users/${user?.emp_code}/handover-assets`, payload);

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
            onHandoverComplete();
            handleClose();

        } catch (err: any) {
            console.error('Lỗi bàn giao thiết bị:', err);
            const errorMessage = err.response?.data?.message || 'Lỗi không xác định khi bàn giao thiết bị';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setHandoverLoading(false);
        }
    };

    const handleClose = () => {
        setShowReport(false);
        setSelectedAssets([]);
        setError('');
        onHide();
    };

    const handleCancel = () => {
        setShowReport(false);
        setSelectedAssets([]);
    };

    const handleDownloadReport = async () => {
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

    return (
        <>
            <Modal show={show && !showReport} onHide={handleClose} size="lg">
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
                    <Button variant="secondary" onClick={handleClose}>
                        Hủy
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleHandover}
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

            {/* Report Modal */}
            <Modal show={showReport} onHide={handleCancel} size="lg">
                <Modal.Body className="p-0">
                    {user ? (
                        <HandoverReport
                            selectedAssets={userAssets.filter(asset => selectedAssets.includes(asset.asset_id))}
                            user={user}
                            handoverBy={handoverBy}
                            onConfirm={handleConfirmHandover}
                            onCancel={handleCancel}
                            onDownload={handleDownloadReport}
                        />
                    ) : (
                        <Alert variant="danger">Không tìm thấy thông tin người dùng</Alert>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

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
