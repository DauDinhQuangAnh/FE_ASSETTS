import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { fetchBusinessUnits, fetchDepartments } from '../../api/userApi';
import type { User, BusinessUnit, Department } from '../../types/typeUserDetail';

interface UpdateUserModalProps {
    show: boolean;
    onHide: () => void;
    user: User | null;
    onUserUpdated: () => void;
}

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

export default function UpdateUserModal({ show, onHide, user, onUserUpdated }: UpdateUserModalProps) {
    const [editData, setEditData] = useState<User | null>(null);
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    useEffect(() => {
        if (show && user) {
            const userData = {
                ...user,
                status_account: user.status_account || 'active',
                position: user.position || ''
            };
            setEditData(userData);
        }
    }, [show, user]);

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
        if (show && editData) {
            loadDepartments();
        }
    }, [editData?.business_unit_id, show]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editData) return;

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
            toast.success('Cập nhật thông tin người dùng thành công!');
            onUserUpdated();
            onHide();
        } catch (err: any) {
            console.error('Lỗi cập nhật:', err.response?.data || err);
            setEditError(err.response?.data?.message || 'Lỗi khi cập nhật người dùng');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
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
                            <Button variant="secondary" onClick={onHide}>
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
    );
}
