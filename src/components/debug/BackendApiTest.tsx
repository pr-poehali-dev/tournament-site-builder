import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BackendApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testUsersAPI = async () => {
    setLoading(true);
    setResult('Тестирую API...');
    
    try {
      const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.text();
      setResult(`Status: ${response.status}\nResponse: ${data}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateUser = async () => {
    setLoading(true);
    setResult('Создаю пользователя...');
    
    try {
      const response = await fetch('https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: `test_${Date.now()}`,
          password: 'test123',
          name: 'API Test User',
          role: 'player',
          city: 'Тест'
        })
      });

      const data = await response.text();
      setResult(`Status: ${response.status}\nResponse: ${data}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Backend API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testUsersAPI} disabled={loading}>
            GET Users
          </Button>
          <Button onClick={testCreateUser} disabled={loading}>
            POST Create User
          </Button>
        </div>
        
        {result && (
          <div className="p-4 bg-gray-100 rounded font-mono text-sm whitespace-pre-wrap">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendApiTest;