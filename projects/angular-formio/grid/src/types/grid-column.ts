import { ComponentInstance } from 'angular-formio-proyectoscolfuturo';

export interface GridColumn {
  label?: string;
  path: string;
  renderCell?(cellValue: any, component?: ComponentInstance): string;
}
