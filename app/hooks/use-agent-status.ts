import { useState, useEffect, useCallback } from "react";

export interface AgentStatus {
  running: boolean;
  connected: boolean;
  lastStarted?: number;
  lastStopped?: number;
  error?: string;
}

export interface UseAgentStatusReturn {
  status: AgentStatus | null;
  isLoading: boolean;
  error: string | null;
  startAgent: () => Promise<void>;
  stopAgent: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useAgentStatus(): UseAgentStatusReturn {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/agent/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.message || 'Failed to get agent status');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    }
  }, []);

  const startAgent = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const response = await fetch('/api/agent/start', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.message || 'Failed to start agent');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopAgent = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const response = await fetch('/api/agent/stop', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.message || 'Failed to stop agent');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh status on mount and periodically
  useEffect(() => {
    refreshStatus();
    
    const interval = setInterval(refreshStatus, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    status,
    isLoading,
    error,
    startAgent,
    stopAgent,
    refreshStatus,
  };
}