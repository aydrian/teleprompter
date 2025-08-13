// AgentManager - Manages the lifecycle of the TeleprompterAgent
import { Worker, WorkerOptions, log, initializeLogger } from '@livekit/agents';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export interface AgentStatus {
  running: boolean;
  connected: boolean;
  lastStarted?: number;
  lastStopped?: number;
  error?: string;
}

/**
 * Singleton AgentManager for managing the TeleprompterAgent lifecycle
 * This runs in the Node.js context of React Router v7
 */
export class AgentManager {
  private static instance: AgentManager;
  private worker: Worker | null = null;
  private status: AgentStatus = { running: false, connected: false };

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Start the teleprompter agent
   */
  async startAgent(): Promise<void> {
    if (this.worker) {
      throw new Error('Agent is already running');
    }

    try {
      // Initialize logger
      initializeLogger({ pretty: true, level: 'info' });
      log().info('Starting TeleprompterAgent worker');

      // Get the path to the teleprompter agent
      const agentPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        'teleprompter-agent.js' // Will be compiled to .js
      );

      // Create worker options
      const workerOptions = new WorkerOptions({
        agent: agentPath,
        // Use environment variables for LiveKit connection
        wsURL: process.env.LIVEKIT_URL || 'ws://localhost:7880',
        apiKey: process.env.LIVEKIT_API_KEY,
        apiSecret: process.env.LIVEKIT_API_SECRET,
      });

      // Create and start the worker
      this.worker = new Worker(workerOptions);
      
      // Set up event handlers using EventEmitter
      this.worker.event.on('worker_registered', () => {
        log().info('TeleprompterAgent worker registered');
        this.status.running = true;
        this.status.connected = true;
        this.status.lastStarted = Date.now();
        this.status.error = undefined;
      });

      this.worker.event.on('worker_msg', (msg: unknown) => {
        log().info('TeleprompterAgent received message:', msg);
      });

      // Start the worker
      await this.worker.run();
      
      log().info('TeleprompterAgent worker started successfully');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log().error('Failed to start TeleprompterAgent:', message);
      this.status.error = message;
      this.status.running = false;
      this.status.connected = false;
      this.worker = null;
      throw error;
    }
  }

  /**
   * Stop the teleprompter agent
   */
  async stopAgent(): Promise<void> {
    if (!this.worker) {
      throw new Error('Agent is not running');
    }

    try {
      log().info('Stopping TeleprompterAgent worker');
      
      // Drain the worker gracefully
      await this.worker.drain();
      await this.worker.close();
      this.worker = null;
      
      this.status.running = false;
      this.status.connected = false;
      this.status.lastStopped = Date.now();
      this.status.error = undefined;
      
      log().info('TeleprompterAgent worker stopped successfully');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log().error('Failed to stop TeleprompterAgent:', message);
      this.status.error = message;
      throw error;
    }
  }

  /**
   * Get the current status of the agent
   */
  getStatus(): AgentStatus {
    return { ...this.status };
  }

  /**
   * Check if the agent is running
   */
  isRunning(): boolean {
    return this.status.running;
  }

  /**
   * Check if the agent is connected
   */
  isConnected(): boolean {
    return this.status.connected;
  }

  /**
   * Restart the agent (stop then start)
   */
  async restartAgent(): Promise<void> {
    if (this.worker) {
      await this.stopAgent();
    }
    await this.startAgent();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.stopAgent();
    }
  }
}

// Export singleton instance
export const agentManager = AgentManager.getInstance();