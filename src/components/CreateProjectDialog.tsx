
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

const CreateProjectDialog = ({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('voice_projects')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Project created",
        description: "Your voice cloning project has been created successfully.",
      });

      setName('');
      setDescription('');
      onProjectCreated();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Create New Voice Project</DialogTitle>
          <DialogDescription className="text-slate-300">
            Start a new voice cloning project. You can add voice samples and generate speech later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Project Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Description (optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your voice project..."
              rows={3}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
