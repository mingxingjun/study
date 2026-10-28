import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * 页面级错误边界
 *
 * 之前任何一个页面抛出渲染错误都会让整棵 React 树卸载 → 白屏。
 * 现在单个页面崩溃只影响内容区：侧边栏仍可用，并提供重试与刷新本页两个出口。
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] 页面渲染失败:', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-24 sm:px-8 lg:px-14 lg:pt-14"
      >
        <div className="mx-auto max-w-xl border-2 border-primary bg-white p-8 shadow-md">
          <div className="mb-5 flex h-12 w-12 items-center justify-center bg-[#8e3b4e]">
            <AlertTriangle className="h-6 w-6 text-white" strokeWidth={2.4} />
          </div>

          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">
            Render Error / 页面出错
          </p>
          <h1 className="mb-3 font-serif text-2xl text-primary">这个页面没能画出来</h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            其它页面还能正常使用。可以先重试一次；如果同样出错，刷新页面通常就能恢复。
          </p>

          <pre className="mb-6 max-h-32 overflow-auto border-2 border-primary/15 bg-[#eef3f8] p-3 font-mono text-[11px] leading-relaxed text-gray-600">
            {String(error?.message || error)}
          </pre>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex cursor-pointer items-center gap-2 border-2 border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1d314b]"
            >
              <RotateCcw size={15} strokeWidth={2.4} />
              重试
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer border-2 border-primary bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-[#eef3f8]"
            >
              刷新页面
            </button>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;