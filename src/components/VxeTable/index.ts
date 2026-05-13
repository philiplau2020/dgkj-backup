import { withInstall } from '@/utils';
import vxeBasicTable from './src/VxeBasicTable';
import { VXETable } from 'vxe-table';
import VXETablePluginAntd from './src/components';
import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx';
import './src/setting';

export const VxeBasicTable = withInstall(vxeBasicTable);
export * from 'vxe-table';
export * from './src/types';

export interface VxeFormItemProps {
  field?: string;
  title?: string;
  titleWidth?: string | number;
  visible?: boolean;
  span?: number;
  collapse?: boolean;
  itemRender?: any;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  minWidth?: string | number;
  fixed?: 'left' | 'right';
  resizable?: boolean;
  showOverflow?: boolean | { tooltip?: boolean };
  className?: string;
  slots?: any;
  props?: any;
  attrs?: any;
}

VXETable.use(VXETablePluginAntd).use(VXETablePluginExportXLSX);
