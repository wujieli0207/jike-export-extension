export enum ExportTypeEnum {
  MD = 'markdown',
  TXT = 'txt',
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

export enum ContentOrderTypeEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export const ContentOrderTypeList = [
  {
    value: ContentOrderTypeEnum.ASC,
    label: '从旧动态到新动态',
  },
  {
    value: ContentOrderTypeEnum.DESC,
    label: '从新动态到旧动态',
  },
]
