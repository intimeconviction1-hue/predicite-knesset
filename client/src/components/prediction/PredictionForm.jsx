import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Percent, Users, CheckCircle, PenLine, Medal, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';

const FALLBACK_DEADLINE_UTC = "2026-03-15T07:00:00Z";

function formatLocalDeadline(utcString) {
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
  return `${date} — ${time}`;
}

export default function PredictionForm({ city, user, onSubmit, existingPredictions = [], onUpdate }) {
  const [step, setStep] = useState(1);
  const [winner, setWinner] = useState('');
  const [percentage, setPercentage] = useState([50]);
  const [turnout, setTurnout] = useState([55]);
  const [justification, setJustification] = useState('');
  const [showJustification, setShowJustification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [rank, setRank] = useState(null);
  const [deadlineUtc, setDeadlineUtc] = useState(FALLBACK_DEADLINE_UTC);
  const [deadlineClosed, setDeadlineClosed] = useState(false);
  const [editMode, setEditMode] = useState(null); // 'winner' | 'percentage' | 'turnout'

  useEffect(() => {
    base44.entities.CampaignSettings.filter({ key: 'global' })
      .then(res => {
        const d = res?.[0]?.predictions_deadline_utc;
        const parsed = d && !Number.isNaN(new Date(d).getTime()) ? d : FALLBACK_DEADLINE_UTC;
        setDeadlineUtc(parsed);
        setDeadlineClosed(new Date() >= new Date(parsed));
      })
      .catch(() => {
        setDeadlineClosed(new Date() >= new Date(FALLBACK_DEADLINE_UTC));
      });
  }, []);

  const hasWinnerPrediction = existingPredictions.some(p => p.prediction_type === 'winner');
  const hasPercentagePrediction = existingPredictions.some(p => p.prediction_type === 'percentage');
  const hasTurnoutPrediction = existingPredictions.some(p => p.prediction_type === 'turnout');

  const winnerPred = existingPredictions.find(p => p.prediction_type === 'winner');
  const percentagePred = existingPredictions.find(p => p.prediction_type === 'percentage');
  const turnoutPred = existingPredictions.find(p => p.prediction_type === 'turnout');

  const handleEdit = (type) => {
    if (deadlineClosed) return;
    if (type === 'winner' && winnerPred) { setWinner(winnerPred.predicted_winner || ''); }
    if (type === 'percentage' && percentagePred) { setPercentage([percentagePred.predicted_percentage || 50]); }
    if (type === 'turnout' && turnoutPred) { setTurnout([turnoutPred.predicted_turnout || 55]); }
    setEditMode(type);
  };

  const handleUpdate = async (type) => {
    if (!user || !onUpdate) return;
    setIsSubmitting(true);
    try {
      const pred = existingPredictions.find(p => p.prediction_type === type);
      if (!pred) return;
      const updates = {};
      if (type === 'winner') updates.predicted_winner = winner;
      if (type === 'percentage') updates.predicted_percentage = Math.max(0, Math.min(100, percentage[0]));
      if (type === 'turnout') updates.predicted_turnout = Math.max(0, Math.min(100, turnout[0]));
      await base44.entities.Prediction.update(pred.id, updates);
      if (onUpdate) await onUpdate();
      setEditMode(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (withJustification = false) => {
    // Si pas connecté : afficher modale d'invitation puis simuler la confirmation
    if (!user || !onSubmit) {
      setShowLoginPrompt(true);
      setConfirmed(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const predictions = [];
      if (winner && !hasWinnerPrediction) {
        predictions.push({
          city_id: city.id,
          prediction_type: 'winner',
          predicted_winner: winner,
          justification: withJustification ? justification : ''
        });
      }
      if (!hasPercentagePrediction) {
        predictions.push({ city_id: city.id, prediction_type: 'percentage', predicted_percentage: Math.max(0, Math.min(100, percentage[0])) });
      }
      if (!hasTurnoutPrediction) {
        predictions.push({ city_id: city.id, prediction_type: 'turnout', predicted_turnout: Math.max(0, Math.min(100, turnout[0])) });
      }
      
      if (predictions.length > 0) {
        try {
          await onSubmit(predictions);
        } catch (err) {
          const is403 = err?.response?.status === 403 || err?.status === 403;
          if (is403) setDeadlineClosed(true);
          throw err;
        }
        try {
          const allPreds = await base44.entities.Prediction.filter({ city_id: city.id, prediction_type: 'winner' });
          const uniqueUsers = new Set(allPreds.map(p => p.user_email));
          setRank(uniqueUsers.size || 1);
        } catch { setRank(1); }
        setConfirmed(true);
      }
    } catch (error) {
      console.error('Prediction submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation screen
  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center"
      >
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          {showLoginPrompt ? 'Prédiction enregistrée !' : 'Position enregistrée !'}
        </h3>

        {/* Modale invitation pour les non-connectés */}
        {showLoginPrompt && (
          <div className="mb-5 bg-[#034EA2]/5 border border-[#034EA2]/15 rounded-2xl p-5 text-left">
            <p className="text-sm font-semibold text-slate-800 mb-1">Sauvegarde ta prédiction 🏆</p>
            <p className="text-xs text-slate-500 mb-4">
              Crée un compte gratuit pour enregistrer ton pronostic, suivre ton score le soir du 15 mars et concourir au classement.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full bg-[#034EA2] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#023b7a] transition-colors"
              >
                Créer mon compte gratuit →
              </button>
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full text-slate-500 text-xs py-2 hover:text-slate-700 transition-colors"
              >
                J'ai déjà un compte — Se connecter
              </button>
            </div>
          </div>
        )}

        {!showLoginPrompt && (
          <>
            <div className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 font-semibold px-3 py-1.5 rounded-full text-sm mb-4">
              <Trophy className="w-4 h-4" />+50 pts
            </div>
            <p className="text-slate-500 text-sm mb-4">
              Votre pronostic pour <strong>{city.name}</strong> a bien été enregistré.
            </p>
          </>
        )}

        {!showLoginPrompt && (
          <>
            {rank && (
              <div className="bg-[#034EA2]/5 border border-[#034EA2]/15 rounded-xl px-4 py-3 mb-5 flex items-center justify-center gap-2">
                <Medal className="w-4 h-4 text-[#034EA2]" />
                <span className="text-sm font-semibold text-[#034EA2]">
                  {rank === 1 ? `Vous êtes actuellement #1 sur ${city.name}` : `Votre rang provisoire : #${rank} sur ${city.name}`}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2 mb-4">
              <Link to={createPageUrl(`Leaderboard`)}>
                <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#034EA2] px-4 py-2.5 rounded-lg hover:bg-[#023b7a] transition-colors">
                  <Trophy className="w-4 h-4" />
                  Voir le classement
                </button>
              </Link>
            </div>
            {!showJustification ? (
              <button
                onClick={() => setShowJustification(true)}
                className="flex items-center gap-2 mx-auto text-sm text-slate-500 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Ajouter une analyse (facultatif)
              </button>
            ) : (
              <div className="text-left space-y-3">
                <label className="text-sm font-medium text-slate-700">Votre analyse</label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Pourquoi ce candidat selon vous ? (optionnel)"
                  className="resize-none"
                  rows={3}
                />
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="w-full bg-[#034EA2] hover:bg-[#023b7a]"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer mon analyse'}
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-[#034EA2] to-[#7C3AED] p-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-white" />
          <h3 className="text-white font-bold">Mes prédictions · {city.name}</h3>
        </div>
        <p className="text-white/70 text-sm mt-0.5">
          {deadlineClosed ? 'Prédictions clôturées' : 'Sélectionnez un candidat et validez en un clic'}
        </p>
      </div>

      {/* Deadline banner */}
      <div className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b ${
        deadlineClosed
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-amber-50 border-amber-100 text-amber-700'
      }`}>
        {deadlineClosed ? <Lock className="w-4 h-4 flex-shrink-0" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
        {deadlineClosed
          ? <span className="font-medium">Prédictions clôturées — résultats bientôt !</span>
          : <span>Clôture : <strong>{formatLocalDeadline(deadlineUtc)}</strong></span>
        }
      </div>

      <div className="p-6">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step === s ? 'bg-[#034EA2] text-white'
                : (s === 1 && hasWinnerPrediction) || (s === 2 && hasPercentagePrediction) || (s === 3 && hasTurnoutPrediction)
                ? 'bg-green-100 text-green-600'
                : 'bg-slate-100 text-slate-500'
              }`}
            >
              {(s === 1 && hasWinnerPrediction) || (s === 2 && hasPercentagePrediction) || (s === 3 && hasTurnoutPrediction)
                ? <CheckCircle className="w-4 h-4" /> : s}
            </button>
          ))}
        </div>

        {/* Step 1: Winner */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h4 className="font-semibold text-slate-800">Qui va gagner ?</h4>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">+50 pts</span>
            </div>

            {hasWinnerPrediction && editMode !== 'winner' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-medium text-sm">Pronostic : <strong>{winnerPred?.predicted_winner}</strong></p>
                    <p className="text-green-600 text-xs mt-0.5">Enregistré</p>
                  </div>
                </div>
                {!deadlineClosed && (
                  <button
                    onClick={() => handleEdit('winner')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#034EA2] border border-[#034EA2]/30 px-3 py-1.5 rounded-lg hover:bg-[#034EA2]/5 transition-colors min-h-[36px]"
                    aria-label="Modifier mon pronostic vainqueur"
                  >
                    <PenLine className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
              </div>
            ) : hasWinnerPrediction && editMode === 'winner' ? (
              <div className="space-y-3">
                <RadioGroup value={winner} onValueChange={setWinner} className="space-y-2">
                  {city.candidates.map((candidate, idx) => (
                    <div key={candidate?.name || idx} className="flex items-center space-x-3">
                      <RadioGroupItem value={candidate?.name || ''} id={`edit-${candidate?.name || idx}`} />
                      <Label htmlFor={`edit-${candidate?.name || idx}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: candidate?.color || '#6366f1' }}>
                            {candidate?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{candidate?.name}</p>
                            <p className="text-xs text-slate-500">{candidate?.party}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditMode(null)} className="flex-1">Annuler</Button>
                  <Button size="sm" disabled={isSubmitting || !winner} onClick={() => handleUpdate('winner')} className="flex-1 bg-[#034EA2]">
                    {isSubmitting ? '...' : '✓ Mettre à jour'}
                  </Button>
                </div>
              </div>
            ) : city?.candidates && city.candidates.length > 0 ? (
              <RadioGroup value={winner} onValueChange={setWinner} className="space-y-2">
                {city.candidates.map((candidate, idx) => (
                  <div key={candidate?.name || idx} className="flex items-center space-x-3">
                    <RadioGroupItem value={candidate?.name || ''} id={candidate?.name || `candidate-${idx}`} />
                    <Label htmlFor={candidate?.name || `candidate-${idx}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: candidate?.color || '#6366f1' }}
                        >
                          {candidate?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{candidate?.name || 'Candidat'}</p>
                          <p className="text-xs text-slate-500">{candidate?.party || 'Parti'}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <p className="text-slate-500 text-center py-4">Candidats à venir...</p>
            )}

            {/* Justification — available before submit */}
            {winner && !hasWinnerPrediction && (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowJustification(!showJustification)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  {showJustification ? 'Masquer l\'analyse' : 'Ajouter une analyse (facultatif)'}
                </button>
                {showJustification && (
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Pourquoi ce candidat selon vous ? Contexte local, sondages, tendances…"
                    className="resize-none text-sm"
                    rows={3}
                  />
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleSubmit(showJustification && justification.length > 0)}
                disabled={isSubmitting || !winner || hasWinnerPrediction || deadlineClosed}
                className="flex-1 bg-[#034EA2] hover:bg-[#023b7a]"
              >
                {isSubmitting ? 'Enregistrement...' : '✓ Valider ma prédiction'}
              </Button>
              <Button variant="outline" onClick={() => setStep(2)} className="flex-shrink-0">
                Suite →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Percentage */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-slate-800">Avec quel pourcentage ?</h4>
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">+30 pts</span>
            </div>
            {hasPercentagePrediction && editMode !== 'percentage' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-medium text-sm">Score prédit : <strong>{percentagePred?.predicted_percentage}%</strong></p>
                    <p className="text-green-600 text-xs mt-0.5">Enregistré</p>
                  </div>
                </div>
                {!deadlineClosed && (
                  <button onClick={() => handleEdit('percentage')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#034EA2] border border-[#034EA2]/30 px-3 py-1.5 rounded-lg hover:bg-[#034EA2]/5 transition-colors min-h-[36px]"
                    aria-label="Modifier mon pronostic de score">
                    <PenLine className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
              </div>
            ) : hasPercentagePrediction && editMode === 'percentage' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-5xl font-bold text-indigo-600">{percentage[0]}%</span>
                </div>
                <Slider value={percentage} onValueChange={setPercentage} min={30} max={80} step={1} />
                <div className="flex justify-between text-xs text-slate-500"><span>30%</span><span>80%</span></div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditMode(null)} className="flex-1">Annuler</Button>
                  <Button size="sm" disabled={isSubmitting} onClick={() => handleUpdate('percentage')} className="flex-1 bg-[#034EA2]">
                    {isSubmitting ? '...' : '✓ Mettre à jour'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-5xl font-bold text-indigo-600">{percentage[0]}%</span>
                  <p className="text-slate-500 text-sm mt-2">Pourcentage prédit pour le vainqueur</p>
                </div>
                <Slider value={percentage} onValueChange={setPercentage} min={30} max={80} step={1} />
                <div className="flex justify-between text-xs text-slate-500"><span>30%</span><span>Élection serrée</span><span>80%</span></div>
              </>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-[#034EA2] hover:bg-[#023b7a]">Continuer</Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Turnout */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h4 className="font-semibold text-slate-800">Taux de participation ?</h4>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">+20 pts</span>
            </div>
            {hasTurnoutPrediction && editMode !== 'turnout' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 font-medium text-sm">Participation prédite : <strong>{turnoutPred?.predicted_turnout}%</strong></p>
                    <p className="text-green-600 text-xs mt-0.5">Enregistré</p>
                  </div>
                </div>
                {!deadlineClosed && (
                  <button onClick={() => handleEdit('turnout')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#034EA2] border border-[#034EA2]/30 px-3 py-1.5 rounded-lg hover:bg-[#034EA2]/5 transition-colors min-h-[36px]"
                    aria-label="Modifier mon pronostic de participation">
                    <PenLine className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
              </div>
            ) : hasTurnoutPrediction && editMode === 'turnout' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-5xl font-bold text-emerald-600">{turnout[0]}%</span>
                </div>
                <Slider value={turnout} onValueChange={setTurnout} min={30} max={80} step={1} />
                <div className="flex justify-between text-xs text-slate-500"><span>30%</span><span>Moyenne: ~50%</span><span>80%</span></div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditMode(null)} className="flex-1">Annuler</Button>
                  <Button size="sm" disabled={isSubmitting} onClick={() => handleUpdate('turnout')} className="flex-1 bg-[#034EA2]">
                    {isSubmitting ? '...' : '✓ Mettre à jour'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-5xl font-bold text-emerald-600">{turnout[0]}%</span>
                  <p className="text-slate-500 text-sm mt-2">Taux de participation prédit</p>
                </div>
                <Slider value={turnout} onValueChange={setTurnout} min={30} max={80} step={1} />
                <div className="flex justify-between text-xs text-slate-500"><span>30%</span><span>Moyenne: ~50%</span><span>80%</span></div>
              </>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Retour</Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || deadlineClosed || (hasWinnerPrediction && hasPercentagePrediction && hasTurnoutPrediction)}
                className="flex-1 bg-gradient-to-r from-[#034EA2] to-[#7C3AED] hover:opacity-90"
              >
                {isSubmitting ? 'Envoi...' : 'Valider tout 🎯'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}