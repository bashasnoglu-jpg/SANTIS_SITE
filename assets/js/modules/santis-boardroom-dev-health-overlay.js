/**
 * santis-boardroom-dev-health-overlay.js
 * Runtime health cockpit for Boardroom development.
 */
class SantisBoardroomDevHealthOverlay {
  constructor({
    root = document.getElementById('boardroom-dev-health-overlay'),
    pollInterval = 15000,
  } = {}) {
    this.root = root;
    this.pollInterval = pollInterval;
    this.state = {
      assets: 'checking',
      ingestionApi: 'checking',
      coreState: 'checking',
      oracle: 'checking',
      sovereignBus: 'idle',
      lastError: 'none',
    };
    this.details = {
      assets: 'Scanning linked CSS and scripts',
      ingestionApi: 'Checking http://localhost:3030',
      coreState: 'Waiting for stream event',
      oracle: 'Checking Oracle endpoints',
      sovereignBus: 'No bus error observed',
      lastError: 'No runtime error observed',
    };
    this.boundRefresh = this.refresh.bind(this);
  }

  init() {
    if (!this.root) return;

    this.renderShell();
    this.bindEvents();
    this.refresh();
    window.setInterval(this.boundRefresh, this.pollInterval);
  }

  bindEvents() {
    window.addEventListener('error', (event) => {
      this.state.lastError = 'error';
      this.details.lastError = event.message || 'Runtime error captured';
      this.render();
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.state.lastError = 'error';
      this.details.lastError = event.reason?.message || String(event.reason || 'Unhandled promise rejection');
      this.render();
    });

    window.addEventListener('santis:corestate:connected', () => {
      this.state.coreState = 'ok';
      this.details.coreState = 'CoreState stream connected';
      this.render();
    });

    window.addEventListener('santis:corestate:error', () => {
      this.state.coreState = 'warn';
      this.details.coreState = 'CoreState stream error or reconnecting';
      this.render();
    });

    window.addEventListener('santis:sovereign-bus:error', (event) => {
      this.state.sovereignBus = 'warn';
      this.details.sovereignBus = `Bus error at ${event.detail?.timestamp || 'unknown time'}`;
      this.render();
    });
  }

  renderShell() {
    this.root.innerHTML = `
      <button class="dev-health-toggle" type="button" aria-expanded="false">
        <span class="dev-health-dot"></span>
        Dev Health
      </button>
      <section class="dev-health-panel" hidden>
        <div class="dev-health-header">
          <strong>Boardroom Dev Health</strong>
          <span data-health-summary>Checking...</span>
        </div>
        <div class="dev-health-grid" data-health-grid></div>
      </section>
    `;

    this.root.querySelector('.dev-health-toggle')?.addEventListener('click', () => {
      const panel = this.root.querySelector('.dev-health-panel');
      const button = this.root.querySelector('.dev-health-toggle');
      const isHidden = panel.hasAttribute('hidden');
      panel.toggleAttribute('hidden', !isHidden);
      button.setAttribute('aria-expanded', String(isHidden));
    });
  }

  async refresh() {
    this.checkAssets();
    await Promise.all([
      this.checkIngestionApi(),
      this.checkOracleEndpoints(),
    ]);
    this.render();
  }

  checkAssets() {
    const stylesheets = Array.from(document.styleSheets || []);
    const expectedLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).length;
    const loadedStylesheets = stylesheets.filter((sheet) => sheet.href).length;
    const moduleScripts = Array.from(document.querySelectorAll('script[type="module"]'));

    if (loadedStylesheets >= expectedLinks && moduleScripts.length > 0) {
      this.state.assets = 'ok';
      this.details.assets = `${loadedStylesheets}/${expectedLinks} stylesheets loaded; ${moduleScripts.length} module scripts declared`;
      return;
    }

    this.state.assets = 'warn';
    this.details.assets = `${loadedStylesheets}/${expectedLinks} stylesheets visible; verify server root if assets are missing`;
  }

  async checkIngestionApi() {
    try {
      const response = await fetch('http://localhost:3030/api/v1/analytics/god/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      this.state.ingestionApi = response.ok ? 'ok' : 'warn';
      this.details.ingestionApi = response.ok ? 'Ingestion API reachable' : `Health returned ${response.status}`;
    } catch (error) {
      this.state.ingestionApi = 'error';
      this.details.ingestionApi = 'Ingestion API not reachable on localhost:3030';
    }
  }

  async checkOracleEndpoints() {
    const endpoints = [
      'action-memory',
      'node-sync',
      'global-aggregation',
      'cross-node-learning',
      'strategy-simulation',
      'execution-guard',
      'execution-outcomes',
    ];

    try {
      const results = await Promise.all(endpoints.map((endpoint) =>
        fetch(`http://localhost:3030/api/v1/oracle/${endpoint}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }).then((response) => response.ok)
      ));
      const okCount = results.filter(Boolean).length;
      this.state.oracle = okCount === endpoints.length ? 'ok' : 'warn';
      this.details.oracle = `${okCount}/${endpoints.length} Oracle endpoints reachable`;
    } catch (error) {
      this.state.oracle = 'error';
      this.details.oracle = 'Oracle endpoints not reachable on localhost:3030';
    }
  }

  render() {
    if (!this.root) return;

    const healthKeys = ['assets', 'ingestionApi', 'coreState', 'oracle', 'sovereignBus', 'lastError'];
    const worst = this.resolveWorstStatus(healthKeys.map((key) => this.state[key]));
    const grid = this.root.querySelector('[data-health-grid]');
    const summary = this.root.querySelector('[data-health-summary]');
    const dot = this.root.querySelector('.dev-health-dot');

    summary.textContent = this.resolveSummary(worst);
    dot.dataset.status = worst;
    grid.innerHTML = healthKeys.map((key) => this.renderItem(key)).join('');
  }

  renderItem(key) {
    return `
      <article class="dev-health-item" data-status="${this.escapeHtml(this.state[key])}">
        <span>${this.escapeHtml(this.labelFor(key))}</span>
        <strong>${this.escapeHtml(this.state[key])}</strong>
        <p>${this.escapeHtml(this.details[key])}</p>
      </article>
    `;
  }

  resolveWorstStatus(statuses) {
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warn') || statuses.includes('checking')) return 'warn';
    return 'ok';
  }

  resolveSummary(status) {
    if (status === 'error') return 'Action needed';
    if (status === 'warn') return 'Degraded';
    return 'Healthy';
  }

  labelFor(key) {
    return {
      assets: 'Static assets',
      ingestionApi: 'Ingestion API',
      coreState: 'CoreState stream',
      oracle: 'Oracle endpoints',
      sovereignBus: 'Sovereign Bus',
      lastError: 'Last runtime error',
    }[key] || key;
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

const overlay = new SantisBoardroomDevHealthOverlay();
overlay.init();
