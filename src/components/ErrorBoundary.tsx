import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'حدث خطأ غير متوقع أثناء تشغيل التطبيق.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-white flex items-center justify-center p-6 text-gray-900"
        >
          <div className="max-w-md w-full border border-gray-200 rounded-xl p-6 text-center space-y-4">
            <h2 className="text-lg font-bold text-gray-900">تعذّر إتمام العملية</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              واجه التطبيق خطأً تقنياً أثناء الاتصال بقاعدة البيانات أو عرض الصفحة.
            </p>
            <p className="text-xs text-gray-400 break-words bg-gray-50 p-3 rounded-lg border border-gray-100">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
