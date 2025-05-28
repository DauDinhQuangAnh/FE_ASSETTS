// src/pages/NetworkSegmentPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Spinner,
  Container,
  Modal,
  Button,
} from "react-bootstrap";
import Header from "../../components/Header";
import _debounce from "lodash.debounce";
import FilterForm from "../../components/IP_components/FilterForm";
import NetworkSegmentTable from "../../components/IP_components/NetworkSegmentTable";
import AssignOrEditFormModal from "../../components/IP_components/AssignOrEditFormModal";
import AutoDismissAlert from "../../components/IP_components/AutoDismissAlert";
import { NetworkSegment } from "../../types/NetworkSegment";
import {
  fetchNetworkSegments,
  fetchDistinctVlan,
  fetchNetworkSegmentByIp,
  updateNetworkSegment,
  deleteNetworkSegment,
} from "../../services/networkSegmentService";
import { useTranslation } from "react-i18next";

interface DistinctItem {
  value: string;
}

const NetworkSegmentPage: React.FC = () => {
  const { t } = useTranslation();
  const [segments, setSegments] = useState<NetworkSegment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedVLAN, setSelectedVLAN] = useState<string>("");
  const [distinctVLANs, setDistinctVLANs] = useState<string[]>([]);
  const [ipUsage, setIpUsage] = useState<string>(""); // '' = All, 'unused', 'used'
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"assign" | "edit" | "delete">(
    "assign"
  );
  const [modalRecord, setModalRecord] = useState<NetworkSegment | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "danger";
    message: string;
    show: boolean;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [ipToDelete, setIpToDelete] = useState<string>("");

  // State để lưu số lượng IP
  const [allCount, setAllCount] = useState<number>(0);
  const [usedCount, setUsedCount] = useState<number>(0);
  const [unusedCount, setUnusedCount] = useState<number>(0);

  /**
   * loadData: Lấy danh sách IP theo các filter (ipUsage, searchTerm, ...)
   */
  const loadData = async (vlan: string, usage: string, term: string) => {
    // Nếu chưa chọn VLAN (giá trị rỗng), không hiển thị gì cả
    if (vlan === "") {
      setSegments([]);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchNetworkSegments({
        vlan: vlan === "all" ? "" : vlan, // Nếu chọn All VLAN thì gửi rỗng
        ipUsage: usage,
        searchTerm: term,
      });
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
      setAlert({
        type: "danger",
        message: t("networkSegment.errors.loadError"),
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * loadCounts: Lấy toàn bộ IP (không filter ipUsage) của VLAN để tính số lượng
   */
  const loadCounts = async (vlan: string) => {
    // Nếu chưa chọn VLAN (giá trị rỗng), reset tất cả số lượng về 0
    if (vlan === "") {
      setAllCount(0);
      setUsedCount(0);
      setUnusedCount(0);
      return;
    }

    try {
      const allData = await fetchNetworkSegments({
        vlan: vlan === "all" ? "" : vlan, // Nếu chọn All VLAN thì gửi rỗng
      });
      const total = allData.length;
      const used = allData.filter(
        (item) => item["Use"] && item["Use"].trim() !== ""
      ).length;
      const unused = total - used;
      setAllCount(total);
      setUsedCount(used);
      setUnusedCount(unused);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const debouncedLoadData = useCallback(
    _debounce((vlan: string, usage: string, term: string) => {
      loadData(vlan, usage, term);
    }, 300),
    []
  );

  /**
   * Khi selectedVLAN, ipUsage hoặc searchTerm thay đổi, gọi loadCounts để cập nhật số lượng,
   * và gọi loadData để lấy danh sách IP hiển thị.
   */
  useEffect(() => {
    loadCounts(selectedVLAN);
    debouncedLoadData(selectedVLAN, ipUsage, searchTerm);
  }, [selectedVLAN, ipUsage, searchTerm, debouncedLoadData]);

  // Lấy danh sách VLAN
  const loadDistinctValues = async () => {
    try {
      const vlanRes: DistinctItem[] = await fetchDistinctVlan();
      setDistinctVLANs(vlanRes.map((item) => item.value));
    } catch (error) {
      console.error("Error fetching distinct VLANs:", error);
      setAlert({
        type: "danger",
        message: t("networkSegment.errors.loadVlanError"),
        show: true,
      });
    }
  };

  useEffect(() => {
    loadDistinctValues();
  }, []);

  const handleReset = () => {
    setSelectedVLAN("");
    setIpUsage("");
    setSearchTerm("");
  };

  const handleAction = async (
    ip: string,
    mode: "assign" | "edit" | "delete",
    record?: NetworkSegment
  ) => {
    if (mode === "delete") {
      setIpToDelete(ip);
      setShowDeleteConfirm(true);
      return;
    }

    if (mode === "assign") {
      setModalRecord({
        Registration: "",
        VLAN:
          record?.VLAN ||
          segments.find((s) => s["IP address"] === ip)?.VLAN ||
          "",
        "Host Name": "",
        "IP Type": "",
        "IP address": ip,
        "MAC address": "",
        "Connection Devices": "",
        "Device Type": "",
        "Network Type": "",
        "Installation floor": "",
        "Installation location": "",
        Use: "",
        Status: "",
        Remarks: "",
      });
      setModalMode("assign");
      setShowModal(true);
      return;
    }

    try {
      const fullRecord = await fetchNetworkSegmentByIp(ip);
      setModalRecord(fullRecord);
      setModalMode("edit");
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching record for edit:", error);
      setAlert({
        type: "danger",
        message: t("networkSegment.errors.loadRecordError"),
        show: true,
      });
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await updateNetworkSegment(data);
      setAlert({
        type: "success",
        message: t("networkSegment.success.save"),
        show: true,
      });
      setShowModal(false);
      // Reload data và counts sau khi update
      loadData(selectedVLAN, ipUsage, searchTerm);
      loadCounts(selectedVLAN);
    } catch (error) {
      console.error(error);
      setAlert({
        type: "danger",
        message: t("networkSegment.errors.saveError"),
        show: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteNetworkSegment(ipToDelete);
      setAlert({
        type: "success",
        message: t("networkSegment.success.delete"),
        show: true,
      });
      // Reload data và counts sau khi xóa
      loadData(selectedVLAN, ipUsage, searchTerm);
      loadCounts(selectedVLAN);
    } catch (error) {
      console.error("Error deleting IP:", error);
      setAlert({
        type: "danger",
        message: t("networkSegment.errors.deleteError"),
        show: true,
      });
    } finally {
      setShowDeleteConfirm(false);
      setIpToDelete("");
    }
  };

  return (
    <Container fluid style={{ paddingTop: '80px' }}>
      <Header />
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">{t("networkSegment.filters.title")}</h5>
        </Card.Header>
        <Card.Body>
          <FilterForm
            distinctVLANs={distinctVLANs}
            selectedVLAN={selectedVLAN}
            onVLANChange={setSelectedVLAN}
            ipUsage={ipUsage}
            onIpUsageChange={setIpUsage}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onReset={handleReset}
            allCount={allCount}
            usedCount={usedCount}
            unusedCount={unusedCount}
          />
        </Card.Body>
      </Card>

      {alert && (
        <AutoDismissAlert
          variant={alert.type}
          message={alert.message}
          show={alert.show}
          onClose={() => setAlert(null)}
        />
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">{t("networkSegment.loading")}</span>
          </Spinner>
        </div>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <NetworkSegmentTable
              segments={segments}
              searchTerm={searchTerm}
              onAction={handleAction}
            />
          </Card.Body>
        </Card>
      )}

      {showModal && modalRecord && (
        <AssignOrEditFormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          mode={modalMode}
          record={modalRecord}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("networkSegment.modals.delete.title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t("networkSegment.modals.delete.message", { ip: ipToDelete })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            {t("networkSegment.modals.delete.cancel")}
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            {t("networkSegment.modals.delete.confirm")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default NetworkSegmentPage;
