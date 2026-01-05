import { designColors } from './theme-colors';

type ButtonVariant = Record<string, string>;
type ButtonVariantNum = Record<string, string | number>;
type CardVariant = Record<string, string>;
type InputVariant = Record<string, string>;

interface ComponentTokens {
  button: { primary: ButtonVariant; secondary: ButtonVariant; ghost: ButtonVariant; icon: ButtonVariantNum };
  card: { elevated: CardVariant; outlined: CardVariant; flat: CardVariant };
  input: { text: InputVariant; number: InputVariant; search: InputVariant; select: InputVariant };
  table: { borderRadius: Record<string, string>; headerBackground: string; rowHover: string };
}

export const componentTokens: ComponentTokens = {
  button: {
    primary: { background: designColors.primary[500], color: '#ffffff', border: 'none', hoverBackground: designColors.primary[700] },
    secondary: { background: 'transparent', color: designColors.primary[500], border: `1px solid ${designColors.primary[500]}`, hoverBackground: designColors.primary[300] },
    ghost: { background: 'transparent', color: designColors.gray[800], border: 'none', hoverBackground: designColors.gray[100] },
    icon: { padding: '8px', borderRadius: '50%', minWidth: 'auto' },
  },
  card: {
    elevated: { background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' },
    outlined: { background: '#ffffff', boxShadow: 'none', border: `1px solid ${designColors.gray[200]}` },
    flat: { background: designColors.gray[50], boxShadow: 'none', border: 'none' },
  },
  input: {
    text: { background: '#ffffff', border: `1px solid ${designColors.gray[200]}`, color: designColors.gray[800], padding: '10px 14px' },
    number: { background: '#ffffff', border: `1px solid ${designColors.gray[200]}`, color: designColors.gray[800], padding: '10px 14px' },
    search: { background: '#ffffff', border: `1px solid ${designColors.gray[200]}`, color: designColors.gray[800], padding: '10px 14px 10px 40px' },
    select: { background: '#ffffff', border: `1px solid ${designColors.gray[200]}`, color: designColors.gray[800], padding: '10px 14px' },
  },
  table: {
    borderRadius: { sm: '4px', md: '8px', lg: '12px' },
    headerBackground: designColors.gray[100],
    rowHover: designColors.gray[50],
  },
};

export type { ComponentTokens };
