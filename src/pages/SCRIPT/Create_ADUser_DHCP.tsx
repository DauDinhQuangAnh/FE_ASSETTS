import { useEffect, useState, useRef } from 'react';
import { Table, Button, Spinner, Card, Badge, Modal } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { ArrowDown, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { updateNetworkSegment } from '../../services/networkSegmentService';
import { useTranslation } from 'react-i18next';

interface ADUser {
  first_name: string;
  last_name: string;
  emp_code: string;
  email: string;
  department: string;
  business_unit: string;
  jobtitle: string;
  description: string;
  asset_code: string;
  middleInitial: string;
  streetaddress: string;
  city: string;
  zipcode: string;
  state: string;
  country: string;
  password: string;
  telephone: string;
  company: string;
  ou: string;
  office: string;
  groupname: string;
  maccam: string;
  mac_address: string;
  mac_wifi?: string;
  full_name: string;
  floor: string;
  ip_address: string[];
  ip_addresses?: string[];
  group_mail?: string;
  mail_groups?: string[];
  category_name?: string;
  history_id?: number;
}

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
const TITLE_C = [
  'Manager',
  'Senior Manager',
  'Deputy General Manager',
  'BU HEAD',
  'General Director',
  'Chairman'
];

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

const MAIL_GROUPS = [
  'SMV_ADM_ME',
  'SMV_Admin_BU',
  'SMV_ADMIN_GA',
  'SMV_Admin_MANAGER',
  'SMV_AM_LevelUp',
  'SMV_BSO',
  'SMV_CM_BU',
  'SMV_CM_CM_All',
  'SMV_CM_COMPLAINT',
  'SMV_CM_EE',
  'SMV_CM_MANAGER',
  'SMV_CM_Production_Control',
  'SMV_CM_QA',
  'SMV_CM_SCM',
  'SMV_CM_SMT_Production',
  'SMV_CM1',
  'SMV_DP_BU',
  'SMV_DP_CF_InternalSharing',
  'SMV_dp_contact_list',
  'SMV_DP_Engineer',
  'SMV_DP_IOC',
  'SMV_DP_IT',
  'SMV_DP_MANAGER',
  'SMV_DP_MM',
  'SMV_DP_PC',
  'SMV_DP_Production',
  'SMV_DP_Production_TLD',
  'SMV_DP_Purchasing',
  'SMV_DP_QA',
  'SMV_DP_QC',
  'SMV_DP_R&D_Dept',
  'SMV_GA1',
  'smv_globalnet_notify',
  'SMV_JAPAN',
  'SMV_LEGAL',
  'SMV_MANAGER_Level_up',
  'SMV_QMS',
  'SMV_SAS_BU',
  'SMV_SAS_MANAGER',
  'SMV_SAS_PPC',
  'SMV_SAS_Purchasing',
  'SMV_SAS_QA_OC',
  'SMV_SAS_SP',
  'SMV_SAS_WH',
  'SMV_SAS1',
  'SMV_SUP_Level_up',
  'SMV_Trading',
  'SMV_Trading_CM',
  'SMV_Trading_DP',
  'SMV_Trading_SAS'
];

export default function ADUserList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ADUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [showDropdowns, setShowDropdowns] = useState<{ [key: string]: boolean }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ [key: string]: { top: number; left: number; width: number } }>({});
  const inputRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [macType, setMacType] = useState<{ [key: number]: 'mac_address' | 'mac_wifi' }>({});

  useEffect(() => {
    fetchADUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const fetchADUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/script/ad-users');
      const formattedUsers = response.data.map((user: any) => {
        const department = `${user.business_unit || ''} ${user.department || ''}`.trim();
        const defaultGroups = getDefaultMailGroups(department, user.position || '');

        const baseUser = {
          middleInitial: '',
          streetaddress: '',
          city: '',
          zipcode: '',
          state: '',
          country: '',
          password: 'P@ssw0rd',
          telephone: '',
          company: 'SMV',
          ou: 'OU=USERS,OU=SMV,DC=ASIASHARP,DC=COM',
          office: 'SMV',
          groupname: 'SMV Domain User',
          ip_addresses: [],
          mail_groups: defaultGroups,
          history_id: user.history_id
        };

        return {
          ...user,
          ...baseUser,
          floor: user.floor || '',
          jobtitle: user.position || '',
          business_unit: user.business_unit || '',
          asset_code: user.asset_code || '',
          mac_address: user.mac_address || '',
          full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()
        };
      });
      setUsers(formattedUsers);
    } catch (err: any) {
      setError(err.response?.data?.message || t('createADUser.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleIPChange = (index: number, ipIndex: number, value: string) => {
    setUsers(prevUsers => {
      const newUsers = [...prevUsers];
      const user = { ...newUsers[index] };
      if (!user.ip_address) {
        user.ip_address = [];
      }
      user.ip_address[ipIndex] = value;
      newUsers[index] = user;
      return newUsers;
    });
  };

  const handleExportCSV = () => {
    const fields = [
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

    const csv = Papa.unparse({
      fields,
      data: users.map(user => ({
        firstname: user.first_name || '',
        middleInitial: user.maccam || '',
        lastname: user.last_name || '',
        username: user.emp_code || '',
        email: user.email || '',
        streetaddress: user.maccam || '',
        city: user.maccam || '',
        zipcode: user.maccam || '',
        state: user.maccam || '',
        country: user.maccam || '',
        department: `${user.business_unit || ''} ${user.department || ''}`.trim(),
        password: user.maccam || 'P@ssw0rd',
        telephone: user.maccam || '',
        jobtitle: user.jobtitle || '',
        company: user.maccam || 'SMV',
        ou: user.maccam || 'OU=USERS,OU=SMV,DC=ASIASHARP,DC=COM',
        description: user.emp_code || '0',
        office: user.maccam || 'SMV',
        LogonWorkstations: user.asset_code || '',
        GroupName: user.maccam || 'SMV Domain User'
      }))
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'CREATE_ADUser.csv');

    const deviceFields = ['IP', 'Mac', 'Hostname', 'Description', 'ScopeID', 'BU'];
    const deviceCsv = Papa.unparse({
      fields: deviceFields,
      data: users.flatMap((user, index) => {
        const scopeIDs = getScopeIDs(user.floor);
        return scopeIDs.map((ip, ipIndex) => ({
          IP: user.ip_address?.[ipIndex] || '',
          Mac: (macType[index] === 'mac_wifi' ? user.mac_wifi : user.mac_address) || '',
          Hostname: user.asset_code || '',
          Description: `LAN: ${(user.mac_address || '')} | WIFI: ${(user.mac_wifi || '')}`,
          ScopeID: ip,
          BU: user.business_unit || '0'
        }));
      })
    });

    const deviceBlob = new Blob([deviceCsv], { type: 'text/csv;charset=utf-8;' });
    saveAs(deviceBlob, 'CREATE_DHCP_Reservation.csv');

    const groupMailFields = ['SamAccountName', 'Name', 'Identity'];
    const groupMailCsv = Papa.unparse({
      fields: groupMailFields,
      data: users.flatMap(user =>
        (user.mail_groups || []).map(group => ({
          SamAccountName: user.emp_code,
          Name: user.full_name || '',
          Identity: group
        }))
      )
    });

    const groupMailBlob = new Blob([groupMailCsv], { type: 'text/csv;charset=utf-8;' });
    saveAs(groupMailBlob, 'Add-ADGroupMember.csv');

    const shareFileFields = ['LocalUser', 'Password', 'Description', 'FullName', 'GroupName'];
    const shareFileCsv = Papa.unparse({
      fields: shareFileFields,
      data: users.flatMap(user => {
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

  const handleComplete = async () => {
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    try {
      setUpdating(true);
      setShowConfirmModal(false);

      await axios.post('/script/complete-setup', {
        users: users.map(user => ({
          emp_code: user.emp_code,
          asset_code: user.asset_code,
          ip_addresses: user.ip_address,
          history_id: user.history_id
        }))
      });

      const ipUpdates = users.flatMap(user =>
        (user.ip_address || []).map(ip => ({
          ip: ip,
          hostName: user.asset_code,
          macAddress: (macType[users.indexOf(user)] === 'mac_wifi' ? user.mac_wifi : user.mac_address) || '',
          use: `${user.emp_code} - ${user.full_name}`,
          installationFloor: user.floor,
          installationLocation: user.department || '',
          ipType: "DHCP",
          deviceType: user.category_name || '',
          networkType: user.category_name || '',
          connectionDevices: user.category_name || '',
          status: "In Use",
          remarks: `Assigned to ${user.full_name} (${user.emp_code})`
        }))
      );

      await Promise.all(ipUpdates.map(update => updateNetworkSegment(update)));

      toast.success(t('createADUser.messages.updateSuccess'));
      await fetchADUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('createADUser.messages.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSearchChange = (index: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [index]: value }));
    if (!showDropdowns[index]) {
      const inputElement = inputRefs.current[index];
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        setDropdownPosition(prev => ({
          ...prev,
          [index]: {
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          }
        }));
      }
    }
    setShowDropdowns(prev => ({ ...prev, [index]: true }));
  };

  const handleDropdownToggle = (index: string) => {
    if (!showDropdowns[index]) {
      const inputElement = inputRefs.current[index];
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        setDropdownPosition(prev => ({
          ...prev,
          [index]: {
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          }
        }));
      }
    }
    setShowDropdowns(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSelectGroup = (index: string, group: string) => {
    const [userIndex, groupIndex] = index.split('-').map(Number);
    const newUsers = [...users];
    if (!newUsers[userIndex].mail_groups) {
      newUsers[userIndex].mail_groups = [];
    }
    newUsers[userIndex].mail_groups[groupIndex] = group;
    setUsers(newUsers);
    setSearchTerms(prev => ({ ...prev, [index]: group }));
    setShowDropdowns(prev => ({ ...prev, [index]: false }));
  };

  const filteredMailGroups = (index: string) => {
    const searchTerm = searchTerms[index] || '';
    return MAIL_GROUPS.filter(group =>
      group.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Layout>
      <div className="ad-user-list container py-3">
        <Card className="shadow-sm border-0">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">📋 {t('createADUser.title')}</h5>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={handleExportCSV}
                disabled={updating}
              >
                <ArrowDown size={18} className="me-2" />
                {t('createADUser.exportCSV')}
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {t('createADUser.updating')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="me-2" />
                    {t('createADUser.complete')}
                  </>
                )}
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-bordered align-middle table-hover">
                  <thead className="table-light text-center">
                    <tr>
                      <th>{t('createADUser.table.stt')}</th>
                      <th>{t('createADUser.table.firstname')}</th>
                      <th>{t('createADUser.table.lastname')}</th>
                      <th>{t('createADUser.table.username')}</th>
                      <th>{t('createADUser.table.email')}</th>
                      <th>{t('createADUser.table.department')}</th>
                      <th>{t('createADUser.table.jobtitle')}</th>
                      <th>{t('createADUser.table.workstation')}</th>
                      <th>{t('createADUser.table.description')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: ADUser, index: number) => (
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
              </div>
            )}
          </Card.Body>

          {/* Device Info */}
          <Card.Body>
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <h5 className="mb-0">📋 {t('createADUser.deviceInfo.title')}</h5>
            </Card.Header>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-bordered align-middle table-hover">
                  <thead className="table-light text-center">
                    <tr>
                      <th>{t('createADUser.deviceInfo.table.stt')}</th>
                      <th>{t('createADUser.deviceInfo.table.ip')}</th>
                      <th>{t('createADUser.deviceInfo.table.mac')}</th>
                      <th>{t('createADUser.deviceInfo.table.hostname')}</th>
                      <th>{t('createADUser.deviceInfo.table.description')}</th>
                      <th>{t('createADUser.deviceInfo.table.scopeID')}</th>
                      <th>{t('createADUser.deviceInfo.table.bu')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: ADUser, index: number) => {
                      const scopeIDs = getScopeIDs(u.floor);
                      return scopeIDs.map((scopeID, ipIndex) => (
                        <tr key={`${index}-${ipIndex}`}>
                          <td className="text-center fw-medium">{index + 1}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={u.ip_address?.[ipIndex] || ''}
                                onChange={(e) => handleIPChange(index, ipIndex, e.target.value)}
                                placeholder={t('createADUser.deviceInfo.placeholders.ip')}
                              />
                            </div>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={macType[index] || 'mac_address'}
                              onChange={e => setMacType({ ...macType, [index]: e.target.value as 'mac_address' | 'mac_wifi' })}
                            >
                              <option value="mac_address">{u.mac_address || 'Không có'}</option>
                              <option value="mac_wifi">{u.mac_wifi || 'Không có'}</option>
                            </select>
                          </td>
                          <td>{u.asset_code}</td>
                          <td>
                            <span className="text-muted small">
                              LAN: {u.mac_address || 'Không có'} | WIFI: {u.mac_wifi || 'Không có'}
                            </span>
                          </td>
                          <td>{scopeID}</td>
                          <td>{u.business_unit}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>

          {/* Group Mail Table */}
          <Card.Body>
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <h5 className="mb-0">📋 {t('createADUser.groupMail.title')}</h5>
            </Card.Header>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-bordered align-middle table-hover">
                  <thead className="table-light text-center">
                    <tr>
                      <th>{t('createADUser.groupMail.table.stt')}</th>
                      <th>{t('createADUser.groupMail.table.samAccountName')}</th>
                      <th>{t('createADUser.groupMail.table.name')}</th>
                      <th>{t('createADUser.groupMail.table.identity')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.flatMap((u: ADUser, userIndex: number) =>
                      (u.mail_groups || []).map((group, groupIndex) => (
                        <tr key={`${userIndex}-${groupIndex}`}>
                          <td className="text-center fw-medium">{userIndex + 1}</td>
                          <td>{u.emp_code}</td>
                          <td>{u.full_name || ''}</td>
                          <td>
                            <div
                              className="dropdown-group-mail"
                              ref={(el) => {
                                if (el) {
                                  inputRefs.current[`${userIndex}-${groupIndex}`] = el;
                                }
                              }}
                            >
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={group}
                                  placeholder={t('createADUser.groupMail.placeholders.mailGroup')}
                                  onChange={(e) => {
                                    const newUsers = [...users];
                                    if (!newUsers[userIndex].mail_groups) {
                                      newUsers[userIndex].mail_groups = [];
                                    }
                                    newUsers[userIndex].mail_groups[groupIndex] = e.target.value;
                                    setUsers(newUsers);
                                    handleSearchChange(`${userIndex}-${groupIndex}`, e.target.value);
                                  }}
                                  onClick={() => handleDropdownToggle(`${userIndex}-${groupIndex}`)}
                                />
                                <button
                                  className="btn btn-outline-secondary"
                                  type="button"
                                  onClick={() => handleDropdownToggle(`${userIndex}-${groupIndex}`)}
                                >
                                  <i className="fas fa-chevron-down"></i>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>

          {/* Create Share File Table */}
          <Card.Body>
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <h5 className="mb-0">📋 {t('createADUser.shareFile.title')}</h5>
            </Card.Header>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-bordered align-middle table-hover">
                  <thead className="table-light text-center">
                    <tr>
                      <th>{t('createADUser.shareFile.table.stt')}</th>
                      <th>{t('createADUser.shareFile.table.localUser')}</th>
                      <th>{t('createADUser.shareFile.table.password')}</th>
                      <th>{t('createADUser.shareFile.table.description')}</th>
                      <th>{t('createADUser.shareFile.table.fullName')}</th>
                      <th>{t('createADUser.shareFile.table.groupName')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.flatMap((u: ADUser, index: number) => {
                      const defaultGroups = getDefaultGroupNames(u.business_unit || '');
                      return defaultGroups.map((group, groupIndex) => (
                        <tr key={`${index}-${groupIndex}`}>
                          <td className="text-center fw-medium">{index + 1}</td>
                          <td>{u.emp_code}</td>
                          <td>P@ssw0rd</td>
                          <td>{u.email}</td>
                          <td>{u.full_name}</td>
                          <td>
                            <div
                              className="dropdown-group-mail"
                              ref={(el) => {
                                if (el) {
                                  inputRefs.current[`share-${index}-${groupIndex}`] = el;
                                }
                              }}
                            >
                              <div className="input-group input-group-sm">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={group}
                                  readOnly
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Confirmation Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('createADUser.modal.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="alert alert-warning">
              <i className="fas fa-question-circle me-2"></i>
              {t('createADUser.modal.warning')}
            </div>
            <p className="text-muted mb-0">
              {t('createADUser.modal.description')}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              {t('createADUser.modal.buttons.checkAgain')}
            </Button>
            <Button variant="primary" onClick={handleConfirmComplete} disabled={updating}>
              {updating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {t('createADUser.updating')}
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="me-2" />
                  {t('createADUser.modal.buttons.proceed')}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      {/* Render dropdowns using Portal */}
      {Object.entries(showDropdowns).map(([index, isOpen]) => {
        if (!isOpen) return null;
        const position = dropdownPosition[index];
        if (!position) return null;

        return createPortal(
          <div
            ref={dropdownRef}
            className="dropdown-menu show"
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 1050,
              maxHeight: '118px',
              overflowY: 'auto'
            }}
          >
            {filteredMailGroups(index).map((group) => (
              <div
                key={group}
                className="dropdown-item"
                onClick={() => handleSelectGroup(index, group)}
              >
                {group}
              </div>
            ))}
          </div>,
          document.body
        );
      })}
    </Layout>
  );
}

const styles = `
  .dropdown-group-mail {
    position: relative;
  }

  .dropdown-group-mail .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1050;
    background-color: white;
    width: 100%;
    max-height: 120px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
  }

  .dropdown-group-mail .dropdown-item {
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  .dropdown-group-mail .dropdown-item:hover {
    background-color: #f8f9fa;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

