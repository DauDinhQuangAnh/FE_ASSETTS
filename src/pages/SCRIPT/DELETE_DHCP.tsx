import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Card, Modal } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { ArrowDown, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { updateNetworkSegment } from '../../services/networkSegmentService';
import { useTranslation } from 'react-i18next';

interface DHCPUser {
  asset_code: string;
  asset_name: string;
  brand: string;
  model: string;
  serial_number: string;
  mac_address: string;
  mac_wifi: string;
  type: string;
  ip_address: string[];
  hub: string;
  vcs_lan_no: string;
  start_use_date: string;
  OS: string;
  OFFICE: string;
  software_used: string;
  configuration: string;
  purchase_date: string;
  purchase_price: number;
  warranty_expiry: string;
  maintenance_cycle: number;
  upgrade_infor: string;
  notes: string;
  emp_code: string;
  full_name: string;
  last_employee_email: string;
  last_department: string;
  business_unit_name: string;
  handover_date: string;
  returned_date: string;
  floor: string;
  history_note: string;
  is_borrowed: boolean;
  borrow_start_date: string;
  borrow_due_date: string;
  status_name: string;
  category_name: string;
}

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

export default function DHCPList() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<DHCPUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchDHCPUsers();
  }, []);

  const fetchDHCPUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/script/returned-assets');
      console.log('API Response:', response.data);
      const formattedUsers = response.data.map((user: any) => ({
        ...user,
        ip_address: user.ip_address || []
      }));
      console.log('Formatted Users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || t('deleteDHCP.messages.loadError'));
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
      data: users.flatMap(user => {
        const scopeIDs = getScopeIDs(user.floor);
        return scopeIDs.map((ip, ipIndex) => ({
          [t('deleteDHCP.table.ip')]: user.ip_address?.[ipIndex] || '',
          [t('deleteDHCP.table.mac')]: user.mac_address || '',
          [t('deleteDHCP.table.hostname')]: user.asset_code || '',
          [t('deleteDHCP.table.description')]: `${user.emp_code || ''}/${user.full_name || ''}`.trim(),
          [t('deleteDHCP.table.scopeID')]: ip,
          [t('deleteDHCP.table.bu')]: user.business_unit_name || '0'
        }));
      })
    });

    const deviceBlob = new Blob([deviceCsv], { type: 'text/csv;charset=utf-8;' });
    saveAs(deviceBlob, 'DELETE_DHCP_Reservation.csv');
  };

  const handleComplete = async () => {
    setShowConfirmModal(true);
  };

  const handleConfirmComplete = async () => {
    try {
      setUpdating(true);
      setShowConfirmModal(false);

      const ipUpdates = users.flatMap(user =>
        (user.ip_address || []).map(ip => ({
          ip: ip,
          hostName: null,
          macAddress: null,
          use: null,
          installationFloor: null,
          installationLocation: null,
          deviceType: null,
          networkType: null,
          connectionDevices: null,
          status: null,
          remarks: null
        }))
      );

      await Promise.all(ipUpdates.map(update => updateNetworkSegment(update)));

      await axios.post('/script/complete-delete-assets');

      toast.success(t('deleteDHCP.messages.updateSuccess'));
      await fetchDHCPUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('deleteDHCP.messages.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div className="dhcp-list container py-3">
        <Card className="shadow-sm border-0">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">📋 {t('deleteDHCP.title')}</h5>
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={handleExportCSV}
                disabled={updating || users.length === 0}
              >
                <ArrowDown size={18} className="me-2" />
                {t('deleteDHCP.exportCSV')}
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={updating || users.length === 0}
              >
                {updating ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {t('deleteDHCP.updating')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="me-2" />
                    {t('deleteDHCP.complete')}
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
            ) : users.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-0">{t('deleteDHCP.noData')}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-bordered align-middle table-hover">
                  <thead className="table-light text-center">
                    <tr>
                      <th>{t('deleteDHCP.table.stt')}</th>
                      <th>{t('deleteDHCP.table.ip')}</th>
                      <th>{t('deleteDHCP.table.mac')}</th>
                      <th>{t('deleteDHCP.table.hostname')}</th>
                      <th>{t('deleteDHCP.table.description')}</th>
                      <th>{t('deleteDHCP.table.scopeID')}</th>
                      <th>{t('deleteDHCP.table.bu')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: DHCPUser, index: number) =>
                      (user.ip_address.length > 0 ? user.ip_address : ['']).map((ip, ipIndex) => (
                        <tr key={`${user.asset_code}-${ipIndex}`}>
                          <td className="text-center fw-medium">{index + 1}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={ip}
                                onChange={(e) => handleIPChange(index, ipIndex, e.target.value)}
                                placeholder={t('deleteDHCP.placeholders.ip')}
                              />
                            </div>
                          </td>
                          <td>{user.mac_address || '-'}</td>
                          <td>{user.asset_code || '-'}</td>
                          <td>{`${user.emp_code || ''}/${user.full_name || ''}`.trim() || '-'}</td>
                          <td>{ip || '-'}</td>
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

        {/* Confirmation Modal */}
        <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{t('deleteDHCP.modal.title')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="alert alert-warning">
              <i className="fas fa-question-circle me-2"></i>
              {t('deleteDHCP.modal.warning')}
            </div>
            <p className="text-muted mb-0">
              {t('deleteDHCP.modal.description')}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              {t('deleteDHCP.modal.buttons.checkAgain')}
            </Button>
            <Button variant="primary" onClick={handleConfirmComplete} disabled={updating}>
              {updating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {t('deleteDHCP.updating')}
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="me-2" />
                  {t('deleteDHCP.modal.buttons.proceed')}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Layout>
  );
}

