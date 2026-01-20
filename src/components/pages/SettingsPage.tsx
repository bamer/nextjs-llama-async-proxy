'use client';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-2xl font-semibold mb-6">General</h3>
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">Dark Mode</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Toggle</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">Notifications</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Enable</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">Auto Update</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Enable</button>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6 mt-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-2xl font-semibold mb-6">Security</h3>
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">Authentication</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Configure</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">Encryption</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Manage</button>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6 mt-6 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-2xl font-semibold mb-6">System</h3>
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">System Health</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Check</button>
        </div>
        
        <div className="flex justify-between items-center py-4 border-b border-border">
          <span className="text-foreground">Backup Settings</span>
          <button className="border border-border hover:bg-muted px-4 py-2 rounded-md transition-colors text-foreground hover:shadow-sm font-medium">Manage</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;