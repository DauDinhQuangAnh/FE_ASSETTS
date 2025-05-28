// Các type/interface dùng cho ManageUser

export interface BusinessUnit {
    business_unit_id: number;
    name: string;
}

export interface Department {
    department_id: number;
    department_name: string;
    business_unit_id: number;
}

export interface User {
    employee_id: number;
    emp_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    role: string;
    status_account: string;
    business_unit_id: number;
    business_unit_name: string;
    department_id: number;
    department_name: string;
    position: string;
    join_date: string;
    leave_date?: string;
    status_work: string;
    note?: string;
}

export interface Asset {
    asset_id: number;
    asset_code: string;
    asset_name: string;
    category_name: string;
    brand: string;
    OS: string;
    OFFICE: string;
    software_used_name: string;
    configuration: string;
    model: string;
    serial_number: string;
    type: string;
    ip_address: string;
    mac_address: string;
    hub: string;
    vcs_lan_no: string;
    start_use_date: string;
    factory_area: string;
    department_name: string;
    vendor_name: string;
    location_name: string;
    purchase_date: string;
    purchase_price: string;
    warranty_expiry: string;
    maintenance_cycle: number;
    status_name: string;
    upgrade_infor: string;
    notes: string;
    handover_date: string;
    returned_date: string | null;
    floor: string;
    position: string;
    history_mac_address: string;
    history_status: string;
    history_note: string;
}

export interface CreateUserFormData {
    emp_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    password: string;
    role: string;
    status_account: string;
    department_id: string;
    business_unit_id: string;
    position: string;
    join_date: string;
    status_work: string;
    note?: string;
}

export interface AssetDetailModalProps {
    show: boolean;
    asset: Asset | null;
    onHide: () => void;
}

export interface EditUserModalProps {
    show: boolean;
    onHide: () => void;
    initialData: User;
    businessUnits: BusinessUnit[];
    departments: Department[];
    onUserUpdated: (updatedUser: User) => void;
}

export interface CreateUserModalProps {
    show: boolean;
    onHide: () => void;
    businessUnits: BusinessUnit[];
    onUserCreated: () => void;
}

export type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
