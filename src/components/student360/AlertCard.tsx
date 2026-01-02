// src/components/student360/AlertCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, FileText, MessageSquare } from "lucide-react";
import { useTranslation } from "@/i18n/provider";

export interface AlertData {
  id: string;
  type: 'risk' | 'academic' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  date: string;
  evidence?: { sourceId: string; snippet: string; trustScore: number }[];
}

interface AlertCardProps {
  alert: AlertData;
  onSnooze: (id: string) => void;
  onCreateCase: (id: string) => void;
  onOpenConsultation: (id: string) => void;
  onRequestMeeting?: (id: string) => void;
}

export function AlertCard({ alert, onSnooze, onCreateCase, onOpenConsultation }: AlertCardProps) {
  const { t } = useTranslation();
  const isCritical = alert.severity === 'critical';

  return (
    <Card 
        className={`mb-4 border-l-4 ${isCritical ? 'border-l-red-500 bg-red-50/10' : 'border-l-orange-400'}`}
        role="alert"
        aria-live="polite"
        aria-labelledby={`alert-title-${alert.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-500' : 'text-orange-500'}`} aria-hidden="true" />
            <CardTitle id={`alert-title-${alert.id}`} className="text-base font-semibold">{alert.title}</CardTitle>
          </div>
          <Badge variant={isCritical ? "destructive" : "outline"} aria-label={`Severity: ${alert.severity}`}>{alert.severity}</Badge>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" /> 
            <span className="sr-only">Date:</span> {new Date(alert.date).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent className="pb-3 text-sm">
        <p className="mb-2">{alert.description}</p>
        
        {alert.evidence && alert.evidence.length > 0 && (
            <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">{t('student360.evidence.title')}:</p>
                <ul className="text-xs list-disc pl-4 space-y-1 text-muted-foreground/90">
                    {alert.evidence.map((ev, idx) => (
                        <li key={idx}>
                            "{ev.snippet}" <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">{t('student360.evidence.trust')}: {ev.trustScore}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex gap-2 overflow-x-auto pb-3">
          <Button size="sm" variant={isCritical ? "default" : "outline"} onClick={() => onCreateCase(alert.id)} aria-label={`${t('student360.actions.case')} for ${alert.title}`}>
              <FileText className="mr-1 h-3 w-3" aria-hidden="true" /> {t('student360.actions.case')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenConsultation(alert.id)} aria-label={`${t('student360.actions.consult')} for ${alert.title}`}>
              <MessageSquare className="mr-1 h-3 w-3" aria-hidden="true" /> {t('student360.actions.consult')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSnooze(alert.id)} aria-label={`${t('student360.actions.snooze')} ${alert.title}`}>
              <Clock className="mr-1 h-3 w-3" aria-hidden="true" /> {t('student360.actions.snooze')}
          </Button>
      </CardFooter>
    </Card>
  );
}
