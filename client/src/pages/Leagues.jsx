import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Users, Plus, Copy, Lock, Globe, Trophy, 
  UserPlus, LogOut, Crown, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import LoginPromptModal from '@/components/shared/LoginPromptModal.jsx';

export default function Leagues() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeaguePrivate, setNewLeaguePrivate] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => base44.entities.League.list()
  });

  const { data: allProgress = [] } = useQuery({
    queryKey: ['all-user-progress'],
    queryFn: () => base44.entities.UserProgress.list('-total_points', 200)
  });

  const myLeagues = user ? leagues.filter(l => 
    l.owner_email === user?.email || l.members?.includes(user?.email)
  ) : [];

  const publicLeagues = leagues.filter(l => 
    !l.is_private && !myLeagues.find(ml => ml.id === l.id)
  );

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createLeague = useMutation({
    mutationFn: async () => {
      if (!newLeagueName.trim()) throw new Error('Nom requis');
      
      const code = generateCode();
      await base44.entities.League.create({
        name: newLeagueName,
        code,
        owner_email: user.email,
        members: [user.email],
        is_private: newLeaguePrivate,
        max_members: 50
      });
      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      setShowCreateDialog(false);
      setNewLeagueName('');
      toast.success(`Ligue créée ! Code: ${code}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création');
    }
  });

  const joinLeague = useMutation({
    mutationFn: async () => {
      if (!joinCode.trim()) throw new Error('Code requis');
      
      const league = leagues.find(l => l.code?.toUpperCase() === joinCode.toUpperCase());
      if (!league) throw new Error('Code d\'invitation invalide');
      if (league.members?.includes(user.email)) throw new Error('Vous êtes déjà membre de cette ligue');
      if (league.max_members && league.members?.length >= league.max_members) {
        throw new Error('La ligue est pleine');
      }
      
      await base44.entities.League.update(league.id, {
        members: [...(league.members || []), user.email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      setShowJoinDialog(false);
      setJoinCode('');
      toast.success('Vous avez rejoint la ligue !');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la connexion');
    }
  });

  const leaveLeague = useMutation({
    mutationFn: async (leagueId) => {
      const league = leagues.find(l => l.id === leagueId);
      if (!league) throw new Error('Ligue non trouvée');
      
      if (league.owner_email === user.email) {
        await base44.entities.League.delete(leagueId);
      } else {
        const updatedMembers = (league.members || []).filter(m => m !== user.email);
        await base44.entities.League.update(leagueId, {
          members: updatedMembers
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leagues'] });
      toast.success('Vous avez quitté la ligue');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié !');
  };

  const [showLoginModal, setShowLoginModal] = useState(false);

  // If not logged in, show read-only view of public leagues with login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#07122A] to-[#0d1f3c]">
        <LoginPromptModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          message="Créez un compte pour créer ou rejoindre des ligues et défier vos amis."
        />
        <div className="bg-[#034EA2] text-white">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-white/70" />
              <h1 className="text-2xl font-bold">Cercles citoyens</h1>
            </div>
            <p className="text-white/65 text-sm max-w-lg">Analysez ensemble les élections. Comparez vos pronostics, débattez des enjeux locaux.</p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/5 border border-white/15 rounded-2xl p-8 text-center mb-6">
            <Lock className="w-10 h-10 text-[#4A7FD4] mx-auto mb-3" />
            <h2 className="text-white font-bold text-lg mb-2">Rejoignez une ligue</h2>
            <p className="text-white/50 text-sm mb-5">Créez un compte pour créer ou rejoindre des cercles citoyens et défier vos amis.</p>
            <Button onClick={() => setShowLoginModal(true)} className="bg-[#034EA2] hover:bg-[#023882] text-white">
              <UserPlus className="w-4 h-4 mr-2" /> Créer un compte gratuit
            </Button>
          </div>
          {leagues.filter(l => !l.is_private).length > 0 && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">Cercles ouverts</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {leagues.filter(l => !l.is_private).map(league => (
                  <div key={league.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-white font-bold">{league.name}</h3>
                    </div>
                    <p className="text-white/40 text-sm">{league.members?.length || 0} membre{(league.members?.length || 0) > 1 ? 's' : ''}</p>
                    <Button size="sm" className="mt-3 bg-[#034EA2]/60 hover:bg-[#034EA2] text-white text-xs" onClick={() => setShowLoginModal(true)}>
                      Rejoindre
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-white/70" />
              <h1 className="text-2xl font-bold">Cercles citoyens</h1>
            </div>
            <p className="text-white/65 text-sm max-w-lg">
              Analysez ensemble les élections. Comparez vos pronostics, débattez des enjeux locaux et progressez collectivement.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Actions */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="flex gap-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-white text-[#034EA2] hover:bg-slate-50 shadow-lg border border-slate-200">
                <Plus className="w-4 h-4 mr-2" />
                Créer une ligue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une ligue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Nom de la ligue</Label>
                  <Input
                    id="name"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="Ex: Les Pronostiqueurs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {newLeaguePrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    <Label htmlFor="private">Ligue privée</Label>
                  </div>
                  <Switch
                    id="private"
                    checked={newLeaguePrivate}
                    onCheckedChange={setNewLeaguePrivate}
                  />
                </div>
                <Button
                  onClick={() => createLeague.mutate()}
                  disabled={!newLeagueName || createLeague.isPending}
                  className="w-full bg-[#034EA2] hover:bg-[#023b7a]"
                  >
                  Créer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 bg-white shadow-lg">
                <UserPlus className="w-4 h-4 mr-2" />
                Rejoindre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejoindre une ligue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="code">Code d'invitation</Label>
                  <Input
                    id="code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="uppercase"
                  />
                </div>
                <Button
                  onClick={() => joinLeague.mutate()}
                  disabled={!joinCode || joinLeague.isPending}
                  className="w-full bg-[#034EA2] hover:bg-[#023b7a]"
                  >
                  Rejoindre
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* My leagues */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Mes cercles</h2>
        
        {myLeagues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">Pas encore de cercle citoyen</p>
            <p className="text-sm text-slate-400 mt-1">Créez-en un ou rejoignez un cercle existant pour analyser les élections ensemble.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myLeagues.map((league, index) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">{league.name}</h3>
                        {league.is_private ? (
                          <Lock className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-emerald-500" />
                        )}
                        {league.owner_email === user.email && (
                          <Badge className="bg-amber-100 text-amber-700">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {league.members?.length || 0} membre{(league.members?.length || 0) > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(league.code)}
                        className="text-slate-500"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        {league.code}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => leaveLeague.mutate(league.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* League leaderboard — ranked by points */}
                <div className="bg-slate-50 p-4 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>Classement de la ligue</span>
                  </div>
                  <div className="space-y-2">
                    {(league.members || [])
                      .map(email => {
                        const p = allProgress.find(up => up.user_email === email);
                        return { email, points: p?.total_points || 0 };
                      })
                      .sort((a, b) => b.points - a.points)
                      .slice(0, 5)
                      .map(({ email, points }, i) => (
                        <div key={email} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0 ? 'bg-yellow-100 text-yellow-600' :
                              i === 1 ? 'bg-slate-100 text-slate-600' :
                              i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {i + 1}
                            </span>
                            <span className={`text-slate-700 ${email === user.email ? 'font-semibold' : ''}`}>
                              {email.split('@')[0]}
                              {email === user.email && ' (vous)'}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#034EA2]">{points.toLocaleString('fr-FR')} pts</span>
                        </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Public leagues */}
      {publicLeagues.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Cercles ouverts</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {publicLeagues.map((league, index) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-slate-800">{league.name}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {league.members?.length || 0} membre{(league.members?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setJoinCode(league.code);
                      joinLeague.mutate();
                    }}
                    className="bg-[#034EA2] hover:bg-[#023b7a]"
                  >
                    Rejoindre
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}