import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

interface AutoDismissAlertProps {
  variant: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  show: boolean;
}

const AutoDismissAlert: React.FC<AutoDismissAlertProps> = ({
  variant,
  message,
  onClose,
  show
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <Alert
      variant={variant}
      onClose={onClose}
      dismissible
      className="mb-4"
    >
      {message}
    </Alert>
  );
};

export default AutoDismissAlert; 