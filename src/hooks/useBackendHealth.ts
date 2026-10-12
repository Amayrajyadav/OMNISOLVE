import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { HealthCheckResponse } from '../types/analysis';

export function useBackendHealth() {
  const [health, setHealth] = useState<HealthCheckResponse>({
    status: 'checking',
    model_available: false,
  });
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    const result = await apiService.checkHealth();
    setHealth(result);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiService.checkHealth().then((result) => {
      if (isMounted) {
        setHealth(result);
        setIsChecking(false);
      }
    });

    // Poll every 30 seconds
    const interval = setInterval(() => {
      apiService.checkHealth().then((result) => {
        if (isMounted) {
          setHealth(result);
        }
      });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    health,
    isChecking,
    recheck: checkStatus,
    isOnline: health.status === 'ok',
  };
}
