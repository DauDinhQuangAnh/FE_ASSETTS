import { useState, useRef, useCallback } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from '../../api/axiosInstance';

interface UploadProcessProps {
    show: boolean;
    onHide: () => void;
    empCode: string;
}

export default function UploadProcess({ show, onHide, empCode }: UploadProcessProps) {
    const [, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const handleClose = () => {
        onHide();
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
            try {
                await validateFile(file);
                await new Promise(resolve => setTimeout(resolve, 300));
                processFileWithDebounce(file);
            } catch (error: any) {
                console.error('Lỗi khi đọc file:', error);
                setImportError(error.message || 'Không thể đọc file. Vui lòng thử lại.');
                setImportFile(null);
            }
        }
    }, [validateFile, processFileWithDebounce]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

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
            handleClose();
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

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Upload Files</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {importError && (
                    <Alert variant="danger">{importError}</Alert>
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
                <Button variant="secondary" onClick={handleClose}>
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
    );
}
