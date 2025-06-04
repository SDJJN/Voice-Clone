
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Play, Pause, Download, Trash2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceRecorder from './VoiceRecorder';
import { Tables } from '@/integrations/supabase/types';

type VoiceProject = Tables<'voice_projects'>;
type VoiceSample = Tables<'voice_samples'>;
type GeneratedAudio = Tables<'generated_audio'>;

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<VoiceProject | null>(null);
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio[]>([]);
  const [inputText, setInputText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('voice_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch voice samples
      const { data: samplesData, error: samplesError } = await supabase
        .from('voice_samples')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (samplesError) throw samplesError;
      setSamples(samplesData || []);

      // Fetch generated audio
      const { data: audioData, error: audioError } = await supabase
        .from('generated_audio')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (audioError) throw audioError;
      setGeneratedAudio(audioData || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to generate speech",
        variant: "destructive",
      });
      return;
    }

    if (samples.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one voice sample first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          text: inputText,
          samples: samples.map(s => ({ name: s.name, audioUrl: s.audio_url })),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Speech generated successfully",
        });
        setInputText('');
        fetchProjectData(); // Refresh to get new generated audio
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate speech",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-300">{project.description || 'No description'}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voice Recording Section */}
          <div className="space-y-6">
            <VoiceRecorder
              projectId={projectId!}
              onSampleUploaded={fetchProjectData}
            />

            {/* Voice Samples */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Voice Samples ({samples.length})</CardTitle>
                <CardDescription className="text-slate-300">
                  Recorded voice samples for cloning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {samples.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    No voice samples yet. Record your first sample above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {samples.map((sample) => (
                      <div key={sample.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{sample.name}</div>
                          <div className="text-slate-300 text-sm">
                            {sample.duration_seconds ? `${sample.duration_seconds}s` : 'Unknown duration'}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => playAudio(sample.audio_url)}
                            size="sm"
                            variant="outline"
                            className="border-slate-600"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Text-to-Speech Section */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-purple-400" />
                  Generate Speech
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Enter text to generate speech using your cloned voice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter the text you want to convert to speech..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                />
                <Button
                  onClick={generateSpeech}
                  disabled={generating || !inputText.trim() || samples.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generating ? 'Generating...' : 'Generate Speech'}
                </Button>
                {samples.length === 0 && (
                  <p className="text-yellow-400 text-sm">
                    Upload at least one voice sample to generate speech
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Generated Audio */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Generated Audio ({generatedAudio.length})</CardTitle>
                <CardDescription className="text-slate-300">
                  Your generated speech files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedAudio.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">
                    No generated audio yet. Create your first speech above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {generatedAudio.map((audio) => (
                      <div key={audio.id} className="p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-white font-medium">Generated Speech</div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => playAudio(audio.audio_url)}
                              size="sm"
                              variant="outline"
                              className="border-slate-600"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => window.open(audio.audio_url, '_blank')}
                              size="sm"
                              variant="outline"
                              className="border-slate-600"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{audio.text_input}</p>
                        <div className="text-slate-400 text-xs mt-1">
                          {new Date(audio.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
