import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Gift, Clock, Inbox } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time?: string;
  timestamp?: string;
  type: 'alert' | 'appointment' | 'incentive' | 'system';
  read: boolean;
}

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
  onMarkRead
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stay informed about outbreak warnings, teleconsultations, and DBT incentive payouts.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-colors cursor-pointer"
          >
            Mark All Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">No notifications</h3>
            <p className="text-slate-500 text-sm">You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const displayTime = n.time || (n.timestamp ? new Date(n.timestamp).toLocaleString() : 'Just now');
            
            return (
              <div key={n.id} className={`p-4 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${n.read ? 'bg-white' : 'bg-teal-50/30'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'alert' ? 'bg-rose-100 text-rose-700' :
                  n.type === 'incentive' ? 'bg-purple-100 text-purple-700' :
                  'bg-teal-100 text-teal-700'
                }`}>
                  {n.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> :
                   n.type === 'incentive' ? <Gift className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{displayTime}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                </div>
                
                {!n.read && (
                  <button 
                    onClick={() => onMarkRead(n.id)}
                    className="self-end sm:self-auto shrink-0 mt-2 sm:mt-0 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
