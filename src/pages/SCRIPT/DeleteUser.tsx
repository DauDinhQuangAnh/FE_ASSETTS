import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Card } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { ArrowDown, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import axios from '../../api/axiosInstance';
import './Create_ADUser_DHCP.css';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

interface User {
  emp_code: string;
  email: string;
}

export default function DeleteUser() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/script/delete-user');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('deleteUser.messages.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const fields = ['username', 'email'];
    const csv = Papa.unparse({
      fields,
      data: users.map(user => ({
        username: user.emp_code || '',
        email: user.email || ''
      }))
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'DELETE_ADUser.csv');
  };

  const handleComplete = async () => {
    setUpdating(true);
    try {
      await axios.post('/script/complete-delete');
      toast.success(t('deleteUser.messages.updateSuccess'));
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('deleteUser.messages.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div className="ad-user-list container py-3">
        <Card className="shadow-sm border-0">
          <Card.Header className="d-flex justify-content-between align-items-center bg-white">
            <h5 className="mb-0">📋 {t('deleteUser.title')}</h5>
            <div
              style={{ paddingLeft: '500px' }}
            ><Button
              variant="success"
              onClick={handleExportCSV}
            >
                <ArrowDown size={18} className="me-2" />
                {t('deleteUser.exportCSV')}
              </Button></div>
            <Button
              variant="primary"
              onClick={handleComplete}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {t('deleteUser.updating')}
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="me-2" />
                  {t('deleteUser.complete')}
                </>
              )}
            </Button>
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
                      <th>{t('deleteUser.table.stt')}</th>
                      <th>{t('deleteUser.table.username')}</th>
                      <th>{t('deleteUser.table.email')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
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
      </div>
    </Layout>
  );
} 