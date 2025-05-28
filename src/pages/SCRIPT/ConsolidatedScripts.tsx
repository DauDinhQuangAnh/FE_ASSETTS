import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Card, Badge } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { ArrowDown } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import { useTranslation } from 'react-i18next';

// Interfaces for data from different scripts
interface SetLogOnUser {
    first_name: string;
    last_name: string;
    emp_code: string;
    oldpc: string;
    asset_code: string;
    business_unit: string;
}

interface DeleteUser {
    emp_code: string;
    email: string;
}

interface DHCPUser {
    ip_address: string[];
    mac_address: string;
    mac_wifi?: string;
    asset_code: string;
    emp_code?: string;
    full_name?: string;
    floor: string;
    business_unit_name?: string;
}

interface CreateADUser {
    first_name: string;
    last_name: string;
    emp_code: string;
    email: string;
    department: string;
    business_unit: string;
    jobtitle: string;
    asset_code: string;
    mac_address: string;
    mac_wifi?: string;
    full_name: string;
    floor: string;
    ip_address: string[];
    group_mail?: string;
    mail_groups?: string[];
    category_name?: string;
}

// Helper function from Create_ADUser_DHCP for Scope IDs
const FLOOR_IPS = {
    '1F': '172.25.166.0',
    '2F': '172.25.168.0',
    'BF': '172.25.164.0'
};

const getScopeIDs = (floor: string) => {
    if (!floor) return [];
    const floors = floor.split(' ');
    return floors.map(f => FLOOR_IPS[f as keyof typeof FLOOR_IPS]).filter(Boolean);
};

// Helper function from Create_ADUser_DHCP for default mail groups
const TITLE_C = [
    'Manager',
    'Senior Manager',
    'Deputy General Manager',
    'BU HEAD',
    'General Director',
    'Chairman'
];
const TITLE_B = [
    'Assistant Manager',
    'Deputy Manager',
    'Manager',
    'Senior Manager',
    'Deputy General Manager',
    'BU HEAD',
    'General Director',
    'Chairman'
];
const TITLE_A = [
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
    'Chairman'
];

const getDefaultMailGroups = (department: string, jobtitle: string) => {
    const groups: string[] = [];

    if (department.includes('Administration')) {
        groups.push('SMV_Admin_BU');
        if (TITLE_C.includes(jobtitle)) {
            groups.push('SMV_Admin_MANAGER');
        }
    } else if (department.includes('DP')) {
        groups.push('SMV_DP_BU');
        if (TITLE_C.includes(jobtitle)) {
            groups.push('SMV_DP_MANAGER');
        }
    } else if (department.includes('CM')) {
        groups.push('SMV_CM_BU');
        if (TITLE_C.includes(jobtitle)) {
            groups.push('SMV_CM_MANAGER');
        }
    } else if (department.includes('SAS')) {
        groups.push('SMV_SAS_BU');
        if (TITLE_C.includes(jobtitle)) {
            groups.push('SMV_SAS_MANAGER');
        }
    }

    if (TITLE_C.includes(jobtitle)) {
        groups.push('SMV_MANAGER_Level_up');
    }
    if (TITLE_B.includes(jobtitle)) {
        groups.push('SMV_AM_Level_up');
    }
    if (TITLE_A.includes(jobtitle)) {
        groups.push('SMV_SUP_Level_up');
    }

    return groups;
};

// Helper function from Create_ADUser_DHCP for default share file groups
const getDefaultGroupNames = (business_unit: string) => {
    const groups: string[] = [];

    if (business_unit.includes('DP')) {
        groups.push('QMS_DP');
        groups.push('DP_5S_RO');
        groups.push('DP_QMS_TEMPLATE_RO');
    } else if (business_unit.includes('SAS')) {
        groups.push('QMS_SAS');
    } else if (business_unit.includes('Administration')) {
        groups.push('QMS_AD');
        groups.push('ADM_5S_RO');
    } else if (business_unit.includes('CM')) {
        groups.push('QMS_CM');
    }

    return groups;
};

export default function ConsolidatedScripts() {
    const { t } = useTranslation();

    // State for SetLogOn data
    const [setLogonData, setSetLogonData] = useState<SetLogOnUser[]>([]);
    const [loadingSetLogon, setLoadingSetLogon] = useState(true);
    const [errorSetLogon, setErrorSetLogon] = useState('');

    // State for DeleteUser data
    const [deleteUserData, setDeleteUserData] = useState<DeleteUser[]>([]);
    const [loadingDeleteUser, setLoadingDeleteUser] = useState(true);
    const [errorDeleteUser, setErrorDeleteUser] = useState('');

    // State for DELETE_DHCP data
    const [deleteDhcpData, setDeleteDhcpData] = useState<DHCPUser[]>([]);
    const [loadingDeleteDhcp, setLoadingDeleteDhcp] = useState(true);
    const [errorDeleteDhcp, setErrorDeleteDhcp] = useState('');

    // State for Create_ADUser_DHCP data
    const [createAdData, setCreateAdData] = useState<CreateADUser[]>([]);
    const [loadingCreateAd, setLoadingCreateAd] = useState(true);
    const [errorCreateAd, setErrorCreateAd] = useState('');

    // --- Data Fetching Functions (Adapted from original files) ---

    const fetchSetLogOnUsers = async () => {
        setLoadingSetLogon(true);
        try {
            const response = await axios.get('/script/set-logon');
            setSetLogonData(response.data.map((user: any) => ({ ...user, oldpc: user.oldpc || '' })));
        } catch (err: any) {
            setErrorSetLogon(err.response?.data?.message || t('setLogon.messages.loadError'));
        } finally {
            setLoadingSetLogon(false);
        }
    };

    const fetchDeleteUsers = async () => {
        setLoadingDeleteUser(true);
        try {
            const response = await axios.get('/script/delete-user');
            setDeleteUserData(response.data);
        } catch (err: any) {
            setErrorDeleteUser(err.response?.data?.message || t('deleteUser.messages.loadError'));
        } finally {
            setLoadingDeleteUser(false);
        }
    };

    const fetchDHCPUsers = async () => {
        setLoadingDeleteDhcp(true);
        try {
            const response = await axios.get('/script/returned-assets');
            setDeleteDhcpData(response.data.map((user: any) => ({ ...user, ip_address: user.ip_address || [] })));
        } catch (err: any) {
            setErrorDeleteDhcp(err.response?.data?.message || t('deleteDHCP.messages.loadError'));
        } finally {
            setLoadingDeleteDhcp(false);
        }
    };

    const fetchCreateADUsers = async () => {
        setLoadingCreateAd(true);
        try {
            const response = await axios.get('/script/ad-users');
            const formattedUsers = response.data.map((user: any) => {
                const department = `${user.business_unit || ''} ${user.department || ''}`.trim();
                const defaultGroups = getDefaultMailGroups(department, user.position || '');

                return {
                    ...user,
                    email: user.email || '',
                    department: user.department || '',
                    business_unit: user.business_unit || '',
                    jobtitle: user.position || '',
                    asset_code: user.asset_code || '',
                    mac_address: user.mac_address || '',
                    mac_wifi: user.mac_wifi || '',
                    full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                    floor: user.floor || '',
                    ip_address: user.ip_address || [],
                    category_name: user.category_name || '',
                    mail_groups: defaultGroups
                };
            });
            setCreateAdData(formattedUsers);
        } catch (err: any) {
            setErrorCreateAd(err.response?.data?.message || t('createADUser.messages.loadError'));
        } finally {
            setLoadingCreateAd(false);
        }
    };

    useEffect(() => {
        fetchSetLogOnUsers();
        fetchDeleteUsers();
        fetchDHCPUsers();
        fetchCreateADUsers();
    }, []);

    // --- Export CSV Functions (Adapted from original files) ---

    const handleExportSetLogOnCSV = () => {
        const fields = [
            'firstname',
            'middleInitial',
            'lastname',
            'id',
            'oldpc',
            'newpc',
            'BUName'
        ];

        const csv = Papa.unparse({
            fields,
            data: setLogonData.map(user => ({
                firstname: user.first_name || '',
                middleInitial: '', // Not available in simplified interface
                lastname: user.last_name || '',
                id: user.emp_code || '',
                oldpc: user.oldpc || '',
                newpc: user.asset_code || '',
                BUName: user.business_unit || ''
            }))
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'Set_logonWorkstations.csv');
    };

    const handleExportDeleteUserCSV = () => {
        const fields = ['username', 'email'];
        const csv = Papa.unparse({
            fields,
            data: deleteUserData.map(user => ({
                username: user.emp_code || '',
                email: user.email || ''
            }))
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'DELETE_ADUser.csv');
    };

    const handleExportDHCPCSV = () => {
        const deviceFields = [
            t('deleteDHCP.table.ip'),
            t('deleteDHCP.table.mac'),
            t('deleteDHCP.table.hostname'),
            t('deleteDHCP.table.description'),
            t('deleteDHCP.table.scopeID'),
            t('deleteDHCP.table.bu')
        ];
        const deviceCsv = Papa.unparse({
            fields: deviceFields,
            data: deleteDhcpData.flatMap(user => {
                const scopeIDs = getScopeIDs(user.floor);
                return scopeIDs.map((ip, ipIndex) => ({
                    [t('deleteDHCP.table.ip')]: user.ip_address?.[ipIndex] || '',
                    [t('deleteDHCP.table.mac')]: user.mac_address || '', // Assuming mac_address is preferred
                    [t('deleteDHCP.table.hostname')]: user.asset_code || '',
                    [t('deleteDHCP.table.description')]: `${user.emp_code || ''}/${user.full_name || ''}`.trim(),
                    [t('deleteDHCP.table.scopeID')]: ip, // This seems incorrect, should be the IP itself, not scope ID
                    [t('deleteDHCP.table.bu')]: user.business_unit_name || '0'
                }));
            })
        });

        // Correcting the DHCP CSV export logic based on original file
        const correctedDeviceFields = ['IP', 'Mac', 'Hostname', 'Description', 'ScopeID', 'BU'];
        const correctedDeviceCsv = Papa.unparse({
            fields: correctedDeviceFields,
            data: deleteDhcpData.flatMap(user =>
                (user.ip_address.length > 0 ? user.ip_address : ['']).map((ip, ipIndex) => ({
                    IP: ip || '',
                    Mac: user.mac_address || user.mac_wifi || '', // Use either MAC if available
                    Hostname: user.asset_code || '',
                    Description: `${user.emp_code || ''}/${user.full_name || ''}`.trim() || '-',
                    ScopeID: getScopeIDs(user.floor)[ipIndex] || '', // Get correct Scope ID for this IP's floor
                    BU: user.business_unit_name || '0'
                }))
            )
        });


        const blob = new Blob([correctedDeviceCsv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'DELETE_DHCP_Reservation.csv');
    };

    const handleExportCreateADUserCSV = () => {
        // AD User CSV
        const adFields = [
            'firstname',
            'middleInitial',
            'lastname',
            'username',
            'email',
            'streetaddress',
            'city',
            'zipcode',
            'state',
            'country',
            'department',
            'password',
            'telephone',
            'jobtitle',
            'company',
            'ou',
            'description',
            'office',
            'LogonWorkstations',
            'GroupName'
        ];

        const adCsv = Papa.unparse({
            fields: adFields,
            data: createAdData.map(user => ({
                firstname: user.first_name || '',
                middleInitial: '',
                lastname: user.last_name || '',
                username: user.emp_code || '',
                email: user.email || '',
                streetaddress: '',
                city: '',
                zipcode: '',
                state: '',
                country: '',
                department: `${user.business_unit || ''} ${user.department || ''}`.trim(),
                password: 'P@ssw0rd',
                telephone: '',
                jobtitle: user.jobtitle || '',
                company: 'SMV',
                ou: 'OU=USERS,OU=SMV,DC=ASIASHARP,DC=COM',
                description: user.emp_code || '0',
                office: 'SMV',
                LogonWorkstations: user.asset_code || '',
                GroupName: 'SMV Domain User'
            }))
        });
        const adBlob = new Blob([adCsv], { type: 'text/csv;charset=utf-8;' });
        saveAs(adBlob, 'CREATE_ADUser.csv');

        // DHCP Reservation CSV
        const dhcpFields = ['IP', 'Mac', 'Hostname', 'Description', 'ScopeID', 'BU'];
        const dhcpCsv = Papa.unparse({
            fields: dhcpFields,
            data: createAdData.flatMap(user => {
                const scopeIDs = getScopeIDs(user.floor);
                return scopeIDs.map((scopeID, ipIndex) => ({
                    IP: user.ip_address?.[ipIndex] || '',
                    Mac: user.mac_address || user.mac_wifi || '',
                    Hostname: user.asset_code || '',
                    Description: `LAN: ${(user.mac_address || '')} | WIFI: ${(user.mac_wifi || '')}`,
                    ScopeID: scopeID,
                    BU: user.business_unit || '0'
                }));
            })
        });
        const dhcpBlob = new Blob([dhcpCsv], { type: 'text/csv;charset=utf-8;' });
        saveAs(dhcpBlob, 'CREATE_DHCP_Reservation.csv');

        // Add Group Mail CSV
        const groupMailFields = ['SamAccountName', 'Name', 'Identity'];
        const groupMailCsv = Papa.unparse({
            fields: groupMailFields,
            data: createAdData.flatMap((u) =>
                (u.mail_groups || []).map((group) => ({
                    SamAccountName: u.emp_code || '',
                    Name: u.full_name || '',
                    Identity: group
                }))
            )
        });
        const groupMailBlob = new Blob([groupMailCsv], { type: 'text/csv;charset=utf-8;' });
        saveAs(groupMailBlob, 'Add-ADGroupMember.csv');

        // Create Share File CSV
        const shareFileFields = ['LocalUser', 'Password', 'Description', 'FullName', 'GroupName'];
        const shareFileCsv = Papa.unparse({
            fields: shareFileFields,
            data: createAdData.flatMap(user => {
                const defaultGroups = getDefaultGroupNames(user.business_unit || '');
                return defaultGroups.map(group => ({
                    LocalUser: user.emp_code || '',
                    Password: 'P@ssw0rd',
                    Description: user.email || '',
                    FullName: user.full_name || '',
                    GroupName: group
                }));
            })
        });
        const shareFileBlob = new Blob([shareFileCsv], { type: 'text/csv;charset=utf-8;' });
        saveAs(shareFileBlob, 'QMS -  SMV_AddLocalUser.csv');
    };



    // --- Render JSX ---

    return (
        <Layout>
            <div className="container py-3">
                <h1 className="mb-4">Consolidated Scripts Overview</h1>

                {/* Set LogOn Table */}
                <Card className="shadow-sm mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                        <h5 className="mb-0">📋 Set LogOn Data</h5>
                        <Button variant="success" onClick={handleExportSetLogOnCSV} disabled={loadingSetLogon}>
                            <ArrowDown size={18} className="me-2" /> Export Set LogOn CSV
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {errorSetLogon && <div className="alert alert-danger">{errorSetLogon}</div>}
                        {loadingSetLogon ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                        ) : (
                            <div className="table-responsive">
                                <Table className="table-bordered align-middle table-hover">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>First Name</th>
                                            <th>Last Name</th>
                                            <th>ID</th>
                                            <th>Old PC</th>
                                            <th>New PC</th>
                                            <th>BU Name</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {setLogonData.map((u, index) => (
                                            <tr key={index}>
                                                <td className="text-center fw-medium">{index + 1}</td>
                                                <td>{u.first_name}</td>
                                                <td>{u.last_name}</td>
                                                <td>{u.emp_code}</td>
                                                <td>{u.oldpc}</td>
                                                <td>{u.asset_code}</td>
                                                <td>{u.business_unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Delete User Table */}
                <Card className="shadow-sm mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                        <h5 className="mb-0">📋 Delete User Data</h5>
                        <Button variant="success" onClick={handleExportDeleteUserCSV} disabled={loadingDeleteUser}>
                            <ArrowDown size={18} className="me-2" /> Export Delete User CSV
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {errorDeleteUser && <div className="alert alert-danger">{errorDeleteUser}</div>}
                        {loadingDeleteUser ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                        ) : (
                            <div className="table-responsive">
                                <Table className="table-bordered align-middle table-hover">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deleteUserData.map((user, index) => (
                                            <tr key={index}>
                                                <td className="text-center fw-medium">{index + 1}</td>
                                                <td>{user.emp_code}</td>
                                                <td>{user.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* DELETE DHCP Table */}
                <Card className="shadow-sm mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                        <h5 className="mb-0">📋 Delete DHCP Data</h5>
                        <Button variant="success" onClick={handleExportDHCPCSV} disabled={loadingDeleteDhcp}>
                            <ArrowDown size={18} className="me-2" /> Export Delete DHCP CSV
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {errorDeleteDhcp && <div className="alert alert-danger">{errorDeleteDhcp}</div>}
                        {loadingDeleteDhcp ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                        ) : (
                            <div className="table-responsive">
                                <Table className="table-bordered align-middle table-hover">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>IP</th>
                                            <th>Mac</th>
                                            <th>Hostname</th>
                                            <th>Description</th>
                                            <th>ScopeID</th>
                                            <th>BU</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deleteDhcpData.flatMap((user: DHCPUser, index: number) =>
                                            (user.ip_address.length > 0 ? user.ip_address : ['']).map((ip, ipIndex) => (
                                                <tr key={`${user.asset_code}-${ipIndex}`}>
                                                    <td className="text-center fw-medium">{index + 1}</td>
                                                    <td>{ip || '-'}</td>
                                                    <td>{user.mac_address || user.mac_wifi || '-'}</td>
                                                    <td>{user.asset_code || '-'}</td>
                                                    <td>{`${user.emp_code || ''}/${user.full_name || ''}`.trim() || '-'}</td>
                                                    <td>{getScopeIDs(user.floor)[ipIndex] || '-'}</td>
                                                    <td>{user.business_unit_name || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Create AD User / DHCP Table */}
                <Card className="shadow-sm mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                        <h5 className="mb-0">📋 Create AD User / DHCP Data</h5>
                        <Button variant="success" onClick={handleExportCreateADUserCSV} disabled={loadingCreateAd}>
                            <ArrowDown size={18} className="me-2" /> Export All Create Scripts CSVs
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {errorCreateAd && <div className="alert alert-danger">{errorCreateAd}</div>}
                        {loadingCreateAd ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
                        ) : (
                            <div className="table-responsive">
                                <Table className="table-bordered align-middle table-hover">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>First Name</th>
                                            <th>Last Name</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Job Title</th>
                                            <th>Workstation</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createAdData.map((u, index) => (
                                            <tr key={index}>
                                                <td className="text-center fw-medium">{index + 1}</td>
                                                <td>{u.first_name}</td>
                                                <td>{u.last_name}</td>
                                                <td>{u.emp_code}</td>
                                                <td>{u.email}</td>
                                                <td>{`${u.business_unit || ''} ${u.department || ''}`.trim()}</td>
                                                <td>{u.jobtitle}</td>
                                                <td className="text-center">
                                                    <Badge bg="info">{u.asset_code}</Badge>
                                                </td>
                                                <td>{u.emp_code}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                {/* Additional tables for DHCP, Group Mail, Share File from Create_ADUser_DHCP */}
                                <h6 className="mt-4">DHCP Reservation Data</h6>
                                <Table className="table-bordered align-middle table-hover mt-2">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>IP</th>
                                            <th>Mac</th>
                                            <th>Hostname</th>
                                            <th>Description</th>
                                            <th>ScopeID</th>
                                            <th>BU</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createAdData.flatMap((u: CreateADUser, index: number) => {
                                            const scopeIDs = getScopeIDs(u.floor);
                                            return scopeIDs.map((scopeID, ipIndex) => (
                                                <tr key={`${index}-${ipIndex}-dhcp`}>
                                                    <td className="text-center fw-medium">{index + 1}</td>
                                                    <td>{u.ip_address?.[ipIndex] || ''}</td>
                                                    <td>{u.mac_address || u.mac_wifi || ''}</td>
                                                    <td>{u.asset_code || ''}</td>
                                                    <td>{`LAN: ${(u.mac_address || '')} | WIFI: ${(u.mac_wifi || '')}`}</td>
                                                    <td>{scopeID}</td>
                                                    <td>{u.business_unit || ''}</td>
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </Table>

                                <h6 className="mt-4">Add Group Mail Data</h6>
                                <Table className="table-bordered align-middle table-hover mt-2">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>SamAccountName</th>
                                            <th>Name</th>
                                            <th>Identity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createAdData.flatMap((u: CreateADUser, userIndex: number) =>
                                            (u.mail_groups || []).map((group: string, groupIndex: number) => (
                                                <tr key={`${userIndex}-${groupIndex}-groupmail`}>
                                                    <td className="text-center fw-medium">{userIndex + 1}</td>
                                                    <td>{u.emp_code || ''}</td>
                                                    <td>{u.full_name || ''}</td>
                                                    <td>{group}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>

                                <h6 className="mt-4">Create Share File Data</h6>
                                <Table className="table-bordered align-middle table-hover mt-2">
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>STT</th>
                                            <th>LocalUser</th>
                                            <th>Password</th>
                                            <th>Description</th>
                                            <th>FullName</th>
                                            <th>GroupName</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createAdData.flatMap((u: CreateADUser, index: number) => {
                                            const defaultGroups = getDefaultGroupNames(u.business_unit || '');
                                            return defaultGroups.map((group, groupIndex) => (
                                                <tr key={`${index}-${groupIndex}-sharefile`}>
                                                    <td className="text-center fw-medium">{index + 1}</td>
                                                    <td>{u.emp_code || ''}</td>
                                                    <td>P@ssw0rd</td>
                                                    <td>{u.email || ''}</td>
                                                    <td>{u.full_name || ''}</td>
                                                    <td>{group}</td>
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </Table>

                            </div>
                        )}
                    </Card.Body>
                </Card>

            </div>
        </Layout>
    );
} 