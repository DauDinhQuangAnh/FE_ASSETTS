// Các type/interface dùng cho UserDetail

export interface Asset {
    asset_id: number;
    asset_code: string;
    asset_name: string;
    category_id: number;
    category_name: string;
    brand: string;
    model: string;
    serial_number: string;
    type: string;
    status_name: string;
    configuration: string;
    OS: string;
    OFFICE: string;
    ip_address?: string | string[];
    mac_address: string;
    hub: string;
    os: string;
    office: string;
    software_used: string[];
    history_status: string;
    history_note: string;
    floor: string;
    position: string;
    handover_date: string;
    returned_date: string | null;
    is_handover: boolean;
    vcs_lan_no: string;
    start_use_date: string;
    factory_area: string;
    department_name: string;
    vendor_name: string;
    location_id: string;
    purchase_date: string;
    purchase_price: string;
    warranty_expiry: string;
    maintenance_cycle: number;
    upgrade_infor: string;
    notes: string;
    history_mac_address: string;
    old_ip_address: string;
    history_id: number;
}

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

export interface UploadedFile {
    id: number;
    filename: string;
    upload_date: string;
    file_size: number;
    file_type: string;
    download_url: string;
}

export type FloorFilterType = {
    'BF': boolean;
    '1F': boolean;
    '2F': boolean;
};

export type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
