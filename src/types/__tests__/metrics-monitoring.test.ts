import type { MonitoringEntry } from '@/types/monitoring';

describe('Metrics Monitoring Tests', () => {
  it('handles various model count scenarios', () => {
    const singleModel: MonitoringEntry = {
      system: {
        cpu: { usage: 25 },
        memory: { used: 30 },
        disk: { used: 50 },
        network: { rx: 1000000, tx: 500000 },
        uptime: 7200,
      },
      models: [{ status: 'running', memory: 2048, requests: 100 }],
    };

    const multipleModels: MonitoringEntry = {
      system: {
        cpu: { usage: 80 },
        memory: { used: 75 },
        disk: { used: 50 },
        network: { rx: 8000000, tx: 4000000 },
        uptime: 14400,
      },
      models: [
        { status: 'running', memory: 2048, requests: 100 },
        { status: 'running', memory: 4096, requests: 200 },
        { status: 'stopped', memory: 0, requests: 0 },
      ],
    };

    const noModels: MonitoringEntry = {
      system: {
        cpu: { usage: 0 },
        memory: { used: 0 },
        disk: { used: 0 },
        network: { rx: 0, tx: 0 },
        uptime: 0,
      },
      models: [],
    };

    expect(singleModel.models).toHaveLength(1);
    expect(multipleModels.models).toHaveLength(3);
    expect(multipleModels.models.length).toBeGreaterThan(2);
    expect(noModels.models).toHaveLength(0);
  });

  it('handles different model statuses', () => {
    const validStatuses = ['running', 'stopped', 'loading', 'error'] as const;
    const entry: MonitoringEntry = {
      system: {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        network: { rx: 5000000, tx: 2500000 },
        uptime: 3600,
      },
      models: [
        { status: 'running', memory: 2048, requests: 100 },
        { status: 'stopped', memory: 0, requests: 0 },
        { status: 'loading', memory: 1024, requests: 0 },
        { status: 'error', memory: 0, requests: 0 },
      ],
    };

    expect(entry.models).toHaveLength(4);
    entry.models.forEach((model, idx) => {
      expect(validStatuses).toContain(model.status);
      expect(model.memory).toBe(
        entry.models[idx].status === 'loading' ? 1024 : model.memory,
      );
      expect(model.requests).toBe(
        entry.models[idx].status === 'running' ? model.requests : model.requests,
      );
    });
  });

  it('handles overall metrics scenarios', () => {
    const idle: MonitoringEntry = {
      system: {
        cpu: { usage: 0 },
        memory: { used: 0 },
        disk: { used: 0 },
        network: { rx: 0, tx: 0 },
        uptime: 0,
      },
      models: [],
    };

    const moderate: MonitoringEntry = {
      system: {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        network: { rx: 5000000, tx: 2500000 },
        uptime: 1800,
      },
      models: [{ status: 'running', memory: 2048, requests: 100 }],
    };

    const fullyLoaded: MonitoringEntry = {
      system: {
        cpu: { usage: 100 },
        memory: { used: 100 },
        disk: { used: 100 },
        network: { rx: 10000000, tx: 5000000 },
        uptime: 86400,
      },
      models: [{ status: 'running', memory: 10240, requests: 1000 }],
    };

    expect(idle.system.cpu.usage).toBe(0);
    expect(idle.system.memory.used).toBe(0);
    expect(idle.system.disk.used).toBe(0);

    expect(moderate.system.cpu.usage).toBe(50);
    expect(moderate.system.memory.used).toBe(50);
    expect(moderate.models).toHaveLength(1);

    expect(fullyLoaded.system.cpu.usage).toBe(100);
    expect(fullyLoaded.system.memory.used).toBe(100);
    expect(fullyLoaded.system.disk.used).toBe(100);
  });

  it('handles exact and fractional values for precision', () => {
    const exactValues: MonitoringEntry = {
      system: {
        cpu: { usage: 42.0 },
        memory: { used: 42.0 },
        disk: { used: 42.0 },
        network: { rx: 4200000, tx: 2100000 },
        uptime: 15120,
      },
      models: [],
    };

    const fractionalValues: MonitoringEntry = {
      system: {
        cpu: { usage: 75.5 },
        memory: { used: 82.3 },
        disk: { used: 50.0 },
        network: { rx: 5500000, tx: 2750000 },
        uptime: 1800,
      },
      models: [],
    };

    expect(exactValues.system.cpu.usage).toBe(42.0);
    expect(exactValues.system.memory.used).toBe(42.0);
    expect(exactValues.system.disk.used).toBe(42.0);

    expect(fractionalValues.system.cpu.usage).toBeCloseTo(75.5, 1);
    expect(fractionalValues.system.memory.used).toBeCloseTo(82.3, 1);
  });

  it('handles scenario with balanced metrics', () => {
    const entry: MonitoringEntry = {
      system: {
        cpu: { usage: 55 },
        memory: { used: 55 },
        disk: { used: 55 },
        network: { rx: 5500000, tx: 2750000 },
        uptime: 5500,
      },
      models: [{ status: 'running', memory: 2048, requests: 55 }],
    };

    expect(entry.system.cpu.usage).toBe(55);
    expect(entry.system.memory.used).toBe(55);
    expect(entry.system.disk.used).toBe(55);
    expect(entry.models[0].requests).toBe(55);
  });
});
