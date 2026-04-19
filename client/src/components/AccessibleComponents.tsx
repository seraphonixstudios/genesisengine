import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Type definitions
interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface Generation {
  id: string;
  prompt: string;
  url?: string;
  status: string;
  createdAt: string;
  error?: string;
  progress?: number;
}

// Skip to content link for accessibility
const SkipToContent = () => (
  <a
    href="#main-content"
    className="skip-to-content"
    style={{
      position: 'absolute',
      top: '-40px',
      left: '0',
      background: '#000',
      color: '#fff',
      padding: '8px 16px',
      zIndex: 10000,
      transition: 'top 0.3s',
    }}
    onFocus={(e) => (e.target.style.top = '0')}
    onBlur={(e) => (e.target.style.top = '-40px')}
  >
    Skip to main content
  </a>
);

// Loading spinner with ARIA
const LoadingSpinner = ({ size = 'medium', ariaLabel = 'Loading' }: { size?: string; ariaLabel?: string }) => (
  <div
    role="status"
    aria-label={ariaLabel}
    className={`spinner spinner-${size}`}
  >
    <div className="spinner-circle" />
    <span className="sr-only">{ariaLabel}</span>
  </div>
);

// Accessible button with keyboard support
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  ariaLabel?: string;
}

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'medium',
  ariaLabel,
  className = '',
  ...props 
}: ButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    aria-label={ariaLabel}
    aria-busy={loading}
    className={`btn btn-${variant} btn-${size} ${className}`}
    {...props}
  >
    {loading && <LoadingSpinner size="small" ariaLabel="" />}
    {children}
  </button>
);

// Accessible input with error handling
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

const Input = ({ 
  label, 
  error, 
  id,
  required = false,
  helpText,
  ...props 
}: InputProps) => {
  const inputId = id || React.useId();
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="required" aria-label="required"> *</span>}
      </label>
      {helpText && (
        <div id={helpId} className="help-text">{helpText}</div>
      )}
      <input
        id={inputId}
        className={`form-input ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`}
        {...props}
      />
      {error && (
        <div id={errorId} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// Accessible textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = ({ 
  label, 
  error, 
  id,
  required = false,
  helpText,
  maxLength,
  showCount = false,
  ...props 
}: TextareaProps) => {
  const [count, setCount] = useState(0);
  const textareaId = id || React.useId();
  const errorId = `${textareaId}-error`;
  const helpId = `${textareaId}-help`;
  
  return (
    <div className="form-group">
      <label htmlFor={textareaId} className="form-label">
        {label}
        {required && <span className="required" aria-label="required"> *</span>}
      </label>
      {helpText && (
        <div id={helpId} className="help-text">{helpText}</div>
      )}
      <textarea
        id={textareaId}
        className={`form-textarea ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`}
        onChange={(e) => {
          setCount(e.target.value.length);
          props.onChange?.(e);
        }}
        {...props}
      />
      <div className="textarea-meta">
        {error && (
          <div id={errorId} className="error-message" role="alert">
            {error}
          </div>
        )}
        {showCount && maxLength && (
          <div className="char-count" aria-live="polite">
            {count}/{maxLength} characters
          </div>
        )}
      </div>
    </div>
  );
};

// Toast notification system
const Toast = ({ message, type = 'info', onClose }: { message: string; type?: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      role="alert"
      aria-live="polite"
      className={`toast toast-${type}`}
    >
      <span className="toast-message">{message}</span>
      <button 
        onClick={onClose}
        aria-label="Close notification"
        className="toast-close"
      >
        ×
      </button>
    </motion.div>
  );
};

// Toast container
const ToastContainer = ({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: number) => void }) => (
  <div className="toast-container" role="region" aria-label="Notifications">
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  </div>
);

// Progress bar with ARIA
const ProgressBar = ({ progress, label = 'Progress' }: { progress: number; label?: string }) => (
  <div className="progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <div className="progress-track">
      <motion.div 
        className="progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
    <span className="progress-text">{Math.round(progress)}%</span>
  </div>
);

// Image card with accessibility
interface ImageCardProps {
  generation: Generation;
  onDownload?: (gen: Generation) => void;
  onDelete?: (gen: Generation) => void;
  onView?: (gen: Generation) => void;
  onFavorite?: (gen: Generation) => void;
  isFavorite?: boolean;
}

const ImageCard = ({ generation, onDownload, onDelete, onView, onFavorite, isFavorite = false }: ImageCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div 
      className="image-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      tabIndex={0}
      role="article"
      aria-label={`Generated image: ${generation.prompt}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onView?.(generation);
        }
      }}
    >
      <div className="image-container">
        {!imageLoaded && !imageError && (
          <div className="image-placeholder">
            <LoadingSpinner size="medium" ariaLabel="Loading image" />
          </div>
        )}
        
        {generation.url && (
          <img
            src={generation.url}
            alt={generation.prompt}
            className={`generated-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
        
        {imageError && (
          <div className="image-error" role="alert">
            <span>Failed to load image</span>
          </div>
        )}
        
        <div className="image-overlay">
          <div className="image-actions">
            <button
              onClick={() => onView?.(generation)}
              aria-label="View full size"
              className="action-btn"
              title="View"
            >
              👁
            </button>
            <button
              onClick={() => onDownload?.(generation)}
              aria-label="Download image"
              className="action-btn"
              title="Download"
            >
              ⬇
            </button>
            <button
              onClick={() => onFavorite?.(generation)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`action-btn ${isFavorite ? 'favorite active' : 'favorite'}`}
              title={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              {isFavorite ? '★' : '☆'}
            </button>
            <button
              onClick={() => onDelete?.(generation)}
              aria-label="Delete image"
              className="action-btn delete"
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
      
      <div className="image-info">
        <p className="image-prompt" title={generation.prompt}>
          {generation.prompt}
        </p>
        <div className="image-meta">
          <span className={`status-badge status-${generation.status.toLowerCase()}`}>
            {generation.status}
          </span>
          <span className="image-date">
            {new Date(generation.createdAt).toLocaleDateString()}
          </span>
        </div>
        {generation.error && (
          <p className="image-error-text" role="alert">
            {generation.error}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Modal with accessibility
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Keyboard shortcuts help
const KeyboardShortcuts = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
    <div className="shortcuts-list">
      <div className="shortcut-item">
        <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
        <span>Generate image</span>
      </div>
      <div className="shortcut-item">
        <kbd>Esc</kbd>
        <span>Close modal / Cancel generation</span>
      </div>
      <div className="shortcut-item">
        <kbd>Tab</kbd>
        <span>Navigate between elements</span>
      </div>
      <div className="shortcut-item">
        <kbd>Enter</kbd> / <kbd>Space</kbd>
        <span>Activate button or link</span>
      </div>
    </div>
  </Modal>
);

// Export all components
export {
  SkipToContent,
  LoadingSpinner,
  Button,
  Input,
  Textarea,
  Toast,
  ToastContainer,
  ProgressBar,
  ImageCard,
  Modal,
  KeyboardShortcuts
};

export type { ToastItem, Generation, ImageCardProps };
