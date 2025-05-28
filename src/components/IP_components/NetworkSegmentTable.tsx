// src/components/NetworkSegmentTable.tsx
import React, { useEffect, useState } from "react";
import { NetworkSegment } from "../../types/NetworkSegment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { Table, Button } from "react-bootstrap";

interface TableProps {
  segments: NetworkSegment[];
  searchTerm: string;
  onAction: (ip: string, mode: "assign" | "edit" | "delete", record?: NetworkSegment) => void;
}

const NetworkSegmentTable: React.FC<TableProps> = ({
  segments,
  searchTerm,
  onAction,
}) => {
  const { t } = useTranslation();
  const [tableHeight, setTableHeight] = useState("450px");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Hàm cập nhật chiều cao bảng dựa trên chiều cao cửa sổ
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight;
    // Để lại khoảng trống cho header và footer
    const newHeight = windowHeight - 250; // 250px cho header và các phần khác
    setTableHeight(`${newHeight}px`);
  };

  // Theo dõi thay đổi kích thước màn hình
  useEffect(() => {
    updateTableHeight();
    window.addEventListener("resize", updateTableHeight);
    return () => window.removeEventListener("resize", updateTableHeight);
  }, []);

  // Reset selected rows when segments change
  useEffect(() => {
    setSelectedRows([]);
  }, [segments]);


  const handleExportExcel = () => {
    if (selectedRows.length === 0) {
      alert("Vui lòng chọn ít nhất một dòng để xuất");
      return;
    }

    // Lọc các dòng đã chọn
    const selectedSegments = segments.filter((item) =>
      selectedRows.includes(item["IP address"] || "")
    );

    // Tạo dữ liệu cho worksheet
    const ws_data = [
      // Header
      [
        "Registration",
        "VLAN",
        "Host Name",
        "IP Type",
        "IP address",
        "MAC Address",
        "Connection Devices",
        "Device Type",
        "Network Type",
        "Installation floor",
        "Installation location",
        "Use",
        "Status",
        "Remarks",
      ],
      // Data rows
      ...selectedSegments.map((item) => [
        formatDate(item.Registration),
        item.VLAN,
        item["Host Name"],
        item["IP Type"],
        item["IP address"],
        item["MAC address"],
        item["Connection Devices"],
        item["Device Type"],
        item["Network Type"],
        item["Installation floor"],
        item["Installation location"],
        item.Use,
        item.Status,
        item.Remarks,
      ]),
    ];

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, "IP List");

    // Tạo tên file với ngày hiện tại
    const date = new Date().toISOString().split("T")[0];
    const filename = `ip_list_${date}.xlsx`;

    // Lưu file
    XLSX.writeFile(wb, filename);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };


  const filteredSegments = segments.filter((segment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      segment["IP address"]?.toLowerCase().includes(searchLower) ||
      segment["Host Name"]?.toLowerCase().includes(searchLower) ||
      segment["MAC address"]?.toLowerCase().includes(searchLower) ||
      segment["Connection Devices"]?.toLowerCase().includes(searchLower) ||
      segment["Installation location"]?.toLowerCase().includes(searchLower) ||
      segment["Use"]?.toLowerCase().includes(searchLower) ||
      segment["Remarks"]?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {selectedRows.length > 0 && (
        <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded">
          <span>Selected {selectedRows.length} row</span>
          <button
            className="btn btn-success btn-sm"
            onClick={handleExportExcel}
          >
            <FontAwesomeIcon icon={faFileExport} className="me-1" />
            Export Excel
          </button>
        </div>
      )}

      <div
        style={{
          maxHeight: tableHeight,
          overflowX: "auto",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <Table striped bordered hover className="mb-0">
          <thead>
            <tr>
              <th>{t("networkSegment.table.registration")}</th>
              <th>{t("networkSegment.table.vlan")}</th>
              <th>{t("networkSegment.table.hostName")}</th>
              <th>{t("networkSegment.table.ipType")}</th>
              <th>{t("networkSegment.table.ipAddress")}</th>
              <th>{t("networkSegment.table.macAddress")}</th>
              <th>{t("networkSegment.table.connectionDevices")}</th>
              <th>{t("networkSegment.table.deviceType")}</th>
              <th>{t("networkSegment.table.networkType")}</th>
              <th>{t("networkSegment.table.installationFloor")}</th>
              <th>{t("networkSegment.table.installationLocation")}</th>
              <th>{t("networkSegment.table.use")}</th>
              <th>{t("networkSegment.table.status")}</th>
              <th>{t("networkSegment.table.remarks")}</th>
              <th>{t("networkSegment.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSegments.map((segment, index) => (
              <tr key={index}>
                <td>{segment.Registration}</td>
                <td>{segment.VLAN}</td>
                <td>{segment["Host Name"]}</td>
                <td>{segment["IP Type"]}</td>
                <td>{segment["IP address"]}</td>
                <td>{segment["MAC address"]}</td>
                <td>{segment["Connection Devices"]}</td>
                <td>{segment["Device Type"]}</td>
                <td>{segment["Network Type"]}</td>
                <td>{segment["Installation floor"]}</td>
                <td>{segment["Installation location"]}</td>
                <td>{segment.Use}</td>
                <td>{segment.Status}</td>
                <td>{segment.Remarks}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onAction(segment["IP address"], "assign", segment)}
                    >
                      {t("networkSegment.actions.assign")}
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => onAction(segment["IP address"], "edit", segment)}
                    >
                      {t("networkSegment.actions.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onAction(segment["IP address"], "delete", segment)}
                    >
                      {t("networkSegment.actions.delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default NetworkSegmentTable;
