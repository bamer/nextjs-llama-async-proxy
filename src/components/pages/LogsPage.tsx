'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useStore } from '@/lib/store';
import { useEffectEvent } from '@/hooks/use-effect-event';

const LogsPage = () => {
  const { requestLogs, isConnected } = useWebSocket();
  const logs = useStore((state) => state.logs);
  const [filterText, setFilterText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [maxLines, setMaxLines] = useState(50);

  // Request logs on mount - using useEffectEvent for stability
  const requestLogsIfConnected = useEffectEvent(() => {
    if (isConnected) {
      requestLogs();
    }
  });

  useEffect(() => {
    requestLogsIfConnected();
  }, [isConnected, requestLogsIfConnected]);



  const filteredLogs = logs.filter((log) => {
    const source = log.source || (typeof log.context?.source === 'string' ? log.context.source : 'application');
    const messageText = typeof log.message === 'string' ? log.message : JSON.stringify(log.message);
    const matchesText =
      messageText.toLowerCase().includes(filterText.toLowerCase()) ||
      source.toLowerCase().includes(filterText.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    return matchesText && matchesLevel;
  }).slice(0, maxLines);

  const clearLogs = () => {
    useStore.getState().clearLogs();
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'warn': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
      case 'debug': return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getLogLevelTextColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-700 dark:text-red-300';
      case 'warn': return 'text-yellow-700 dark:text-yellow-300';
      case 'info': return 'text-blue-700 dark:text-blue-300';
      case 'debug': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="logs-page">
      <h1 className="text-3xl font-bold mb-6">Logs</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="border border-border rounded-md px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary transition-all"
            />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="border border-border rounded-md px-4 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <button
              onClick={clearLogs}
              className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMaxLines(50)}
            className={`px-4 py-2 rounded-md transition-colors font-medium ${maxLines === 50 ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border hover:bg-muted text-foreground'}`}
          >
            50
          </button>
          <button
            onClick={() => setMaxLines(100)}
            className={`px-4 py-2 rounded-md transition-colors font-medium ${maxLines === 100 ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border hover:bg-muted text-foreground'}`}
          >
            100
          </button>
          <button
            onClick={() => setMaxLines(200)}
            className={`px-4 py-2 rounded-md transition-colors font-medium ${maxLines === 200 ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border hover:bg-muted text-foreground'}`}
          >
            200
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
           {filteredLogs.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               {logs.length === 0 ? 'No logs available' : 'No logs match the selected filters'}
             </div>
           ) : (
               filteredLogs.map((log, index) => {
                 const source = log.source || (typeof log.context?.source === 'string' ? log.context.source : 'application');
                 const messageText = typeof log.message === 'string' ? log.message : JSON.stringify(log.message);
                 return (
                   <div key={index} className={`p-3 border rounded-md ${getLogLevelColor(log.level)} transition-all hover:shadow-sm`}>
                     <div className="flex justify-between items-start">
                       <span className={`font-mono ${getLogLevelTextColor(log.level)} font-medium`}>
                         {log.level.toUpperCase()} - {new Date(log.timestamp).toLocaleTimeString()}
                       </span>
                       <span className="text-xs opacity-60 ml-2 flex-shrink-0">{source}</span>
                     </div>
                     <p className="mt-2 font-mono text-sm leading-relaxed">{messageText}</p>
                   </div>
                 );
               })
           )}
         </div>
      </div>
    </div>
  );
};

export default LogsPage;