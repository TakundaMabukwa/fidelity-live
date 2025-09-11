'use client';

import { useState } from 'react';
import { testDatabaseConnection, testBasicTableAccess } from '@/lib/actions/customers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugCustomersPage() {
  const [result, setResult] = useState<{ success: boolean; message: string; tables?: string[]; sampleData?: any } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const testResult = await testDatabaseConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBasicTest = async () => {
    setLoading(true);
    try {
      const testResult = await testBasicTableAccess();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto p-6 container">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={loading}>
              {loading ? 'Testing...' : 'Test Database Connection'}
            </Button>
            <Button onClick={handleBasicTest} disabled={loading} variant="outline">
              {loading ? 'Testing...' : 'Test Basic Table Access'}
            </Button>
          </div>
          
          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <h3 className="mb-2 font-semibold">Result:</h3>
              <p className="mb-2">{result.message}</p>
              {result.tables && result.tables.length > 0 && (
                <div>
                  <h4 className="mb-1 font-medium">Available Tables:</h4>
                  <ul className="list-disc list-inside">
                    {result.tables.map((table, index) => (
                      <li key={index}>{table}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.sampleData && (
                <div>
                  <h4 className="mb-1 font-medium">Sample Data:</h4>
                  <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                    {JSON.stringify(result.sampleData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
