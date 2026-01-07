// src/components/Customize/ProgressStepper.jsx
import React from "react";
import { Check } from 'lucide-react';
import { STEP_LABELS } from './customizeConstants';
import styles from './styles';

const ProgressStepper = React.memo(({ currentStep }) => (
  <div style={styles.stepper}>
    {STEP_LABELS.map((label, i) => (
      <div
        key={i}
        style={{
          ...styles.stepItem,
          ...(currentStep === i + 1 ? styles.activeStep : {}),
          ...(currentStep > i + 1 ? styles.completedStep : {}),
        }}
      >
        <div
          style={{
            ...styles.stepCircle,
            ...(currentStep > i + 1
              ? {
                  backgroundColor: 'var(--kc-success)',
                  color: 'white',
                  borderColor: 'var(--kc-success)',
                }
              : {}),
            ...(currentStep === i + 1
              ? {
                  borderColor: 'var(--kc-gold-1)',
                  color: 'var(--kc-gold-1)',
                  fontWeight: '700',
                }
              : {}),
          }}
        >
          {currentStep > i + 1 ? <Check size={18} /> : (i + 1)}
        </div>
        <span style={styles.stepLabel}>{label}</span>
      </div>
    ))}
  </div>
));

export default ProgressStepper;