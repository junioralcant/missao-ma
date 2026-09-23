'use client';

import {MouseEvent, useEffect, useRef} from 'react';

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
};

const CANCEL_LABEL = 'Cancelar';

const CONFIRM_CLASS_NAMES = {
  danger: 'btn btn--small btn--danger',
  primary: 'btn btn--small',
};

export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onCancel();
    }
  };

  return (
    <dialog
      className="dialog"
      ref={dialogRef}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
      onCancel={onCancel}
      onClick={handleBackdropClick}
    >
      <h2 className="dialog-title" id="dialog-title">
        {title}
      </h2>
      <p className="dialog-message" id="dialog-message">
        {message}
      </p>
      <div className="dialog-actions">
        <button
          className="btn btn--small btn--ghost"
          type="button"
          onClick={onCancel}
          autoFocus
        >
          {CANCEL_LABEL}
        </button>
        <button
          className={CONFIRM_CLASS_NAMES[tone]}
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
};
