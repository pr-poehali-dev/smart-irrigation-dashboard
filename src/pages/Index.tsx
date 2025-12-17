import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuthForm } from '@/components/AuthForm';
import { UserMenu } from '@/components/UserMenu';
import { EditZoneDialog } from '@/components/EditZoneDialog';
import { Button } from '@/components/ui/button';

const waterUsageData = [
  { day: 'Пн', usage: 45 },
  { day: 'Вт', usage: 52 },
  { day: 'Ср', usage: 38 },
  { day: 'Чт', usage: 48 },
  { day: 'Пт', usage: 42 },
  { day: 'Сб', usage: 55 },
  { day: 'Вс', usage: 50 },
];

const moistureData = [
  { time: '00:00', zone1: 65, zone2: 72, zone3: 58, zone4: 68, zone5: 55, zone6: 71, zone7: 62, zone8: 70 },
  { time: '04:00', zone1: 62, zone2: 68, zone3: 55, zone4: 65, zone5: 52, zone6: 68, zone7: 59, zone8: 67 },
  { time: '08:00', zone1: 70, zone2: 75, zone3: 65, zone4: 72, zone5: 62, zone6: 76, zone7: 68, zone8: 74 },
  { time: '12:00', zone1: 68, zone2: 73, zone3: 62, zone4: 70, zone5: 60, zone6: 74, zone7: 66, zone8: 72 },
  { time: '16:00', zone1: 65, zone2: 70, zone3: 60, zone4: 67, zone5: 58, zone6: 71, zone7: 64, zone8: 69 },
  { time: '20:00', zone1: 72, zone2: 78, zone3: 68, zone4: 75, zone5: 65, zone6: 79, zone7: 71, zone8: 77 },
];

interface Zone {
  id: number;
  name: string;
  active: boolean;
  moisture: number;
  temperature: number;
  lastWatered: string;
}

