export const BRAND = {
  teal:   '#11AEB3',
  orange: '#FF9700',
} as const;

export const LS = {
  theme:          'theme-preference',
  thresholds:     'que-thresholds',
  guideDismissed: 'que-guide-dismissed',
  reportCharts:   'que-report-charts',
  reportLayout:   'que-report-layout',
  chartType:      (id: string) => `que-ct-${id}`,
  datasets:       'que-datasets',
  activeDataset:  'que-active-dataset',
} as const;

// sessionStorage: solo persiste mientras la pestaña está abierta
export const SS = {
  splash: 'wc-splash-shown',
} as const;
