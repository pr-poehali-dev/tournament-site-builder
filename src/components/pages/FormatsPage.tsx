import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { AppState, TournamentFormat } from '@/types';

interface FormatsPageProps {
  appState: AppState;
  editingFormatId: string | null;
  editingFormat: { name: string; coefficient: number };
  newFormat: { name: string; coefficient: number };
  setEditingFormatId: (id: string | null) => void;
  setEditingFormat: (format: { name: string; coefficient: number }) => void;
  setNewFormat: (format: { name: string; coefficient: number }) => void;
  addTournamentFormat: (format: { name: string; coefficient: number }) => void;
  updateTournamentFormat: (id: string, format: { name: string; coefficient: number }) => void;
  deleteTournamentFormat: (formatId: string) => void;
  formatNameInputRef: React.RefObject<HTMLInputElement>;
}

export const FormatsPage: React.FC<FormatsPageProps> = ({
  appState,
  editingFormatId,
  editingFormat,
  newFormat,
  setEditingFormatId,
  setEditingFormat,
  setNewFormat,
  addTournamentFormat,
  updateTournamentFormat,
  deleteTournamentFormat,
  formatNameInputRef
}) => {
  const addFormat = () => {
    if (!formatNameInputRef.current?.value.trim()) return;
    const name = formatNameInputRef.current.value.trim();
    const coefficient = parseInt((document.querySelector('input[type="number"]') as HTMLInputElement)?.value || '1');
    addTournamentFormat({ name, coefficient });
    formatNameInputRef.current.value = '';
    (document.querySelector('input[type="number"]') as HTMLInputElement).value = '';
  };

  const startEditFormat = (format: TournamentFormat) => {
    setEditingFormatId(format.id);
    setEditingFormat({ name: format.name, coefficient: format.coefficient });
  };

  const saveEditFormat = () => {
    if (editingFormatId && editingFormat.name.trim()) {
      updateTournamentFormat(editingFormatId, editingFormat);
      setEditingFormatId(null);
      setEditingFormat({ name: '', coefficient: 1 });
    }
  };

  const cancelEditFormat = () => {
    setEditingFormatId(null);
    setEditingFormat({ name: '', coefficient: 1 });
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Layers" size={20} />
            Форматы турниров
          </CardTitle>
          <CardDescription>
            Управление форматами и их коэффициентами для рейтинговых очков
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Форма добавления формата */}
          <div className="flex gap-2">
            <input
              ref={formatNameInputRef}
              type="text"
              placeholder="Название формата"
              className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <input
              type="number"
              min="1"
              step="1"
              defaultValue="1"
              placeholder="Коэффициент"
              className="w-32 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button onClick={addFormat}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить
            </Button>
          </div>

          {/* Список форматов */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Всего форматов: {appState.tournamentFormats.length}
            </div>
            
            {appState.tournamentFormats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Layers" size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Нет форматов</p>
                <p className="text-sm">Добавьте первый формат выше</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {appState.tournamentFormats.map((format) => (
                  <div key={format.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon name="Layers" size={16} className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">{format.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Коэффициент: <span className="font-medium">{format.coefficient}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditFormat(format)}>
                        <Icon name="Edit" size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить формат</AlertDialogTitle>
                            <AlertDialogDescription>
                              Удалить формат "{format.name}"? Это действие необратимо.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTournamentFormat(format.id)} className="bg-destructive hover:bg-destructive/90">
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Модальное окно редактирования */}
          {editingFormatId && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Редактирование формата</div>
                  <div className="flex gap-2">
                    <Input
                      value={editingFormat.name}
                      onChange={(e) => setEditingFormat({ ...editingFormat, name: e.target.value })}
                      placeholder="Название формата"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={editingFormat.coefficient}
                      onChange={(e) => setEditingFormat({ ...editingFormat, coefficient: parseInt(e.target.value) || 1 })}
                      placeholder="Коэффициент"
                      className="w-32"
                    />
                    <Button onClick={saveEditFormat}>
                      <Icon name="Check" size={16} className="mr-2" />
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={cancelEditFormat}>
                      <Icon name="X" size={16} className="mr-2" />
                      Отмена
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};