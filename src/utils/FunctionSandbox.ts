// FunctionSandbox: runs user JS in a sandboxed iframe
// Usage: const sandbox = new FunctionSandbox();
// sandbox.runFunction(fnCode, args).then(result => ...)

export class FunctionSandbox {
  private iframe: HTMLIFrameElement;
  private ready: Promise<void>;
  private msgId = 0;
  private resolvers = new Map<number, (value: any) => void>();

  constructor() {
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.sandbox.add('allow-scripts');
    document.body.appendChild(this.iframe);
    this.ready = new Promise(resolve => {
      this.iframe.onload = () => resolve();
      this.iframe.srcdoc = `
        <script>
        window.addEventListener('message', async (e) => {
          const { id, fnCode, args } = e.data;
          let result, error;
          try {
            const fn = new Function('args', fnCode);
            result = await fn(args);
          } catch (err) {
            error = err?.toString();
          }
          parent.postMessage({ id, result, error }, '*');
        });
        <\/script>
      `;
    });
    window.addEventListener('message', (e) => {
      const { id, result, error } = e.data || {};
      if (typeof id === 'number' && this.resolvers.has(id)) {
        this.resolvers.get(id)?.(error ? { error } : { result });
        this.resolvers.delete(id);
      }
    });
  }

  async runFunction(fnCode: string, args: any): Promise<any> {
    await this.ready;
    return new Promise(resolve => {
      const id = this.msgId++;
      this.resolvers.set(id, resolve);
      this.iframe.contentWindow!.postMessage({ id, fnCode, args }, '*');
    });
  }

  destroy() {
    this.iframe.remove();
    this.resolvers.clear();
  }
}
