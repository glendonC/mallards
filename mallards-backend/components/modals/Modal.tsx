import React, { MouseEvent, ReactNode } from "react";
import "../../styles/components/modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  children: ReactNode;
  type?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onClick, children, type }) => {
  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClick}>
      <div 
        className={`modal-content ${type === 'community-impact' ? 'community-impact' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-modal" onClick={onClose}>
          X
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
