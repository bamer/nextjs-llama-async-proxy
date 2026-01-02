export class ErrorRecovery {
  public resetError = (setState: (state: any) => void): void => {
    setState({ hasError: false, error: null, errorInfo: null });
  };

  public reloadPage = (): void => {
    window.location.reload();
  };

  public getRecoveryActions(): Array<{
    label: string;
    action: () => void;
    severity: 'primary' | 'secondary';
  }> {
    return [
      {
        label: 'Reload Page',
        action: () => this.reloadPage(),
        severity: 'primary',
      },
      {
        label: 'Try Again',
        action: () => console.log('Try Again - needs state setter'),
        severity: 'secondary',
      },
    ];
  }

  public canAutoRecover(error: Error): boolean {
    const recoverablePatterns = [
      'ResizeObserver',
      'ChunkLoadError',
      'NetworkError',
    ];

    return recoverablePatterns.some(pattern =>
      error.message?.includes(pattern) || error.name?.includes(pattern)
    );
  }

  public suggestRecovery(error: Error): string {
    if (error.message.includes('Network')) {
      return 'Check your internet connection and try again.';
    }
    if (error.message.includes('ChunkLoadError')) {
      return 'Clear your browser cache and reload the page.';
    }
    if (error.message.includes('ResizeObserver')) {
      return 'This is a non-critical UI issue. You can continue using the application.';
    }
    return 'Try refreshing the page or contact support if the issue persists.';
  }
}
