// Các type/interface dùng cho quản lý tài sản (Asset)

export interface Asset {
    asset_id: number;
    asset_code: string;
    asset_name: string;
    category_id?: number;
    category_name: string;
    brand: string;
    OS?: string;
    os?: string;
    OFFICE?: string;
    office?: string;
    software_used?: number;
    software_used_name?: string;
    configuration?: string;
    model: string;
    serial_number?: string;
    type?: string;
    ip_address?: string | string[];
    mac_address?: string;
    hub?: string;
    vcs_lan_no?: string;
    start_use_date?: string;
    factory_area?: string;
    belongs_to_dept_id?: number;
    department_name?: string;
    vendor_id?: number;
    vendor_name?: string;
    location_id?: number;
    location_name?: string;
    purchase_date?: string;
    purchase_price?: number;
    warranty_expiry?: string;
    maintenance_cycle?: number;
    status_id?: number;
    status_name: string;
    upgrade_infor?: string;
    notes?: string;
    old_ip_address?: string;
    status_account?: string;
    mac_wifi?: string;
}

export interface Category {
    category_id: number;
    category_name: string;
}

export interface Status {
    status_id: number;
    status_name: string;
}

export interface Department {
    department_id: number;
    department_name: string;
}

export interface SoftwareUsed {
    software_used_id: number;
    software_used_name: string;
    note: string;
}

export interface Vendor {
    vendor_id: number;
    vendor_name: string;
}

export interface Location {
    location_id: number;
    location_name: string;
}

export interface AssetHistory {
    history_id: number;
    asset_id: number;
    employee_id: number;
    handover_by: number;
    department_id: number;
    handover_date: string;
    returned_date: string | null;
    floor: string;
    position: string;
    mac_address: string;
    note: string;
    emp_code: string;
    emp_name: string;
    department_name: string;
    location_position: string;
    history_status: string;
} 