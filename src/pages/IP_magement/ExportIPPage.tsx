import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Table,
  Card,
  Row,
  Col,
  Spinner,
  Container,

} from "react-bootstrap";
import Header from "../../components/Header";
import { FaSearch, FaFileCsv } from "react-icons/fa";
import { fetchAllocatedIPsByDate } from "../../services/networkSegmentService";
import { NetworkSegment } from "../../types/NetworkSegment";
import IconWrapper from "../../components/IP_components/IconWrapper";
import AutoDismissAlert from "../../components/IP_components/AutoDismissAlert";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";

const ExportIPPage: React.FC = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [allocatedIPs, setAllocatedIPs] = useState<NetworkSegment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{
    message: string;
    show: boolean;
  } | null>(null);
  const [selectedIPs, setSelectedIPs] = useState<string[]>([]);


  // Format date dạng dd/mm/yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Set default date range: 7 ngày gần nhất khi trang load
  useEffect(() => {
    const today = new Date();
    const defaultEnd = today.toISOString().split("T")[0];
    const past = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago (to include today)
    const defaultStart = past.toISOString().split("T")[0];
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, []);

  // Khi startDate và endDate thay đổi, tự động gọi handleSearch
  useEffect(() => {
    if (startDate && endDate) {
      handleSearch();
    }
  }, [startDate, endDate]);

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError({ message: t("exportIP.errors.dateRange"), show: true });
      return;
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj < startDateObj) {
      setError({
        message: t("exportIP.errors.invalidDateRange"),
        show: true,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllocatedIPsByDate(startDate, endDate);
      if (!data || data.length === 0) {
        setError({
          message: t("exportIP.errors.noData"),
          show: true,
        });
        setAllocatedIPs([]);
      } else {
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(a.Registration).getTime();
          const dateB = new Date(b.Registration).getTime();
          return dateB - dateA;
        });
        setAllocatedIPs(sortedData);
      }
      setSelectedIPs([]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError({
        message: t("exportIP.errors.loadError"),
        show: true,
      });
      setAllocatedIPs([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý chọn/deselect từng dòng
  const handleCheckboxChange = (ipAddress: string, checked: boolean) => {
    setSelectedIPs((prev) => {
      if (checked) {
        return [...prev, ipAddress];
      } else {
        return prev.filter((ip) => ip !== ipAddress);
      }
    });
  };

  // Checkbox chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIPs = allocatedIPs.map((ip) => ip["IP address"]);
      setSelectedIPs(allIPs);
    } else {
      setSelectedIPs([]);
    }
  };

  // Xuất file Excel chỉ với các IP được tick. Nếu không có IP nào được tick, báo lỗi.
  const handleExport = () => {
    if (selectedIPs.length === 0) {
      setError({
        message: t("exportIP.export.noSelection"),
        show: true,
      });
      return;
    }

    const dataToExport = allocatedIPs.filter((ip) =>
      selectedIPs.includes(ip["IP address"])
    );

    try {
      const exportData = dataToExport.map((ip) => ({
        Registration: formatDate(ip.Registration),
        VLAN: ip.VLAN,
        "Host Name": ip["Host Name"],
        "IP Type": ip["IP Type"],
        "IP Address": ip["IP address"],
        "MAC Address": ip["MAC address"],
        "Device Type": ip["Device Type"],
        "Network Type": ip["Network Type"],
        "Installation Floor": ip["Installation floor"],
        "Installation Location": ip["Installation location"],
        Use: ip.Use,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 12 }, // Registration
        { wch: 8 }, // VLAN
        { wch: 20 }, // Host Name
        { wch: 10 }, // IP Type
        { wch: 15 }, // IP Address
        { wch: 20 }, // MAC Address
        { wch: 15 }, // Device Type
        { wch: 15 }, // Network Type
        { wch: 15 }, // Installation Floor
        { wch: 20 }, // Installation Location
        { wch: 30 }, // Use
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Allocated IPs");

      // Tạo tên file với ngày theo định dạng dd/mm/yyyy
      const startDateFormatted = formatDate(startDate);
      const endDateFormatted = formatDate(endDate);
      XLSX.writeFile(
        wb,
        `Allocated_IPs_${startDateFormatted}_${endDateFormatted}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      setError({
        message: t("exportIP.export.error"),
        show: true,
      });
    }
  };

  return (
    <Container fluid style={{ paddingTop: '80px' }}>
      <Header />
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex align-items-center">
          <IconWrapper icon={FaSearch} size={16} className="me-2" />
          <h5 className="mb-0">Date Range Selection</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>{t("exportIP.dateRange.startDate")}</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>{t("exportIP.dateRange.endDate")}</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                className="me-2"
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
                    {t("exportIP.dateRange.loading")}
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaSearch} size={14} className="me-2" />
                    {t("exportIP.dateRange.search")}
                  </>
                )}
              </Button>
              {selectedIPs.length > 0 && (
                <Button variant="success" onClick={handleExport}>
                  <IconWrapper icon={FaFileCsv} size={14} className="me-2" />
                  {t("exportIP.export.button")}
                </Button>
              )}
            </Col>
          </Row>
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
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">{t("exportIP.dateRange.loading")}</span>
          </Spinner>
        </div>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <div style={{ overflowX: "auto" }}>
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "40px" }}>
                      <Form.Check
                        type="checkbox"
                        checked={selectedIPs.length === allocatedIPs.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>{t("exportIP.table.registration")}</th>
                    <th>{t("exportIP.table.vlan")}</th>
                    <th>{t("exportIP.table.hostName")}</th>
                    <th>{t("exportIP.table.ipType")}</th>
                    <th>{t("exportIP.table.ipAddress")}</th>
                    <th>{t("exportIP.table.macAddress")}</th>
                    <th>{t("exportIP.table.connectionDevices")}</th>
                    <th>{t("exportIP.table.deviceType")}</th>
                    <th>{t("exportIP.table.networkType")}</th>
                    <th>{t("exportIP.table.installationFloor")}</th>
                    <th>{t("exportIP.table.installationLocation")}</th>
                    <th>{t("exportIP.table.use")}</th>
                    <th>{t("exportIP.table.status")}</th>
                    <th>{t("exportIP.table.remarks")}</th>
                  </tr>
                </thead>
                <tbody>
                  {allocatedIPs.map((ip, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedIPs.includes(ip["IP address"])}
                          onChange={(e) =>
                            handleCheckboxChange(
                              ip["IP address"],
                              e.target.checked
                            )
                          }
                        />
                      </td>
                      <td>{formatDate(ip.Registration)}</td>
                      <td>{ip.VLAN}</td>
                      <td>{ip["Host Name"]}</td>
                      <td>{ip["IP Type"]}</td>
                      <td>{ip["IP address"]}</td>
                      <td>{ip["MAC address"]}</td>
                      <td>{ip["Connection Devices"]}</td>
                      <td>{ip["Device Type"]}</td>
                      <td>{ip["Network Type"]}</td>
                      <td>{ip["Installation floor"]}</td>
                      <td>{ip["Installation location"]}</td>
                      <td>{ip.Use}</td>
                      <td>{ip.Status}</td>
                      <td>{ip.Remarks}</td>
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

export default ExportIPPage;
