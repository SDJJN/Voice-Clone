
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogOut, Mic, FileAudio, Waveform } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectCard from './ProjectCard';
import CreateProjectDialog from './CreateProjectDialog';
import { Tables } from '@/integrations/supabase/types';

type VoiceProject = Tables<'voice_projects'>;

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [projects, setProjects] = useState<VoiceProject[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleProjectCreated = () => {
    fetchProjects();
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Mic className="w-8 h-8 text-purple-400" />
              <Waveform className="w-6 h-6 text-blue-400 absolute -right-2 -bottom-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">VoiceClone AI</h1>
              <p className="text-sm text-slate-300">Welcome back, {user.email}</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Voice Projects</h2>
            <p className="text-slate-300">Manage your voice cloning projects</p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-slate-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 text-center py-12">
            <CardContent>
              <FileAudio className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <CardTitle className="text-white mb-2">No projects yet</CardTitle>
              <CardDescription className="text-slate-300 mb-6">
                Create your first voice cloning project to get started
              </CardDescription>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        <CreateProjectDialog 
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onProjectCreated={handleProjectCreated}
        />
      </main>
    </div>
  );
};

export default Dashboard;
