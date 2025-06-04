
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mic, Square, Play, Pause, Upload, Trash2 } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSampleUploaded: () => void;
  projectId: string;
}

const VoiceRecorder = ({ onSampleUploaded, projectId }: VoiceRecorderProps) => {
  const { isRecording, audioBlob, duration, startRecording, stopRecording, resetRecording } = useVoiceRecording();
  const [sampleName, setSampleName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const uploadSample = async () => {
    if (!audioBlob || !sampleName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the voice sample",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Convert blob to base64 for upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const response = await fetch('/api/upload-voice-sample', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            name: sampleName,
            audioData: base64Audio,
            duration,
          }),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description: "Voice sample uploaded successfully",
          });
          resetRecording();
          setSampleName('');
          onSampleUploaded();
        } else {
          throw new Error('Upload failed');
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload voice sample",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Mic className="w-5 h-5 mr-2 text-purple-400" />
          Record Voice Sample
        </CardTitle>
        <CardDescription className="text-slate-300">
          Record a clear voice sample for cloning (recommended: 10-30 seconds)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!audioBlob ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <div className="text-2xl font-mono text-white mb-2">
                {formatTime(duration)}
              </div>
              {isRecording && (
                <div className="flex items-center justify-center space-x-2 text-red-400">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span>Recording...</span>
                </div>
              )}
            </div>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div>
                <div className="text-white font-medium">Recorded Sample</div>
                <div className="text-slate-300 text-sm">{formatTime(duration)}</div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={playAudio}
                  size="sm"
                  variant="outline"
                  className="border-slate-600"
                  disabled={isPlaying}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={resetRecording}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Enter sample name (e.g., 'Reading sample 1')"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                onClick={uploadSample}
                disabled={uploading || !sampleName.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Sample'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
