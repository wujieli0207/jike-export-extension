export enum ExportTypeEnum {
  MD = 'markdown',
  TXT = 'text',
  EXCEL = 'excel',
  CSV = 'csv',
}

export const ExportTypeList = [
  {
    value: ExportTypeEnum.MD,
    label: 'Markdown',
  },
  {
    value: ExportTypeEnum.TXT,
    label: '纯文本',
  },
  {
    value: ExportTypeEnum.EXCEL,
    label: 'Excel',
  },
  {
    value: ExportTypeEnum.CSV,
    label: 'CSV',
  },
]
