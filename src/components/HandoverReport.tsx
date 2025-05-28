import React from 'react';
import { Table, Button, Container, Row, Col } from 'react-bootstrap';
import { format } from 'date-fns';
import './HandoverReport.css';

interface Asset {
  asset_id: number;
  asset_code: string;
  asset_name: string;
  brand: string;
  model: string;
  category_name: string;
  handover_date: string;
  serial_number?: string;
  quantity?: number;
  status?: string;
}

interface User {
  full_name: string;
  emp_code: string;
  department_name: string;
  position: string;
  business_unit?: string;
}

interface HandoverReportProps {
  selectedAssets: Asset[];
  user: User;
  handoverBy: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDownload: () => void;
}

const HandoverReport: React.FC<HandoverReportProps> = ({
  selectedAssets,
  user,
  handoverBy,
  onConfirm,
  onCancel,
  onDownload
}) => {
  const currentDate = new Date();

  return (
    <div className="report-wrapper">
      <Container id="reportContainer" className="handover-report" style={{
        width: '100%',
        minHeight: '295mm',
        padding: '5mm 5mm',
        margin: '0',
        backgroundColor: 'white',
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt',
      }}>
        <div className="text-center" style={{ marginBottom: '5mm' }}>
          <h1 className="fw-bold" style={{ fontSize: '16pt', marginBottom: '3mm' }}>BIÊN BẢN BÀN GIAO</h1>
          <h2 className="fw-bold" style={{ fontSize: '14pt' }}>MINUTES OF THE HANDOVER</h2>
        </div>

        <div style={{ marginBottom: '5mm', paddingLeft: '5mm', paddingRight: '5mm' }}>
          <p style={{ marginBottom: '2mm' }}>
            <strong>Hôm nay, {format(currentDate, 'dd/MM/yyyy')}, chúng tôi gồm có:</strong>
          </p>
          <p className="fst-italic" style={{ marginBottom: '0' }}>
            Today, {format(currentDate, 'MMMM dd, yyyy')}, both parties are included:
          </p>
        </div>

        <div className="party-section" style={{ marginBottom: '5mm', paddingLeft: '5mm', paddingRight: '5mm' }}>
          <div className="party-a" style={{
            marginBottom: '4mm',
            padding: '4mm',
            borderLeft: '3px solid #0d6efd',
            backgroundColor: '#f8f9fa'
          }}>
            <h5 className="fw-bold" style={{ fontSize: '11pt', marginBottom: '2mm' }}>Bên A - Bên cấp phát / Party A - Allocator: SMV - IT</h5>
            <Row className="gx-2 mb-1">
              <Col xs={3} className="fw-bold">Địa chỉ / Address:</Col>
              <Col xs={9}>No.3 VSIP II-A, Street No.16, Vietnam-Singapore Industrial Park II-A, Vinh Tan Ward, Tan Uyen City, Binh Duong Province, Viet Nam.</Col>
            </Row>
            <Row className="gx-2 mb-1">
              <Col xs={3} className="fw-bold">Đại diện / Represented by:</Col>
              <Col xs={9}>{handoverBy}</Col>
            </Row>
            <Row className="gx-2">
              <Col xs={3} className="fw-bold">Chức vụ / Position:</Col>
              <Col xs={9}>Trợ lý giám sát / Assistant Supervisor</Col>
            </Row>
          </div>

          <div className="party-b" style={{
            padding: '4mm',
            borderLeft: '3px solid #198754',
            backgroundColor: '#f8f9fa'
          }}>
            <h5 className="fw-bold" style={{ fontSize: '11pt', marginBottom: '2mm' }}>Bên B - Bên nhận / Party B – Receiver – Nhân viên SMV / SMV Employee</h5>
            <Row className="gx-2 mb-1">
              <Col xs={3} className="fw-bold">Địa chỉ / Address:</Col>
              <Col xs={9}>No.3 VSIP II-A, Street No.16, Vietnam-Singapore Industrial Park II-A, Vinh Tan Ward, Tan Uyen City, Binh Duong Province, Viet Nam.</Col>
            </Row>
            <Row className="gx-2 mb-1">
              <Col xs={3} className="fw-bold">Họ tên / Full name:</Col>
              <Col xs={4}>{user.full_name}</Col>
              <Col xs={2} className="fw-bold">MSNV / Employee ID:</Col>
              <Col xs={3}>{user.emp_code}</Col>
            </Row>
            <Row className="gx-2 mb-1">
              <Col xs={3} className="fw-bold">BU:</Col>
              <Col xs={4}>{user.business_unit ?? '-'}</Col>
              <Col xs={2} className="fw-bold">Bộ phận / Dept.:</Col>
              <Col xs={3}>{user.department_name}</Col>
            </Row>
            <Row className="gx-2">
              <Col xs={3} className="fw-bold">Chức vụ / Position:</Col>
              <Col xs={9}>{user.position}</Col>
            </Row>
          </div>
        </div>

        <div style={{ marginBottom: '0mm', paddingLeft: '5mm', paddingRight: '5mm' }}>
          <p className="fw-bold" style={{ marginBottom: '1mm' }}>Cùng đồng ý ký biên bản bàn giao thiết bị nội dung như sau:</p>
          <p className="fst-italic" style={{ marginBottom: '3mm' }}>Both agreed to sign the minutes of the handover as the content as follows:</p>
        </div>

        <Table bordered className="asset-table" style={{
          fontSize: '10pt',
          marginBottom: '0mm',
          marginLeft: '5mm',
          marginRight: '5mm',
          width: 'calc(100% - 10mm)'
        }}>
          <thead className="text-center" style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ width: '5%', padding: '1.5mm', verticalAlign: 'middle' }}>No.</th>
              <th style={{ width: '35%', padding: '1.5mm', verticalAlign: 'middle' }}>Diễn giải / Description</th>
              <th style={{ width: '20%', padding: '1.5mm', verticalAlign: 'middle' }}>Serial Number</th>
              <th style={{ width: '10%', padding: '1.5mm', verticalAlign: 'middle' }}>SL / Q.ty</th>
              <th style={{ width: '15%', padding: '1.5mm', verticalAlign: 'middle' }}>Tình trạng / Status</th>
              <th style={{ width: '15%', padding: '1.5mm', verticalAlign: 'middle' }}>User Check</th>
            </tr>
          </thead>
          <tbody>
            {selectedAssets.map((asset, index) => (
              <tr key={asset.asset_id}>
                <td className="text-center" style={{ padding: '1.5mm', verticalAlign: 'middle' }}>{index + 1}</td>
                <td style={{ padding: '1.5mm', verticalAlign: 'middle' }}>
                  <strong>{asset.asset_name}</strong>
                  <br />
                  <span style={{ fontSize: '9pt' }}>Code: {asset.asset_code}</span>
                </td>
                <td className="text-center" style={{ padding: '1.5mm', verticalAlign: 'middle' }}>{asset.serial_number || '-'}</td>
                <td className="text-center" style={{ padding: '1.5mm', verticalAlign: 'middle' }}>{asset.quantity ?? 1}</td>
                <td className="text-center fw-bold" style={{ padding: '1.5mm', verticalAlign: 'middle' }}>{asset.status ?? 'GOOD'}</td>
                <td className="text-center" style={{ padding: '1.5mm', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '1.5px solid #333',
                      backgroundColor: 'white',
                      borderRadius: '2px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p style={{ margin: '2mm 0 0 5mm' }}>◉ Thiết bị máy tính được cung cấp dây nguồn (cục sạc) và dây mạng đầy đủ.</p>

        <div style={{
          padding: '4mm',
          backgroundColor: '#f8f9fa',
          borderRadius: '3px',
          marginBottom: '4mm',
          marginLeft: '5mm',
          marginRight: '5mm',
          fontSize: '10pt'
        }}>
          <p style={{ marginBottom: '2mm' }}>Biên bản được lập thành 2 bản, mỗi bên giữ một bản có giá trị như nhau.</p>
          <p className="fst-italic" style={{ marginBottom: '2mm' }}>This agreement is made of 02 copies, each party keeps 01 copy with equal validity.</p>
          <p style={{ marginBottom: '2mm' }}>Phải có trách nhiệm bảo quản thiết bị. Trường hợp hư hại do cố ý, bên B - Nhận sẽ chịu toàn bộ chi phí sửa chữa thiết bị.</p>
          <p className="fst-italic" style={{ marginBottom: 0 }}>Must be responsible for maintaining device. In case of intentional damage, the Party B - Receiver will be responsible for all costs of repairing the device.</p>
        </div>

        <Row style={{
          marginLeft: '5mm',
          marginRight: '5mm'
        }}>
          <Col xs={5} className="text-center">
            <h5 className="fw-bold" style={{ fontSize: '11pt', marginBottom: '2mm' }}>Đại diện bên A</h5>
            <p className="fst-italic" style={{ marginBottom: '15mm' }}>Party A</p>
            <div style={{ borderBottom: '1px solid #000', width: '80%', margin: '0 auto 2mm' }}></div>
            <p style={{ fontSize: '9pt' }}>(Ký, ghi rõ họ tên)</p>
          </Col>
          <Col xs={2}></Col>
          <Col xs={5} className="text-center">
            <h5 className="fw-bold" style={{ fontSize: '11pt', marginBottom: '2mm' }}>Đại diện bên B</h5>
            <p className="fst-italic" style={{ marginBottom: '15mm' }}>Party B</p>
            <div style={{ borderBottom: '1px solid #000', width: '80%', margin: '0 auto 2mm' }}></div>
            <p style={{ fontSize: '9pt' }}>(Ký, ghi rõ họ tên)</p>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-3 action-buttons" style={{ position: 'absolute', bottom: '5mm', right: '15mm' }}>
          <Button variant="outline-secondary" onClick={onCancel} style={{ fontSize: '10pt' }}>
            Hủy
          </Button>
          <Button variant="outline-primary" onClick={onDownload} style={{ fontSize: '10pt' }}>
            <i className="fas fa-download me-1"></i>
            Tải biên bản
          </Button>
          <Button variant="primary" onClick={onConfirm} style={{ fontSize: '10pt' }}>
            <i className="fas fa-check me-1"></i>
            Xác nhận bàn giao
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default HandoverReport;