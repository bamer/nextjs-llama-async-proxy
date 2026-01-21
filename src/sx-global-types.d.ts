import { SxProps } from '@mui/material/styles';

// Allow the `sx` prop on commonly used MUI components
declare module '@mui/material/Box' {
  interface BoxProps extends SxProps<any> {}
}
declare module '@mui/material/Paper' {
  interface PaperProps extends SxProps<any> {}
}
declare module '@mui/material/Chip' {
  interface ChipProps extends SxProps<any> {}
}
declare module '@mui/material/Typography' {
  interface TypographyProps extends SxProps<any> {}
}
declare module '@mui/material/Table' {
  interface TableProps extends SxProps<any> {}
}
declare module '@mui/material/TableRow' {
  interface TableRowProps extends SxProps<any> {}
}
declare module '@mui/material/TableCell' {
  interface TableCellProps extends SxProps<any> {}
}
declare module '@mui/material/TableHead' {
  interface TableHeadProps extends SxProps<any> {}
}
declare module '@mui/material/TableBody' {
  interface TableBodyProps extends SxProps<any> {}
}
declare module '@mui/material/TableContainer' {
  interface TableContainerProps extends SxProps<any> {}
}