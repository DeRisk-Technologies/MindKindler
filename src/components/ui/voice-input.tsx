"use client";

import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    currentValue: string;
}

export function VoiceInput({ onTranscript, currentValue }: VoiceInputProps) {
    const { toast } = useToast();
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();
    
    // We need to manage appending logic carefully
    const [isActive, setIsActive] = useState(false);
    const initialValueRef = useRef(currentValue);

    useEffect(() => {
        if (listening) {
            setIsActive(true);
            // When listening starts, we don't change anything yet
        } else {
            if (isActive) {
                // When listening stops, we're done
                setIsActive(false);
            }
        }
    }, [listening]);

    useEffect(() => {
        if (isActive) {
            // Append transcript to the initial value captured when recording started
            // Note: This is a simple append strategy. 
            // Ideally, we'd insert at cursor position, but that's complex for Phase 2.
            const separator = initialValueRef.current && transcript ? " " : "";
            onTranscript(initialValueRef.current + separator + transcript);
        }
    }, [transcript, isActive]);

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission
        if (listening) {
            SpeechRecognition.stopListening();
            toast({ description: "Voice input stopped." });
        } else {
            initialValueRef.current = currentValue; // Capture current text before starting
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
            toast({ description: "Listening... Speak clearly." });
        }
    };

    if (!browserSupportsSpeechRecognition) {
        return null; // Graceful degradation
    }

    return (
        <Button 
            variant={listening ? "destructive" : "outline"} 
            size="icon" 
            className="h-8 w-8 ml-2 shrink-0 transition-all"
            onClick={toggleListening}
            title={listening ? "Stop Recording" : "Start Voice Dictation"}
        >
            {listening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
        </Button>
    );
}
