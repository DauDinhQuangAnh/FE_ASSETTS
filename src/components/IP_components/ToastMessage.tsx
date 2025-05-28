import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

interface Props {
  show: boolean;
  onClose: () => void;
  message: string;
}

const ToastMessage: React.FC<Props> = ({ show, onClose, message }) => {
  return (
    <ToastContainer position="top-end" className="p-3">
      <Toast
        show={show}
        onClose={onClose}
        delay={2000}
        autohide
        style={{
          backgroundColor: '#d3d3d3',
          borderColor: '#d3d3d3'
        }}
      >
        <Toast.Header
          style={{
            backgroundColor: '#d3d3d3',
            borderColor: '#d3d3d3'
          }}
        >
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body style={{ color: '#000' }}>{message}</Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default ToastMessage;
