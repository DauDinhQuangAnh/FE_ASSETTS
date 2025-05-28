import React from 'react';
import { IconType, IconBaseProps } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size, className }) => {
  // Ép kiểu Icon về React.FC<IconBaseProps>
  const ValidIcon = Icon as React.FC<IconBaseProps>;
  return <ValidIcon size={size} className={className} />;
};

export default IconWrapper;
