import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function TestAPI() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    
    try {
      console.log('🧪 Ejecutando test de API...');
      
      const { data, error } = await supabase.functions.invoke('test-gomanage');
      
      if (error) {
        console.error('❌ Error en test:', error);
        setResults({ error: error.message });
      } else {
        console.log('✅ Test completado:', data);
        setResults(data);
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setResults({ error: 'Error inesperado durante el test' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Test API GO!Manage</h1>
        <p className="text-muted-foreground">
          Prueba directa de la conexión con la API de GO!Manage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ejecutar Pruebas</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTest} 
            disabled={testing}
            className="w-full"
          >
            {testing ? '🔄 Probando...' : '🧪 Probar API'}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Test</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-background-alt p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}