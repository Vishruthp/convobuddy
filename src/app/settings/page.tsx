// pages/settings.tsx
"use client"
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/theme-toggle';
import { redirect  } from 'next/navigation';

interface SettingsForm {
  ollamaUrl: string;
  ollamaPort: number;
}

const SettingsPage = () => {
  const { register, handleSubmit, setValue } = useForm<SettingsForm>();
  const [savedSettings, setSavedSettings] = useState<SettingsForm | null>(null);
  //const router = useRouter();

  useEffect(() => {
    // Load settings from localStorage on page load
    const savedOllamaUrl = localStorage.getItem('ollamaUrl');
    const savedPort = localStorage.getItem('ollamaPort');

    if (savedOllamaUrl && savedPort) {
      setSavedSettings({
        ollamaUrl: savedOllamaUrl,
        ollamaPort: parseInt(savedPort),
      });
      // Set form values from localStorage
      setValue('ollamaUrl', savedOllamaUrl);
      setValue('ollamaPort', parseInt(savedPort));
    }
  }, [setValue]);

  const onSubmit = (data: SettingsForm) => {
    // Save settings to localStorage
    localStorage.setItem('ollamaUrl', data.ollamaUrl);
    localStorage.setItem('ollamaPort', data.ollamaPort.toString());

    // Optionally navigate away after saving
    redirect('/chat'); // Redirect to home or another page if needed
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <div className="mb-4">
      <p> Theme Toggle </p>
      <ModeToggle />
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <Label htmlFor="ollamaUrl">Ollama URL</Label>
          <Input
            id="ollamaUrl"
            placeholder="Enter Ollama URL"
            value="http://localhost"
            {...register('ollamaUrl', { required: 'Ollama URL is required' })}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            value="11434"
            placeholder="Enter Port"
            {...register('ollamaPort', { required: 'Port is required' })}
            className="w-full"
          />
        </div>

        <Button type="submit" className="w-full">Save Settings</Button>
      </form>

      {savedSettings && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold">Saved Settings</h3>
          <p><strong>Ollama URL:</strong> {savedSettings.ollamaUrl}</p>
          <p><strong>Port:</strong> {savedSettings.ollamaPort}</p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
