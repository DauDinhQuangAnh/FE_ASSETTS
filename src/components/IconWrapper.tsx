import React from "react";
import { IconType } from "react-icons";

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({
  icon: Icon,
  size = 16,
  className = "",
}) => {
  return <Icon size={size} className={className} />;
};

export default IconWrapper; 