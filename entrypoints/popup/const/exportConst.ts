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

export enum FastDateRangeEnum {
  ALL = 'all',
  LAST_WEEK = 'last_week',
  LAST_MONTH = 'last_month',
  LAST_THREE_MONTH = 'last_three_month',
  LAST_SIX_MONTH = 'last_six_month',
  LAST_YEAR = 'last_year',
  CUSOTM = 'custom',
}

export const FastDateRangeList = [
  {
    value: FastDateRangeEnum.ALL,
    label: '全部',
  },
  {
    value: FastDateRangeEnum.LAST_WEEK,
    label: '最近一周',
  },
  {
    value: FastDateRangeEnum.LAST_MONTH,
    label: '最近一个月',
  },
  {
    value: FastDateRangeEnum.LAST_THREE_MONTH,
    label: '最近三个月',
  },
  {
    value: FastDateRangeEnum.LAST_SIX_MONTH,
    label: '最近半年',
  },
  {
    value: FastDateRangeEnum.LAST_YEAR,
    label: '最近一年',
  },
  {
    value: FastDateRangeEnum.CUSOTM,
    label: '自定义',
  },
]

export enum moreFilterEnum {
  ONLY_PICTURE = 'only_picture',
  EXCLUDE_PICTURE = 'exclude_picture',
}

export const moreFilterList = [
  {
    value: moreFilterEnum.ONLY_PICTURE,
    label: '仅包含图片',
  },
  {
    value: moreFilterEnum.EXCLUDE_PICTURE,
    label: '排除图片',
  },
]
