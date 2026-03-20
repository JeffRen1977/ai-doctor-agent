import type { ThemeConfig } from 'antd'

/**
 * AI Doctor Assistant — Ant Design 5 theme aligned with Figma design tokens.
 * Use the same hex values in Figma Variables for handoff (see docs/design/FIGMA_ANTD_MAPPING.md).
 */
export const appDesignTokens = {
  colorPrimary: '#2f5f8f',
  colorSuccess: '#389e0d',
  colorWarning: '#d48806',
  colorError: '#cf1322',
  colorInfo: '#1677ff',
  colorTextBase: 'rgba(0, 0, 0, 0.88)',
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBorder: '#d9e2ec',
  colorSplit: '#e8f0f8',
  borderRadius: 10,
  borderRadiusLG: 12,
  borderRadiusSM: 8,
  wireframe: false,
  fontSize: 14,
  fontSizeLG: 16,
  padding: 12,
  paddingLG: 16,
  paddingSM: 8,
  margin: 12,
  marginLG: 16,
  marginSM: 8,
  controlHeight: 36,
  controlHeightLG: 40,
} as const

export const appTheme: ThemeConfig = {
  token: {
    ...appDesignTokens,
    colorBgLayout: '#f0f4f8',
    colorBgSpotlight: 'rgba(47, 95, 143, 0.08)',
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    boxShadowSecondary:
      '0 6px 16px 0 rgba(47, 95, 143, 0.08), 0 3px 6px -4px rgba(47, 95, 143, 0.12), 0 9px 28px 8px rgba(47, 95, 143, 0.05)',
  },
  components: {
    Layout: {
      bodyBg: '#f0f4f8',
      headerBg: '#ffffff',
      footerBg: '#f0f4f8',
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
    },
    Button: {
      borderRadius: 10,
      controlHeight: 36,
      controlHeightLG: 40,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Tabs: {
      borderRadius: 10,
      margin: 8,
    },
    Table: {
      borderRadius: 10,
      headerBorderRadius: 10,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Menu: {
      itemBorderRadius: 10,
      iconSize: 16,
    },
  },
}
