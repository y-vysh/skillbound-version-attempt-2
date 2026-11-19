import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Edit3,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { SKILL_CATEGORIES, type Skill } from '../types';

export function MySkillsPage() {
  const { showToast, refreshMe } = useAuth();

  const [teachSkills, setTeachSkills] = useState<Skill[]>([]);
  const [learnSkills, setLearnSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [direction, setDirection] = useState<'teach' | 'learn'>('teach');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(SKILL_CATEGORIES[0]);
  const [proficiency, setProficiency] = useState('Intermediate');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirm state
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ teachSkills: Skill[]; learnSkills: Skill[] }>('/skills/my');
      setTeachSkills(res.teachSkills);
      setLearnSkills(res.learnSkills);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load skills.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const openAddModal = (dir: 'teach' | 'learn') => {
    setEditingSkill(null);
    setDirection(dir);
    setName('');
    setCategory(SKILL_CATEGORIES[0]);
    setProficiency(dir === 'teach' ? 'Intermediate' : 'Beginner');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setDirection(skill.direction);
    setName(skill.name);
    setCategory(skill.category);
    setProficiency(skill.proficiency);
    setDescription(skill.description);
    setModalOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingSkill) {
        await apiRequest(`/skills/${editingSkill.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, category, direction, proficiency, description }),
        });
        showToast('Skill updated successfully.', 'success');
      } else {
        await apiRequest('/skills', {
          method: 'POST',
          body: JSON.stringify({ name, category, direction, proficiency, description }),
        });
        showToast(`Added "${name.trim()}" to your ${direction === 'teach' ? 'teaching' : 'learning'} list!`, 'success');
      }
      setModalOpen(false);
      await loadSkills();
      await refreshMe();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save skill.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSkill) return;
    setDeleting(true);
    try {
      await apiRequest(`/skills/${deletingSkill.id}`, { method: 'DELETE' });
      showToast(`Removed "${deletingSkill.name}".`, 'info');
      setDeletingSkill(null);
      await loadSkills();
      await refreshMe();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete skill.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const total = teachSkills.length + learnSkills.length;
  const teachRatioPct = total > 0 ? Math.round((teachSkills.length / total) * 100) : 50;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Reciprocal Ratio Bar */}
        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#0b1c30]">My Skill Exchange Profile</h1>
              <p className="text-sm text-[#464554] mt-1">
                Manage the skills you can teach peers and the skills you want to learn in return.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => openAddModal('teach')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Teach Skill</span>
              </button>
              <button
                type="button"
                onClick={() => openAddModal('learn')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#e0e0ff] text-[#4338ca] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Learning Goal</span>
              </button>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="inline-flex items-center gap-1.5 text-[#4338ca]">
                <ArrowLeftRight className="w-4 h-4" />
                Reciprocal Balance ({teachSkills.length} Teaching / {learnSkills.length} Learning)
              </span>
              <span className="text-[#0b1c30] tabular-nums">
                {teachSkills.length > 0 && learnSkills.length > 0
                  ? 'Matching Enabled'
                  : 'Add both sides to unlock mutual matches'}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#ffddb8] overflow-hidden">
              <div
                className="h-full bg-[#4338ca] transition-all"
                style={{ width: `${teachRatioPct}%` }}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
            <div className="h-72 bg-white rounded-2xl border border-[#e2e8f0]" />
            <div className="h-72 bg-white rounded-2xl border border-[#e2e8f0]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills I Teach */}
            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#eff4ff] text-[#4338ca] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#0b1c30]">
                      Skills I Can Teach ({teachSkills.length})
                    </h2>
                    <p className="text-xs text-[#64748b]">Shown to peers looking for mentors</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal('teach')}
                  className="text-xs font-semibold text-[#4338ca] hover:underline"
                >
                  + Add
                </button>
              </div>

              {teachSkills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#c3c4da] p-6 text-center">
                  <p className="text-sm font-semibold text-[#0b1c30]">No teaching skills yet</p>
                  <p className="text-xs text-[#64748b] mt-1 mb-3">
                    List a language, coding skill, instrument, or design tool you can share.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddModal('teach')}
                    className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-xs font-semibold"
                  >
                    Add First Skill
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {teachSkills.map((sk) => (
                    <div
                      key={sk.id}
                      className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-[#0b1c30]">{sk.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#4338ca] text-[11px] font-semibold">
                            {sk.proficiency}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#e2e8f0] text-[#464554] text-[11px] font-medium">
                            {sk.category}
                          </span>
                        </div>
                        {sk.description && (
                          <p className="text-xs text-[#464554] mt-1.5">{sk.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Edit ${sk.name}`}
                          onClick={() => openEditModal(sk)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#464554] hover:bg-white hover:text-[#4338ca]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${sk.name}`}
                          onClick={() => setDeletingSkill(sk)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#464554] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Skills I Want to Learn */}
            <section className="bg-white rounded-2xl border border-[#e2e8f0] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#ffddb8] text-[#633b00] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#0b1c30]">
                      Skills I Want to Learn ({learnSkills.length})
                    </h2>
                    <p className="text-xs text-[#64748b]">Used to match you with peer teachers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal('learn')}
                  className="text-xs font-semibold text-[#4338ca] hover:underline"
                >
                  + Add
                </button>
              </div>

              {learnSkills.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#c3c4da] p-6 text-center">
                  <p className="text-sm font-semibold text-[#0b1c30]">No learning goals yet</p>
                  <p className="text-xs text-[#64748b] mt-1 mb-3">
                    Add skills you want to acquire so our rule-based matcher finds mutual partners.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddModal('learn')}
                    className="px-4 py-2 rounded-xl bg-[#4338ca] text-white text-xs font-semibold"
                  >
                    Add Learning Goal
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {learnSkills.map((sk) => (
                    <div
                      key={sk.id}
                      className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-sm text-[#0b1c30]">{sk.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-[#ffddb8] text-[#633b00] text-[11px] font-semibold">
                            Goal: {sk.proficiency}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#e2e8f0] text-[#464554] text-[11px] font-medium">
                            {sk.category}
                          </span>
                        </div>
                        {sk.description && (
                          <p className="text-xs text-[#464554] mt-1.5">{sk.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Edit ${sk.name}`}
                          onClick={() => openEditModal(sk)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#464554] hover:bg-white hover:text-[#4338ca]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${sk.name}`}
                          onClick={() => setDeletingSkill(sk)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#464554] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Add / Edit Skill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0b1c30]">
                {editingSkill ? 'Edit Skill' : direction === 'teach' ? 'Add Skill I Can Teach' : 'Add Skill I Want to Learn'}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Skill Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('teach')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      direction === 'teach'
                        ? 'bg-[#4338ca] text-white border-[#4338ca]'
                        : 'bg-[#f8f9ff] text-[#464554] border-[#e2e8f0]'
                    }`}
                  >
                    I Can Teach
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('learn')}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      direction === 'learn'
                        ? 'bg-[#4338ca] text-white border-[#4338ca]'
                        : 'bg-[#f8f9ff] text-[#464554] border-[#e2e8f0]'
                    }`}
                  >
                    Want to Learn
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python, Photography, React, Spanish"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4338ca]"
                  >
                    {SKILL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    {direction === 'teach' ? 'Proficiency Level' : 'Preferred Level'}
                  </label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4338ca]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Short Description (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Topics you cover or learning goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4338ca]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-sm font-semibold text-[#464554]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingSkill ? 'Save Changes' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Skill Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingSkill)}
        title="Remove Skill?"
        description={`Are you sure you want to remove "${deletingSkill?.name}" from your profile?`}
        confirmLabel={deleting ? 'Removing...' : 'Remove Skill'}
        destructive
        onCancel={() => setDeletingSkill(null)}
        onConfirm={handleConfirmDelete}
      />
    </AppShell>
  );
}
