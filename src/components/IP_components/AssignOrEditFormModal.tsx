import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Alert } from "react-bootstrap";
import { NetworkSegment } from "../../types/NetworkSegment";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onHide: () => void;
  mode: "assign" | "edit" | "delete";
  record: NetworkSegment;
  onSubmit: (data: any) => void;
}

const AssignOrEditFormModal: React.FC<Props> = ({
  show,
  onHide,
  mode,
  record,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<NetworkSegment>(record);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Cập nhật lại formData khi modal được hiển thị hoặc record thay đổi
  useEffect(() => {
    if (show) {
      setFormData({ ...record });
      setMissingFields([]);
      setShowSuccess(false);
    }
  }, [show, record]);

  // Hàm thay đổi giá trị của trường form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form cho mode 'assign'
  const validateForm = () => {
    if (mode !== "assign") return [];
    const requiredFields = [
      "Host Name",
      "Network Type",
      "Installation floor",
      "Use",
      "Status",
      "IP Type",
      "Device Type",
    ];
    return requiredFields.filter((field) => {
      const value = formData[field as keyof NetworkSegment];
      return typeof value === "string" ? value.trim() === "" : !value;
    });
  };

  const handleSave = () => {
    const missing = validateForm();
    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }
    setMissingFields([]);
    setShowConfirm(true);
  };

  // Khi xác nhận lưu, tạo payload và gọi onSubmit
  const handleConfirmSave = () => {
    const payload = {
      ip: formData["IP address"],
      registration: new Date().toISOString(),
      vlan: formData["VLAN"],
      hostName: formData["Host Name"],
      ipType: formData["IP Type"],
      macAddress: formData["MAC address"], // Thêm trường MAC address
      connectionDevices: formData["Connection Devices"],
      deviceType: formData["Device Type"],
      networkType: formData["Network Type"],
      installationFloor: formData["Installation floor"],
      installationLocation: formData["Installation location"],
      use: formData["Use"],
      status: formData["Status"],
      remarks: formData["Remarks"],
      mode: mode,
    };

    onSubmit(payload);
    setShowConfirm(false);
    setShowSuccess(true);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === "assign"
              ? t("networkSegment.actions.assign")
              : mode === "edit"
                ? t("networkSegment.actions.edit")
                : t("networkSegment.actions.delete")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showSuccess && (
            <Alert variant="success">{t("networkSegment.success.save")}</Alert>
          )}
          {missingFields.length > 0 && (
            <Alert variant="danger">
              {t("networkSegment.errors.requiredFields")}: {missingFields.join(", ")}
            </Alert>
          )}
          <Form>
            {/* IP, Registration, VLAN */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="formIp">
                  <Form.Label>{t("networkSegment.table.ipAddress")}</Form.Label>
                  <Form.Control
                    value={formData["IP address"] || ""}
                    disabled
                    readOnly
                    name="IP address"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="formRegistration">
                  <Form.Label>{t("networkSegment.table.registration")}</Form.Label>
                  <Form.Control
                    value={
                      formData["Registration"]
                        ? new Date(formData["Registration"]).toLocaleDateString(
                          "en-US"
                        )
                        : new Date().toLocaleDateString("en-US")
                    }
                    disabled
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="formVLAN">
                  <Form.Label>{t("networkSegment.table.vlan")}</Form.Label>
                  <Form.Control
                    value={formData["VLAN"]?.toString() || ""}
                    disabled
                    readOnly
                    name="VLAN"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Host Name, MAC Address, IP Type */}
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="formHostName">
                  <Form.Label>{t("networkSegment.table.hostName")}</Form.Label>
                  <Form.Control
                    value={formData["Host Name"] || ""}
                    name="Host Name"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="formMacAddress">
                  <Form.Label>{t("networkSegment.table.macAddress")}</Form.Label>
                  <Form.Control
                    value={formData["MAC address"] || ""}
                    name="MAC address"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="formIpType">
                  <Form.Label>{t("networkSegment.table.ipType")}</Form.Label>
                  <Form.Select
                    value={formData["IP Type"] || ""}
                    name="IP Type"
                    onChange={handleChange}
                  >
                    <option value="">-- {t("networkSegment.select.select")} --</option>
                    <option value="Fixed">Fixed</option>
                    <option value="DHCP">DHCP</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Devices */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formConnDev">
                  <Form.Label>{t("networkSegment.table.connectionDevices")}</Form.Label>
                  <Form.Control
                    value={formData["Connection Devices"] || ""}
                    name="Connection Devices"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formDeviceType">
                  <Form.Label>{t("networkSegment.table.deviceType")}</Form.Label>
                  <Form.Control
                    value={formData["Device Type"] || ""}
                    name="Device Type"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Network Type, Installation Floor */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formNetworkType">
                  <Form.Label>{t("networkSegment.table.networkType")}</Form.Label>
                  <Form.Select
                    value={formData["Network Type"] || ""}
                    name="Network Type"
                    onChange={handleChange}
                  >
                    <option value="">-- {t("networkSegment.select.select")} --</option>
                    <option value="Office">Office</option>
                    <option value="Server">Server</option>
                    <option value="CM production">CM production</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formInstallationFloor">
                  <Form.Label>{t("networkSegment.table.installationFloor")}</Form.Label>
                  <Form.Select
                    value={formData["Installation floor"] || ""}
                    name="Installation floor"
                    onChange={handleChange}
                  >
                    <option value="">-- {t("networkSegment.select.select")} --</option>
                    <option value="BF">BF</option>
                    <option value="1F">1F</option>
                    <option value="2F">2F</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Installation Location, Use */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formInstallationLocation">
                  <Form.Label>{t("networkSegment.table.installationLocation")}</Form.Label>
                  <Form.Control
                    value={formData["Installation location"] || ""}
                    name="Installation location"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formUse">
                  <Form.Label>{t("networkSegment.table.use")}</Form.Label>
                  <Form.Control
                    value={formData["Use"] || ""}
                    name="Use"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Status, Remarks */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formStatus">
                  <Form.Label>{t("networkSegment.table.status")}</Form.Label>
                  <Form.Select
                    value={formData["Status"] || ""}
                    name="Status"
                    onChange={handleChange}
                  >
                    <option value="">-- {t("networkSegment.select.select")} --</option>
                    <option value="used">{t("networkSegment.select.used")}</option>
                    <option value="unused">{t("networkSegment.select.unused")}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formRemarks">
                  <Form.Label>{t("networkSegment.table.remarks")}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData["Remarks"] || ""}
                    name="Remarks"
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            {t("networkSegment.modals.delete.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t("networkSegment.success.save")}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Confirmation Modal với nền màu xám */}
      {/* Confirmation Modal với màu xám nhạt hài hòa */}
      // Confirmation Modal với thiết kế màu sắc mới
      <Modal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        centered
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)", // hiệu ứng shadow nhẹ
        }}
      >
        {/* Header: nền xanh dương đậm, chữ trắng */}
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            borderBottom: "none",
          }}
        >
          <Modal.Title>Confirm</Modal.Title>
        </Modal.Header>

        {/* Body: nền trắng, chữ xám đậm */}
        <Modal.Body
          style={{
            backgroundColor: "#fff",
            color: "#333",
          }}
        >
          {t("networkSegment.modals.delete.confirm")}
        </Modal.Body>

        {/* Footer: nền trắng, viền trên nhẹ */}
        <Modal.Footer
          style={{
            backgroundColor: "#fff",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => setShowConfirm(false)}
          >
            {t("networkSegment.modals.delete.no")}
          </Button>
          <Button variant="primary" onClick={handleConfirmSave}>
            {t("networkSegment.modals.delete.yes")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AssignOrEditFormModal;
