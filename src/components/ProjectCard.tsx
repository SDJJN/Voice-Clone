
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Play, Calendar } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type VoiceProject = Tables<'voice_projects'>;

interface ProjectCardProps {
  project: VoiceProject;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Mic className="w-6 h-6 text-purple-400" />
          <span className="text-xs text-slate-400 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(project.created_at)}
          </span>
        </div>
        <CardTitle className="text-white">{project.name}</CardTitle>
        <CardDescription className="text-slate-300">
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Voice samples: 0 • Generated: 0
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Play className="w-3 h-3 mr-1" />
            Open
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
