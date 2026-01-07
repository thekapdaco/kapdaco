import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KCButton } from '../ui';

const FitGuideModal = ({ open, onClose, productName }) => (
  <AnimatePresence>
    {open ? (
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg space-y-5 rounded-[var(--kc-radius-lg)] border border-white/10 bg-[#121214] p-6 text-white shadow-[var(--kc-shadow-md)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="space-y-2">
            <p className="kc-pill inline-flex bg-white/10 text-white/70">Fit Guide</p>
            <h2 className="text-2xl font-semibold">Find your ideal fit</h2>
            <p className="text-sm text-white/70">
              Our {productName || 'product'} is cut for premium comfort. Compare your measurements to the chart below and
              review model references for effortless sizing.
            </p>
          </div>

          <div className="overflow-hidden rounded-[var(--kc-radius)] border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Chest (in)</th>
                  <th className="px-4 py-3">Length (in)</th>
                  <th className="px-4 py-3">Model ref.</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'S', chest: '36-38', length: '26', model: '5’9” / 68kg • Relaxed' },
                  { size: 'M', chest: '39-41', length: '27', model: '5’11” / 74kg • Relaxed' },
                  { size: 'L', chest: '42-44', length: '28', model: '6’1” / 82kg • Relaxed' },
                  { size: 'XL', chest: '45-47', length: '29', model: '6’2” / 90kg • Oversized' },
                ].map((row) => (
                  <tr key={row.size} className="border-t border-white/5">
                    <td className="px-4 py-3 font-semibold text-white">{row.size}</td>
                    <td className="px-4 py-3 text-white/80">{row.chest}</td>
                    <td className="px-4 py-3 text-white/80">{row.length}</td>
                    <td className="px-4 py-3 text-white/50">{row.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-white/60">
            Tip: For an elevated oversized silhouette, we suggest sizing up once. Shrinkage is minimal thanks to prewash
            treatments.
          </p>

          <div className="flex justify-end">
            <KCButton onClick={onClose} className="px-6">
              Close
            </KCButton>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default FitGuideModal;