interface User {
  username: string;
  email: string;
  zones: Zone[];
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wsUrl] = useState('ws://192.168.1.100:81');
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  
  const [zones, setZones] = useState<Zone[]>([
    { id: 1, name: 'Газон передний', active: true, moisture: 72, temperature: 24, lastWatered: '2 часа назад' },
    { id: 2, name: 'Цветник', active: true, moisture: 68, temperature: 23, lastWatered: '1 час назад' },
    { id: 3, name: 'Огород', active: false, moisture: 55, temperature: 25, lastWatered: '5 часов назад' },
    { id: 4, name: 'Газон задний', active: true, moisture: 75, temperature: 22, lastWatered: '30 минут назад' },
    { id: 5, name: 'Теплица', active: false, moisture: 58, temperature: 28, lastWatered: '4 часа назад' },
    { id: 6, name: 'Клумба входная', active: true, moisture: 71, temperature: 23, lastWatered: '1.5 часа назад' },
    { id: 7, name: 'Сад фруктовый', active: true, moisture: 69, temperature: 24, lastWatered: '2.5 часа назад' },
    { id: 8, name: 'Розарий', active: false, moisture: 52, temperature: 22, lastWatered: '6 часов назад' },
  ]);

  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onConnect: () => {
      toast.success('Подключено к ESP32', {
        description: 'Данные обновляются в реальном времени',
      });
    },
    onDisconnect: () => {
      toast.error('Соединение потеряно', {
        description: 'Попытка переподключения...',
      });
    },
    onMessage: (data) => {
      if (data.type === 'sensor_data') {
        updateZoneData(data.data);
      }
    },
  });

  const updateZoneData = (data: any) => {
    if (data.zoneId !== undefined) {
      setZones(prevZones =>
        prevZones.map(zone =>
          zone.id === data.zoneId
            ? {
                ...zone,
                moisture: data.moisture ?? zone.moisture,
                temperature: data.temperature ?? zone.temperature,
                active: data.active ?? zone.active,
              }
            : zone
        )
      );
    }
  };

  const handleLogin = (username: string, password: string) => {
    const mockUser: User = {
      username,
      email: `${username}@example.com`,
      zones: zones,
    };
    setUser(mockUser);
    toast.success('Вход выполнен', {
      description: `Добро пожаловать, ${username}!`,
    });
  };

  const handleRegister = (username: string, password: string, email: string) => {
    const mockUser: User = {
      username,
      email,
      zones: zones,
    };
    setUser(mockUser);
    toast.success('Регистрация завершена', {
      description: 'Добро пожаловать в систему!',
    });
  };

  const handleLogout = () => {
    setUser(null);
    toast.info('Выход выполнен', {
      description: 'До скорой встречи!',
    });
  };

  const toggleZone = (id: number) => {
    const zone = zones.find(z => z.id === id);
    if (zone) {
      sendMessage({
        type: 'toggle_zone',
        zoneId: id,
        active: !zone.active,
      });
      setZones(zones.map(z => 
        z.id === id ? { ...z, active: !z.active } : z
      ));
    }
  };

  const handleRenameZone = (newName: string) => {
    if (editingZone) {
      setZones(zones.map(z => 
        z.id === editingZone.id ? { ...z, name: newName } : z
      ));
      toast.success('Зона переименована', {
        description: `Новое название: ${newName}`,
      });
    }
  };

  const getMoistureColor = (moisture: number) => {
    if (moisture >= 70) return 'text-secondary';
    if (moisture >= 50) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getMoistureStatus = (moisture: number) => {
    if (moisture >= 70) return 'Отлично';
    if (moisture >= 50) return 'Норма';
    return 'Низкая';
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Система автополива</h1>
              <p className="text-muted-foreground">Мониторинг и управление зонами полива в реальном времени</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-secondary animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'ESP32 подключён' : 'Нет соединения'}
                </span>
              </div>
              <UserMenu username={user.username} email={user.email} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-scale-in hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Активных зон</CardTitle>
                <Icon name="Droplets" size={20} className="text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {zones.filter(z => z.active).length}/{zones.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Зоны в работе</p>
            </CardContent>
          </Card>

          <Card className="animate-scale-in hover:shadow-lg transition-shadow" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Средняя влажность</CardTitle>
                <Icon name="Gauge" size={20} className="text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {Math.round(zones.reduce((acc, z) => acc + z.moisture, 0) / zones.length)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Все зоны</p>
            </CardContent>
          </Card>

          <Card className="animate-scale-in hover:shadow-lg transition-shadow" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Температура</CardTitle>
                <Icon name="Thermometer" size={20} className="text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {Math.round(zones.reduce((acc, z) => acc + z.temperature, 0) / zones.length)}°C
              </div>
              <p className="text-xs text-muted-foreground mt-1">Средняя по зонам</p>
            </CardContent>
          </Card>

          <Card className="animate-scale-in hover:shadow-lg transition-shadow" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Расход воды</CardTitle>
                <Icon name="Activity" size={20} className="text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">48л</div>
              <p className="text-xs text-muted-foreground mt-1">Сегодня</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BarChart3" size={20} className="text-primary" />
                Расход воды за неделю
              </CardTitle>
              <CardDescription>Потребление в литрах по дням</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={waterUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6'
                    }}
                  />
                  <Bar dataKey="usage" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" size={20} className="text-secondary" />
                Динамика влажности
              </CardTitle>
              <CardDescription>Изменение по зонам за 24 часа</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={moistureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6'
                    }}
                  />
                  <Line type="monotone" dataKey="zone1" stroke="#0ea5e9" strokeWidth={2} />
                  <Line type="monotone" dataKey="zone2" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="zone3" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="zone4" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MapPin" size={20} className="text-primary" />
              Управление зонами полива
            </CardTitle>
            <CardDescription>Включение/выключение и мониторинг состояния</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${zone.active ? 'bg-secondary animate-pulse' : 'bg-gray-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{zone.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setEditingZone(zone)}
                          >
                            <Icon name="Edit2" size={14} className="text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{zone.lastWatered}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={zone.active} 
                      onCheckedChange={() => toggleZone(zone.id)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Icon name="Droplet" size={14} />
                          Влажность
                        </span>
                        <span className={`text-sm font-semibold ${getMoistureColor(zone.moisture)}`}>
                          {zone.moisture}% · {getMoistureStatus(zone.moisture)}
                        </span>
                      </div>
                      <Progress value={zone.moisture} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Icon name="Thermometer" size={14} />
                        Температура
                      </span>
                      <span className="text-sm font-semibold text-orange-500">
                        {zone.temperature}°C
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Cpu" size={20} className="text-primary" />
                Подключённые устройства
              </CardTitle>
              <CardDescription>Датчики и клапаны системы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Датчик влажности #1', status: 'online', type: 'sensor' },
                  { name: 'Датчик влажности #2', status: 'online', type: 'sensor' },
                  { name: 'Датчик влажности #3', status: 'online', type: 'sensor' },
                  { name: 'Датчик температуры', status: 'online', type: 'sensor' },
                  { name: 'Главный клапан', status: 'online', type: 'valve' },
                  { name: 'Клапан зоны 1-4', status: 'online', type: 'valve' },
                  { name: 'Клапан зоны 5-8', status: 'online', type: 'valve' },
                ].map((device, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Icon 
                        name={device.type === 'sensor' ? 'Radio' : 'Settings'} 
                        size={18} 
                        className="text-muted-foreground" 
                      />
                      <span className="text-sm font-medium">{device.name}</span>
                    </div>
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {device.status === 'online' ? 'Онлайн' : 'Проверка'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Bell" size={20} className="text-primary" />
                Уведомления
              </CardTitle>
              <CardDescription>Последние события системы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { text: 'Зона "Газон передний" полив завершён', time: '2 часа назад', type: 'success' },
                  { text: 'Низкая влажность в зоне "Розарий"', time: '3 часа назад', type: 'warning' },
                  { text: 'Система запущена успешно', time: '6 часов назад', type: 'info' },
                  { text: 'Датчик температуры обновлён', time: '12 часов назад', type: 'info' },
                  { text: 'Еженедельная проверка завершена', time: '1 день назад', type: 'success' },
                ].map((notification, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg border">
                    <Icon 
                      name={notification.type === 'success' ? 'CheckCircle2' : notification.type === 'warning' ? 'AlertCircle' : 'Info'} 
                      size={18} 
                      className={
                        notification.type === 'success' ? 'text-secondary' : 
                        notification.type === 'warning' ? 'text-yellow-500' : 
                        'text-primary'
                      }
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <EditZoneDialog
          open={!!editingZone}
          onOpenChange={(open) => !open && setEditingZone(null)}
          zoneName={editingZone?.name || ''}
          onSave={handleRenameZone}
        />
      </div>
    </div>
  );
};

export default Index;