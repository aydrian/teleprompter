import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Play, RotateCcw } from 'lucide-react';
import { useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { useTranscriber } from '@/hooks/useTranscriber';

interface TeleprompterProps {
  typingSpeed?: number;
}

export function Teleprompter({ 
  typingSpeed: _typingSpeed = 25
}: TeleprompterProps) {
  const [isEditMode, setIsEditMode] = useState(true);
  const [script, setScript] = useState(`Welcome to the LiveKit Teleprompter!

This is an example script to demonstrate the teleprompter functionality. You can edit this text by clicking the Edit button.

The teleprompter will automatically scroll and highlight sentences as you speak them. This helps maintain a natural reading pace while ensuring you stay on track with your presentation.

Try speaking along with the text and watch as it follows your voice. The system uses advanced speech recognition to synchronize your words with the script.

Remember to speak clearly and at a comfortable pace. The teleprompter will adapt to your speaking speed automatically.

This technology makes it easier to deliver professional presentations, record videos, or practice public speaking with confidence.`);
  
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roomState = useConnectionState();
  const isConnected = roomState === ConnectionState.Connected;
  const {  setTranscriptCallback } = useTranscriber();

  const scrollToSentence = useCallback((index: number) => {
    if (scrollRef.current && sentences.length > 0) {
      const currentElement = scrollRef.current.querySelector(`[data-sentence-index="${index}"]`);
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [sentences.length]);

  // Speech-to-script matching algorithm
  const findMatchingSentence = useCallback((sentences: string[], transcript: string, currentIndex: number): number => {
    const lowerTranscript = transcript.toLowerCase().trim();
    const transcriptWords = lowerTranscript.split(/\s+/).filter(word => word.length > 0);
    
    if (transcriptWords.length === 0) return -1;

    const calculateMatchScore = (sentence: string): number => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      const transcriptWordsSet = new Set(transcriptWords);
      
      let matches = 0;
      for (const word of sentenceWords) {
        if (transcriptWordsSet.has(word)) {
          matches++;
        }
      }
      
      return sentenceWords.length > 0 ? matches / sentenceWords.length : 0;
    };

    // Check current sentence first
    if (currentIndex < sentences.length) {
      const currentScore = calculateMatchScore(sentences[currentIndex]);
      if (currentScore >= 0.5) {
        return currentIndex;
      }
    }

    // Check next sentence
    if (currentIndex + 1 < sentences.length) {
      const nextScore = calculateMatchScore(sentences[currentIndex + 1]);
      if (nextScore >= 0.5) {
        return currentIndex + 1;
      }
    }

    // Search entire script for best match
    let bestMatch = -1;
    let bestScore = 0.5; // Minimum threshold
    
    for (let i = 0; i < sentences.length; i++) {
      const score = calculateMatchScore(sentences[i]);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = i;
      }
    }
    
    return bestMatch;
  }, []);

  // Split script into sentences when script changes
  useEffect(() => {
    if (script) {
      // Split by sentence endings, keeping the punctuation
      const sentenceList = script
        .split(/([.!?]+\s+)/)
        .filter(s => s.trim().length > 0)
        .reduce((acc: string[], curr, index, arr) => {
          if (index % 2 === 0) {
            const punctuation = arr[index + 1] || '';
            acc.push((curr + punctuation).trim());
          }
          return acc;
        }, []);
      
      setSentences(sentenceList.filter(s => s.length > 0));
    } else {
      setSentences([]);
    }
  }, [script]);

  // Load script from localStorage on mount
  useEffect(() => {
    const savedScript = localStorage.getItem('teleprompter-script');
    if (savedScript) {
      setScript(savedScript);
    }
  }, []);

  // Auto-scroll to current sentence
  useEffect(() => {
    if (scrollRef.current && !isEditMode && sentences.length > 0) {
      scrollToSentence(currentIndex);
    }
  }, [currentIndex, isEditMode, sentences, scrollToSentence]);

  // Process transcripts received via useTranscriber hook
  const handleTranscriptReceived = useCallback((transcript: string) => {
    if (sentences.length === 0) return;

    console.log('🗣️ Teleprompter: Processing transcript from useTranscriber:', {
      transcript,
      currentIndex,
      sentenceCount: sentences.length
    });

    const matchingSentenceIndex = findMatchingSentence(sentences, transcript, currentIndex);
    console.log('🎯 Teleprompter: Matching result:', {
      transcript,
      matchingSentenceIndex,
      currentSentence: currentIndex < sentences.length ? sentences[currentIndex] : 'none',
      matchingSentence: matchingSentenceIndex >= 0 ? sentences[matchingSentenceIndex] : 'none'
    });
    
    if (matchingSentenceIndex >= 0) {
      const nextSentenceIndex = matchingSentenceIndex + 1;
      console.log('⏭️ Teleprompter: Advancing from sentence', {
        from: currentIndex,
        to: nextSentenceIndex,
        willAdvance: nextSentenceIndex < sentences.length && nextSentenceIndex !== currentIndex
      });

      if (nextSentenceIndex < sentences.length && nextSentenceIndex !== currentIndex) {
        setCurrentIndex(nextSentenceIndex);
        scrollToSentence(nextSentenceIndex);
        console.log('✅ Teleprompter: Advanced to sentence', nextSentenceIndex);
      } else {
        console.log('⏸️ Teleprompter: No advancement needed', {
          reason: nextSentenceIndex >= sentences.length ? 'end of script' : 'already at position'
        });
      }
    } else {
      console.log('❌ Teleprompter: No matching sentence found for transcript');
    }
  }, [sentences, currentIndex, findMatchingSentence, scrollToSentence]);

  // Set up transcript callback when sentences are available
  useEffect(() => {
    if (sentences.length > 0) {
      console.log('🔗 Teleprompter: Setting transcript callback with', sentences.length, 'sentences');
      setTranscriptCallback(handleTranscriptReceived);
    }
  }, [sentences, setTranscriptCallback, handleTranscriptReceived]);

  const handleScriptChange = (newScript: string) => {
    setScript(newScript);
    localStorage.setItem('teleprompter-script', newScript);
  };

  const handleModeToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleReset = () => {
    setCurrentIndex(0);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {isEditMode ? 'Edit Script' : 'Teleprompter'}
          </h2>
          {!isEditMode && sentences.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {sentences.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditMode && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          )}
          
          <Button
            onClick={handleModeToggle}
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            className="gap-2"
            disabled={!isConnected && !isEditMode}
          >
            {isEditMode ? (
              <>
                <Play className="h-4 w-4" />
                Start Teleprompter
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Edit Script
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isEditMode ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full p-4"
            >
              <Textarea
                value={script}
                onChange={(e) => handleScriptChange(e.target.value)}
                placeholder="Enter your script here..."
                className="h-full resize-none text-base leading-relaxed"
              />
            </motion.div>
          ) : (
            <motion.div
              key="teleprompter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto"
              ref={scrollRef}
            >
              <div className="p-8 max-w-4xl mx-auto">
                {sentences.length > 0 ? (
                  <div className="space-y-6">
                    {sentences.map((sentence, index) => (
                      <motion.div
                        key={index}
                        data-sentence-index={index}
                        initial={{ opacity: 0.5 }}
                        animate={{
                          opacity: index === currentIndex ? 1 : 0.4,
                          scale: index === currentIndex ? 1.02 : 1,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        className={`
                          text-2xl leading-relaxed cursor-pointer p-4 rounded-lg
                          transition-all duration-300
                          ${index === currentIndex 
                            ? 'bg-primary/10 text-foreground shadow-sm border border-primary/20' 
                            : 'text-muted-foreground hover:bg-muted/50'
                          }
                        `}
                        onClick={() => setCurrentIndex(index)}
                      >
                        {sentence}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg mb-2">No script available</p>
                      <p className="text-sm">Switch to Edit mode to add your script</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}