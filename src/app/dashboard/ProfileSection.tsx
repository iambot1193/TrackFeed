'use client'

import { useRef } from "react";
import { ShieldCheck, AlertCircle, LogOut, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileSection({
  user,
  profileName,
  setProfileName,
  profileAvatarUrl,
  setProfileAvatarUrl,
  profileCategories,
  setProfileCategories,
  handleSavePersonalData,
  handleSaveInterests,
  isSavingProfile,
  logout,
  setIsChangingPassword,
  setIsDeletingAccount,
  setIsChangingEmail,
  ALL_POSSIBLE_CATEGORIES,
  userIsVerifiedState,
  handleOpenVerifyModal
}: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem é muito grande! Selecione um arquivo de no máximo 2MB para garantir a velocidade do sistema.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setProfileAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-2xl relative overflow-hidden group">
        <div
          onClick={handleAvatarClick}
          className="h-24 w-24 rounded-[2rem] bg-zinc-900 flex items-center justify-center overflow-hidden border border-cyan-500/20 shadow-2xl cursor-pointer relative group/avatar transition-all duration-500 hover:border-cyan-500 hover:scale-105"
        >
          {profileAvatarUrl ? (
            <img src={profileAvatarUrl} alt="Foto de perfil" className="w-full h-full object-cover transition-opacity group-hover/avatar:opacity-40" onError={(e: any) => e.target.style.display = 'none'} />
          ) : (
            <span className="text-white text-2xl font-black group-hover/avatar:opacity-40">{user.name.substring(0, 2)}</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
            <Camera size={20} className="text-cyan-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-white tracking-tighter">{user.name}</h2>
          {userIsVerifiedState ? (
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              E-mail Verificado
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase tracking-widest mt-1.5 flex-wrap">
              <AlertCircle size={12} className="text-rose-400 animate-pulse" />
              E-mail não verificado
              <button
                onClick={handleOpenVerifyModal}
                className="ml-2 px-2.5 py-1 rounded-lg bg-cyan-500 text-black font-black uppercase text-[8px] tracking-wider flex items-center justify-center hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer border-none"
              >
                Verificar Agora
              </button>
            </div>
          )}
        </div>
        <div>
          <Button onClick={logout} className="bg-white/5 hover:bg-white/10 text-white h-12 w-12 rounded-xl transition-all border border-white/5 shadow-lg flex items-center justify-center"><LogOut size={20} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* CARD DADOS PESSOAIS */}
        <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-widest italic mb-2">Dados Pessoais</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/60 font-black text-[9px] uppercase tracking-wider">Seu Nome</Label>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-10 rounded-xl focus:border-cyan-500/50 text-sm"
                  placeholder="Seu nome"
                />
              </div>
              {(profileName !== user.name || profileAvatarUrl !== (user.avatarUrl || "")) && (
                <div className="p-3 text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl animate-pulse italic flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  💡 VOCÊ ALTEROU SEUS DADOS! CLIQUE EM &quot;SALVAR ALTERAÇÕES&quot; ABAIXO PARA APLICAR.
                </div>
              )}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setIsChangingEmail(true)}
                  className="w-full h-9 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-xl border border-white/5 transition-all text-[10px] tracking-wider"
                >
                  Alterar E-mail
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full h-9 bg-white/5 hover:bg-white/10 text-white font-black uppercase rounded-xl border border-white/5 transition-all text-[10px] tracking-wider"
                >
                  Alterar Senha
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={handleSavePersonalData} disabled={isSavingProfile} className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded-xl shadow-xl transition-all text-xs tracking-widest mt-4">Salvar Alterações</Button>
        </div>

        {/* CARD INTERESSES */}
        <div className="p-5 md:p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-widest italic mb-4">Interesses</h3>
            <div className="flex flex-wrap gap-2 items-start content-start">
              {ALL_POSSIBLE_CATEGORIES.map((cat: any) => (
                <button
                  key={cat.slug}
                  onClick={() => setProfileCategories((p: any) => p.includes(cat.slug) ? p.filter((c: any) => c !== cat.slug) : [...p, cat.slug])}
                  className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${profileCategories.includes(cat.slug) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-xl' : 'bg-white/5 border-white/5 text-zinc-600 hover:text-white'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSaveInterests} disabled={isSavingProfile} className="w-full h-10 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase rounded-xl shadow-xl shadow-purple-600/10 transition-all text-xs tracking-widest mt-4">Atualizar Interesses</Button>
        </div>
      </div>

      {/* CARD ZONA DE PERIGO (LARGURA TOTAL) */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-all space-y-6 flex flex-col">
        <h3 className="text-lg font-black text-red-500 uppercase tracking-widest italic flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500" />
          Deletar Conta
        </h3>
        <p className="text-[11px] text-white/40 font-bold leading-relaxed">ATENÇÃO TOTAL: Esta ação excluirá permanentemente o seu perfil, favoritos e histórico do TrackFeed de forma irreversível.</p>
        <div className="pt-2">
          <Button onClick={() => setIsDeletingAccount(true)} className="w-full h-12 bg-red-950/20 hover:bg-red-600 text-red-500 hover:text-white font-black uppercase rounded-2xl border border-red-500/20 transition-all shadow-xl shadow-red-950/30">Excluir Conta Permanentemente</Button>
        </div>
      </div>
    </section>
  );
}
