import store, { getEffectiveRole, persistDrafts, persistServices } from './store';
import type { Draft } from '../types';

export function mockGetVisibleDrafts(userId: string): Draft[] {
  return store.drafts.filter(d => {
    if (d.authorId === userId) return true;
    const role = getEffectiveRole(userId, d.entityType, d.entityId);
    return role !== null;
  });
}

export function mockApproveDraft(userId: string, draftId: string): { ok: boolean; error?: string } {
  const draft = store.drafts.find(d => d.id === draftId);
  if (!draft) return { ok: false, error: 'Черновик не найден' };
  if (draft.status !== 'created') return { ok: false, error: 'Черновик уже не активен' };

  if (!draft.approverIds.includes(userId)) return { ok: false, error: 'Вы не являетесь подтверждающим для этого черновика' };

  if (draft.authorId === userId) {
    const created = new Date(draft.createdAt).getTime();
    const now = Date.now();
    const diffMin = (now - created) / 1000 / 60;
    if (diffMin < 15) {
      const remaining = Math.ceil(15 - diffMin);
      return { ok: false, error: `Вы создали этот черновик сами. Подтверждение доступно через ${remaining} мин.` };
    }
  }

  draft.status = 'approved';

  if (draft.entityType === 'service') {
    const svc = store.services.find(s => s.id === draft.entityId);
    if (svc) svc.config = { ...draft.configAfter };
  }

  persistDrafts();
  persistServices();
  return { ok: true };
}

export function mockCancelDraft(userId: string, draftId: string): { ok: boolean; error?: string } {
  const draft = store.drafts.find(d => d.id === draftId);
  if (!draft) return { ok: false, error: 'Черновик не найден' };
  if (draft.status !== 'created') return { ok: false, error: 'Черновик уже не активен' };

  if (!draft.approverIds.includes(userId)) return { ok: false, error: 'Вы не являетесь подтверждающим для этого черновика' };

  draft.status = 'cancelled';
  persistDrafts();
  return { ok: true };
}
