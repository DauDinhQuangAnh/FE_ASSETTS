// src/components/FilterForm.tsx
import React from "react";
import { Form, Row, Col, Button, ButtonGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface FilterFormProps {
  distinctVLANs: string[];
  selectedVLAN: string;
  onVLANChange: (vlan: string) => void;

  ipUsage: string; // '' | 'unused' | 'used'
  onIpUsageChange: (usage: string) => void;

  searchTerm: string;
  onSearchTermChange: (term: string) => void;

  onReset: () => void;

  allCount: number;
  usedCount: number;
  unusedCount: number;
}

const FilterForm: React.FC<FilterFormProps> = ({
  distinctVLANs,
  selectedVLAN,
  onVLANChange,
  ipUsage,
  onIpUsageChange,
  searchTerm,
  onSearchTermChange,
  onReset,
  allCount,
  usedCount,
  unusedCount,
}) => {
  const { t } = useTranslation();

  return (
    <Form>
      {/* Hàng đầu: VLAN (trái), IP Usage (giữa), Search Term (phải) */}
      <Row className="mb-3 align-items-end">
        {/* VLAN bên trái */}
        <Col xs={12} md={3}>
          <Form.Group controlId="selectVLAN">
            <Form.Label>{t("networkSegment.filters.vlan")}</Form.Label>
            <Form.Select
              value={selectedVLAN}
              onChange={(e) => onVLANChange(e.target.value)}
            >
              <option value="">-- {t("networkSegment.filters.allVlans")} --</option>
              <option value="all">{t("networkSegment.filters.allVlans")}</option>
              {distinctVLANs.map((vlan) => (
                <option key={vlan} value={vlan}>
                  {vlan}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* IP Usage ở giữa, canh giữa (text-center) */}
        <Col xs={12} md={6} className="text-center">
          <Form.Label>{t("networkSegment.filters.ipUsage")}</Form.Label>
          <div>
            <ButtonGroup>
              <Button
                variant={ipUsage === "" ? "primary" : "outline-primary"}
                onClick={() => onIpUsageChange("")}
              >
                {t("networkSegment.filters.allUsage")} ({allCount})
              </Button>
              <Button
                variant={ipUsage === "unused" ? "primary" : "outline-primary"}
                onClick={() => onIpUsageChange("unused")}
              >
                {t("networkSegment.filters.unused")} ({unusedCount})
              </Button>
              <Button
                variant={ipUsage === "used" ? "primary" : "outline-primary"}
                onClick={() => onIpUsageChange("used")}
              >
                {t("networkSegment.filters.used")} ({usedCount})
              </Button>
            </ButtonGroup>
          </div>
        </Col>

        {/* Search Term bên phải */}
        <Col xs={12} md={3}>
          <Form.Group controlId="searchTerm">
            <Form.Label>{t("networkSegment.filters.search")}</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder={t("networkSegment.filters.search")}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
              <Button variant="secondary" onClick={onReset}>
                {t("networkSegment.filters.reset")}
              </Button>
            </div>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default FilterForm;
