declare global {
  namespace JSX {
    /**
     * Augment all JSX.IntrinsicElements to accept the `sx` prop.
     * This resolves TypeScript errors when using `sx` on any HTML element.
     */
    interface IntrinsicElements {
      [elemName: string]: React.HTMLAttributes<any> & {
        sx?: any;
      };
    }
  }
}