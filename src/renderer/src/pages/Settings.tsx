import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { AppSettings, User } from '@shared/types';
import { Save, Trash2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
      printerName: ''
  });
  const [printers, setPrinters] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  
  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
      window.api.getSettings().then(setSettings);
      window.api.getPrinters().then(setPrinters);
      fetchUsers();
  }, []);

  const fetchUsers = () => {
      window.api.getUsers().then(setUsers);
  };

  const handleChange = (key: keyof AppSettings, value: string) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
      await window.api.saveSettings(settings);
      setMsg('Settings Saved!');
      setTimeout(() => setMsg(''), 3000);
  };

  const handleAddUser = async () => {
      if (!newUser.username || !newUser.password || !currentUser) return;
      const res = await window.api.addUser({ ...newUser, adminId: currentUser.id });
      if (res.success) {
          setIsAddUserOpen(false);
          setNewUser({ username: '', password: '' });
          fetchUsers();
      } else {
          alert(res.message);
      }
  };

  const handleDeleteUser = async (id: number) => {
      if (!currentUser) return;
      if (confirm('Are you sure you want to delete this user?')) {
          const res = await window.api.deleteUser({ userId: id, adminId: currentUser.id });
          if (res.success) {
              fetchUsers();
          } else {
              alert(res.message);
          }
      }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Printer Settings</CardTitle>
                <CardDescription>Configure your thermal printer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Default Printer</Label>
                    <Select value={settings.printerName} onValueChange={(val) => handleChange('printerName', val)}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a printer" />
                      </SelectTrigger>
                      <SelectContent>
                          {printers.map((p) => (
                              <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Select a printer to skip the print dialog.</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" /> Save Settings
                </Button>
                {msg && <span className="text-green-600 font-medium animate-pulse">{msg}</span>}
            </CardFooter>
        </Card>

        {currentUser?.role === 'admin' && (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage application users.</CardDescription>
                </div>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddUser}>Create User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{new Date(user.created_at || '').toLocaleDateString()}</TableCell>
                                <TableCell>{user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={user.id === currentUser?.id}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}