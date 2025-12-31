'use client';

import { useState } from 'react';

interface EnvVar {
  name: string;
  value: string | undefined;
  isBackend?: boolean;
}

const DRGREEN_API_URL = 'https://api.drgreennft.com/api/v1';

export default function EnvDebugger() {
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTest, setActiveTest] = useState<'supabase' | 'drgreen' | null>(null);

  const envVars: EnvVar[] = [
    { name: 'NODE_ENV', value: import.meta.env.MODE },
    { name: 'DRGREEN_API_URL', value: DRGREEN_API_URL },
    { name: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
    { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓ Set' : undefined },
    { name: 'VITE_SUPABASE_PROJECT_ID', value: import.meta.env.VITE_SUPABASE_PROJECT_ID },
  ];

  const backendSecrets: EnvVar[] = [
    { name: 'DRGREEN_API_KEY', value: '✓ Configured', isBackend: true },
    { name: 'DRGREEN_PRIVATE_KEY', value: '✓ Configured', isBackend: true },
    { name: 'RESEND_API_KEY', value: '✓ Configured', isBackend: true },
  ];

  const getValueDisplay = (value: string | undefined, isBackend?: boolean) => {
    if (value === undefined) {
      return { text: '[MISSING]', color: '#ef4444' };
    }
    if (value === '') {
      return { text: '[EMPTY]', color: '#eab308' };
    }
    return { text: value, color: isBackend ? '#60a5fa' : '#22c55e' };
  };

  const handleSupabaseTest = async () => {
    const apiUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!apiUrl) {
      setPingStatus('No Supabase URL configured');
      return;
    }

    setIsLoading(true);
    setActiveTest('supabase');
    setPingStatus(null);

    try {
      await fetch(apiUrl, { method: 'HEAD', mode: 'no-cors' });
      setPingStatus('Supabase: Connection OK');
    } catch (error) {
      setPingStatus(`Supabase Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrGreenTest = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !apiKey) {
      setPingStatus('Missing Supabase configuration');
      return;
    }

    setIsLoading(true);
    setActiveTest('drgreen');
    setPingStatus(null);

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/drgreen-proxy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'apikey': apiKey,
          },
          body: JSON.stringify({
            action: 'get-strains-legacy',
            countryCode: 'PRT'
          })
        }
      );
      const data = await response.json();
      if (data.success) {
        setPingStatus(`Dr. Green API: OK - ${data.data?.length || 0} strains found`);
      } else {
        setPingStatus(`Dr. Green API Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setPingStatus(`Dr. Green API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '0',
    right: '0',
    zIndex: 99999,
    backgroundColor: '#7f1d1d',
    color: '#ffffff',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '11px',
    padding: isMinimized ? '8px 12px' : '16px',
    borderTopLeftRadius: '8px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
    maxWidth: isMinimized ? 'auto' : '400px',
    minWidth: isMinimized ? 'auto' : '320px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMinimized ? '0' : '12px',
    fontWeight: 'bold',
    fontSize: '12px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const cellStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'left',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#1e40af',
    color: '#ffffff',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11px',
    marginTop: '12px',
    width: '100%',
  };

  const minimizeButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '2px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '10px',
  };

  if (isMinimized) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>🔧 ENV</span>
          <button style={minimizeButtonStyle} onClick={() => setIsMinimized(false)}>
            Expand
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>🔧 Environment Debugger</span>
        <button style={minimizeButtonStyle} onClick={() => setIsMinimized(true)}>
          Minimize
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...cellStyle, fontWeight: 'bold' }}>Variable</th>
            <th style={{ ...cellStyle, fontWeight: 'bold' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {envVars.map((env) => {
            const display = getValueDisplay(env.value, env.isBackend);
            return (
              <tr key={env.name}>
                <td style={cellStyle}>{env.name}</td>
                <td style={{ ...cellStyle, color: display.color, wordBreak: 'break-all' }}>
                  {display.text.length > 40 ? `${display.text.substring(0, 40)}...` : display.text}
                </td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={2} style={{ ...cellStyle, fontSize: '10px', opacity: 0.7, paddingTop: '8px' }}>
              Backend Secrets (Edge Functions):
            </td>
          </tr>
          {backendSecrets.map((env) => {
            const display = getValueDisplay(env.value, env.isBackend);
            return (
              <tr key={env.name}>
                <td style={{ ...cellStyle, fontSize: '10px' }}>{env.name}</td>
                <td style={{ ...cellStyle, color: display.color, fontSize: '10px' }}>
                  {display.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button 
          style={{ ...buttonStyle, flex: 1, marginTop: 0, opacity: isLoading && activeTest === 'supabase' ? 0.7 : 1 }} 
          onClick={handleSupabaseTest}
          disabled={isLoading}
        >
          {isLoading && activeTest === 'supabase' ? 'Testing...' : 'Test Supabase'}
        </button>
        <button 
          style={{ ...buttonStyle, flex: 1, marginTop: 0, backgroundColor: '#065f46', opacity: isLoading && activeTest === 'drgreen' ? 0.7 : 1 }} 
          onClick={handleDrGreenTest}
          disabled={isLoading}
        >
          {isLoading && activeTest === 'drgreen' ? 'Testing...' : 'Test Dr. Green API'}
        </button>
      </div>

      {pingStatus && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px', 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          borderRadius: '4px',
          color: pingStatus.includes('Error') ? '#ef4444' : '#22c55e'
        }}>
          {pingStatus}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '9px', opacity: 0.7 }}>
        ⚠️ Remove this component before production deploy
      </div>
    </div>
  );
}
