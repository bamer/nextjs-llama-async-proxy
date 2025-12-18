/* eslint-disable */
/**
 * Global type augmentation for MUI sx prop.
 * This file ensures that all Material-UI components used in the project
 * accept the `sx` prop without TypeScript errors.
 *
 * It augments the component props for the specific components we use
 * in src/components/pages/MonitoringPage.tsx and other components.
 */

/**
 * Global type augmentation for MUI sx prop.
 * This file ensures that all Material-UI components used in the project
 * accept the `sx` prop without TypeScript errors.
 *
 * It augments the component props for the specific components we use
 * in src/components/pages/MonitoringPage.tsx and other components.
 */

import { SxProps, Theme } from '@mui/material/styles';
import { ComponentPropsWithoutRef } from 'react';

// Augment Box component
declare module '@mui/material/Box' {
  interface BoxProps extends SxProps<Theme> {}
}

// Augment Paper component
declare module '@mui/material/Paper' {
  interface PaperProps extends SxProps<Theme> {}
}

// Augment Chip component
declare module '@mui/material/Chip' {
  interface ChipProps extends SxProps<Theme> {}
}

// Augment Typography component
declare module '@mui/material/Typography' {
  interface TypographyProps extends SxProps<Theme> {}
}

// Augment Table component
declare module '@mui/material/Table' {
  interface TableProps extends SxProps<Theme> {}
}

// Augment TableRow component
declare module '@mui/material/TableRow' {
  interface TableRowProps extends SxProps<Theme> {}
}

// Augment TableCell component
declare module '@mui/material/TableCell' {
  interface TableCellProps extends SxProps<Theme> {}
}

// Augment TableHead component
declare module '@mui/material/TableHead' {
  interface TableHeadProps extends SxProps<Theme> {}
}

// Augment TableBody component
declare module '@mui/material/TableBody' {
  interface TableBodyProps extends SxProps<Theme> {}
}

// Augment TableContainer component
declare module '@mui/material/TableContainer' {
  interface TableContainerProps extends SxProps<Theme> {}
}

// Augment Typography component
declare module '@mui/material/Typography' {
  interface TypographyProps
    extends ComponentPropsWithoutRef<'span'>,
      SxProps<any> {}
}

// Augment Chip component
declare module '@mui/material/Chip' {
  interface ChipProps
    extends ComponentPropsWithoutRef<'span'>,
      SxProps<any> {}
}

// Augment Table component
declare module '@mui/material/Table' {
  interface TableProps
    extends ComponentPropsWithoutRef<'table'>,
      SxProps<any> {}
}

// Augment TableRow component
declare module '@mui/material/TableRow' {
  interface TableRowProps
    extends ComponentPropsWithoutRef<'tr'>,
      SxProps<any> {}
}

// Augment TableCell component
declare module '@mui/material/TableCell' {
  interface TableCellProps
    extends ComponentPropsWithoutRef<'td'>,
      SxProps<any> {}
}

// Augment TableHead component
declare module '@mui/material/TableHead' {
  interface TableHeadProps
    extends ComponentPropsWithoutRef<'thead'>,
      SxProps<any> {}
}

// Augment TableBody component
declare module '@mui/material/TableBody' {
  interface TableBodyProps
    extends ComponentPropsWithoutRef<'tbody'>,
      SxProps<any> {}
}

// Augment TableContainer component
declare module '@mui/material/TableContainer' {
  interface TableContainerProps
    extends ComponentPropsWithoutRef<'div'>,
      SxProps<any> {}
}

// Augment Box component (already MUI's Box)
declare module '@mui/material/Box' {
  interface BoxProps extends ComponentPropsWithoutRef<'div'>, SxProps<any> {}
}