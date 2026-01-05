"use client";

import { Box, Typography, IconButton, Paper, Collapse } from "@mui/material";
import { Alert as MuiAlert, AlertTitle, AlertProps } from "@mui/material";
import { Close, Info, Warning, Error as ErrorIcon, CheckCircle } from "@mui/icons-material";

export interface InlineAlertProps {
  severity?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  onDismiss?: (() => void) | undefined;
  action?: React.ReactNode;
  dismissible?: boolean;
  open?: boolean;
  sx?: Record<string, unknown>;
}

const severityIcons = {
  error: <ErrorIcon />,
  warning: <Warning />,
  info: <Info />,
  success: <CheckCircle />,
};

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  error: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  warning: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  info: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  success: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
};

export function InlineAlert({
  severity = 'info',
  title,
  message,
  onDismiss,
  action,
  dismissible = true,
  open = true,
  sx,
}: InlineAlertProps) {
  const colors = severityColors[severity];

  if (!open) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 1,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
        color: colors.text,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        ...sx,
      }}
    >
      <Box sx={{ flexShrink: 0, mt: 0.25 }}>
        {severityIcons[severity]}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: colors.text }}>
          {message}
        </Typography>
        {action && (
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
            {action}
          </Box>
        )}
      </Box>
      {dismissible && onDismiss && (
        <IconButton
          size="small"
          onClick={onDismiss}
          sx={{ color: colors.text, opacity: 0.7, '&:hover': { opacity: 1 } }}
        >
          <Close fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
}

interface FormFieldAlertProps {
  fieldName: string;
  errors: Record<string, string>;
  touched?: Record<string, boolean>;
}

export function getFieldError(fieldName: string, errors: Record<string, string>, touched?: Record<string, boolean>): string | null {
  if (touched && !touched[fieldName]) {
    return null;
  }
  return errors[fieldName] || null;
}

export function FormFieldAlert({ fieldName, errors, touched }: FormFieldAlertProps) {
  const error = getFieldError(fieldName, errors, touched);

  if (!error) return null;

  return (
    <InlineAlert
      severity="error"
      message={error}
      dismissible={false}
      sx={{ mt: 1 }}
    />
  );
}

interface FieldErrorsAlertProps {
  errors: Record<string, string>;
  title?: string;
}

export function FieldErrorsAlert({ errors, title = 'Please correct the following errors:' }: FieldErrorsAlertProps) {
  const errorList = Object.entries(errors);

  if (errorList.length === 0) return null;

  return (
    <MuiAlert severity="error" sx={{ mb: 2 }}>
      {title}
      <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
        {errorList.map(([field, error]) => (
          <li key={field}>{error}</li>
        ))}
      </ul>
    </MuiAlert>
  );
}

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  open?: boolean;
}

export function SuccessAlert({ message, onDismiss, open = true }: SuccessAlertProps) {
  const canDismiss = Boolean(onDismiss);
  return (
    <Collapse in={open}>
      <InlineAlert
        severity="success"
        message={message}
        onDismiss={canDismiss ? onDismiss! : undefined}
        dismissible={canDismiss}
      />
    </Collapse>
  );
}

interface LoadingAlertProps {
  message: string;
}

export function LoadingAlert({ message }: LoadingAlertProps) {
  return (
    <InlineAlert
      severity="info"
      title="Loading..."
      message={message}
      dismissible={false}
    />
  );
}

interface ConfirmationAlertProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error';
}

export function ConfirmationAlert({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  severity = 'warning',
}: ConfirmationAlertProps) {
  return (
    <MuiAlert
      severity={severity}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" color="inherit" onClick={onCancel}>
            {cancelLabel}
          </IconButton>
          <IconButton size="small" color="inherit" onClick={onConfirm}>
            {confirmLabel}
          </IconButton>
        </Box>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </MuiAlert>
  );
}
