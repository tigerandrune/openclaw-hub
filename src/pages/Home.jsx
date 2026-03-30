import { useState, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useI18n } from '../context/I18nContext';
import { useApi } from '../hooks/useApi';
import { Zap, RotateCcw, FileText, Activity, Loader2, GripVertical, Lock, Unlock } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmDialog from '../components/ConfirmDialog';
import SystemHealthWidget from '../components/widgets/SystemHealthWidget';
import GatewayWidget from '../components/widgets/GatewayWidget';
import NotesWidget from '../components/widgets/NotesWidget';
import RecentActivityWidget from '../components/widgets/RecentActivityWidget';
import BookmarksWidget from '../components/widgets/BookmarksWidget';
import HeatmapWidget from '../components/widgets/HeatmapWidget';
import ChannelsWidget from '../components/widgets/ChannelsWidget';
import ModelWidget from '../components/widgets/ModelWidget';

const WIDGET_MAP = {
  health:    SystemHealthWidget,
  gateway:   GatewayWidget,
  notes:     NotesWidget,
  activity:  RecentActivityWidget,
  bookmarks: BookmarksWidget,
  heatmap:   HeatmapWidget,
  channels:  ChannelsWidget,
  model:     ModelWidget,
};

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 5)  return 'greeting.night';
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  if (h < 21) return 'greeting.evening';
  return 'greeting.night';
}

function SortableWidget({ id, children, editMode, t }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {editMode && (
        <div
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md cursor-grab active:cursor-grabbing transition-all hover:scale-110"
          style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
          title={t('home.dragToReorder')}
        >
          <GripVertical size={14} />
        </div>
      )}
      {children}
    </div>
  );
}

export default function Home() {
  const { config, saveConfig } = useConfig();
  const { t, lang } = useI18n();
  const [actionStates, setActionStates] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const { data: availableActions } = useApi('/api/actions');
  
  const widgetOrder = config?.widgetOrder ?? config?.homeWidgets ?? ['health', 'gateway', 'notes', 'activity'];
  const enabledWidgets = widgetOrder.filter(id => WIDGET_MAP[id]);

  const greeting = config?.name
    ? `${t(getGreetingKey())}, ${config.name}`
    : t(getGreetingKey());

  const subline = new Date().toLocaleDateString(lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = widgetOrder.indexOf(active.id);
      const newIndex = widgetOrder.indexOf(over.id);
      const newOrder = arrayMove(widgetOrder, oldIndex, newIndex);
      saveConfig({ widgetOrder: newOrder, homeWidgets: newOrder });
    }
  }, [widgetOrder, saveConfig]);

  const enabledQuickActions = config?.quickActions || [];
  const quickActions = availableActions?.actions?.filter(action => 
    enabledQuickActions.includes(action.id)
  ) || [];

  const handleQuickAction = async (actionId) => {
    setActionStates(prev => ({ ...prev, [actionId]: true }));
    
    try {
      const response = await fetch(`/api/actions/${actionId}/execute`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast(t('actions.success'), 'success');
      } else {
        showToast(`${t('actions.failed')}: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      showToast(`${t('actions.failed')}: ${err.message}`, 'error');
    } finally {
      setActionStates(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const showToast = (message, type) => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage(''), 3000);
  };

  const getActionIcon = (actionId) => {
    switch (actionId) {
      case 'restart-gateway': return RotateCcw;
      case 'check-logs': return FileText;
      case 'gateway-status': return Activity;
      default: return Zap;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-col gap-1 pt-2">
        {config?.dashboardTitle && (
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            {config.dashboardTitle}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: 'var(--text)' }}>
          {greeting} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {subline} · {t('home.subtitle')}
        </p>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {t('actions.title')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {quickActions.map(action => {
              const Icon = getActionIcon(action.id);
              const isLoading = actionStates[action.id];
              
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    if (action.destructive) {
                      setConfirmAction({ id: action.id, name: action.name || action.label });
                    } else {
                      handleQuickAction(action.id);
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-opacity-80 disabled:opacity-60"
                  style={{ 
                    background: 'var(--surface)', 
                    borderColor: 'var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('actions.executing')}
                    </>
                  ) : (
                    <>
                      <Icon size={16} />
                      {t(`actions.${action.id.replace('-', '')}`) || action.name}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget grid header */}
      {enabledWidgets.length > 0 && (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setEditMode(e => !e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: editMode ? 'var(--accent)' : 'var(--surface)',
              color: editMode ? '#000' : 'var(--text-muted)',
              border: `1px solid ${editMode ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {editMode ? <Unlock size={12} /> : <Lock size={12} />}
            {editMode ? t('home.editMode.done') : t('home.editMode.arrange')}
          </button>
        </div>
      )}

      {/* Widget grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={enabledWidgets} strategy={verticalListSortingStrategy}>
          <div className={`widget-grid ${editMode ? 'edit-mode' : ''}`}>
            {enabledWidgets.map(id => {
              const Widget = WIDGET_MAP[id];
              return (
                <SortableWidget key={id} id={id} editMode={editMode} t={t}>
                  <Widget />
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {enabledWidgets.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border"
          style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('home.noWidgets')}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            {t('home.noWidgets.hint')}
          </p>
        </div>
      )}

      {/* Confirm dialog for destructive actions */}
      {confirmAction && (
        <ConfirmDialog
          title={t('confirm.destructiveTitle')}
          message={t('confirm.destructiveMessage', { action: confirmAction.name })}
          confirmLabel={t('confirm.execute')}
          destructive
          onConfirm={() => {
            handleQuickAction(confirmAction.id);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50"
          style={{ 
            background: toastMessage.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff'
          }}
        >
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
