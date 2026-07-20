import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function DailySurveyCard({ survey, user }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();

  const { data: responses = [] } = useQuery({
    queryKey: ['survey-responses', survey?.id],
    queryFn: () => base44.entities.SurveyResponse.filter({ survey_id: survey.id }),
    enabled: !!survey?.id
  });

  const { data: userResponse } = useQuery({
    queryKey: ['user-survey-response', survey?.id, user?.email],
    queryFn: async () => {
      const resp = await base44.entities.SurveyResponse.filter({ 
        survey_id: survey.id,
        user_email: user.email 
      });
      return resp[0];
    },
    enabled: !!survey?.id && !!user?.email
  });

  const submitResponse = useMutation({
    mutationFn: async (optionIndex) => {
      await base44.entities.SurveyResponse.create({
        user_email: user.email,
        survey_id: survey.id,
        selected_option: optionIndex
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['survey-responses']);
      queryClient.invalidateQueries(['user-survey-response']);
      setShowResults(true);
      toast.success('Vote enregistré ! 📊');
    }
  });

  if (!survey) return null;

  const hasVoted = !!userResponse;
  
  const calculateResults = () => {
    const total = responses.length;
    if (total === 0) return survey.options.map(() => 0);
    
    return survey.options.map((_, index) => {
      const count = responses.filter(r => r.selected_option === index).length;
      return Math.round((count / total) * 100);
    });
  };

  const results = calculateResults();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl p-3">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <Badge className="bg-teal-100 text-teal-700 mb-1">
              📊 Sondage du jour
            </Badge>
            <h3 className="text-xl font-bold text-slate-800">{survey.question}</h3>
          </div>
        </div>
        {hasVoted && (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Voté
          </Badge>
        )}
      </div>

      {/* Options or Results */}
      <div className="space-y-3 mb-4">
        <AnimatePresence mode="wait">
          {(!hasVoted && !showResults) ? (
            // Voting mode
            <motion.div
              key="voting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {survey.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedOption === index
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === index
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-slate-300'
                    }`}>
                      {selectedOption === index && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      selectedOption === index ? 'text-teal-800' : 'text-slate-700'
                    }`}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            // Results mode
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {survey.options.map((option, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      {option}
                      {userResponse?.selected_option === index && (
                        <Badge variant="outline" className="text-xs">Votre choix</Badge>
                      )}
                    </span>
                    <span className="font-bold text-teal-600">{results[index]}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${results[index]}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-600"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <Users className="w-3 h-3" />
                <span>{responses.length} participant{responses.length > 1 ? 's' : ''}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      {!hasVoted && !showResults && (
        <Button
          onClick={() => submitResponse.mutate(selectedOption)}
          disabled={selectedOption === null || submitResponse.isPending}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
        >
          {submitResponse.isPending ? 'Enregistrement...' : 'Voter'}
        </Button>
      )}

      {(hasVoted || showResults) && (
        <>
          {/* Educational context */}
          {survey.educational_context && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm mb-1">Contexte pédagogique</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    {survey.educational_context}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Link to challenges */}
          {survey.link_to_challenges && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-amber-800 text-sm">
                💡 <span className="font-medium">Lien avec les jeux : </span>
                {survey.link_to_challenges}
              </p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}