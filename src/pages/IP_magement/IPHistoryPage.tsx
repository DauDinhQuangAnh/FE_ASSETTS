// src/pages/IP_magement/IPHistoryPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Spinner,
  Table,
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { fetchNetworkHistory } from "../../services/networkSegmentService";
import AutoDismissAlert from "../../components/IP_components/AutoDismissAlert";
import "../../styles/App.css"; // Đảm bảo file này chứa class .highlight-latest
import Header from "../../components/Header";
import { useTranslation } from "react-i18next";
import { FaSearch } from 'react-icons/fa';


interface IPHistoryRecord {
  HistoryID: number;
  Registration: string | null;
  VLAN: number | null;
  "Host Name": string | null;
  "IP Type": string | null;
  "IP address": string | null;
  "MAC address": string | null;
  "Installation floor": string | null;
  "Installation location": string | null;
  Use: string | null;
  ActionType: string; // chỉ hiển thị các giá trị như 'INSERT', 'UPDATE - OLD VALUE', 'DELETE'
  ActionDate: string;
  // ModifiedBy không hiển thị theo yêu cầu
}

const IPHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [ipAddress, setIpAddress] = useState<string>(
    searchParams.get("ip") || ""
  );
  const [history, setHistory] = useState<IPHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{
    message: string;
    show: boolean;
  } | null>(null);

  // Hàm format ngày tháng
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Khi trang load, nếu có query param "ip", tự động điền vào ô tìm kiếm
  useEffect(() => {
    const ipParam = searchParams.get("ip");
    if (ipParam) {
      setIpAddress(ipParam);
    }
  }, [searchParams]);

  // Hàm gọi API để lấy lịch sử IP và lọc bỏ các bản ghi có ActionType là "UPDATE - NEW VALUE"
  const loadHistory = async (ip: string) => {
    if (!ip.trim()) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNetworkHistory({ ip });
      // Lọc bỏ các bản ghi có ActionType là "UPDATE - NEW VALUE" để chỉ hiển thị old value
      const filteredData = data.filter(
        (record: IPHistoryRecord) => record.ActionType !== "UPDATE - NEW VALUE"
      );
      setHistory(filteredData);
    } catch (err) {
      console.error("Error fetching IP history:", err);
      setError({ message: t("ipHistory.errors.loadError"), show: true });
    } finally {
      setLoading(false);
    }
  };

  // Dùng debounce để tránh gọi API liên tục khi người dùng nhập
  const debouncedLoadHistory = useCallback(
    debounce((ip: string) => {
      loadHistory(ip);
    }, 300),
    []
  );

  useEffect(() => {
    if (ipAddress.trim()) {
      debouncedLoadHistory(ipAddress);
    } else {
      setHistory([]);
    }
  }, [ipAddress, debouncedLoadHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistory(ipAddress);
  };

  return (
    <Container fluid style={{ paddingTop: '80px' }}>
      <Header />
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">{t("ipHistory.title")}</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder={t("ipHistory.search.placeholder")}
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    {t("ipHistory.loading")}
                  </>
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    {t("ipHistory.search.button")}
                  </>
                )}
              </Button>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>

      {error && (
        <AutoDismissAlert
          variant="danger"
          message={error.message}
          show={error.show}
          onClose={() => setError(null)}
        />
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">{t("ipHistory.loading")}</span>
          </Spinner>
        </div>
      ) : ipAddress && history.length === 0 ? (
        <Card>
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">{t("ipHistory.noData.title", { ip: ipAddress })}</h5>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-5">
              <h5 className="text-muted">{t("ipHistory.noData.message")}</h5>
              <p className="text-muted">{t("ipHistory.noData.description", { ip: ipAddress })}</p>
            </div>
          </Card.Body>
        </Card>
      ) : history.length > 0 && (
        <Card>
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">{t("ipHistory.title")}: {ipAddress}</h5>
          </Card.Header>
          <Card.Body>
            <div style={{ overflowX: "auto" }}>
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>{t("ipHistory.table.registration")}</th>
                    <th>{t("ipHistory.table.vlan")}</th>
                    <th>{t("ipHistory.table.hostName")}</th>
                    <th>{t("ipHistory.table.ipType")}</th>
                    <th>{t("ipHistory.table.ipAddress")}</th>
                    <th>{t("ipHistory.table.macAddress")}</th>
                    <th>{t("ipHistory.table.installationFloor")}</th>
                    <th>{t("ipHistory.table.installationLocation")}</th>
                    <th>{t("ipHistory.table.use")}</th>
                    <th>{t("ipHistory.table.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => (
                    <tr key={index}>
                      <td>{formatDate(record.Registration)}</td>
                      <td>{record.VLAN}</td>
                      <td>{record["Host Name"]}</td>
                      <td>{record["IP Type"]}</td>
                      <td>{record["IP address"]}</td>
                      <td>{record["MAC address"]}</td>
                      <td>{record["Installation floor"]}</td>
                      <td>{record["Installation location"]}</td>
                      <td>{record.Use}</td>
                      <td>
                        <span className={`badge ${record.ActionType === 'ASSIGN' ? 'bg-success' :
                          record.ActionType === 'EDIT' ? 'bg-primary' :
                            record.ActionType === 'DELETE' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                          {t(`ipHistory.actions.${record.ActionType.toLowerCase()}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default IPHistoryPage;
