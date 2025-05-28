import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Card, Modal } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { ArrowDown, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import './Create_ADUser_DHCP.css';

interface ADUser {
  first_name: string;
  last_name: string;
  emp_code: string;
  middleInitial: string;
  id: string;
  oldpc: string;
  business_unit: string;
  mac_address: string;
  floor: string;
  ip_addresses?: string[];
  is_handover: boolean;
  jobtitle: string;
  asset_code: string;
  scope_ids?: string[];
  registered_floors?: string[];
  current_floor?: string;
  show_dhcp_reservation?: boolean;
  history_id: number;
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

const FLOOR_IPS = {
  '1F': '172.25.166.0',
  '2F': '172.25.168.0',
  'BF': '172.25.164.0'
};

const getScopeIDs = (floor: string, jobtitle: string, business_unit: string) => {
  const isTitleA = TITLE_A.includes(jobtitle);
  const ips: string[] = [];

  if (floor === '1F') {
    ips.push(FLOOR_IPS['1F']);
    if (isTitleA) {
      ips.push(FLOOR_IPS['2F']);
    }
  } else if (floor === '2F') {
    if (isTitleA) {
      ips.push(FLOOR_IPS['1F']);
      ips.push(FLOOR_IPS['2F']);
    } else {
      ips.push(FLOOR_IPS['2F']);
    }
  } else if (floor === 'BF') {
    if (isTitleA) {
      ips.push(FLOOR_IPS['1F']);
      ips.push(FLOOR_IPS['BF']);
      ips.push(FLOOR_IPS['2F']);
    } else {
      ips.push(FLOOR_IPS['BF']);
    }
  } else if (business_unit === 'SAS') {
    if (isTitleA) {
      ips.push(FLOOR_IPS['1F']);
      ips.push(FLOOR_IPS['BF']);
      ips.push(FLOOR_IPS['2F']);
    } else {
      ips.push(FLOOR_IPS['BF']);
    }
  }

  return ips;
};

export default function SetLogOn() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ADUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchADUsers();
  }, []);

  const fetchRegisteredFloors = async (assetCode: string) => {
    try {
      const response = await axios.get(`/script/registered-floors/${assetCode}`);
      return response.data.floors || [];
    } catch (err) {
      console.error('Không thể lấy thông tin tầng đã đăng ký:', err);
      return [];
    }
  };

  const fetchADUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/script/set-logon');

      const usersWithFloors = await Promise.all(
        response.data.map(async (user: any) => {
          const registered_floors = await fetchRegisteredFloors(user.asset_code);
          const current_floor = user.floor;

          let show_dhcp_reservation = false;
          if (user.is_handover) {
            show_dhcp_reservation = true;
          } else {
            show_dhcp_reservation = !registered_floors.includes(current_floor);
          }
          const scopeIDs = getScopeIDs(user.floor, user.jobtitle, user.business_unit);
          let ipArr: string[] = [];
          if (typeof user.ip_address === 'string') {
            ipArr = user.ip_address.split(',').map((ip: string) => ip.trim());
          } else if (Array.isArray(user.ip_address)) {
            ipArr = user.ip_address;
          }
          const ip_addresses = scopeIDs.map((_, idx) => ipArr[idx] || '');

          return {
            ...user,
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
            is_handover: user.is_handover || false,
            newpc: `${user.asset_code}@`,
            scope_ids: scopeIDs,
            registered_floors,
            current_floor,
            show_dhcp_reservation,
            ip_addresses,
            history_id: user.history_id || 0
          };
        })
      );

      setUsers(usersWithFloors);
    } catch (err: any) {
      setError(err.response?.data?.message || t('setLogon.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOldPCChange = (index: number, value: string) => {
    setUsers(prevUsers => {
      const newUsers = [...prevUsers];
      newUsers[index] = { ...newUsers[index], oldpc: value };
      return newUsers;
    });
  };

  const handleExportCSV = () => {
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
      data: users.map(user => ({
        firstname: user.first_name || '',
        middleInitial: user.middleInitial || '',
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

  const handleComplete = async () => {
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    try {
      setUpdating(true);
      setShowConfirmModal(false);

      console.log('Users data before API call:', users.map(user => ({
        asset_code: user.asset_code,
        emp_code: user.emp_code,
        history_id: user.history_id
      })));

      const results = await Promise.allSettled(
        users.map(user => {
          console.log(`Calling API for user ${user.emp_code} with history_id: ${user.history_id}`);
          return axios.post(`/script/complete-setup/${user.asset_code}/${user.emp_code}/${user.history_id}`);
        })
      );

      const errors = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      );

      if (errors.length > 0) {
        const errorMessages = errors.map(error => error.reason?.response?.data?.message || 'Lỗi không xác định');
        toast.error(
          <div>
            <strong>Lỗi khi cập nhật:</strong>
            <ul className="mt-2 mb-0">
              {errorMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        );
      } else {
        toast.success(t('setLogon.messages.updateSuccess'));
      }

      await fetchADUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('setLogon.messages.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div className="ad-user-list container py-3">
        <Card className="shadow-sm border-0">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">📋 {t('setLogon.title')}</h5>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={handleExportCSV}
                disabled={updating}
              >
                <ArrowDown size={18} className="me-2" />
                {t('setLogon.exportCSV')}
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {t('setLogon.updating')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="me-2" />
                    {t('setLogon.complete')}
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
                      <th>{t('setLogon.table.stt')}</th>
                      <th>{t('setLogon.table.firstname')}</th>
                      <th>{t('setLogon.table.lastname')}</th>
                      <th>{t('setLogon.table.id')}</th>
                      <th>{t('setLogon.table.oldpc')}</th>
                      <th>{t('setLogon.table.newpc')}</th>
                      <th>{t('setLogon.table.buName')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: ADUser, index: number) => (
                      <tr key={index}>
                        <td className="text-center fw-medium">{index + 1}</td>
                        <td>{u.first_name}</td>
                        <td>{u.last_name}</td>
                        <td>{u.emp_code}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={u.oldpc || ''}
                            onChange={(e) => handleOldPCChange(index, e.target.value)}
                            placeholder={t('setLogon.placeholders.oldpc')}
                          />
                        </td>
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

        {/* Confirmation Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('setLogon.modal.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="alert alert-warning">
              <i className="fas fa-question-circle me-2"></i>
              {t('setLogon.modal.warning')}
            </div>
            <p className="text-muted mb-0">
              {t('setLogon.modal.description')}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              {t('setLogon.modal.buttons.checkAgain')}
            </Button>
            <Button variant="primary" onClick={handleConfirmComplete} disabled={updating}>
              {updating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {t('setLogon.updating')}
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="me-2" />
                  {t('setLogon.modal.buttons.proceed')}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
} 