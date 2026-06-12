// src/components/WidgetNavigation.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { getFilteredWidgets } from '../config/widgetConfig';

// Enhanced Widget Component
const Widget = ({ widget, items, index, onExpand }) => {
  const Icon = widget.icon;
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const primaryItem = items[0];

  const handleClick = (e) => {
    e.preventDefault();
    if (!primaryItem) return;
    if (items.length > 1) {
      onExpand(widget, items);
    } else {
      navigate(primaryItem.path);
    }
  };

  const badgeLabel = items.length > 1 ? `${items.length} sections` : 'Open';

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.18 : 0.24,
        delay: index * 0.03
      }}
      whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.02 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      className="group relative h-full"
    >
      <button
        onClick={handleClick}
        className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-5 bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-xl sm:rounded-2xl hover:bg-white/[0.14] hover:border-white/30 transition-all duration-300 text-center touch-manipulation relative overflow-hidden group-hover:shadow-2xl group-hover:shadow-blue-500/20 cursor-pointer"
        style={{
          minHeight: '168px',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-[0.12] rounded-xl sm:rounded-2xl transition-opacity duration-300`} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10 w-full">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${widget.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 group-hover:text-emerald-200 transition-colors leading-snug px-1">
            {widget.title}
          </h3>

          <p className="text-xs sm:text-sm text-blue-100/75 line-clamp-2 leading-relaxed px-1 mb-3">
            {primaryItem.description}
          </p>
        </div>

        <div
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold text-white bg-gradient-to-r ${widget.color} relative z-10 shadow-md ring-1 ring-white/20`}
        >
          {badgeLabel}
          <span className="ml-1 opacity-80">→</span>
        </div>
      </button>
    </motion.div>
  );
};

// Widget Expansion Modal Component
const WidgetExpansionModal = ({ widget, items, isOpen, onClose }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  if (!isOpen || !widget || !items || items.length === 0) {
    return null;
  }

  const Icon = widget.icon;

  const handleItemClick = (item) => {
    navigate(item.path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden pointer-events-auto border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-r ${widget.color} p-6 sm:p-8 border-b border-white/20`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
                    >
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        {widget.title}
                      </h2>
                      <p className="text-white/80 text-sm sm:text-base">
                        {items.length} {items.length === 1 ? 'section' : 'sections'} available
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <motion.button
                        key={item.path}
                        onClick={() => handleItemClick(item)}
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0.14 : 0.2, delay: index * 0.05 }}
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.01, y: -2 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                        className="group p-4 sm:p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-left touch-manipulation relative overflow-hidden"
                      >
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-10 rounded-xl`}
                        />

                        <div className="flex items-start space-x-4 relative z-10">
                          <div className={`w-12 h-12 bg-gradient-to-r ${widget.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                            <ItemIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                              {item.label}
                            </h3>
                            <p className="text-sm text-blue-200/80 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const WidgetNavigation = ({ userRole }) => {
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWidgets = getFilteredWidgets(userRole);

  const handleExpand = (widget, items) => {
    setExpandedWidget(widget);
    setExpandedItems(items);
  };

  const handleClose = () => {
    setExpandedWidget(null);
    setExpandedItems([]);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleWidgets = normalizedQuery
    ? filteredWidgets.filter(({ widget, items }) => {
        const haystack = [
          widget.title,
          ...items.map((item) => `${item.label} ${item.description}`)
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : filteredWidgets;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
        <h2 className="text-sm sm:text-base font-semibold text-white/90 tracking-wide">
          All modules
        </h2>
      </div>

      {filteredWidgets.length > 6 && (
        <div className="mb-5 sm:mb-6 max-w-md mx-auto">
          <label htmlFor="widget-search" className="sr-only">Search modules</label>
          <input
            id="widget-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200/50 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-white/30 transition-all"
          />
        </div>
      )}

      <div
        className="grid gap-3 sm:gap-4 md:gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}
      >
        {visibleWidgets.map(({ widget, items }, index) => (
          <Widget
            key={widget.key}
            widget={widget}
            items={items}
            index={index}
            onExpand={handleExpand}
          />
        ))}
      </div>

      {filteredWidgets.length === 0 && (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-6 text-center text-blue-100">
          <p className="text-sm">No widgets are available for your role yet.</p>
        </div>
      )}

      {filteredWidgets.length > 0 && visibleWidgets.length === 0 && (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-6 text-center text-blue-100">
          <p className="text-sm">No modules match &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}

      <WidgetExpansionModal
        widget={expandedWidget}
        items={expandedItems}
        isOpen={!!expandedWidget}
        onClose={handleClose}
      />
    </div>
  );
};

export default WidgetNavigation;
